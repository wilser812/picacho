import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api, type ApiProduct } from "../lib/api";
import { ProductGrid } from "../components/ProductGrid";

export default function SearchScreen() {
  const { q } = useLocalSearchParams<{ q: string }>();
  const [products, setProducts] = useState<ApiProduct[]>([]);

  useEffect(() => {
    if (!q?.trim()) {
      setProducts([]);
      return;
    }
    api
      .get<ApiProduct[]>(`/products/search?q=${encodeURIComponent(q)}`)
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [q]);

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <Text className="text-xl font-bold text-foreground">Resultados para &ldquo;{q}&rdquo;</Text>
      <Text className="text-xs text-foreground/60">Ordenados de menor a mayor precio.</Text>
      <ProductGrid products={products} />
    </View>
  );
}
