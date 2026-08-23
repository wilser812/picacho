import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateVendorProductDto } from "./dto/create-vendor-product.dto";
import { UpdateVendorProductDto } from "./dto/update-vendor-product.dto";

@Injectable()
export class VendorService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private notifications: NotificationsService,
  ) {}

  async registerVendor(userId: string, storeName: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.role === "VENDOR") throw new ConflictException("Ya tienes una tienda registrada");

    const vendor = await this.prisma.vendor.create({
      data: { userId, storeName, isApproved: false },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { role: "VENDOR" } });

    const accessToken = this.jwt.sign({ sub: userId, email: user.email, role: "VENDOR" });
    return { accessToken, user: { userId, email: user.email, role: "VENDOR" }, vendor };
  }

  async getMyVendor(userId: string) {
    return this.requireVendor(userId);
  }

  private async requireVendor(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException("No tienes una tienda registrada");
    return vendor;
  }

  async listMyProducts(userId: string) {
    const vendor = await this.requireVendor(userId);
    return this.prisma.product.findMany({
      where: { vendorId: vendor.id },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async createProduct(userId: string, dto: CreateVendorProductDto) {
    const vendor = await this.requireVendor(userId);
    const category = await this.prisma.category.findUnique({ where: { slug: dto.categorySlug } });
    if (!category) throw new NotFoundException("Categoría no encontrada");

    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        unit: dto.unit,
        isEssential: dto.isEssential ?? false,
        imageUrl: dto.imageUrl,
        vendorId: vendor.id,
        categoryId: category.id,
      },
    });
  }

  async updateProduct(userId: string, productId: string, dto: UpdateVendorProductDto) {
    const vendor = await this.requireVendor(userId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.vendorId !== vendor.id) throw new NotFoundException("Producto no encontrado");

    let categoryId: string | undefined;
    if (dto.categorySlug) {
      const category = await this.prisma.category.findUnique({ where: { slug: dto.categorySlug } });
      if (!category) throw new NotFoundException("Categoría no encontrada");
      categoryId = category.id;
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        unit: dto.unit,
        isEssential: dto.isEssential,
        imageUrl: dto.imageUrl,
        categoryId,
      },
    });
  }

  async deleteProduct(userId: string, productId: string) {
    const vendor = await this.requireVendor(userId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.vendorId !== vendor.id) throw new NotFoundException("Producto no encontrado");

    try {
      await this.prisma.product.delete({ where: { id: productId } });
    } catch {
      throw new ConflictException("No se puede eliminar: el producto ya tiene pedidos asociados");
    }
    return { deleted: true };
  }

  async listMyOrders(userId: string) {
    const vendor = await this.requireVendor(userId);
    return this.prisma.order.findMany({
      where: { vendorId: vendor.id },
      include: {
        items: { include: { product: true } },
        buyer: { select: { name: true, email: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateOrderStatus(userId: string, orderId: string, status: "PREPARING") {
    const vendor = await this.requireVendor(userId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.vendorId !== vendor.id) throw new NotFoundException("Pedido no encontrado");
    if (order.status !== "RECEIVED") {
      throw new ForbiddenException("Solo se puede pasar a preparación desde el estado 'Recibido'");
    }

    const updated = await this.prisma.order.update({ where: { id: orderId }, data: { status } });
    await this.notifications.sendToUser(
      order.buyerId,
      "Tu pedido está en preparación",
      `${vendor.storeName} está preparando tu pedido.`,
    );
    return updated;
  }
}
