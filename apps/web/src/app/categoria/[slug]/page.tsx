import { notFound } from "next/navigation";
import Link from "next/link";
import { picachoCategoryTree } from "@picacho/shared";
import { api, type ApiProduct } from "@/lib/api";
import { ProductGrid } from "@/components/ProductGrid";

export const revalidate = 0;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { slug } = await params;
  const { sub } = await searchParams;
  const category = picachoCategoryTree.find((c) => c.slug === slug);
  if (!category) notFound();

  const query = sub ? `?categorySlug=${sub}` : `?categorySlug=${slug}`;
  const products = await api.get<ApiProduct[]>(`/products${query}`);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <h1 className="text-2xl font-bold">
        {category.icon} {category.name}
      </h1>
      <p className="text-sm text-foreground/60">Ordenados de menor a mayor precio.</p>

      <div className="flex flex-col gap-6 mt-8 sm:flex-row sm:gap-8">
        {category.subcategories.length > 0 && (
          <aside className="sm:w-48 sm:flex-shrink-0">
            <h2 className="font-semibold text-sm mb-2 sm:mb-4">Subcategorías</h2>
            <ul className="flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:gap-0 sm:space-y-2 sm:overflow-visible sm:pb-0">
              <li className="flex-shrink-0 sm:flex-shrink">
                <Link
                  href={`/categoria/${slug}`}
                  className={`whitespace-nowrap text-sm inline-block py-1 px-3 sm:block sm:px-2 rounded ${!sub ? 'bg-picacho-green text-white' : 'hover:bg-gray-100'}`}
                >
                  Ver todas
                </Link>
              </li>
              {category.subcategories.map((sub_cat) => (
                <li key={sub_cat.slug} className="flex-shrink-0 sm:flex-shrink">
                  <Link
                    href={`/categoria/${slug}?sub=${sub_cat.slug}`}
                    className={`whitespace-nowrap text-sm inline-block py-1 px-3 sm:block sm:px-2 rounded ${sub === sub_cat.slug ? 'bg-picacho-green text-white' : 'hover:bg-gray-100'}`}
                  >
                    {sub_cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <div className="flex-1 min-w-0">
          <ProductGrid products={products} />
        </div>
      </div>
    </main>
  );
}
