import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { InvoiceIssueInput, InvoiceIssueResult, InvoiceProvider } from "./invoice-provider.interface";

// Emisor de comprobantes simulado para desarrollo local sin OSE real configurado.
// Se usa automáticamente cuando NUBEFACT_TOKEN no está configurado. El PDF es solo
// una vista HTML de referencia y no tiene validez tributaria ante SUNAT.
@Injectable()
export class MockInvoiceProvider implements InvoiceProvider {
  constructor(private config: ConfigService) {}

  async issue(input: InvoiceIssueInput): Promise<InvoiceIssueResult> {
    const apiUrl = this.config.get<string>("API_URL", "http://localhost:3001");
    return {
      status: "ISSUED",
      pdfUrl: `${apiUrl}/invoicing/mock/${input.orderId}`,
      externalId: `mock-${input.series}-${input.correlative}`,
    };
  }
}
