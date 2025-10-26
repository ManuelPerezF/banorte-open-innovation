#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListResourcesRequestSchema, ListToolsRequestSchema, McpError, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { analyzeCompanyKPIs, predictTrends, suggestBudgetOptimization, calculateScenarios, generateFinancialReport, getPersonalFinancialSummary, getCompanyFinancialContext } from "./financial-tools.js";
// Esquemas de validación para las herramientas
const AnalyzeKPIsSchema = z.object({
    companyId: z.string(),
    months: z.number().optional().default(6),
    includeComparisons: z.boolean().optional().default(true)
});
const PredictTrendsSchema = z.object({
    companyId: z.string(),
    forecastMonths: z.number().optional().default(3),
    includeSeasonality: z.boolean().optional().default(true)
});
const BudgetOptimizationSchema = z.object({
    companyId: z.string(),
    targetMarginIncrease: z.number().optional().default(5),
    priorityAreas: z.array(z.string()).optional().default(['marketing', 'personal', 'infraestructura'])
});
const ScenarioCalculationSchema = z.object({
    companyId: z.string(),
    scenarios: z.array(z.object({
        name: z.string(),
        revenueChange: z.number(),
        expenseChanges: z.record(z.string(), z.number())
    }))
});
const FinancialReportSchema = z.object({
    companyId: z.string().optional(),
    userId: z.string().optional(),
    reportType: z.enum(['summary', 'detailed', 'trends', 'recommendations']).default('summary'),
    period: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly')
});
class BanorteMCPServer {
    server;
    constructor() {
        this.server = new Server({
            name: "banorte-financial-mcp",
            version: "1.0.0",
        }, {
            capabilities: {
                resources: {},
                tools: {},
                prompts: {},
            },
        });
        this.setupToolHandlers();
        this.setupResourceHandlers();
        this.setupPromptHandlers();
        // Manejo de errores
        this.server.onerror = (error) => console.error("[MCP Error]", error);
        process.on("SIGINT", async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        // Listar herramientas disponibles
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "analyze_company_kpis",
                        description: "Analiza los KPIs financieros de una empresa, incluyendo tendencias, márgenes y recomendaciones",
                        inputSchema: {
                            type: "object",
                            properties: {
                                companyId: {
                                    type: "string",
                                    description: "ID de la empresa a analizar"
                                },
                                months: {
                                    type: "number",
                                    description: "Número de meses a incluir en el análisis (default: 6)",
                                    default: 6
                                },
                                includeComparisons: {
                                    type: "boolean",
                                    description: "Incluir comparaciones mes a mes (default: true)",
                                    default: true
                                }
                            },
                            required: ["companyId"]
                        }
                    },
                    {
                        name: "predict_financial_trends",
                        description: "Predice tendencias financieras futuras basado en datos históricos",
                        inputSchema: {
                            type: "object",
                            properties: {
                                companyId: {
                                    type: "string",
                                    description: "ID de la empresa"
                                },
                                forecastMonths: {
                                    type: "number",
                                    description: "Meses a proyectar (default: 3)",
                                    default: 3
                                },
                                includeSeasonality: {
                                    type: "boolean",
                                    description: "Incluir análisis de estacionalidad (default: true)",
                                    default: true
                                }
                            },
                            required: ["companyId"]
                        }
                    },
                    {
                        name: "suggest_budget_optimization",
                        description: "Sugiere optimizaciones del presupuesto para mejorar márgenes",
                        inputSchema: {
                            type: "object",
                            properties: {
                                companyId: {
                                    type: "string",
                                    description: "ID de la empresa"
                                },
                                targetMarginIncrease: {
                                    type: "number",
                                    description: "Aumento objetivo del margen en % (default: 5)",
                                    default: 5
                                },
                                priorityAreas: {
                                    type: "array",
                                    items: { type: "string" },
                                    description: "Áreas prioritarias para optimizar",
                                    default: ["marketing", "personal", "infraestructura"]
                                }
                            },
                            required: ["companyId"]
                        }
                    },
                    {
                        name: "calculate_scenarios",
                        description: "Calcula múltiples escenarios financieros 'qué pasaría si'",
                        inputSchema: {
                            type: "object",
                            properties: {
                                companyId: {
                                    type: "string",
                                    description: "ID de la empresa"
                                },
                                scenarios: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            name: { type: "string" },
                                            revenueChange: { type: "number" },
                                            expenseChanges: {
                                                type: "object",
                                                additionalProperties: { type: "number" }
                                            }
                                        },
                                        required: ["name", "revenueChange", "expenseChanges"]
                                    },
                                    description: "Lista de escenarios a evaluar"
                                }
                            },
                            required: ["companyId", "scenarios"]
                        }
                    },
                    {
                        name: "generate_financial_report",
                        description: "Genera reportes financieros detallados para empresas o usuarios personales",
                        inputSchema: {
                            type: "object",
                            properties: {
                                companyId: {
                                    type: "string",
                                    description: "ID de la empresa (opcional si es reporte personal)"
                                },
                                userId: {
                                    type: "string",
                                    description: "ID del usuario personal (opcional si es reporte empresarial)"
                                },
                                reportType: {
                                    type: "string",
                                    enum: ["summary", "detailed", "trends", "recommendations"],
                                    description: "Tipo de reporte a generar",
                                    default: "summary"
                                },
                                period: {
                                    type: "string",
                                    enum: ["monthly", "quarterly", "yearly"],
                                    description: "Período del reporte",
                                    default: "monthly"
                                }
                            }
                        }
                    }
                ]
            };
        });
        // Manejar llamadas a herramientas
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case "analyze_company_kpis": {
                        const validated = AnalyzeKPIsSchema.parse(args);
                        const result = await analyzeCompanyKPIs(validated);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(result, null, 2)
                                }
                            ]
                        };
                    }
                    case "predict_financial_trends": {
                        const validated = PredictTrendsSchema.parse(args);
                        const result = await predictTrends(validated);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(result, null, 2)
                                }
                            ]
                        };
                    }
                    case "suggest_budget_optimization": {
                        const validated = BudgetOptimizationSchema.parse(args);
                        const result = await suggestBudgetOptimization(validated);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(result, null, 2)
                                }
                            ]
                        };
                    }
                    case "calculate_scenarios": {
                        const validated = ScenarioCalculationSchema.parse(args);
                        const result = await calculateScenarios(validated);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(result, null, 2)
                                }
                            ]
                        };
                    }
                    case "generate_financial_report": {
                        const validated = FinancialReportSchema.parse(args);
                        const result = await generateFinancialReport(validated);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(result, null, 2)
                                }
                            ]
                        };
                    }
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Herramienta desconocida: ${name}`);
                }
            }
            catch (error) {
                if (error instanceof z.ZodError) {
                    throw new McpError(ErrorCode.InvalidParams, `Parámetros inválidos: ${error.message}`);
                }
                throw error;
            }
        });
    }
    setupResourceHandlers() {
        // Listar recursos disponibles
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            return {
                resources: [
                    {
                        uri: "company-kpis://recent",
                        name: "KPIs Empresariales Recientes",
                        description: "KPIs financieros más recientes de todas las empresas",
                        mimeType: "application/json"
                    },
                    {
                        uri: "personal-finances://summary",
                        name: "Resumen Finanzas Personales",
                        description: "Resumen de finanzas personales por usuario",
                        mimeType: "application/json"
                    },
                    {
                        uri: "financial-trends://monthly",
                        name: "Tendencias Financieras Mensuales",
                        description: "Análisis de tendencias financieras por mes",
                        mimeType: "application/json"
                    },
                    {
                        uri: "budget-recommendations://active",
                        name: "Recomendaciones Presupuestarias Activas",
                        description: "Recomendaciones activas para optimización presupuestaria",
                        mimeType: "application/json"
                    }
                ]
            };
        });
        // Leer recursos específicos
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            if (uri.startsWith("company-kpis://")) {
                const companyId = uri.split("//")[1];
                if (companyId === "recent") {
                    // Retornar KPIs recientes de todas las empresas
                    return {
                        contents: [
                            {
                                uri,
                                mimeType: "application/json",
                                text: JSON.stringify({ message: "KPIs recientes de todas las empresas" })
                            }
                        ]
                    };
                }
                else {
                    // Retornar KPIs de empresa específica
                    const context = await getCompanyFinancialContext(companyId);
                    return {
                        contents: [
                            {
                                uri,
                                mimeType: "application/json",
                                text: JSON.stringify(context)
                            }
                        ]
                    };
                }
            }
            if (uri.startsWith("personal-finances://")) {
                const userId = uri.split("//")[1];
                if (userId !== "summary") {
                    const summary = await getPersonalFinancialSummary(parseInt(userId));
                    return {
                        contents: [
                            {
                                uri,
                                mimeType: "application/json",
                                text: JSON.stringify(summary)
                            }
                        ]
                    };
                }
            }
            throw new McpError(ErrorCode.InvalidRequest, `Recurso no encontrado: ${uri}`);
        });
    }
    setupPromptHandlers() {
        // Listar prompts disponibles
        this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
            return {
                prompts: [
                    {
                        name: "financial_analysis_expert",
                        description: "Prompt para análisis financiero experto con contexto de datos reales",
                        arguments: [
                            {
                                name: "userType",
                                description: "Tipo de usuario (personal o company)",
                                required: true
                            },
                            {
                                name: "userId",
                                description: "ID del usuario o empresa",
                                required: true
                            },
                            {
                                name: "analysisType",
                                description: "Tipo de análisis requerido",
                                required: false
                            }
                        ]
                    },
                    {
                        name: "budget_optimization_advisor",
                        description: "Prompt especializado en optimización presupuestaria",
                        arguments: [
                            {
                                name: "companyId",
                                description: "ID de la empresa",
                                required: true
                            },
                            {
                                name: "focusArea",
                                description: "Área de enfoque para optimización",
                                required: false
                            }
                        ]
                    },
                    {
                        name: "personal_finance_coach",
                        description: "Prompt para asesoría financiera personal",
                        arguments: [
                            {
                                name: "userId",
                                description: "ID del usuario",
                                required: true
                            },
                            {
                                name: "goalType",
                                description: "Tipo de objetivo financiero",
                                required: false
                            }
                        ]
                    }
                ]
            };
        });
        // Obtener prompts específicos
        this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case "financial_analysis_expert": {
                    const userType = args?.userType;
                    const userId = args?.userId;
                    const analysisType = args?.analysisType || "general";
                    if (!userId) {
                        throw new McpError(ErrorCode.InvalidParams, "userId es requerido");
                    }
                    let contextData = "";
                    if (userType === "company") {
                        const context = await getCompanyFinancialContext(userId);
                        contextData = JSON.stringify(context, null, 2);
                    }
                    else {
                        const context = await getPersonalFinancialSummary(parseInt(userId));
                        contextData = JSON.stringify(context, null, 2);
                    }
                    return {
                        description: `Análisis financiero experto para ${userType === "company" ? "empresa" : "usuario personal"}`,
                        messages: [
                            {
                                role: "system",
                                content: {
                                    type: "text",
                                    text: `Eres un experto analista financiero de Banorte especializado en ${userType === "company" ? "finanzas empresariales" : "finanzas personales"}.

