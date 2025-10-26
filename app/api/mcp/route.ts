import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeCompanyKPIs,
  predictTrends,
  suggestBudgetOptimization,
  calculateScenarios,
  generateFinancialReport
} from '../../../mcp-server/src/financial-tools';

export async function POST(request: NextRequest) {
  try {
    const { tool, parameters } = await request.json();

    if (!tool || !parameters) {
      return NextResponse.json(
        { error: 'Se requieren tool y parameters' },
        { status: 400 }
      );
    }

    let result;

    switch (tool) {
      case 'analyze_company_kpis':
        result = await analyzeCompanyKPIs(parameters);
        break;
      
      case 'predict_financial_trends':
        result = await predictTrends(parameters);
        break;
      
      case 'suggest_budget_optimization':
        result = await suggestBudgetOptimization(parameters);
        break;
      
      case 'calculate_scenarios':
        result = await calculateScenarios(parameters);
        break;
      
      case 'generate_financial_report':
        result = await generateFinancialReport(parameters);
        break;
      
      default:
        return NextResponse.json(
          { error: `Herramienta MCP desconocida: ${tool}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en API MCP:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error interno del servidor MCP',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}