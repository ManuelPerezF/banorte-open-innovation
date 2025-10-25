import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from 'next/server';
import { 
  getCompanyKPIs, 
  getCompanyMonthlyData, 
  getCompanyDecisions,
  getPersonalFinancialSummary 
} from '@/services/chatContext';
import { 
  getEnhancedFinancialContext,
  getSmartRecommendations
} from '@/lib/mcp-client';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA7y71LIvxNYEftupYOKY2J3unFMIdQBfc';

export async function POST(request: NextRequest) {
  try {
    const { message, userType, userId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Inicializar Google GenAI
    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY
    });

    // Obtener contexto financiero según el tipo de usuario
    let financialContext = '';
    let mcpRecommendations: string[] = [];
    
    try {
      // Intentar obtener contexto mejorado vía MCP
      const enhancedContext = await getEnhancedFinancialContext(userType, userId);
      const smartRecommendations = await getSmartRecommendations(userType, userId, message);
      
      financialContext = enhancedContext;
      mcpRecommendations = smartRecommendations;
      
      console.log('✅ Contexto MCP obtenido exitosamente');
    } catch (mcpError) {
      console.warn('⚠️ Error con MCP, usando contexto tradicional:', mcpError);
      
      // Fallback al sistema tradicional si MCP falla
      if (userType === 'company') {
        // Obtener datos de la empresa
        const [kpis, monthlyData, decisions] = await Promise.all([
          getCompanyKPIs(userId),
          getCompanyMonthlyData(userId),
          getCompanyDecisions(userId)
        ]);

        if (kpis.length > 0 || monthlyData.length > 0) {
          financialContext = `
DATOS FINANCIEROS ACTUALES DE LA EMPRESA (ID: ${userId}):

📊 KPIs RECIENTES:
${kpis.map(kpi => `
- Mes: ${kpi.month}
  💰 Ingresos: $${kpi.ingresos?.toLocaleString() || 'N/A'}
  💸 Gastos: $${kpi.gastos?.toLocaleString() || 'N/A'}
  📈 Margen Neto: ${kpi.margen_neto_pct?.toFixed(2) || 'N/A'}%
  📊 Crecimiento MoM: ${kpi.ingresos_mom_pct?.toFixed(2) || 'N/A'}%
  🏗️ % Infraestructura: ${kpi.pct_infra?.toFixed(1) || 'N/A'}%
  👥 % Personal: ${kpi.pct_personal?.toFixed(1) || 'N/A'}%
  📢 % Marketing: ${kpi.pct_marketing?.toFixed(1) || 'N/A'}%`).join('\n')}

📅 DISTRIBUCIÓN DE GASTOS POR CATEGORÍA (ÚLTIMOS MESES):
${monthlyData.map(month => `
- ${month.month}:
  🏗️ Infraestructura: $${month.g_infra?.toLocaleString() || '0'}
  👥 Personal: $${month.g_personal?.toLocaleString() || '0'}
  📢 Marketing: $${month.g_marketing?.toLocaleString() || '0'}
  🛠️ Servicios: $${month.g_servicios?.toLocaleString() || '0'}
  💼 Costos: $${month.g_costos?.toLocaleString() || '0'}`).join('\n')}

🎯 RECOMENDACIONES AUTOMÁTICAS:
${decisions.recommendations?.map(rec => `
- KPI: ${rec.kpi} | Mes: ${rec.month} | Valor: ${rec.value}
  💡 Recomendación: ${rec.decision}`).join('\n') || 'No hay recomendaciones disponibles'}
`;
        }
      } else {
        // Obtener datos personales
        const personalSummary = await getPersonalFinancialSummary(parseInt(userId));
        
        if (personalSummary) {
          const topCategorias = Object.entries(personalSummary.gastosPorCategoria)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 5);

          financialContext = `
DATOS FINANCIEROS PERSONALES ACTUALES (Usuario: ${userId}):

💰 RESUMEN FINANCIERO:
- Total Ingresos: $${personalSummary.totalIngresos.toLocaleString()}
- Total Gastos: $${personalSummary.totalGastos.toLocaleString()}
- Balance Actual: $${personalSummary.balance.toLocaleString()}
- Estado: ${personalSummary.balance >= 0 ? '✅ Positivo' : '❌ Negativo'}

📊 TOP CATEGORÍAS DE GASTOS:
${topCategorias.map(([categoria, monto]) => `
- ${categoria}: $${(monto as number).toLocaleString()}`).join('\n')}

📋 ÚLTIMAS TRANSACCIONES:
${personalSummary.transacciones.slice(0, 5).map(tx => `
- ${tx.fecha}: ${tx.tipo === 'ingreso' ? '💰' : '💸'} $${tx.monto.toLocaleString()} - ${tx.descripcion || tx.categoria || 'Sin descripción'}`).join('\n')}
`;
        }
      }
    }

    // Agregar recomendaciones MCP al contexto si están disponibles
    const mcpSection = mcpRecommendations.length > 0 ? `

🤖 RECOMENDACIONES INTELIGENTES MCP:
${mcpRecommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}
` : '';

    // Crear el contexto del prompt basado en el tipo de usuario
    const systemContext = `Eres un asistente financiero especializado de Banorte, potenciado por tecnología MCP (Model Context Protocol), enfocado en ayudar a ${userType === 'personal' ? 'usuarios individuales' : 'empresas'} con sus finanzas.

Contexto del usuario:
- Tipo de usuario: ${userType === 'personal' ? 'Personal' : 'Empresarial'}
- ID de usuario: ${userId}
- Sistema: ${mcpRecommendations.length > 0 ? '🤖 MCP Activo' : '📊 Modo Tradicional'}

${financialContext}${mcpSection}

INSTRUCCIONES IMPORTANTES:
1. Usa SIEMPRE los datos financieros reales proporcionados arriba para responder preguntas específicas sobre números, gastos, ingresos, etc.
2. Si el usuario pregunta sobre tendencias, usa los datos históricos mostrados
3. Si pregunta sobre recomendaciones, prioriza las recomendaciones MCP cuando estén disponibles
4. Para preguntas generales de consejos financieros, combina tu conocimiento general con insights de los datos reales
5. Siempre referencia números específicos cuando sea relevante
6. Si los datos muestran problemas (como gastos altos en ciertas categorías), menciónalos proactivamente
7. ${mcpRecommendations.length > 0 ? 'PRIORIZA las recomendaciones MCP ya que son análisis avanzados basados en IA' : 'Usa los datos disponibles para dar consejos personalizados'}

Tu rol es:
1. Proporcionar consejos financieros personalizados basados en datos reales
2. Analizar tendencias y patrones en los datos históricos
3. Sugerir estrategias específicas basadas en la situación actual
4. Explicar productos financieros de Banorte cuando sea relevante
5. Ser empático y comprensivo con las preocupaciones financieras
6. ${mcpRecommendations.length > 0 ? 'Actuar como un asesor financiero potenciado por IA avanzada' : 'Usar análisis tradicional de datos financieros'}

Responde de manera:
- Clara y concisa
- Profesional pero amigable  
- Enfocada en soluciones prácticas basadas en datos reales
- Con ejemplos específicos usando los números reales del usuario
- En español mexicano
- ${mcpRecommendations.length > 0 ? 'Mencionando que usas análisis avanzado MCP cuando sea relevante' : 'Basándote en análisis de datos tradicional'}

Pregunta del usuario: ${message}`;

    // Generar contenido con Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemContext,
    });

    const generatedText = response.text || 'Lo siento, no pude generar una respuesta.';

    return NextResponse.json({ response: generatedText });

  } catch (error) {
    console.error('Error en la API de chat:', error);
    
    // Determinar el tipo de error y responder apropiadamente
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('API_KEY')) {
        return NextResponse.json(
          { error: 'Clave de API inválida' },
          { status: 401 }
        );
      } else if (error.message.includes('429') || error.message.includes('QUOTA')) {
        return NextResponse.json(
          { error: 'Cuota de API excedida' },
          { status: 429 }
        );
      } else if (error.message.includes('403')) {
        return NextResponse.json(
          { error: 'Acceso denegado. Verifica tu API key.' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}