DATOS FINANCIEROS ACTUALES:
${contextData}

Tu análisis debe ser:
1. Basado en datos reales específicos del cliente
2. Actionable y práctico
3. Enfocado en ${analysisType}
4. Profesional pero accesible
5. Incluir recomendaciones específicas

Proporciona insights profundos sobre la situación financiera actual y recomendaciones concretas para mejora.`
                                }
                            }
                        ]
                    };
                }
                case "budget_optimization_advisor": {
                    const companyId = args?.companyId;
                    const focusArea = args?.focusArea || "general";
                    if (!companyId) {
                        throw new McpError(ErrorCode.InvalidParams, "companyId es requerido");
                    }
                    const context = await getCompanyFinancialContext(companyId);
                    return {
                        description: "Asesor especializado en optimización presupuestaria",
                        messages: [
                            {
                                role: "system",
                                content: {
                                    type: "text",
                                    text: `Eres un consultor especializado en optimización presupuestaria empresarial de Banorte.

DATOS FINANCIEROS DE LA EMPRESA:
${JSON.stringify(context, null, 2)}

ÁREA DE ENFOQUE: ${focusArea}

Tu misión es identificar oportunidades de optimización presupuestaria específicas basadas en los datos reales. Proporciona:

1. Análisis detallado de distribución actual de gastos
2. Identificación de áreas de ineficiencia
3. Recomendaciones específicas con impacto cuantificado
4. Plan de implementación por fases
5. Métricas para medir el éxito

