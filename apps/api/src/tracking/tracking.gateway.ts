import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import type { DriverLocationUpdateInput } from "@picacho/shared";
import { PrismaService } from "../prisma/prisma.service";

// Nota MVP: el evento "driver:location" confía en el driverId enviado por el cliente,
// solo verificando contra la BD que ese repartidor es el asignado al pedido. Una
// implementación de producción autenticaría el handshake del socket con el JWT y
// derivaría el driverId en el servidor en vez de confiar en el payload del cliente.
@WebSocketGateway({ cors: { origin: "*" } })
export class TrackingGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private prisma: PrismaService) {}

  @SubscribeMessage("order:join")
  handleJoinOrder(@MessageBody() orderId: string, @ConnectedSocket() client: Socket) {
    client.join(`order:${orderId}`);
  }

  @SubscribeMessage("driver:location")
  async handleDriverLocation(@MessageBody() payload: DriverLocationUpdateInput) {
    const order = await this.prisma.order.findUnique({ where: { id: payload.orderId } });
    if (!order || order.driverId !== payload.driverId) return;

    await this.prisma.driverLocation.create({
      data: { driverId: payload.driverId, lat: payload.lat, lng: payload.lng },
    });

    this.server.to(`order:${payload.orderId}`).emit("driver:location", payload);
  }
}
