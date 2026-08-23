import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch {
      setError("Correo o contraseña inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background px-6 py-10">
      <Text className="text-2xl font-bold text-primary">Inicia sesión</Text>

      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="mt-6 rounded-lg border border-black/10 bg-white px-4 py-3 text-foreground"
      />
      <TextInput
        placeholder="Contraseña"
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
        <Text className="font-semibold text-white">{loading ? "Ingresando..." : "Ingresar"}</Text>
      </Pressable>

      <Link href="/registro" className="mt-4 text-center text-sm font-semibold text-accent">
        ¿No tienes cuenta? Regístrate
      </Link>
    </View>
  );
}
