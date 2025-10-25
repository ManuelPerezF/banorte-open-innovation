"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import BanorteLogo from "@/components/BanorteLogo";

type UserType = "personal" | "company";

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<UserType>("personal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userId.trim() || !name.trim()) {
      setError("Por favor ingresa ID y Nombre.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), name: name.trim(), userType }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error || "Error al verificar credenciales");
      } else {
        setSuccess(`Bienvenido ${data.user?.name}`);
        // Redirigir al dashboard después de una verificación exitosa
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-white">Inicia Sesión en tu cuenta</h1>
          <p className="text-gray-300 text-sm text-balance">
            Ingresa tu ID y Nombre para verificar tu cuenta
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="id" className="text-gray-200">Numero de cliente</FieldLabel>
          <Input
            id="id"
            type="text"
            placeholder="47"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="name" className="text-gray-200">Contraseña</FieldLabel>
          <Input
            id="name"
            type="password"
            placeholder="********"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>

        <Field>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="radio"
                name="userType"
                checked={userType === "personal"}
                onChange={() => setUserType("personal")}
                className="accent-red-600"
              />
              Personal
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="radio"
                name="userType"
                checked={userType === "company"}
                onChange={() => setUserType("company")}
                className="accent-red-600"
              />
              Empresa
            </label>
          </div>
        </Field>

        {error && (
          <Field>
            <FieldError>{error}</FieldError>
          </Field>
        )}


        <Field>
          <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? "Verificando..." : "Verificar"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}