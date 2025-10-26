import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from 'next/server';
import { 
  getCompanyKPIs, 
  getCompanyMonthlyData, 
  getCompanyDecisions,
  getPersonalFinancialSummary,
  getPersonalFinancialSummaryFallback 
} from '@/services/chatContext';
import { 
  getEnhancedFinancialContext,
  getSmartRecommendations
} from '@/lib/mcp-client';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBo9Bgg0OnzOePhrTzkJHuiJCXcVDapNRU';

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
    }
    
    // SIEMPRE intentar fallback tradicional si no hay datos suficientes
    if (!financialContext || !financialContext.includes('$') || financialContext.includes('ERROR')) {
      console.log('🔄 Usando fallback tradicional para obtener datos');
      
      if (userType === 'company') {
        // Obtener datos de la empresa
        const [kpis, monthlyData, decisions] = await Promise.all([
          getCompanyKPIs(userId),
          getCompanyMonthlyData(userId),
          getCompanyDecisions(userId)
        ]);

        console.log(`📊 KPIs obtenidos: ${kpis.length} registros`);
        console.log(`📅 Datos mensuales: ${monthlyData.length} registros`);

        if (kpis.length > 0 || monthlyData.length > 0) {
          financialContext = `
DATOS EMPRESA ${userId}:

📊 KPIs RECIENTES:
${kpis.map(kpi => `
- Mes: ${kpi.month}
  💰 Ingresos: $${kpi.ingresos?.toLocaleString() || 'N/A'}
  💸 Gastos: $${kpi.gastos?.toLocaleString() || 'N/A'}
  📈 Margen: ${kpi.margen_neto_pct?.toFixed(2) || 'N/A'}%
  📊 Crecimiento: ${kpi.ingresos_mom_pct?.toFixed(2) || 'N/A'}%
  🏗️ % Infraestructura: ${kpi.pct_infra?.toFixed(1) || 'N/A'}%
  👥 % Personal: ${kpi.pct_personal?.toFixed(1) || 'N/A'}%
  📢 % Marketing: ${kpi.pct_marketing?.toFixed(1) || 'N/A'}%`).join('\n')}

📅 GASTOS POR CATEGORÍA:
${monthlyData.map(month => `
- ${month.month}:
  🏗️ Infraestructura: $${month.g_infra?.toLocaleString() || '0'}
  👥 Personal: $${month.g_personal?.toLocaleString() || '0'}
  📢 Marketing: $${month.g_marketing?.toLocaleString() || '0'}
  🛠️ Servicios: $${month.g_servicios?.toLocaleString() || '0'}
  💼 Costos: $${month.g_costos?.toLocaleString() || '0'}`).join('\n')}
`;
        }
      } else {
        // Obtener datos personales - USAR LA FUNCIÓN CORREGIDA CON TODAS LAS TRANSACCIONES
        const personalSummary = await getPersonalFinancialSummaryFallback(parseInt(userId));
        
        if (personalSummary) {
          const topCategorias = Object.entries(personalSummary.gastosPorCategoria)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 5);

          financialContext = `
DATOS PERSONALES ${userId}:

💰 RESUMEN:
- Ingresos totales: $${personalSummary.totalIngresos.toLocaleString()}
- Gastos totales: $${personalSummary.totalGastos.toLocaleString()}
- Balance: $${personalSummary.balance.toLocaleString()}

📊 TOP GASTOS:
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

🤖 DATOS MCP:
${mcpRecommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}
` : '';

    // Verificar que tenemos datos reales
    let hasRealData = false;
    if (userType === 'company') {
      hasRealData = financialContext.includes('$') && (financialContext.includes('Ingresos:') || financialContext.includes('KPIs'));
    } else {
      hasRealData = financialContext.includes('$') && financialContext.includes('Balance');
    }

    console.log(`📋 Validación de datos - Usuario: ${userId}, Tipo: ${userType}, Tiene datos: ${hasRealData}`);
    console.log(`📝 Contexto financiero: ${financialContext.substring(0, 200)}...`);

    if (!hasRealData) {
      console.log('❌ No se encontraron datos financieros');
      return NextResponse.json({ 
        response: userType === 'company' 
          ? `No encuentro datos financieros para la empresa ID: ${userId}. Verifica que tengas KPIs registrados en la vista v_company_kpis.`
          : "No encuentro tus datos financieros. Agrega algunas transacciones en la sección de Datos para que pueda ayudarte."
      });
    }

    // Crear el contexto del prompt basado en el tipo de usuario
    const systemContext = `Eres un asistente financiero especializado de Banorte. Tu trabajo es dar respuestas INFORMATIVAS y ESPECÍFICAS basadas en los datos reales del usuario.

DATOS DEL USUARIO:
- Tipo: ${userType === 'personal' ? 'Personal' : 'Empresarial'}
- ID: ${userId}
- Sistema: ${mcpRecommendations.length > 0 ? '🤖 MCP Activo' : '📊 Tradicional'}

${financialContext}${mcpSection}

REGLAS PARA RESPUESTAS:
1. SIEMPRE usar números reales de los datos mostrados arriba
2. Respuestas de 3-6 líneas (ni muy cortas ni muy largas)
3. Incluir el dato principal + contexto relevante + una recomendación breve
4. Para KPIs: mostrar número + comparación + estado actual
5. Para gastos: mostrar categorías principales + porcentajes + observación

FORMATO DE RESPUESTAS:
- Datos específicos: "Tu [métrica] es $X. [Contexto]. [Recomendación breve]"
- Tendencias: "[Métrica]: $X (vs anterior: +Y%). [Interpretación]. [Siguiente paso]"  
- Gastos: "Principales gastos: [3 categorías con montos]. [Análisis]. [Sugerencia]"
- Estado general: "[Estado] - [Razón] + [Dato de apoyo] + [Consejo]"

${userType === 'company' ? `
RESPUESTAS TIPO EMPRESA:
- KPIs: Número + contexto de crecimiento + estado del margen + recomendación
- Gastos: Top 3 categorías con % + comparación con estándares + sugerencia de optimización
- Tendencias: Crecimiento actual + análisis del período + pronóstico simple
- Estado: Evaluación general + métricas clave + acción recomendada
` : `
RESPUESTAS TIPO PERSONAL:
- Balance: Monto + evaluación + categoría principal + consejo de ahorro
- Gastos: Top 3 categorías + porcentaje del total + recomendación
- Situación: Estado actual + comparación temporal + próximo paso
`}

Pregunta: "${message}"

RESPUESTA (3-6 líneas informativas con datos específicos):`;

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