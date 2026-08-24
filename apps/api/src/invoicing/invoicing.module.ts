import { Module } from "@nestjs/common";
import { InvoicingController } from "./invoicing.controller";
import { InvoicingService } from "./invoicing.service";
import { NubefactInvoiceProvider } from "./providers/nubefact.provider";
import { MockInvoiceProvider } from "./providers/mock.provider";

@Module({
  controllers: [InvoicingController],
  providers: [InvoicingService, NubefactInvoiceProvider, MockInvoiceProvider],
  exports: [InvoicingService],
})
export class InvoicingModule {}
