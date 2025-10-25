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
export declare function analyzeCompanyKPIs(params: AnalysisParams): Promise<{
    success: boolean;
    message: string;
    data: null;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    data: {
        datos_historicos: any[] | null;
        empresa_id: string;
        periodo_analizado: string;
        kpi_actual: any;
        tendencias: {
            ingresos: {
                actual: any;
                crecimiento_periodo: string;
                crecimiento_mes_anterior: any;
            };
            margen_neto: {
                actual: any;
                promedio_periodo: string;
                mejor_mes: string;
                peor_mes: string;
            };
            gastos_distribucion: {
                infraestructura: any;
                personal: any;
                marketing: any;
            };
        };
        alertas: string[];
        recomendaciones: string[];
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: string;
    data?: undefined;
}>;
export declare function predictTrends(params: TrendParams): Promise<{
    success: boolean;
    message: string;
    data: null;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    data: {
        empresa_id: string;
        periodo_prediccion: string;
        datos_historicos_usados: number;
        predicciones: {
            mes: string;
            ingresos_proyectados: number;
            gastos_proyectados: number;
            utilidad_proyectada: number;
            margen_proyectado: number;
            confianza: number;
        }[];
        notas: string[];
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: string;
    data?: undefined;
}>;
export declare function suggestBudgetOptimization(params: OptimizationParams): Promise<{
    success: boolean;
    message: string;
    data: null;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    data: {
        empresa_id: string;
        situacion_actual: {
            margen_neto: any;
            ingresos: any;
            gastos_totales: any;
        };
        objetivo: {
            margen_objetivo: any;
            mejora_requerida: number;
            mejora_alcanzable: string;
        };
        optimizaciones_por_area: {
            area: string;
            situacion_actual: {
                monto: number;
                porcentaje: string;
            };
            optimizacion_sugerida: {
                reduccion_porcentaje: number;
                ahorro_estimado: number;
                nuevo_monto: number;
                nuevo_porcentaje: string;
            };
            impacto_margen: string;
            dificultad: string;
            recomendaciones: string[];
        }[];
        resumen: {
            ahorro_total_estimado: number;
            factibilidad: string;
            plazo_implementacion: string;
            riesgo_general: string;
        };
        proximos_pasos: string[];
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: string;
    data?: undefined;
}>;
export declare function calculateScenarios(params: ScenarioParams): Promise<{
    success: boolean;
    message: string;
    data: null;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    data: {
        empresa_id: string;
        escenario_base: {
            ingresos: any;
            gastos: any;
            utilidad: any;
            margen: any;
        };
        escenarios_analizados: {
            nombre: string;
            cambios_aplicados: {
                ingresos: string;
                gastos: Record<string, number>;
            };
            resultados: {
                ingresos: {
                    base: any;
                    nuevo: number;
                    diferencia: number;
                    cambio_porcentual: number;
                };
                gastos: {
                    base: any;
                    nuevo: number;
                    diferencia: number;
                    desglose: {
                        infraestructura: number;
                        personal: number;
                        marketing: number;
                        servicios: number;
                        costos: number;
                    };
                };
                utilidad: {
                    base: any;
                    nueva: number;
                    diferencia: number;
                    cambio_porcentual: number;
                };
                margen: {
                    base: any;
                    nuevo: number;
                    diferencia: number;
                };
            };
            evaluacion: {
                viabilidad: string;
                riesgo: string;
                recomendacion: string;
            };
        }[];
        mejor_escenario: string;
        resumen_comparativo: {
            rango_ingresos: {
                minimo: number;
                maximo: number;
            };
            rango_margenes: {
                minimo: number;
                maximo: number;
            };
        };
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: string;
    data?: undefined;
}>;
export declare function generateFinancialReport(params: ReportParams): Promise<{
    success: boolean;
    message: string;
    data: {
        tipo: string;
        empresa_id: string;
        periodo: string;
        fecha_generacion: string;
        resumen_ejecutivo: {
            ingresos_actuales: any;
            margen_neto: any;
            crecimiento_mom: any;
            estado_general: string;
        };
    };
} | {
    success: boolean;
    message: string;
    data: {
        user_id: number;
        totalIngresos?: any;
        totalGastos?: any;
        balance?: number | undefined;
        transacciones_analizadas?: number | undefined;
        tipo: string;
        periodo: string;
    };
} | {
    success: boolean;
    message: string;
    data: null;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: string;
    data?: undefined;
}>;
export declare function getPersonalFinancialSummary(userId: number): Promise<{
    success: boolean;
    data: {
        user_id: number;
        totalIngresos: any;
        totalGastos: any;
        balance: number;
        transacciones_analizadas: number;
    };
    message?: undefined;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: string;
    data?: undefined;
}>;
export declare function getCompanyFinancialContext(companyId: string): Promise<{
    success: boolean;
    data: any[];
    message?: undefined;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: string;
    data?: undefined;
}>;
export {};
//# sourceMappingURL=financial-tools.d.ts.map