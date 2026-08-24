import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  listVendors() {
    return this.prisma.vendor.findMany({
      include: { user: { select: { name: true, email: true } }, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async setVendorApproval(vendorId: string, isApproved: boolean) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException("Vendedor no encontrado");
    return this.prisma.vendor.update({ where: { id: vendorId }, data: { isApproved } });
  }

  listProducts() {
    return this.prisma.product.findMany({
      include: {
        vendor: { select: { storeName: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Producto no encontrado");
    try {
      await this.prisma.product.delete({ where: { id: productId } });
    } catch {
      throw new ConflictException("No se puede eliminar: el producto ya tiene pedidos asociados");
    }
    return { deleted: true };
  }

  listOrders() {
    return this.prisma.order.findMany({
      include: {
        buyer: { select: { name: true, email: true } },
        vendor: { select: { storeName: true } },
        driver: { select: { id: true, user: { select: { name: true } } } },
        payment: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  listDrivers() {
    return this.prisma.driver.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    });
  }

  async assignDriver(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    if (order.status === "DELIVERED") {
      throw new ConflictException("No se puede reasignar un pedido ya entregado");
    }

    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException("Repartidor no encontrado");

    return this.prisma.order.update({
      where: { id: orderId },
      data: { driverId },
      include: {
        buyer: { select: { name: true, email: true } },
        vendor: { select: { storeName: true } },
        driver: { select: { id: true, user: { select: { name: true } } } },
        payment: true,
        items: true,
      },
    });
  }

  listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSettings() {
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    if (settings) return settings;
    return this.prisma.platformSettings.create({ data: { id: "singleton" } });
  }

  async updateSettings(commissionRate: number) {
    return this.prisma.platformSettings.upsert({
      where: { id: "singleton" },
      update: { commissionRate },
      create: { id: "singleton", commissionRate },
    });
  }
}
