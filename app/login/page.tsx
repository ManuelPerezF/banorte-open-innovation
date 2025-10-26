"use client";

import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  
  return (

    <div className="grid min-h-svh lg:grid-cols-3">
      
      <div className="flex flex-col gap-4 p-6 md:p-10 lg:col-span-2 bg-gradient-to-r from-red-900 to-black">
        
        {/* Encabezado */}
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium text-white">
            <img
              src="/BanorteText.svg"
              alt="Banorte Logo" 
              className="h-6" 
            />
          </a>
        </div>

        {/* Contenedor del Formulario */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>

      <div className="bg-black relative hidden lg:block p-10 lg:col-span-1">
        
        <div className="absolute inset-0 flex items-center justify-start p-12">
          <blockquote className="text-left text-3xl font-medium text-gray-200 leading-snug">
            "Entiende tu presente. <br/>
            <span className="text-red-600">Domina</span> tu futuro."
          </blockquote>
        </div>
        
      </div>
    </div>
  )
}