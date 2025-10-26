
"use client";

import { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import supabase from '@/services/supabase';
import { getPersonalExpensesByCategory, getAllTimeExpenseSummary } from '@/services/personalExpenses';

interface CompanyKPI {
  empresa_id: string;
  month: string;
  ingresos: number;
  gastos: number;
  utilidad_neta: number;
  margen_neto_pct: number;
  ingresos_mom_pct: number;
  pct_personal: number;
  pct_marketing: number;
  pct_infra: number;
  g_personal: number;
  g_marketing: number;
  g_infra: number;
  g_costos: number;
  g_servicios: number;
}

interface CompanyData {
  id: string;
  name: string;
}

interface PersonalSummary {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
}

interface PersonalCategories {
  [key: string]: {
    ingresos: number;
    gastos: number;
  };
}

export default function ReportePage() {
  const [userType, setUserType] = useState<'personal' | 'company'>('personal');
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState<CompanyKPI | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [monthsWithData, setMonthsWithData] = useState<number>(0);
  const [personalSummary, setPersonalSummary] = useState<PersonalSummary | null>(null);
  const [personalCategories, setPersonalCategories] = useState<PersonalCategories | null>(null);

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
    
    if (storedUserType === 'company') {
      fetchCompanyData(storedUserId);
    } else {
      fetchPersonalData(parseInt(storedUserId));
    }
  }, []);

  const fetchCompanyData = async (companyId: string) => {
    try {
      // Obtener datos de la empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompanyData(company);

      // Obtener KPIs más recientes
      const { data: kpis, error: kpiError } = await supabase
        .from('v_company_kpis')
        .select('*')
        .eq('empresa_id', companyId)
        .order('month', { ascending: false })
        .limit(1);

      if (kpiError) throw kpiError;
      
      if (kpis && kpis.length > 0) {
        setKpiData(kpis[0]);
      }

      // Contar el número de meses con datos
      const { data: allKpis, error: countError } = await supabase
        .from('v_company_kpis')
        .select('month')
        .eq('empresa_id', companyId);

      if (countError) throw countError;
      
      setMonthsWithData(allKpis?.length || 0);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPersonalData = async (userId: number) => {
    try {
      // Obtener resumen de TODOS los datos históricos (no solo mes actual)
      const summary = await getAllTimeExpenseSummary(userId);
      setPersonalSummary(summary);

      // Obtener categorías
      const categories = await getPersonalExpensesByCategory(userId);
      setPersonalCategories(categories);
    } catch (error) {
      console.error('Error fetching personal data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChangeIcon = (value: number) => {
    return value > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getChangeColor = (value: number) => {
    return value > 0 ? 'text-green-600' : 'text-red-600';
  };

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
        <DashboardSidebar userType={userType} userId={userId} />

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
          <div className="flex-1 bg-gray-50 p-8 w-full min-h-0 overflow-auto">
            <div className="w-full max-w-7xl mx-auto space-y-8">
              {/* Header del Reporte */}
              <div className="bg-red-600 text-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-8 w-8" />
                  <h1 className="text-2xl font-bold">Reporte de Análisis Financiero</h1>
                </div>
                <p className="text-red-100">
                  Generado el {new Date().toLocaleDateString('es-MX', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {userType === 'company' && companyData ? (
                <>
                  {/* Información de la Empresa */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Información de la Empresa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Sector</p>
                          <p className="font-semibold">Comercio</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Empresa</p>
                          <p className="font-semibold">{companyData.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Ventas Mensuales</p>
                          <p className="font-semibold">{kpiData ? formatCurrency(kpiData.ingresos) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Registros</p>
                          <p className="font-semibold">{monthsWithData} {monthsWithData === 1 ? 'mes' : 'meses'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Métricas Clave (KPIs) */}
                  {kpiData && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">Métricas Clave (KPIs)</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Ventas Mensuales */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 mb-1">Ventas Mensuales</p>
                              <p className="text-2xl font-bold">{formatCurrency(kpiData.ingresos)}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {getChangeIcon(kpiData.ingresos_mom_pct || 0)}
                                <span className={`text-sm font-medium ${getChangeColor(kpiData.ingresos_mom_pct || 0)}`}>
                                  {formatPercentage(kpiData.ingresos_mom_pct || 0)} vs. anterior
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* EBITDA */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 mb-1">EBITDA</p>
                              <p className="text-2xl font-bold">{formatCurrency(kpiData.utilidad_neta)}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {getChangeIcon(kpiData.margen_neto_pct)}
                                <span className={`text-sm font-medium ${getChangeColor(kpiData.margen_neto_pct)}`}>
                                  {formatPercentage(kpiData.margen_neto_pct)} vs. anterior
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Flujo Libre */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 mb-1">Flujo Libre</p>
                              <p className="text-2xl font-bold">{formatCurrency(kpiData.ingresos - kpiData.gastos)}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {getChangeIcon(-3.2)}
                                <span className="text-sm font-medium text-orange-600">
                                  {formatPercentage(-3.2)} vs. anterior
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
        
                      </div>
                    </div>
                  )}

                  {/* Distribución de Gastos - Tabla */}
                  {kpiData && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">Distribución de Gastos</h2>
                      <Card>
                        <CardContent className="p-6">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-right">% del Total</TableHead>
                                <TableHead className="text-right">Estado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Personal</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatCurrency(kpiData.g_personal)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-medium">{formatPercentage(kpiData.pct_personal)}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    kpiData.pct_personal > 50 ? 'bg-red-100 text-red-800' :
                                    kpiData.pct_personal > 30 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {kpiData.pct_personal > 50 ? 'Alto' :
                                     kpiData.pct_personal > 30 ? 'Medio' : 'Óptimo'}
                                  </span>
                                </TableCell>
                              </TableRow>
                              
                              <TableRow>
                                <TableCell className="font-medium">Marketing</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatCurrency(kpiData.g_marketing)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-medium">{formatPercentage(kpiData.pct_marketing)}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    kpiData.pct_marketing > 20 ? 'bg-red-100 text-red-800' :
                                    kpiData.pct_marketing > 10 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {kpiData.pct_marketing > 20 ? 'Alto' :
                                     kpiData.pct_marketing > 10 ? 'Medio' : 'Óptimo'}
                                  </span>
                                </TableCell>
                              </TableRow>
                              
                              <TableRow>
                                <TableCell className="font-medium">Infraestructura</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatCurrency(kpiData.g_infra)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-medium">{formatPercentage(kpiData.pct_infra)}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    kpiData.pct_infra > 25 ? 'bg-red-100 text-red-800' :
                                    kpiData.pct_infra > 15 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {kpiData.pct_infra > 25 ? 'Alto' :
                                     kpiData.pct_infra > 15 ? 'Medio' : 'Óptimo'}
                                  </span>
                                </TableCell>
                              </TableRow>
                              
                              <TableRow>
                                <TableCell className="font-medium">Servicios</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatCurrency(kpiData.g_servicios)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-medium">{formatPercentage((kpiData.g_servicios / kpiData.gastos) * 100)}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Variable
                                  </span>
                                </TableCell>
                              </TableRow>
                              
                              {/* Fila de totales */}
                              <TableRow className="border-t-2 font-semibold bg-gray-50">
                                <TableCell className="font-bold">TOTAL GASTOS</TableCell>
                                <TableCell className="text-right font-bold">
                                  {formatCurrency(kpiData.gastos)}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  100.0%
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                                    Total
                                  </span>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </>
              ) : (
                /* Vista para usuarios personales */
                <>
                  {/* Información Personal */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Información Personal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Tipo de Usuario</p>
                          <p className="font-semibold">Personal</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Usuario</p>
                          <p className="font-semibold">{userName || 'Usuario'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Ingresos Totales</p>
                          <p className="font-semibold">{personalSummary ? formatCurrency(personalSummary.totalIngresos) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Balance</p>
                          <p className={`font-semibold ${personalSummary && personalSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {personalSummary ? formatCurrency(personalSummary.balance) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Métricas Personales */}
                  {personalSummary && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">Resumen Financiero Histórico</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Ingresos Totales */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 mb-1">Ingresos Históricos</p>
                              <p className="text-2xl font-bold text-green-600">{formatCurrency(personalSummary.totalIngresos)}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-600">
                                  Total acumulado
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Gastos Totales */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 mb-1">Gastos Históricos</p>
                              <p className="text-2xl font-bold text-red-600">{formatCurrency(personalSummary.totalGastos)}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-600">
                                  Total gastado
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Balance */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 mb-1">Balance Neto</p>
                              <p className={`text-2xl font-bold ${personalSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(personalSummary.balance)}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                {personalSummary.balance >= 0 ? (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <span className={`text-sm font-medium ${personalSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {personalSummary.balance >= 0 ? 'Patrimonio positivo' : 'Déficit histórico'}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Distribución por Categorías - Tabla */}
                  {personalCategories && Object.keys(personalCategories).length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">Distribución por Categorías</h2>
                      <Card>
                        <CardContent className="p-6">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="text-right">Ingresos</TableHead>
                                <TableHead className="text-right">Gastos</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-right">% del Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(personalCategories)
                                .sort(([,a], [,b]) => (b.ingresos + b.gastos) - (a.ingresos + a.gastos))
                                .map(([categoria, datos]) => {
                                  const balance = datos.ingresos - datos.gastos;
                                  const totalMovimientos = personalSummary ? (personalSummary.totalIngresos + personalSummary.totalGastos) : 1;
                                  const porcentajeTotal = ((datos.ingresos + datos.gastos) / totalMovimientos) * 100;
                                  
                                  return (
                                    <TableRow key={categoria}>
                                      <TableCell className="font-medium">{categoria}</TableCell>
                                      <TableCell className="text-right">
                                        {datos.ingresos > 0 ? (
                                          <span className="text-green-600 font-semibold">
                                            {formatCurrency(datos.ingresos)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {datos.gastos > 0 ? (
                                          <span className="text-red-600 font-semibold">
                                            {formatCurrency(datos.gastos)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatCurrency(balance)}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className="text-gray-600">
                                          {porcentajeTotal.toFixed(1)}%
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              
                              {/* Fila de totales */}
                              {personalSummary && (
                                <TableRow className="border-t-2 font-semibold bg-gray-50">
                                  <TableCell className="font-bold">TOTAL</TableCell>
                                  <TableCell className="text-right text-green-600 font-bold">
                                    {formatCurrency(personalSummary.totalIngresos)}
                                  </TableCell>
                                  <TableCell className="text-right text-red-600 font-bold">
                                    {formatCurrency(personalSummary.totalGastos)}
                                  </TableCell>
                                  <TableCell className="text-right font-bold">
                                    <span className={personalSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {formatCurrency(personalSummary.balance)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right text-gray-600 font-bold">
                                    100.0%
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Mensaje si no hay datos */}
                  {(!personalSummary || (personalSummary.totalIngresos === 0 && personalSummary.totalGastos === 0)) && (
                    <div className="text-center py-12">
                      <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Sin Datos Financieros
                      </h2>
                      <p className="text-gray-600 mb-6">
                        No tienes transacciones registradas para este mes. Agrega algunas en la sección de Datos.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}