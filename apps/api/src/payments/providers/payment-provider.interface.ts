import { Prisma } from "@prisma/client";

export interface CheckoutResult {
  checkoutUrl: string;
  providerPaymentId?: string;
}

export interface OrderForCheckout {
  id: string;
  total: Prisma.Decimal;
  items: {
    product: { name: string };
    quantity: Prisma.Decimal;
    unitPrice: Prisma.Decimal;
  }[];
}

export interface PaymentProvider {
  createCheckout(order: OrderForCheckout): Promise<CheckoutResult>;
}
