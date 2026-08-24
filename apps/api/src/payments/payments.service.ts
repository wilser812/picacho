import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { MercadoPagoProvider } from "./providers/mercadopago.provider";
import { MockPaymentProvider } from "./providers/mock.provider";
import { InvoicingService } from "../invoicing/invoicing.service";

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mercadoPago: MercadoPagoProvider,
    private mock: MockPaymentProvider,
    private invoicing: InvoicingService,
  ) {}

  private get usingMercadoPago() {
    return Boolean(this.config.get<string>("MP_ACCESS_TOKEN"));
  }

  async createCheckout(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order || order.buyerId !== buyerId) throw new NotFoundException("Pedido no encontrado");

    const provider = this.usingMercadoPago ? this.mercadoPago : this.mock;
    const providerName = this.usingMercadoPago ? "mercadopago" : "mock";
    const result = await provider.createCheckout(order);

    await this.prisma.payment.upsert({
      where: { orderId },
      update: { provider: providerName, providerPaymentId: result.providerPaymentId, status: "pending" },
      create: {
        orderId,
        provider: providerName,
        providerPaymentId: result.providerPaymentId,
        status: "pending",
      },
    });

    return { checkoutUrl: result.checkoutUrl };
  }

  async handleWebhook(query: Record<string, string>, body: Record<string, unknown> | undefined) {
    if (!this.usingMercadoPago) return { received: true };

    const dataId = body?.data as { id?: string } | undefined;
    const paymentId = query["data.id"] ?? dataId?.id ?? query["id"];
    if (!paymentId) return { received: true };

    const info = await this.mercadoPago.getPayment(paymentId);
    if (!info.externalReference) return { received: true };

    await this.prisma.payment.updateMany({
      where: { orderId: info.externalReference },
      data: { status: info.status, providerPaymentId: paymentId },
    });

    if (info.status === "approved") {
      await this.invoicing.issueForOrder(info.externalReference);
    }

    return { received: true };
  }

  async approveMock(orderId: string) {
    await this.prisma.payment.upsert({
      where: { orderId },
      update: { status: "approved" },
      create: { orderId, provider: "mock", status: "approved", providerPaymentId: `mock-${orderId}` },
    });

    await this.invoicing.issueForOrder(orderId);

    const webUrl = this.config.get<string>("WEB_URL", "http://localhost:3000");
    return `<!doctype html>
<html lang="es">
  <body style="font-family: sans-serif; text-align: center; padding: 48px;">
    <h1 style="color: #0D8A4B;">¡Pago simulado aprobado!</h1>
    <p>Este es un checkout de desarrollo (no se configuró MP_ACCESS_TOKEN).</p>
    <a href="${webUrl}/pedido/${orderId}" style="color: #F97316;">Ver mi pedido</a>
  </body>
</html>`;
  }
}
