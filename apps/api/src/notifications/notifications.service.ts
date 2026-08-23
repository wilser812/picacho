import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async registerToken(userId: string, token: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { pushToken: token } });
    return { registered: true };
  }

  async sendToUser(userId: string, title: string, body: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.pushToken) return;

    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ to: user.pushToken, title, body, sound: "default" }),
      });
    } catch (err) {
      // No bloquear el flujo principal (cambio de estado, pago, etc.) si el envío de push falla.
      this.logger.warn(`No se pudo enviar la notificación push a ${userId}: ${err}`);
    }
  }
}
