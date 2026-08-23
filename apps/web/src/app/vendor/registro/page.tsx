"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function VendorRegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading, becomeVendor } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await becomeVendor(storeName);
      router.push("/vendor");
    } catch {
      setError("No se pudo registrar la tienda. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <main className="min-h-screen px-6 py-16 text-center text-foreground/60">Cargando...</main>;
  }

  if (!user) {
    return (
      <main className="min-h-screen px-6 py-16 text-center">
        <p className="text-foreground/70">Inicia sesión para registrar tu tienda.</p>
      </main>
    );
  }

  if (user.role === "VENDOR") {
    router.push("/vendor");
    return null;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-6 py-16">
      <h1 className="text-2xl font-bold text-primary">Registra tu tienda</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Empieza a vender en Picacho. Un administrador aprobará tu tienda antes de que sea visible
        públicamente.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          placeholder="Nombre de la tienda"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          required
          minLength={2}
          className="rounded-lg border border-black/10 px-4 py-2 text-sm outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Creando tienda..." : "Crear tienda"}
        </button>
      </form>
    </main>
  );
}
