// Cliente MCP simplificado para el chatbot de Banorte
// En lugar de conectar directamente al servidor MCP, haremos llamadas HTTP

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

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.mcpServerUrl = serverUrl;
  }

  async connect(): Promise<void> {
    // Para esta implementación simplificada, no necesitamos conectar
    // El servidor MCP corre independientemente
    console.log('Cliente MCP inicializado');
  }

  async disconnect(): Promise<void> {
    console.log('Cliente MCP desconectado');
  }

  private async callMCPAPI(endpoint: string, data: any): Promise<MCPToolResponse> {
    try {
      const response = await fetch(`${this.mcpServerUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en llamada MCP ${endpoint}:`, error);
      return {
        success: false,
        message: `Error en ${endpoint}`,
        data: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  async analyzeCompanyKPIs(params: MCPAnalysisParams): Promise<MCPToolResponse> {
    return this.callMCPAPI('/api/mcp/analyze-kpis', params);
  }

  async predictFinancialTrends(params: MCPTrendParams): Promise<MCPToolResponse> {
    return this.callMCPAPI('/api/mcp/predict-trends', params);
  }

  async suggestBudgetOptimization(params: MCPOptimizationParams): Promise<MCPToolResponse> {
    return this.callMCPAPI('/api/mcp/optimize-budget', params);
  }

  async calculateScenarios(params: MCPScenarioParams): Promise<MCPToolResponse> {
    return this.callMCPAPI('/api/mcp/calculate-scenarios', params);
  }

  async generateFinancialReport(params: MCPReportParams): Promise<MCPToolResponse> {
    return this.callMCPAPI('/api/mcp/generate-report', params);
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

        if (kpiAnalysis.success) {
          return {
            type: 'company',
            data: kpiAnalysis.data,
            summary: `Análisis de KPIs para empresa ${userId}: ${kpiAnalysis.message}`
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
        // Obtener optimizaciones presupuestarias
        const optimization = await this.suggestBudgetOptimization({
          companyId: userId,
          targetMarginIncrease: 5,
          priorityAreas: ['marketing', 'personal', 'infraestructura']
        });

        if (optimization.success && optimization.data?.optimizaciones_por_area) {
          return optimization.data.optimizaciones_por_area.map((opt: any) => 
            `${opt.area}: ${opt.recomendaciones?.[0] || 'Revisar gastos en esta área'}`
          );
        }
      }

      // Recomendaciones genéricas si no hay datos específicos
      return [
        'Revisar gastos mensuales para identificar oportunidades de ahorro',
        'Establecer un presupuesto mensual y monitorearlo regularmente',
        'Considerar opciones de inversión según tu perfil de riesgo'
      ];
    } catch (error) {
      console.error('Error obteniendo recomendaciones:', error);
      return [
        'Consulta con un asesor financiero para obtener recomendaciones personalizadas'
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
      return `CONTEXTO FINANCIERO AVANZADO (vía MCP):
Tipo: ${context.type}
Usuario: ${userId}
Resumen: ${context.summary}
Datos: ${JSON.stringify(context.data, null, 2)}`;
    }
    
    return `CONTEXTO BÁSICO:
Tipo: ${context.type}
Usuario: ${userId}
Estado: ${context.summary}`;
  } catch (error) {
    console.error('Error en contexto financiero:', error);
    return `CONTEXTO LIMITADO: Error al obtener datos avanzados para ${userType} ${userId}`;
  }
}

export async function getSmartRecommendations(userType: 'personal' | 'company', userId: string, query: string): Promise<string[]> {
  try {
    const client = await getMCPClient();
    return await client.getIntelligentRecommendations(userType, userId, query);
  } catch (error) {
    console.error('Error obteniendo recomendaciones inteligentes:', error);
    return ['Consulta con un asesor financiero para obtener recomendaciones personalizadas'];
  }
}