import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerTintColor: "#0D8A4B" }}>
        <Stack.Screen name="index" options={{ title: "Picacho Repartidor" }} />
        <Stack.Screen name="login" options={{ title: "Iniciar sesión" }} />
        <Stack.Screen name="registro" options={{ title: "Crear cuenta" }} />
        <Stack.Screen name="registro-vehiculo" options={{ title: "Datos de repartidor" }} />
      </Stack>
    </AuthProvider>
  );
}
