"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import supabase from "@/services/supabase";
import {
  authenticatePersonalUser,
  authenticateCompanyUser,
} from "@/services/auth";
import { Tables } from "@/services/supabasaTypes";
import BanorteLogo from "@/components/BanorteLogo";

type AppUser = Tables<"app_users">;
type Company = Tables<"companies">;


export function LoginForm() {
  const [userType, setUserType] = useState<"personal" | "company">("personal");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar usuarios personales
        const { data: usersData, error: usersError } = await supabase
          .from("app_users")
          .select("*");

        if (usersError) throw usersError;
        setUsers(usersData || []);

        // Cargar empresas
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("*");

        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setError("Error al cargar usuarios y empresas");
      }
    };

    loadData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      let authResult;

      if (userType === "personal") {
        authResult = await authenticatePersonalUser(userId, userName);
      } else {
        authResult = await authenticateCompanyUser(userId, userName);
      }

      if (authResult.success) {
        // Guardar información de la sesión
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("userType", userType);
        sessionStorage.setItem("userId", userId);

        // Redirigir al dashboard principal
        window.location.href = "/dashboard";
      } else {
        setError(authResult.error || "Credenciales incorrectas");
      }
    } catch (error) {
      console.error("Error en autenticación:", error);
      setError("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

 
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-red-100">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4">
          <BanorteLogo size="lg" className="mx-auto shadow-lg" />
        </div>
        <h1 className="text-2xl font-bold text-red-900">Banorte Digital</h1>
        <p className="text-red-700 mt-2">Inicia sesión en tu cuenta</p>
      </div>
      
    // Formulario de inicio de sesión
      <form onSubmit={handleLogin} className="space-y-6">
    // Selector de tipo de usuario
        <div className="flex rounded-lg bg-red-100 p-1">
          <button
            type="button"
            onClick={() => {
              setUserType("personal");
              setUserId("");
              setUserName("");
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              userType === "personal"
                ? "bg-white text-red-700 shadow-sm"
                : "text-red-600 hover:text-red-700"
            }`}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => {
              setUserType("company");
              setUserId("");
              setUserName("");
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              userType === "company"
                ? "bg-white text-red-700 shadow-sm"
                : "text-red-600 hover:text-red-700"
            }`}
          >
            Empresarial
          </button>
        </div>

        // ID Field
        <div>
          <label
            htmlFor="userId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {userType === "personal" ? "ID de Usuario" : "ID de Empresa"}
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder={userType === "personal" ? "Ej: 47" : "Ej: E016"}
          />
        </div>

        // Campo de contrasena (que en este caso es el nombre)
        <div>
          <label
            htmlFor="userName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {userType === "personal"
              ? "Nombre de Usuario"
              : "Nombre de Empresa"}
          </label>
          <input
            type="text"
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder={
              userType === "personal"
                ? "Ej: Usuario Demo"
                : "Ej: E016 SA de CV"
            }
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white"
          disabled={isLoading || !userId || !userName}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>
    </div>
  );
}

export default LoginForm;