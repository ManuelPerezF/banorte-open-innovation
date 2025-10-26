
"use client";

import { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

export default function ReportePage() {
  const [userType, setUserType] = useState<'personal' | 'company'>('personal');
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener información de la sesión
    const storedUserType = sessionStorage.getItem('userType') as 'personal' | 'company';
    const storedUserId = sessionStorage.getItem('userId');
    const storedUserName = sessionStorage.getItem('userName');
    
    if (!storedUserType || !storedUserId) {
      window.location.href = '/login';
      return;
    }

    setUserType(storedUserType);
    setUserId(storedUserId);
    setUserName(storedUserName || '');
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-700 mx-auto mb-4"></div>
          <p className="text-red-700">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        {/* Sidebar */}
        <DashboardSidebar userType={userType} userId={userId} userName={userName} />

        {/* Main Content */}
        <SidebarInset className="flex-1 w-full">
          {/* Header con trigger del sidebar */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white w-full">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-gray-300 mx-2" />
            <h1 className="text-xl font-semibold text-gray-900">
              Reporte Financiero {userType === "personal" ? "Personal" : "Empresarial"}
            </h1>
          </header>

          {/* Page Content */}
          <div className="flex-1 bg-gray-50 p-8 w-full min-h-0">
            <div className="w-full h-full">
              <h1 className="text-2xl font-bold mb-4">Reporte Financiero</h1>
              <p className="text-gray-600 mb-6">
                Aquí podrás ver un resumen detallado de tus finanzas, incluyendo ingresos, gastos, inversiones y recomendaciones personalizadas.
              </p>
              
              {/* Contenido del reporte financiero */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Resumen Mensual</h3>
                  <p className="text-gray-600">Análisis de ingresos y gastos del mes actual</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Tendencias</h3>
                  <p className="text-gray-600">Evolución de tus finanzas en el tiempo</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Recomendaciones</h3>
                  <p className="text-gray-600">Sugerencias personalizadas para optimizar tus finanzas</p>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}