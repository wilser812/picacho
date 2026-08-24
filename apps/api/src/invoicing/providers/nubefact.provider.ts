import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { InvoiceIssueInput, InvoiceIssueResult, InvoiceProvider } from "./invoice-provider.interface";

// Integración con Nubefact (OSE autorizado por SUNAT: https://www.nubefact.com).
// Se activa automáticamente cuando NUBEFACT_TOKEN y NUBEFACT_RUC están configurados.
// IMPORTANTE: verificar los nombres de campo contra la documentación vigente de
// Nubefact antes de emitir comprobantes reales — esta integración sigue el
// contrato documentado públicamente pero Nubefact puede versionar su API.
const SUNAT_DOC_TYPE_CODE: Record<string, string> = {
  DNI: "1",
  RUC: "6",
};

@Injectable()
export class NubefactInvoiceProvider implements InvoiceProvider {
  constructor(private config: ConfigService) {}

  async issue(input: InvoiceIssueInput): Promise<InvoiceIssueResult> {
    const token = this.config.get<string>("NUBEFACT_TOKEN");
    const ruc = this.config.get<string>("NUBEFACT_RUC");
    if (!token || !ruc) throw new Error("NUBEFACT_TOKEN/NUBEFACT_RUC no configurados");

    const igvRate = 0.18;
    const totalGravada = Number(input.total) / (1 + igvRate);
    const totalIgv = Number(input.total) - totalGravada;

    const body = {
      operacion: "generar_comprobante",
      tipo_de_comprobante: input.docType === "FACTURA" ? 1 : 2,
      serie: input.series,
      numero: input.correlative,
      sunat_transaction: 1,
      cliente_tipo_de_documento: SUNAT_DOC_TYPE_CODE[input.buyerDocType] ?? "1",
      cliente_numero_de_documento: input.buyerDocNumber,
      cliente_denominacion: input.buyerName,
      fecha_de_emision: new Date().toISOString().slice(0, 10),
      moneda: 1,
      porcentaje_de_igv: igvRate * 100,
      total_gravada: totalGravada.toFixed(2),
      total_igv: totalIgv.toFixed(2),
      total: Number(input.total).toFixed(2),
      enviar_automaticamente_a_la_sunat: true,
      items: input.items.map((item) => ({
        unidad_de_medida: "NIU",
        descripcion: item.name,
        cantidad: Number(item.quantity),
        valor_unitario: (Number(item.unitPrice) / (1 + igvRate)).toFixed(2),
        precio_unitario: Number(item.unitPrice).toFixed(2),
        subtotal: (Number(item.quantity) * Number(item.unitPrice) / (1 + igvRate)).toFixed(2),
        tipo_de_igv: 1,
        igv: (Number(item.quantity) * Number(item.unitPrice) - Number(item.quantity) * Number(item.unitPrice) / (1 + igvRate)).toFixed(2),
        total: (Number(item.quantity) * Number(item.unitPrice)).toFixed(2),
      })),
    };

    const response = await fetch(`https://api.nubefact.com/api/v1/${ruc}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Nubefact respondió ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as { enlace_del_pdf?: string; aceptada_por_sunat?: boolean };
    return {
      status: data.aceptada_por_sunat ? "ISSUED" : "ERROR",
      pdfUrl: data.enlace_del_pdf ?? "",
      externalId: `${input.series}-${input.correlative}`,
    };
  }
}
