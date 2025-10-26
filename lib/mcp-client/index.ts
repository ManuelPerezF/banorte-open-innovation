// Cliente MCP simplificado para el chatbot de Banorte
// En lugar de conectar directamente al servidor MCP, haremos llamadas HTTP

import supabase from "@/services/supabase";

// Función local para obtener datos personales (reemplaza chatContext)
async function getPersonalFinancialSummaryFallback(userId: number) {
  try {
    const { data, error } = await supabase
      .from('personal_tx')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    // Calcular resumen con TODAS las transacciones
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
      transacciones: data.slice(0, 10).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) // Últimas 10 transacciones ordenadas
    };
  } catch (error) {
    console.error('Error getting personal financial summary fallback:', error);
    return null;
  }
}

export interface MCPToolResponse {
  success: boolean;
  message: string;
  data: any;
  error?: string;
}

export interface MCPAnalysisParams {
  companyId: string;
  months?: number;
  includeComparisons?: boolean;
}

export interface MCPTrendParams {
  companyId: string;
  forecastMonths?: number;
  includeSeasonality?: boolean;
}

export interface MCPOptimizationParams {
  companyId: string;
  targetMarginIncrease?: number;
  priorityAreas?: string[];
}

export interface MCPScenarioParams {
  companyId: string;
  scenarios: Array<{
    name: string;
    revenueChange: number;
    expenseChanges: Record<string, number>;
  }>;
}

export interface MCPReportParams {
  companyId?: string;
  userId?: string;
  reportType?: 'summary' | 'detailed' | 'trends' | 'recommendations';
  period?: 'monthly' | 'quarterly' | 'yearly';
}

export class BanorteMCPClient {
  private mcpServerUrl: string;

  constructor(serverUrl: string = '/api/mcp') {
    this.mcpServerUrl = serverUrl;
  }

  async connect(): Promise<void> {
    console.log('Cliente MCP inicializado');
  }

  async disconnect(): Promise<void> {
    console.log('Cliente MCP desconectado');
  }

