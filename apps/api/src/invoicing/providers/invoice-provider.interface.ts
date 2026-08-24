import { Prisma } from "@prisma/client";

export interface InvoiceIssueInput {
  orderId: string;
  docType: "BOLETA" | "FACTURA";
  series: string;
  correlative: number;
  buyerDocType: string;
  buyerDocNumber: string;
  buyerName: string;
  total: Prisma.Decimal;
  items: {
    name: string;
    quantity: Prisma.Decimal;
    unitPrice: Prisma.Decimal;
  }[];
}

export interface InvoiceIssueResult {
  status: "ISSUED" | "ERROR";
  pdfUrl: string;
  externalId?: string;
}

export interface InvoiceProvider {
  issue(input: InvoiceIssueInput): Promise<InvoiceIssueResult>;
}
