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
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userId.trim() || !name.trim()) {
      setError("Por favor ingresa ID y Contraseña.");
      return;
    }

    setLoading(true);

    try {
      console.log("Enviando datos:", { userId: userId.trim(), name: name.trim(), userType });
      
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), name: name.trim(), userType }),
      });

      const data = await res.json();
      console.log("Respuesta del servidor:", data);

      if (!res.ok || !data.success) {
        setError(data?.error || "Error al verificar credenciales");
      } else {
        setSuccess(`Bienvenido ${data.user?.name}`);
        console.log("Login exitoso, guardando datos y redirigiendo al dashboard...");
        
        // Guardar datos de usuario en sessionStorage para el dashboard
        sessionStorage.setItem("userType", userType);
        sessionStorage.setItem("userId", userId.trim());
        sessionStorage.setItem("userName", data.user?.name || "Usuario");
        
        // Redirección inmediata
        window.location.replace("/dashboard");
      }
    } catch (err) {
      console.error("Error en login:", err);
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
            Ingresa tu número de cliente y contraseña para continuar
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
          <div className="relative">
            <Input
              id="name"
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
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