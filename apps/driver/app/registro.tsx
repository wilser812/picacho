import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      router.replace("/registro-vehiculo");
    } catch {
      setError("No se pudo crear la cuenta. Revisa los datos o el correo ya está en uso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background px-6 py-10">
      <Text className="text-2xl font-bold text-primary">Crea tu cuenta</Text>

      <TextInput
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
        className="mt-6 rounded-lg border border-black/10 bg-white px-4 py-3 text-foreground"
      />
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="mt-3 rounded-lg border border-black/10 bg-white px-4 py-3 text-foreground"
      />
      <TextInput
        placeholder="Contraseña (mín. 6 caracteres)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="mt-3 rounded-lg border border-black/10 bg-white px-4 py-3 text-foreground"
      />

      {error && <Text className="mt-2 text-sm text-red-600">{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        className="mt-5 items-center rounded-lg bg-primary px-4 py-3"
      >
        <Text className="font-semibold text-white">{loading ? "Creando cuenta..." : "Continuar"}</Text>
      </Pressable>

      <Link href="/login" className="mt-4 text-center text-sm font-semibold text-accent">
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </View>
  );
}
