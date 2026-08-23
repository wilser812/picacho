import Link from "next/link";
import { picachoCategoryTree } from "@picacho/shared";
import { api, type ApiProduct } from "@/lib/api";
import { ProductGrid } from "@/components/ProductGrid";

export const revalidate = 0;

export default async function Home() {
  const essentials = await api.get<ApiProduct[]>("/products?essential=true");

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <h1 className="text-3xl font-bold text-primary">Picacho</h1>
      <p className="mt-2 text-foreground/80">Cercanía, frescura y compras rápidas de confianza.</p>

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {picachoCategoryTree.map((category) => (
          <Link
            key={category.slug}
            href={`/categoria/${category.slug}`}
            className="rounded-xl border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <span className="text-2xl">{category.icon}</span>
            <p className="mt-1 font-medium">{category.name}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Productos Esenciales</h2>
        <p className="text-sm text-foreground/60">Ordenados de menor a mayor precio.</p>
        <ProductGrid products={essentials} />
      </section>
    </main>
  );
}
