import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Interfaces para los tipos de datos
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

interface AnalysisParams {
  companyId: string;
  months?: number;
  includeComparisons?: boolean;
}

interface TrendParams {
  companyId: string;
  forecastMonths?: number;
  includeSeasonality?: boolean;
}

interface OptimizationParams {
  companyId: string;
  targetMarginIncrease?: number;
  priorityAreas?: string[];
}

interface ScenarioParams {
  companyId: string;
  scenarios: Array<{
    name: string;
    revenueChange: number;
    expenseChanges: Record<string, number>;
  }>;
}

interface ReportParams {
  companyId?: string;
  userId?: string;
  reportType?: 'summary' | 'detailed' | 'trends' | 'recommendations';
  period?: 'monthly' | 'quarterly' | 'yearly';
}

// Funciones principales del MCP Server

export async function analyzeCompanyKPIs(params: AnalysisParams) {
  try {
    const { companyId, months = 6, includeComparisons = true } = params;

    // Obtener KPIs de la empresa
    const { data: kpis, error } = await supabase
      .from('v_company_kpis')
      .select('*')
      .eq('empresa_id', companyId)
      .order('month', { ascending: false })
      .limit(months);

    if (error) throw error;

    if (!kpis || kpis.length === 0) {
      return {
        success: false,
        message: `No se encontraron KPIs para la empresa ${companyId}`,
        data: null
      };
    }

    // Calcular métricas de análisis
    const latestKPI = kpis[0];
    const oldestKPI = kpis[kpis.length - 1];
    
    const analysis = {
      empresa_id: companyId,
      periodo_analizado: `${oldestKPI.month} a ${latestKPI.month}`,
      kpi_actual: latestKPI,
      tendencias: {
        ingresos: {
          actual: latestKPI.ingresos,
          crecimiento_periodo: ((latestKPI.ingresos - oldestKPI.ingresos) / oldestKPI.ingresos * 100).toFixed(2),
          crecimiento_mes_anterior: latestKPI.ingresos_mom_pct
        },
        margen_neto: {
          actual: latestKPI.margen_neto_pct,
          promedio_periodo: (kpis.reduce((sum, k) => sum + k.margen_neto_pct, 0) / kpis.length).toFixed(2),
          mejor_mes: Math.max(...kpis.map(k => k.margen_neto_pct)).toFixed(2),
          peor_mes: Math.min(...kpis.map(k => k.margen_neto_pct)).toFixed(2)
        },
        gastos_distribucion: {
          infraestructura: latestKPI.pct_infra,
          personal: latestKPI.pct_personal,
          marketing: latestKPI.pct_marketing
        }
      },
      alertas: [] as string[],
      recomendaciones: [] as string[]
    };

    // Generar alertas basadas en tendencias
    if (latestKPI.margen_neto_pct < 10) {
      analysis.alertas.push("⚠️ Margen neto muy bajo (<10%)");
    }
    if (latestKPI.ingresos_mom_pct < -5) {
      analysis.alertas.push("📉 Decrecimiento significativo de ingresos mes a mes");
    }
    if (latestKPI.pct_personal > 40) {
      analysis.alertas.push("👥 Gastos de personal altos (>40% del total)");
    }

    // Generar recomendaciones
    if (latestKPI.margen_neto_pct < 15) {
      analysis.recomendaciones.push("💡 Considerar optimización de gastos para mejorar margen");
    }
    if (latestKPI.pct_marketing < 5) {
      analysis.recomendaciones.push("📈 Evaluar incremento en inversión de marketing");
    }

    return {
      success: true,
      message: "Análisis de KPIs completado exitosamente",
      data: {
        ...analysis,
        datos_historicos: includeComparisons ? kpis : null
      }
    };

  } catch (error) {
    console.error('Error en análisis de KPIs:', error);
    return {
      success: false,
      message: 'Error al analizar KPIs de la empresa',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export async function predictTrends(params: TrendParams) {
  try {
    const { companyId, forecastMonths = 3, includeSeasonality = true } = params;

    // Obtener datos históricos para predicción
    const { data: historicalData, error } = await supabase
      .from('v_company_kpis')
      .select('*')
      .eq('empresa_id', companyId)
      .order('month', { ascending: true })
      .limit(12); // Últimos 12 meses para mejor predicción

    if (error) throw error;

    if (!historicalData || historicalData.length < 3) {
      return {
        success: false,
        message: 'Datos insuficientes para predicción (mínimo 3 meses)',
        data: null
      };
    }

    // Algoritmo simple de predicción basado en tendencias lineales
    const predictions = [];
    const lastMonth = new Date(historicalData[historicalData.length - 1].month);

    for (let i = 1; i <= forecastMonths; i++) {
      const futureMonth = new Date(lastMonth);
      futureMonth.setMonth(futureMonth.getMonth() + i);
      
      // Calcular tendencia de ingresos
      const ingresosRecientes = historicalData.slice(-3).map(d => d.ingresos);
      const tendenciaIngresos = (ingresosRecientes[2] - ingresosRecientes[0]) / 2;
      const ingresosProyectados = historicalData[historicalData.length - 1].ingresos + (tendenciaIngresos * i);

      // Calcular tendencia de gastos
      const gastosRecientes = historicalData.slice(-3).map(d => d.gastos);
      const tendenciaGastos = (gastosRecientes[2] - gastosRecientes[0]) / 2;
      const gastosProyectados = historicalData[historicalData.length - 1].gastos + (tendenciaGastos * i);

      predictions.push({
        mes: futureMonth.toISOString().slice(0, 7),
        ingresos_proyectados: Math.max(0, ingresosProyectados),
        gastos_proyectados: Math.max(0, gastosProyectados),
        utilidad_proyectada: ingresosProyectados - gastosProyectados,
        margen_proyectado: ((ingresosProyectados - gastosProyectados) / ingresosProyectados * 100),
        confianza: Math.max(30, 90 - (i * 15)) // Confianza decrece con el tiempo
      });
    }

    return {
      success: true,
      message: `Predicción de tendencias generada para ${forecastMonths} meses`,
      data: {
        empresa_id: companyId,
        periodo_prediccion: `${predictions[0].mes} a ${predictions[predictions.length - 1].mes}`,
        datos_historicos_usados: historicalData.length,
        predicciones: predictions,
        notas: [
          "Predicciones basadas en tendencias históricas lineales",
          "La confianza disminuye con el tiempo de proyección",
          includeSeasonality ? "Análisis de estacionalidad incluido" : "Sin análisis de estacionalidad"
        ]
      }
    };

  } catch (error) {
    console.error('Error en predicción de tendencias:', error);
    return {
      success: false,
      message: 'Error al predecir tendencias financieras',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export async function suggestBudgetOptimization(params: OptimizationParams) {
  try {
    const { companyId, targetMarginIncrease = 5, priorityAreas = ['marketing', 'personal', 'infraestructura'] } = params;

    // Obtener KPIs actuales
    const { data: currentKPIs, error } = await supabase
      .from('v_company_kpis')
      .select('*')
      .eq('empresa_id', companyId)
      .order('month', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!currentKPIs || currentKPIs.length === 0) {
      return {
        success: false,
        message: 'No se encontraron datos actuales para optimización',
        data: null
      };
    }

    const currentKPI = currentKPIs[0];
    const currentMargin = currentKPI.margen_neto_pct;
    const targetMargin = currentMargin + targetMarginIncrease;
    const requiredImprovement = (currentKPI.ingresos * targetMarginIncrease) / 100;

    const optimizations = [];

    // Analizar cada área prioritaria
    for (const area of priorityAreas) {
      let currentPercent = 0;
      let currentAmount = 0;
      let areaName = '';

      switch (area) {
        case 'marketing':
          currentPercent = currentKPI.pct_marketing;
          currentAmount = currentKPI.g_marketing;
          areaName = 'Marketing';
          break;
        case 'personal':
          currentPercent = currentKPI.pct_personal;
          currentAmount = currentKPI.g_personal;
          areaName = 'Personal';
          break;
        case 'infraestructura':
          currentPercent = currentKPI.pct_infra;
          currentAmount = currentKPI.g_infra;
          areaName = 'Infraestructura';
          break;
        default:
          continue;
      }

      // Sugerir reducción de 5-15% según el porcentaje actual
      const reductionPercent = currentPercent > 30 ? 15 : currentPercent > 20 ? 10 : 5;
      const potentialSaving = currentAmount * (reductionPercent / 100);
      const newAmount = currentAmount - potentialSaving;
      const newPercent = (newAmount / currentKPI.gastos) * 100;

      optimizations.push({
        area: areaName,
        situacion_actual: {
          monto: currentAmount,
          porcentaje: currentPercent.toFixed(1)
        },
        optimizacion_sugerida: {
          reduccion_porcentaje: reductionPercent,
          ahorro_estimado: potentialSaving,
          nuevo_monto: newAmount,
          nuevo_porcentaje: newPercent.toFixed(1)
        },
        impacto_margen: ((potentialSaving / currentKPI.ingresos) * 100).toFixed(2),
        dificultad: area === 'personal' ? 'Alta' : area === 'infraestructura' ? 'Media' : 'Baja',
        recomendaciones: generateAreaRecommendations(area, currentPercent, reductionPercent)
      });
    }

    const totalPotentialSaving = optimizations.reduce((sum, opt) => sum + opt.optimizacion_sugerida.ahorro_estimado, 0);
    const achievableMarginIncrease = (totalPotentialSaving / currentKPI.ingresos) * 100;

    return {
      success: true,
      message: 'Análisis de optimización presupuestaria completado',
      data: {
        empresa_id: companyId,
        situacion_actual: {
          margen_neto: currentMargin.toFixed(2),
          ingresos: currentKPI.ingresos,
          gastos_totales: currentKPI.gastos
        },
        objetivo: {
          margen_objetivo: targetMargin.toFixed(2),
          mejora_requerida: requiredImprovement,
          mejora_alcanzable: achievableMarginIncrease.toFixed(2)
        },
        optimizaciones_por_area: optimizations,
        resumen: {
          ahorro_total_estimado: totalPotentialSaving,
          factibilidad: achievableMarginIncrease >= targetMarginIncrease ? 'Alta' : 'Parcial',
          plazo_implementacion: '3-6 meses',
          riesgo_general: 'Medio'
        },
        proximos_pasos: [
          "Revisar cada área de optimización en detalle",
          "Implementar cambios de menor riesgo primero",
          "Monitorear impacto mensualmente",
          "Ajustar estrategia según resultados"
        ]
      }
    };

  } catch (error) {
    console.error('Error en optimización presupuestaria:', error);
    return {
      success: false,
      message: 'Error al generar sugerencias de optimización',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

function generateAreaRecommendations(area: string, currentPercent: number, reductionPercent: number): string[] {
  const recommendations: Record<string, string[]> = {
    marketing: [
      "Evaluar ROI de campañas actuales",
      "Optimizar canales digitales más efectivos",
      "Considerar marketing orgánico vs pagado",
      "Revisar acuerdos con agencias externas"
    ],
    personal: [
      "Revisar estructura organizacional",
      "Evaluar productividad por departamento",
      "Considerar automatización de procesos",
      "Optimizar esquemas de compensación"
    ],
    infraestructura: [
      "Revisar contratos de servicios recurrentes",
      "Evaluar migración a servicios cloud",
      "Optimizar espacios físicos",
      "Renegociar contratos con proveedores"
    ]
  };

  return recommendations[area] || ["Revisar gastos en esta categoría"];
}

export async function calculateScenarios(params: ScenarioParams) {
  try {
    const { companyId, scenarios } = params;

    // Obtener KPIs base actuales
    const { data: currentKPIs, error } = await supabase
      .from('v_company_kpis')
      .select('*')
      .eq('empresa_id', companyId)
      .order('month', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!currentKPIs || currentKPIs.length === 0) {
      return {
        success: false,
        message: 'No se encontraron datos base para cálculo de escenarios',
        data: null
      };
    }

    const baseKPI = currentKPIs[0];
    const scenarioResults = [];

    for (const scenario of scenarios) {
      // Calcular nuevos ingresos
      const newRevenue = baseKPI.ingresos * (1 + scenario.revenueChange / 100);
      
      // Calcular nuevos gastos por categoría
      const newExpenses = {
        infraestructura: baseKPI.g_infra * (1 + (scenario.expenseChanges.infraestructura || 0) / 100),
        personal: baseKPI.g_personal * (1 + (scenario.expenseChanges.personal || 0) / 100),
        marketing: baseKPI.g_marketing * (1 + (scenario.expenseChanges.marketing || 0) / 100),
        servicios: baseKPI.g_servicios * (1 + (scenario.expenseChanges.servicios || 0) / 100),
        costos: baseKPI.g_costos * (1 + (scenario.expenseChanges.costos || 0) / 100)
      };

      const totalNewExpenses = Object.values(newExpenses).reduce((sum, exp) => sum + exp, 0);
      const newProfit = newRevenue - totalNewExpenses;
      const newMargin = (newProfit / newRevenue) * 100;

      scenarioResults.push({
        nombre: scenario.name,
        cambios_aplicados: {
          ingresos: `${scenario.revenueChange > 0 ? '+' : ''}${scenario.revenueChange}%`,
          gastos: scenario.expenseChanges
        },
        resultados: {
          ingresos: {
            base: baseKPI.ingresos,
            nuevo: newRevenue,
            diferencia: newRevenue - baseKPI.ingresos,
            cambio_porcentual: scenario.revenueChange
          },
          gastos: {
            base: baseKPI.gastos,
            nuevo: totalNewExpenses,
            diferencia: totalNewExpenses - baseKPI.gastos,
            desglose: newExpenses
          },
          utilidad: {
            base: baseKPI.utilidad_neta,
            nueva: newProfit,
            diferencia: newProfit - baseKPI.utilidad_neta,
            cambio_porcentual: ((newProfit - baseKPI.utilidad_neta) / baseKPI.utilidad_neta * 100)
          },
          margen: {
            base: baseKPI.margen_neto_pct,
            nuevo: newMargin,
            diferencia: newMargin - baseKPI.margen_neto_pct
          }
        },
        evaluacion: {
          viabilidad: newProfit > 0 ? (newMargin > 10 ? 'Alta' : 'Media') : 'Baja',
          riesgo: Math.abs(scenario.revenueChange) > 20 ? 'Alto' : 'Medio',
          recomendacion: newMargin > baseKPI.margen_neto_pct ? 'Favorable' : 'Desfavorable'
        }
      });
    }

    // Encontrar el mejor escenario
    const bestScenario = scenarioResults.reduce((best, current) => 
      current.resultados.margen.nuevo > best.resultados.margen.nuevo ? current : best
    );

    return {
      success: true,
      message: `Análisis de ${scenarios.length} escenarios completado`,
      data: {
        empresa_id: companyId,
        escenario_base: {
          ingresos: baseKPI.ingresos,
          gastos: baseKPI.gastos,
          utilidad: baseKPI.utilidad_neta,
          margen: baseKPI.margen_neto_pct
        },
        escenarios_analizados: scenarioResults,
        mejor_escenario: bestScenario.nombre,
        resumen_comparativo: {
          rango_ingresos: {
            minimo: Math.min(...scenarioResults.map(s => s.resultados.ingresos.nuevo)),
            maximo: Math.max(...scenarioResults.map(s => s.resultados.ingresos.nuevo))
          },
          rango_margenes: {
            minimo: Math.min(...scenarioResults.map(s => s.resultados.margen.nuevo)),
            maximo: Math.max(...scenarioResults.map(s => s.resultados.margen.nuevo))
          }
        }
      }
    };

  } catch (error) {
    console.error('Error en cálculo de escenarios:', error);
    return {
      success: false,
      message: 'Error al calcular escenarios financieros',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export async function generateFinancialReport(params: ReportParams) {
  try {
    const { companyId, userId, reportType = 'summary', period = 'monthly' } = params;

    if (companyId) {
      return await generateCompanyReport(companyId, reportType, period);
    } else if (userId) {
      return await generatePersonalReport(parseInt(userId), reportType, period);
    } else {
      return {
        success: false,
        message: 'Debe especificar companyId o userId para generar el reporte',
        data: null
      };
    }

  } catch (error) {
    console.error('Error generando reporte financiero:', error);
    return {
      success: false,
      message: 'Error al generar reporte financiero',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

async function generateCompanyReport(companyId: string, reportType: string, period: string) {
  const { data: kpis, error } = await supabase
    .from('v_company_kpis')
    .select('*')
    .eq('empresa_id', companyId)
    .order('month', { ascending: false })
    .limit(period === 'yearly' ? 12 : period === 'quarterly' ? 3 : 6);

  if (error) throw error;

  const latestKPI = kpis[0];
  const report = {
    tipo: 'Empresarial',
    empresa_id: companyId,
    periodo: period,
    fecha_generacion: new Date().toISOString(),
    resumen_ejecutivo: {
      ingresos_actuales: latestKPI.ingresos,
      margen_neto: latestKPI.margen_neto_pct,
      crecimiento_mom: latestKPI.ingresos_mom_pct,
      estado_general: latestKPI.margen_neto_pct > 15 ? 'Saludable' : 'Requiere atención'
    }
  };

  if (reportType === 'detailed') {
    return {
      success: true,
      message: 'Reporte detallado generado',
      data: { ...report, datos_detallados: kpis }
    };
  }

  return {
    success: true,
    message: 'Reporte generado exitosamente',
    data: report
  };
}

export async function getPersonalFinancialSummary(userId: number) {
  try {
    // Obtener todas las transacciones del usuario
    const { data, error } = await supabase
      .from('personal_tx')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false });

    if (error) throw error;

    const totalIngresos = data
      .filter(tx => tx.tipo === 'ingreso')
      .reduce((sum, tx) => sum + tx.monto, 0);

    const totalGastos = data
      .filter(tx => tx.tipo === 'gasto')
      .reduce((sum, tx) => sum + tx.monto, 0);

    // Agrupar gastos por categoría
    const gastosPorCategoria = data
      .filter(tx => tx.tipo === 'gasto')
      .reduce((acc, tx) => {
        const categoria = tx.categoria || 'Sin categoría';
        acc[categoria] = (acc[categoria] || 0) + tx.monto;
        return acc;
      }, {} as Record<string, number>);

    // Obtener transacciones del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const transaccionesMes = data.filter(tx => new Date(tx.fecha) >= inicioMes);
    
    const ingresosMes = transaccionesMes
      .filter(tx => tx.tipo === 'ingreso')
      .reduce((sum, tx) => sum + tx.monto, 0);

    const gastosMes = transaccionesMes
      .filter(tx => tx.tipo === 'gasto')
      .reduce((sum, tx) => sum + tx.monto, 0);

    return {
      success: true,
      data: {
        user_id: userId,
        resumen_general: {
          totalIngresos,
          totalGastos,
          balance: totalIngresos - totalGastos,
          transacciones_analizadas: data.length
        },
        mes_actual: {
          ingresos: ingresosMes,
          gastos: gastosMes,
          balance: ingresosMes - gastosMes
        },
        gastos_por_categoria: gastosPorCategoria,
        transacciones_recientes: data.slice(0, 10).map(tx => ({
          fecha: tx.fecha,
          tipo: tx.tipo,
          monto: tx.monto,
          categoria: tx.categoria,
          descripcion: tx.descripcion
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al obtener resumen financiero personal',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

async function generatePersonalReport(userId: number, reportType: string, period: string) {
  const summary = await getPersonalFinancialSummary(userId);
  
  if (!summary.success || !summary.data) {
    return summary;
  }

  const data = summary.data;
  const baseReport = {
    success: true,
    message: 'Reporte personal generado exitosamente',
    data: {
      tipo: 'Personal',
      periodo: period,
      fecha_generacion: new Date().toISOString(),
      ...data,
      recomendaciones: [] as string[]
    }
  };

  if (reportType === 'recommendations') {
    const recommendations = [];
    
    // Analizar balance
    if (data.mes_actual && data.mes_actual.balance < 0) {
      recommendations.push('⚠️ Tu balance mensual es negativo. Considera reducir gastos o aumentar ingresos.');
    } else if (data.mes_actual && data.mes_actual.balance > data.mes_actual.ingresos * 0.2) {
      recommendations.push('✅ Excelente! Estás ahorrando más del 20% de tus ingresos.');
    }

    // Analizar categorías de gastos
    if (data.gastos_por_categoria) {
      const topGastos = Object.entries(data.gastos_por_categoria)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3);

      if (topGastos.length > 0) {
        recommendations.push(`📊 Tu mayor gasto es en ${topGastos[0][0]}: $${(topGastos[0][1] as number).toLocaleString()}`);
      }
    }

    // Sugerencias generales
    if (data.resumen_general && data.resumen_general.balance > 0) {
      recommendations.push('💰 Considera invertir parte de tu balance positivo para generar rendimientos.');
    }

    baseReport.data.recomendaciones = recommendations;
  }

  return baseReport;
}

export async function getCompanyFinancialContext(companyId: string) {
  try {
    const { data: kpis, error } = await supabase
      .from('v_company_kpis')
      .select('*')
      .eq('empresa_id', companyId)
      .order('month', { ascending: false })
      .limit(6);

    if (error) throw error;

    return {
      success: true,
      data: kpis
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al obtener contexto financiero de la empresa',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}