import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { NubefactInvoiceProvider } from "./providers/nubefact.provider";
import { MockInvoiceProvider } from "./providers/mock.provider";

const DEFAULT_SERIES: Record<"BOLETA" | "FACTURA", string> = {
  BOLETA: "B001",
  FACTURA: "F001",
};

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private nubefact: NubefactInvoiceProvider,
    private mock: MockInvoiceProvider,
  ) {}

  private get usingNubefact() {
    return Boolean(this.config.get<string>("NUBEFACT_TOKEN"));
  }

  // Se llama cuando un pago queda aprobado. Es idempotente: si el pedido ya
  // tiene comprobante, no genera uno nuevo.
  async issueForOrder(orderId: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { orderId } });
    if (existing) return existing;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, buyer: true },
    });
    if (!order) throw new NotFoundException("Pedido no encontrado");

    const docType: "BOLETA" | "FACTURA" = "BOLETA";
    const series = DEFAULT_SERIES[docType];

    const counter = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoiceCounter.upsert({
        where: { docType },
        update: { correlative: { increment: 1 } },
        create: { docType, series, correlative: 1 },
      });
      return updated;
    });

    const buyerDocType = "DNI";
    const buyerDocNumber = "00000000";

    const provider = this.usingNubefact ? this.nubefact : this.mock;
    const providerName = this.usingNubefact ? "nubefact" : "mock";

    const input = {
      orderId: order.id,
      docType,
      series,
      correlative: counter.correlative,
      buyerDocType,
      buyerDocNumber,
      buyerName: order.buyer.name,
      total: order.total,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    let result;
    try {
      result = await provider.issue(input);
    } catch (error) {
      this.logger.error(`Fallo al emitir comprobante para pedido ${orderId}`, error);
      result = { status: "ERROR" as const, pdfUrl: "" };
    }

    return this.prisma.invoice.create({
      data: {
        orderId: order.id,
        docType,
        series,
        correlative: counter.correlative,
        buyerDocType,
        buyerDocNumber,
        buyerName: order.buyer.name,
        provider: providerName,
        status: result.status,
        pdfUrl: result.pdfUrl || null,
        externalId: result.externalId,
      },
    });
  }

  async getForOrder(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    if (order.buyerId !== buyerId) throw new ForbiddenException();

    return this.prisma.invoice.findUnique({ where: { orderId } });
  }

  async renderMockHtml(orderId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { orderId } });
    if (!invoice) throw new NotFoundException("Comprobante no encontrado");

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, vendor: true },
    });
    if (!order) throw new NotFoundException("Pedido no encontrado");

    const rows = order.items
      .map(
        (item) =>
          `<tr><td>${item.product.name}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">S/ ${Number(item.unitPrice).toFixed(2)}</td><td style="text-align:right">S/ ${(Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}</td></tr>`,
      )
      .join("");

    return `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><title>${invoice.docType} ${invoice.series}-${invoice.correlative}</title></head>
  <body style="font-family: sans-serif; max-width: 640px; margin: 40px auto; color: #111;">
    <div style="border: 2px solid #0D8A4B; border-radius: 12px; padding: 24px;">
      <h1 style="color: #0D8A4B; margin: 0;">Picacho Marketplace S.A.C.</h1>
      <p style="margin: 4px 0 20px; color: #666;">RUC 00000000000 (demo) · Documento de desarrollo, sin validez tributaria</p>
      <h2 style="margin: 0;">${invoice.docType === "FACTURA" ? "FACTURA ELECTRÓNICA" : "BOLETA DE VENTA ELECTRÓNICA"}</h2>
      <p style="font-weight: bold;">${invoice.series}-${String(invoice.correlative).padStart(6, "0")}</p>
      <p>Cliente: ${invoice.buyerName} · ${invoice.buyerDocType} ${invoice.buyerDocNumber}</p>
      <p>Vendido por: ${order.vendor.storeName}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr style="border-bottom: 1px solid #ccc; text-align: left;">
            <th>Producto</th><th>Cant.</th><th style="text-align:right">P. Unit.</th><th style="text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="text-align: right; margin-top: 16px; font-size: 1.2em; font-weight: bold;">
        Total: S/ ${Number(order.total).toFixed(2)}
      </div>
    </div>
  </body>
</html>`;
  }
}
