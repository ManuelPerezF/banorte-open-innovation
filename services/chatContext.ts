import supabase from "./supabase";

interface CompanyKPI {
  empresa_id: string;
  month: string;
  ingresos: number;
  gastos: number;
  utilidad_neta: number;
  margen_neto_pct: number;
  g_infra: number;
  g_personal: number;
  g_marketing: number;
  g_servicios: number;
  g_costos: number;
  pct_infra: number;
  pct_personal: number;
  pct_marketing: number;
  ingresos_mom_pct: number;
}

interface CompanyDecision {
  recommendations: Array<{
    kpi: string;
    month: string;
    value: number;
    decision: string;
  }>;
}

export async function getCompanyKPIs(companyId: string, limit: number = 6) {
  try {
    const { data, error } = await supabase
      .from('v_company_kpis')
      .select('*')
      .eq('empresa_id', companyId)
      .order('month', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as CompanyKPI[];
  } catch (error) {
    console.error('Error getting company KPIs:', error);
    return [];
  }
}

export async function getCompanyMonthlyData(companyId: string, limit: number = 6) {
  try {
    const { data, error } = await supabase
      .from('v_company_monthly')
      .select('*')
      .eq('empresa_id', companyId)
      .order('month', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting company monthly data:', error);
    return [];
  }
}

export async function getCompanyDecisions(companyId: string) {
  try {
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .rpc('decisions_company_fn', {
        p_company: companyId,
        p_from: fromDate,
        p_to: toDate
      });

    if (error) throw error;
    return data as CompanyDecision;
  } catch (error) {
    console.error('Error getting company decisions:', error);
    return { recommendations: [] };
  }
}

export async function getWhatIfAnalysis(companyId: string, params: any) {
  try {
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .rpc('whatif_company_fn', {
        p_company: companyId,
        p_from: fromDate,
        p_to: toDate,
        p_params: params
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting what-if analysis:', error);
    return null;
  }
}

export async function getPersonalFinancialSummary(userId: number) {
  try {
    const { data, error } = await supabase
      .from('personal_tx')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Calcular resumen
    const totalIngresos = data
      .filter(tx => tx.tipo === 'ingreso')
      .reduce((sum, tx) => sum + tx.monto, 0);

    const totalGastos = data
      .filter(tx => tx.tipo === 'gasto')
      .reduce((sum, tx) => sum + tx.monto, 0);

    // Gastos por categoría
    const gastosPorCategoria = data
      .filter(tx => tx.tipo === 'gasto')
      .reduce((acc, tx) => {
        const categoria = tx.categoria || 'Sin categoría';
        acc[categoria] = (acc[categoria] || 0) + tx.monto;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalIngresos,
      totalGastos,
      balance: totalIngresos - totalGastos,
      gastosPorCategoria,
      transacciones: data.slice(0, 10) // Últimas 10 transacciones
    };
  } catch (error) {
    console.error('Error getting personal financial summary:', error);
    return null;
  }
}