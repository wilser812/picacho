import { api, type ApiProduct } from "@/lib/api";
import { ProductGrid } from "@/components/ProductGrid";

export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const products = q.trim()
    ? await api.get<ApiProduct[]>(`/products/search?q=${encodeURIComponent(q)}`)
    : [];

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <h1 className="text-2xl font-bold">
        Resultados para <span className="text-primary">&ldquo;{q}&rdquo;</span>
      </h1>
      <p className="text-sm text-foreground/60">Ordenados de menor a mayor precio.</p>
      <ProductGrid products={products} />
    </main>
  );
}
