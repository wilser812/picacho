import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CartItemDto } from "./dto/create-order.dto";

const ORDER_INCLUDE = {
  items: { include: { product: true } },
  vendor: { select: { storeName: true } },
  driver: {
    select: {
      id: true,
      phone: true,
      vehiclePlate: true,
      vehicleType: true,
      user: { select: { name: true } },
    },
  },
  payment: true,
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createFromCart(buyerId: string, items: CartItemDto[]) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    });

    if (products.length !== new Set(items.map((i) => i.productId)).size) {
      throw new BadRequestException("Uno o más productos del carrito ya no existen");
    }

    const byVendor = new Map<string, { productId: string; quantity: number; unitPrice: Prisma.Decimal }[]>();
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      const list = byVendor.get(product.vendorId) ?? [];
      list.push({ productId: product.id, quantity: item.quantity, unitPrice: product.price });
      byVendor.set(product.vendorId, list);
    }

    const orders = await Promise.all(
      Array.from(byVendor.entries()).map(([vendorId, vendorItems]) => {
        const total = vendorItems.reduce(
          (sum, i) => sum + Number(i.unitPrice) * i.quantity,
          0,
        );
        return this.prisma.order.create({
          data: {
            buyerId,
            vendorId,
            total,
            items: {
              create: vendorItems.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
              })),
            },
          },
          include: ORDER_INCLUDE,
        });
      }),
    );

    return orders;
  }

  listForBuyer(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    return order;
  }

  async getDriverLocation(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (!order.driverId) return null;

    return this.prisma.driverLocation.findFirst({
      where: { driverId: order.driverId },
      orderBy: { updatedAt: "desc" },
    });
  }
}
