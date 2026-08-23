import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import type { CheckoutResult, OrderForCheckout, PaymentProvider } from "./payment-provider.interface";

@Injectable()
export class MercadoPagoProvider implements PaymentProvider {
  constructor(private config: ConfigService) {}

  // El cliente se crea al usarse (no en el constructor) para que el módulo pueda
  // arrancar sin credenciales configuradas; PaymentsService solo lo invoca cuando
  // MP_ACCESS_TOKEN está presente.
  private getClient() {
    const accessToken = this.config.get<string>("MP_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MP_ACCESS_TOKEN no configurado");
    return new MercadoPagoConfig({ accessToken });
  }

  async createCheckout(order: OrderForCheckout): Promise<CheckoutResult> {
    const preference = new Preference(this.getClient());
    const webUrl = this.config.get<string>("WEB_URL", "http://localhost:3000");
    const apiUrl = this.config.get<string>("API_URL", "http://localhost:3001");

    const result = await preference.create({
      body: {
        items: order.items.map((item) => ({
          id: item.product.name,
          title: item.product.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unitPrice),
          currency_id: "PEN",
        })),
        external_reference: order.id,
        back_urls: {
          success: `${webUrl}/pedido/${order.id}`,
          failure: `${webUrl}/pedido/${order.id}`,
          pending: `${webUrl}/pedido/${order.id}`,
        },
        notification_url: `${apiUrl}/payments/webhook`,
      },
    });

    return { checkoutUrl: result.init_point!, providerPaymentId: result.id };
  }

  async getPayment(paymentId: string) {
    const payment = new Payment(this.getClient());
    const info = await payment.get({ id: Number(paymentId) });
    return { status: info.status ?? "pending", externalReference: info.external_reference ?? null };
  }
}
