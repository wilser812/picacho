import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function DriverVehicleScreen() {
  const router = useRouter();
  const { user, loading: authLoading, registerAsDriver } = useAuth();
  const [phone, setPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await registerAsDriver(phone, vehiclePlate, vehicleType);
      router.replace("/");
    } catch {
      setError("No se pudo completar el registro. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground/60">Cargando...</Text>
      </View>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <View className="flex-1 bg-background px-6 py-10">
      <Text className="text-2xl font-bold text-primary">Datos de repartidor</Text>
      <Text className="mt-1 text-foreground/70">
        Necesitamos estos datos para asignarte pedidos y que el comprador pueda contactarte.
      </Text>

      <TextInput
        placeholder="Teléfono"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        className="mt-6 rounded-lg border border-black/10 bg-white px-4 py-3 text-foreground"
      />
      <TextInput
        placeholder="Placa del vehículo"
        value={vehiclePlate}
        onChangeText={setVehiclePlate}
        autoCapitalize="characters"
        className="mt-3 rounded-lg border border-black/10 bg-white px-4 py-3 text-foreground"
      />
      <TextInput
        placeholder="Tipo de vehículo (moto, auto, bici...)"
        value={vehicleType}
        onChangeText={setVehicleType}
        className="mt-3 rounded-lg border border-black/10 bg-white px-4 py-3 text-foreground"
      />

      {error && <Text className="mt-2 text-sm text-red-600">{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        className="mt-5 items-center rounded-lg bg-primary px-4 py-3"
      >
        <Text className="font-semibold text-white">{loading ? "Guardando..." : "Empezar a repartir"}</Text>
      </Pressable>
    </View>
  );
}
