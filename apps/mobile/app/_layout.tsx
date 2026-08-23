import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerTintColor: "#0D8A4B" }}>
          <Stack.Screen name="index" options={{ title: "Picacho" }} />
          <Stack.Screen name="categoria/[slug]" options={{ title: "Categoría" }} />
          <Stack.Screen name="buscar" options={{ title: "Búsqueda" }} />
          <Stack.Screen name="login" options={{ title: "Iniciar sesión" }} />
          <Stack.Screen name="registro" options={{ title: "Crear cuenta" }} />
          <Stack.Screen name="carrito" options={{ title: "Carrito" }} />
          <Stack.Screen name="pedidos" options={{ title: "Mis pedidos" }} />
          <Stack.Screen name="pedido/[id]" options={{ title: "Pedido" }} />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
