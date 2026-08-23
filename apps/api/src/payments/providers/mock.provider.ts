import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CheckoutResult, OrderForCheckout, PaymentProvider } from "./payment-provider.interface";

// Proveedor de pago simulado para desarrollo local sin credenciales reales de Mercado Pago.
// Se usa automáticamente cuando MP_ACCESS_TOKEN no está configurado.
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  constructor(private config: ConfigService) {}

  async createCheckout(order: OrderForCheckout): Promise<CheckoutResult> {
    const apiUrl = this.config.get<string>("API_URL", "http://localhost:3001");
    return {
      checkoutUrl: `${apiUrl}/payments/mock-checkout/${order.id}`,
      providerPaymentId: `mock-${order.id}`,
    };
  }
}
