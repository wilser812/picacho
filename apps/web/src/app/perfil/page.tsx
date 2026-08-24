"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  BUYER: "Comprador",
  VENDOR: "Vendedor",
  DRIVER: "Repartidor",
  ADMIN: "Administrador",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-black/10 bg-white p-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-black/10 px-4 py-2 text-sm outline-none focus:border-primary";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, refreshUser, logout } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [vendorMsg, setVendorMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [vendorSaving, setVendorSaving] = useState(false);

  const [phone, setPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [driverMsg, setDriverMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [driverSaving, setDriverSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email);
    setStoreName(user.vendor?.storeName ?? "");
    setPhone(user.driver?.phone ?? "");
    setVehiclePlate(user.driver?.vehiclePlate ?? "");
    setVehicleType(user.driver?.vehicleType ?? "");
  }, [user]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      await api.patch("/auth/me", { name, email });
      await refreshUser();
      setProfileMsg({ type: "ok", text: "Datos actualizados." });
    } catch {
      setProfileMsg({ type: "error", text: "No se pudo actualizar. Verifica que el correo no esté en uso." });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordSaving(true);
    try {
      await api.patch("/auth/me/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMsg({ type: "ok", text: "Contraseña actualizada." });
    } catch {
      setPasswordMsg({ type: "error", text: "Contraseña actual incorrecta." });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleVendorSubmit(e: FormEvent) {
    e.preventDefault();
    setVendorMsg(null);
    setVendorSaving(true);
    try {
      await api.patch("/vendor/me", { storeName });
      await refreshUser();
      setVendorMsg({ type: "ok", text: "Tienda actualizada." });
    } catch {
      setVendorMsg({ type: "error", text: "No se pudo actualizar la tienda." });
    } finally {
      setVendorSaving(false);
    }
  }

  async function handleDriverSubmit(e: FormEvent) {
    e.preventDefault();
    setDriverMsg(null);
    setDriverSaving(true);
    try {
      await api.patch("/driver/me", { phone, vehiclePlate, vehicleType });
      await refreshUser();
      setDriverMsg({ type: "ok", text: "Datos de repartidor actualizados." });
    } catch {
      setDriverMsg({ type: "error", text: "No se pudo actualizar." });
    } finally {
      setDriverSaving(false);
    }
  }

  if (loading || !user) {
    return <main className="min-h-screen px-6 py-16 text-center text-foreground/60">Cargando...</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-6 py-10">
      <h1 className="text-2xl font-bold text-primary">Mi perfil</h1>
      <p className="mt-1 text-sm text-foreground/60">
        {ROLE_LABEL[user.role] ?? user.role}
        {user.createdAt ? ` · Miembro desde ${new Date(user.createdAt).toLocaleDateString("es-PE")}` : ""}
      </p>

      <Section title="Datos personales">
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-3">
          <input
            className={inputClass}
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className={inputClass}
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {profileMsg && (
            <p className={`text-sm ${profileMsg.type === "ok" ? "text-primary" : "text-red-600"}`}>
              {profileMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={profileSaving}
            className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {profileSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </Section>

      <Section title="Cambiar contraseña">
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
          <input
            className={inputClass}
            type="password"
            placeholder="Contraseña actual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            className={inputClass}
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.type === "ok" ? "text-primary" : "text-red-600"}`}>
              {passwordMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordSaving}
            className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {passwordSaving ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>
      </Section>

      {user.role === "VENDOR" && (
        <Section title="Mi tienda">
          <form onSubmit={handleVendorSubmit} className="flex flex-col gap-3">
            <input
              className={inputClass}
              placeholder="Nombre de la tienda"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />
            <p className="text-xs text-foreground/60">
              Estado: {user.vendor?.isApproved ? "Aprobada" : "Pendiente de aprobación"}
            </p>
            {vendorMsg && (
              <p className={`text-sm ${vendorMsg.type === "ok" ? "text-primary" : "text-red-600"}`}>
                {vendorMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={vendorSaving}
              className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {vendorSaving ? "Guardando..." : "Guardar tienda"}
            </button>
          </form>
        </Section>
      )}

      {user.role === "DRIVER" && (
        <Section title="Datos de repartidor">
          <form onSubmit={handleDriverSubmit} className="flex flex-col gap-3">
            <input
              className={inputClass}
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              className={inputClass}
              placeholder="Placa del vehículo"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              required
            />
            <input
              className={inputClass}
              placeholder="Tipo de vehículo"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              required
            />
            {driverMsg && (
              <p className={`text-sm ${driverMsg.type === "ok" ? "text-primary" : "text-red-600"}`}>
                {driverMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={driverSaving}
              className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {driverSaving ? "Guardando..." : "Guardar datos"}
            </button>
          </form>
        </Section>
      )}

      <button
        onClick={() => {
          logout();
          router.push("/");
        }}
        className="mt-6 text-sm font-medium text-foreground/60 hover:text-foreground"
      >
        Cerrar sesión
      </button>
    </main>
  );
}
