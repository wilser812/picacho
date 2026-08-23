"use client";

import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-background/95 px-6 py-3 backdrop-blur">
      <Link href="/" className="text-xl font-bold text-primary">
        Picacho
      </Link>
      <SearchBar />
      <div className="flex items-center gap-4 text-sm">
        <Link href="/carrito" className="font-medium text-foreground">
          Carrito{count > 0 ? ` (${count})` : ""}
        </Link>
        {user ? (
          <div className="flex items-center gap-3">
            <Link href="/pedidos" className="font-medium text-foreground">
              Mis pedidos
            </Link>
            <button onClick={logout} className="text-foreground/60 hover:text-foreground">
              Salir
            </button>
          </div>
        ) : (
          <Link href="/login" className="rounded-full bg-primary px-4 py-1.5 font-semibold text-white">
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  );
}
