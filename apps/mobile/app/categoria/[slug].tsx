import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { picachoCategoryTree } from "@picacho/shared";
import { api, type ApiProduct } from "../../lib/api";
import { fetchWithCache } from "../../lib/offlineCache";
import { ProductGrid } from "../../components/ProductGrid";

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [offline, setOffline] = useState(false);
  const category = picachoCategoryTree.find((c) => c.slug === slug);

  useEffect(() => {
    if (!slug) return;
    fetchWithCache(`category-${slug}`, () => api.get<ApiProduct[]>(`/products?categorySlug=${slug}`))
      .then(({ data, fromCache }) => {
        setProducts(data);
        setOffline(fromCache);
      })
      .catch(() => setProducts([]));
  }, [slug]);

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <Text className="text-xl font-bold text-foreground">
        {category ? `${category.icon} ${category.name}` : "Categoría"}
      </Text>
      <Text className="text-xs text-foreground/60">Ordenados de menor a mayor precio.</Text>
      {offline && (
        <Text className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">
          Sin conexión: mostrando el catálogo guardado en tu última visita.
        </Text>
      )}
      <ProductGrid products={products} />
    </View>
  );
}