Sé específico con números y porcentajes basados en los datos reales.`
                                }
                            }
                        ]
                    };
                }
                case "personal_finance_coach": {
                    const userId = args?.userId;
                    const goalType = args?.goalType || "general";
                    if (!userId) {
                        throw new McpError(ErrorCode.InvalidParams, "userId es requerido");
                    }
                    const context = await getPersonalFinancialSummary(parseInt(userId));
                    return {
                        description: "Coach financiero personal especializado",
                        messages: [
                            {
                                role: "system",
                                content: {
                                    type: "text",
                                    text: `Eres un coach financiero personal certificado de Banorte, especializado en ayudar a individuos a mejorar su situación financiera.

SITUACIÓN FINANCIERA ACTUAL:
${JSON.stringify(context, null, 2)}

OBJETIVO PRINCIPAL: ${goalType}

Como coach financiero, debes:

1. Evaluar la situación financiera actual de manera empática
2. Identificar patrones en gastos e ingresos
3. Establecer metas realistas y alcanzables
4. Crear un plan de acción personalizado
5. Motivar y guiar hacia hábitos financieros saludables

Usa un tono alentador pero realista, con recomendaciones prácticas basadas en los datos específicos del usuario.`
                                }
                            }
                        ]
                    };
                }
                default:
                    throw new McpError(ErrorCode.InvalidRequest, `Prompt no encontrado: ${name}`);
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Servidor MCP Financiero de Banorte iniciado");
    }
}
const server = new BanorteMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map