import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { MercadoPagoProvider } from "./providers/mercadopago.provider";
import { MockPaymentProvider } from "./providers/mock.provider";
import { InvoicingModule } from "../invoicing/invoicing.module";

@Module({
  imports: [InvoicingModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoProvider, MockPaymentProvider],
})
export class PaymentsModule {}
