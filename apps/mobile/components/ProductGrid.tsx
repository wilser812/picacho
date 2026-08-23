import { FlatList, Pressable, Text, View } from "react-native";
import { formatPrice, type ApiProduct } from "../lib/api";
import { useCart } from "../context/CartContext";

export function ProductGrid({
  products,
  scrollEnabled = true,
}: {
  products: ApiProduct[];
  scrollEnabled?: boolean;
}) {
  const { addItem } = useCart();

  if (products.length === 0) {
    return <Text className="mt-4 text-foreground/60">No se encontraron productos.</Text>;
  }

  return (
    <FlatList
      className="mt-4"
      data={products}
      numColumns={2}
      scrollEnabled={scrollEnabled}
      keyExtractor={(item) => item.id}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
      renderItem={({ item }) => (
        <View className="flex-1 rounded-xl border border-black/10 bg-white p-4">
          <Text className="text-xs text-foreground/50">{item.category.name}</Text>
          <Text className="mt-1 font-medium text-foreground">{item.name}</Text>
          <Text className="mt-1 font-semibold text-primary">
            {formatPrice(item.price, item.unit)}
          </Text>
          <Pressable
            onPress={() => addItem(item)}
            className="mt-3 items-center rounded-lg bg-accent px-3 py-2"
          >
            <Text className="text-sm font-semibold text-white">Agregar al carrito</Text>
          </Pressable>
        </View>
      )}
    />
  );
}
