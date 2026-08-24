import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RegisterDriverDto } from "./dto/register-driver.dto";

const ORDER_INCLUDE_FOR_DRIVER = {
  items: { include: { product: true } },
  vendor: { select: { storeName: true } },
  buyer: { select: { name: true } },
} as const;

@Injectable()
export class DriverService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private notifications: NotificationsService,
  ) {}

  async registerDriver(userId: string, dto: RegisterDriverDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.role === "DRIVER") throw new ConflictException("Ya estás registrado como repartidor");

    const driver = await this.prisma.driver.create({
      data: { userId, phone: dto.phone, vehiclePlate: dto.vehiclePlate, vehicleType: dto.vehicleType },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { role: "DRIVER" } });

    const accessToken = this.jwt.sign({ sub: userId, email: user.email, role: "DRIVER" });
    return { accessToken, user: { userId, email: user.email, role: "DRIVER" }, driver };
  }

  private async requireDriver(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException("No estás registrado como repartidor");
    return driver;
  }

  async getMyDriverProfile(userId: string) {
    return this.requireDriver(userId);
  }

  async updateDriver(userId: string, dto: { phone?: string; vehiclePlate?: string; vehicleType?: string }) {
    const driver = await this.requireDriver(userId);
    return this.prisma.driver.update({
      where: { id: driver.id },
      data: { phone: dto.phone, vehiclePlate: dto.vehiclePlate, vehicleType: dto.vehicleType },
    });
  }

  async listAvailableOrders() {
    return this.prisma.order.findMany({
      where: { status: "PREPARING", driverId: null },
      include: ORDER_INCLUDE_FOR_DRIVER,
      orderBy: { createdAt: "asc" },
    });
  }

  async acceptOrder(userId: string, orderId: string) {
    const driver = await this.requireDriver(userId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    if (order.status !== "PREPARING" || order.driverId) {
      throw new ForbiddenException("Este pedido ya no está disponible");
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { driverId: driver.id },
      include: ORDER_INCLUDE_FOR_DRIVER,
    });
  }

  async listMyOrders(userId: string) {
    const driver = await this.requireDriver(userId);
    return this.prisma.order.findMany({
      where: { driverId: driver.id },
      include: ORDER_INCLUDE_FOR_DRIVER,
      orderBy: { createdAt: "desc" },
    });
  }

  async updateOrderStatus(userId: string, orderId: string, status: "ON_THE_WAY" | "DELIVERED") {
    const driver = await this.requireDriver(userId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.driverId !== driver.id) throw new NotFoundException("Pedido no encontrado");

    const validTransition =
      (order.status === "PREPARING" && status === "ON_THE_WAY") ||
      (order.status === "ON_THE_WAY" && status === "DELIVERED");
    if (!validTransition) {
      throw new ForbiddenException(`No se puede pasar de ${order.status} a ${status}`);
    }

    const updated = await this.prisma.order.update({ where: { id: orderId }, data: { status } });

    const message =
      status === "ON_THE_WAY"
        ? { title: "¡Tu pedido está en camino!", body: "El repartidor va hacia tu dirección." }
        : { title: "Pedido entregado", body: "Tu pedido fue entregado. ¡Buen provecho!" };
    await this.notifications.sendToUser(order.buyerId, message.title, message.body);

    return updated;
  }
}