  private async callMCPAPI(tool: string, parameters: any): Promise<MCPToolResponse> {
    try {
      const response = await fetch(this.mcpServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tool, parameters }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en llamada MCP ${tool}:`, error);
      return {
        success: false,
        message: `Error en ${tool}`,
        data: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  async analyzeCompanyKPIs(params: MCPAnalysisParams): Promise<MCPToolResponse> {
    return this.callMCPAPI('analyze_company_kpis', params);
  }

  async predictFinancialTrends(params: MCPTrendParams): Promise<MCPToolResponse> {
    return this.callMCPAPI('predict_financial_trends', params);
  }

  async suggestBudgetOptimization(params: MCPOptimizationParams): Promise<MCPToolResponse> {
    return this.callMCPAPI('suggest_budget_optimization', params);
  }

  async calculateScenarios(params: MCPScenarioParams): Promise<MCPToolResponse> {
    return this.callMCPAPI('calculate_scenarios', params);
  }

  async generateFinancialReport(params: MCPReportParams): Promise<MCPToolResponse> {
    return this.callMCPAPI('generate_financial_report', params);
  }

  // Método simplificado para obtener análisis financiero inteligente
  async getFinancialContext(userType: 'personal' | 'company', userId: string): Promise<any> {
    try {
      if (userType === 'company') {
        // Obtener análisis básico de KPIs
        const kpiAnalysis = await this.analyzeCompanyKPIs({ 
          companyId: userId,
          months: 6,
          includeComparisons: true 
        });

        if (kpiAnalysis.success && kpiAnalysis.data) {
          // También obtener análisis de optimización para gastos por categoría
          const optimization = await this.suggestBudgetOptimization({
            companyId: userId,
            targetMarginIncrease: 5,
            priorityAreas: ['marketing', 'personal', 'infraestructura']
          });

          return {
            type: 'company',
            data: {
              kpis: kpiAnalysis.data,
              optimization: optimization.success ? optimization.data : null
            },
            summary: `Análisis completo de KPIs y optimización para empresa ${userId}: ${kpiAnalysis.message}`
          };
        }
      } else {
        // Para usuarios personales, FORZAR uso de función fallback con TODOS los datos
        // El MCP server tiene datos limitados, usar función directa
        let personalData = null;
        
        try {
          console.log('🔧 Usando función fallback con TODOS los datos históricos');
          const fallbackData = await getPersonalFinancialSummaryFallback(parseInt(userId));
          if (fallbackData) {
            personalData = {
              resumen_general: {
                totalIngresos: fallbackData.totalIngresos,
                totalGastos: fallbackData.totalGastos,
                balance: fallbackData.balance
              },
              gastos_por_categoria: fallbackData.gastosPorCategoria,
              transacciones_recientes: fallbackData.transacciones
            };
            console.log('✅ Datos históricos completos:', {
              ingresos: fallbackData.totalIngresos,
              gastos: fallbackData.totalGastos,
              balance: fallbackData.balance,
              totalTransacciones: fallbackData.transacciones.length
            });
          }
        } catch (fallbackError) {
          console.error('❌ Error en función fallback:', fallbackError);
        }

        if (personalData) {
          return {
            type: 'personal',
            data: personalData,
            summary: `Análisis financiero histórico completo para usuario ${userId} - ${Object.keys(personalData.gastos_por_categoria).length} categorías analizadas`
          };
        }
      }

      return {
        type: userType,
        data: null,
        summary: `Contexto básico para usuario ${userType}: ${userId}`
      };
    } catch (error) {
      console.error('Error obteniendo contexto financiero:', error);
      return {
        type: userType,
        data: null,
        summary: `Error obteniendo contexto para ${userId}`,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Método para obtener recomendaciones inteligentes
  async getIntelligentRecommendations(userType: 'personal' | 'company', userId: string, query: string): Promise<string[]> {
    try {
      if (userType === 'company') {
        // Obtener análisis completo de KPIs
        const kpiAnalysis = await this.analyzeCompanyKPIs({
          companyId: userId,
          months: 6,
          includeComparisons: true
        });

        if (kpiAnalysis.success && kpiAnalysis.data) {
          const recommendations = [];
          
          // Agregar alertas como recomendaciones
          if (kpiAnalysis.data.alertas && kpiAnalysis.data.alertas.length > 0) {
            recommendations.push(...kpiAnalysis.data.alertas);
          }
          
          // Agregar recomendaciones específicas
          if (kpiAnalysis.data.recomendaciones && kpiAnalysis.data.recomendaciones.length > 0) {
            recommendations.push(...kpiAnalysis.data.recomendaciones);
          }

          // Si el query menciona gastos por categoría, obtener optimizaciones
          if (query.toLowerCase().includes('categoria') || query.toLowerCase().includes('gastos')) {
            const optimization = await this.suggestBudgetOptimization({
              companyId: userId,
              targetMarginIncrease: 5,
              priorityAreas: ['marketing', 'personal', 'infraestructura']
            });

            if (optimization.success && optimization.data?.optimizaciones_por_area) {
              const categoryRecommendations = optimization.data.optimizaciones_por_area.map((opt: any) => 
                `📊 ${opt.area}: ${opt.recomendaciones?.[0] || 'Revisar gastos en esta área'} (Ahorro potencial: $${opt.optimizacion_sugerida?.ahorro_estimado?.toLocaleString() || 'N/A'})`
              );
              recommendations.push(...categoryRecommendations);
            }
          }

          return recommendations.length > 0 ? recommendations : [
            'Datos analizados correctamente. Consulta específica para más detalles.'
          ];
        }
      } else {
        // Para usuarios personales, generar reporte con recomendaciones
        const personalReport = await this.generateFinancialReport({
          userId: userId,
          reportType: 'recommendations',
          period: 'monthly'
        });

        if (personalReport.success && personalReport.data) {
          const recommendations = [];
          
          // Agregar datos básicos
          if (personalReport.data.resumen_general) {
            recommendations.push(`💰 Balance general: $${personalReport.data.resumen_general.balance?.toLocaleString() || 'N/A'}`);
          }
          
          if (personalReport.data.mes_actual) {
            recommendations.push(`📅 Balance mensual: $${personalReport.data.mes_actual.balance?.toLocaleString() || 'N/A'}`);
          }

          // Agregar gastos por categoría más altos
          if (personalReport.data.gastos_por_categoria) {
            const topCategoria = Object.entries(personalReport.data.gastos_por_categoria)
              .sort(([,a], [,b]) => (b as number) - (a as number))[0];
            
            if (topCategoria) {
              recommendations.push(`📊 Mayor gasto: ${topCategoria[0]} ($${(topCategoria[1] as number).toLocaleString()})`);
            }
          }

          // Agregar recomendaciones específicas
          if (personalReport.data.recomendaciones && personalReport.data.recomendaciones.length > 0) {
            recommendations.push(...personalReport.data.recomendaciones);
          }

          // Si pregunta sobre categorías específicamente
          if (query.toLowerCase().includes('categoria') || query.toLowerCase().includes('gastos')) {
            if (personalReport.data.gastos_por_categoria) {
              const allCategorias = Object.entries(personalReport.data.gastos_por_categoria)
                .sort(([,a], [,b]) => (b as number) - (a as number));
              
              recommendations.push('📋 Análisis de gastos por categoría:');
              allCategorias.slice(0, 5).forEach(([categoria, monto]) => {
                recommendations.push(`  • ${categoria}: $${(monto as number).toLocaleString()}`);
              });
            }
          }

          return recommendations.length > 0 ? recommendations : [
            'Datos analizados correctamente. Pregúntame sobre algo específico para más detalles.'
          ];
        }
      }

      return [
        'Datos financieros analizados. Pregúntame sobre algo específico para obtener más información.'
      ];
    } catch (error) {
      console.error('Error obteniendo recomendaciones:', error);
      return [
        'Error al acceder a los datos financieros. Verifica que tienes transacciones registradas.'
      ];
    }
  }

  // Método para análisis de tendencias
  async getTrendAnalysis(companyId: string): Promise<any> {
    try {
      const trends = await this.predictFinancialTrends({
        companyId,
        forecastMonths: 3,
        includeSeasonality: true
      });

      return trends.success ? trends.data : null;
    } catch (error) {
      console.error('Error obteniendo análisis de tendencias:', error);
      return null;
    }
  }
}

// Instancia singleton para usar en toda la aplicación
let mcpClientInstance: BanorteMCPClient | null = null;

export async function getMCPClient(): Promise<BanorteMCPClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = new BanorteMCPClient();
    await mcpClientInstance.connect();
  }
  return mcpClientInstance;
}

export async function closeMCPClient(): Promise<void> {
  if (mcpClientInstance) {
    await mcpClientInstance.disconnect();
    mcpClientInstance = null;
  }
}

// Funciones de utilidad para el chatbot
export async function getEnhancedFinancialContext(userType: 'personal' | 'company', userId: string): Promise<string> {
  try {
    const client = await getMCPClient();
    const context = await client.getFinancialContext(userType, userId);
    
    if (context.data) {
      if (userType === 'company' && context.data.kpis) {
        const kpis = context.data.kpis;
        
        let contextText = `DATOS EMPRESA ${userId}:

� SITUACIÓN ACTUAL:
- Ingresos: $${kpis.kpi_actual?.ingresos?.toLocaleString() || 'N/A'}
- Gastos: $${kpis.kpi_actual?.gastos?.toLocaleString() || 'N/A'}
- Margen: ${kpis.kpi_actual?.margen_neto_pct?.toFixed(1) || 'N/A'}%
- Crecimiento MoM: ${kpis.kpi_actual?.ingresos_mom_pct?.toFixed(1) || 'N/A'}%

� GASTOS POR CATEGORÍA:
- Personal: ${kpis.kpi_actual?.pct_personal?.toFixed(1) || 'N/A'}% ($${kpis.kpi_actual?.g_personal?.toLocaleString() || 'N/A'})
- Marketing: ${kpis.kpi_actual?.pct_marketing?.toFixed(1) || 'N/A'}% ($${kpis.kpi_actual?.g_marketing?.toLocaleString() || 'N/A'})
- Infraestructura: ${kpis.kpi_actual?.pct_infra?.toFixed(1) || 'N/A'}% ($${kpis.kpi_actual?.g_infra?.toLocaleString() || 'N/A'})`;

        return contextText;
      } else if (userType === 'personal' && context.data) {
        const data = context.data;
        let contextText = `DATOS PERSONALES ${userId}:

� RESUMEN:
- Ingresos totales: $${data.resumen_general?.totalIngresos?.toLocaleString() || 'N/A'}
- Gastos totales: $${data.resumen_general?.totalGastos?.toLocaleString() || 'N/A'}  
- Balance: $${data.resumen_general?.balance?.toLocaleString() || 'N/A'}`;

        if (data.gastos_por_categoria && Object.keys(data.gastos_por_categoria).length > 0) {
          const top3 = Object.entries(data.gastos_por_categoria)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 3);
          
          contextText += `\n\n📊 TOP GASTOS:`;
          top3.forEach(([categoria, monto]) => {
            contextText += `\n- ${categoria}: $${(monto as number).toLocaleString()}`;
          });
        }

        return contextText;
      }
    }
    
    return `DATOS BÁSICOS: ${userType} ${userId}`;
  } catch (error) {
    console.error('Error en contexto MCP:', error);
    return `ERROR: No se pudieron obtener datos para ${userType} ${userId}`;
  }
}

export async function getSmartRecommendations(userType: 'personal' | 'company', userId: string, query: string): Promise<string[]> {
  try {
    const client = await getMCPClient();
    return await client.getIntelligentRecommendations(userType, userId, query);
  } catch (error) {
    console.error('Error obteniendo recomendaciones:', error);
    return [];
  }
}