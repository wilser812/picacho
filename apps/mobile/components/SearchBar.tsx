import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { api, formatPrice, type ApiProduct } from "../lib/api";

const DEBOUNCE_MS = 300;

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ApiProduct[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await api.get<ApiProduct[]>(
          `/products/search?q=${encodeURIComponent(query)}`,
        );
        setSuggestions(results.slice(0, 6));
      } catch {
        setSuggestions([]);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function goToResults(q: string) {
    if (!q.trim()) return;
    setSuggestions([]);
    router.push({ pathname: "/buscar", params: { q } });
  }

  return (
    <View className="relative">
      <View className="flex-row items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2">
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => goToResults(query)}
          placeholder="Busca papa, pollo, detergente..."
          className="flex-1 text-sm text-foreground"
        />
        <Pressable onPress={() => goToResults(query)} className="rounded-full bg-primary px-3 py-1">
          <Text className="text-xs font-semibold text-white">Buscar</Text>
        </Pressable>
      </View>

      {suggestions.length > 0 && (
        <View className="absolute top-12 z-10 w-full rounded-lg border border-black/10 bg-white shadow-lg">
          {suggestions.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => goToResults(p.name)}
              className="flex-row items-center justify-between px-4 py-2"
            >
              <Text className="text-sm text-foreground">{p.name}</Text>
              <Text className="text-sm text-foreground/60">{formatPrice(p.price, p.unit)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
