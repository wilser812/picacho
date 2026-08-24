"use client";

import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const isBuyer = !user || user.role === "BUYER";

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-background/95 px-6 py-3 backdrop-blur">
      <Link href="/" className="text-xl font-bold text-primary">
        Picacho
      </Link>
      {isBuyer && <SearchBar />}
      <div className="flex items-center gap-4 text-sm">
        {isBuyer && (
          <Link href="/carrito" className="font-medium text-foreground">
            Carrito{count > 0 ? ` (${count})` : ""}
          </Link>
        )}
        {user ? (
          <div className="flex items-center gap-3">
            {user.role === "BUYER" && (
              <Link href="/pedidos" className="font-medium text-foreground">
                Mis pedidos
              </Link>
            )}
            {user.role === "VENDOR" && (
              <Link href="/vendor" className="font-medium text-foreground">
                Mi tienda
              </Link>
            )}
            {user.role === "DRIVER" && (
              <Link href="/driver" className="font-medium text-foreground">
                Mis entregas
              </Link>
            )}
            {user.role === "ADMIN" && (
              <Link href="/admin" className="font-medium text-foreground">
                Panel admin
              </Link>
            )}
            <Link href="/perfil" className="font-medium text-foreground">
              {user.name ?? "Mi perfil"}
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
