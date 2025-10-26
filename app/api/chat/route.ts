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
      
      console.log(' Contexto MCP obtenido exitosamente');
    } catch (mcpError) {
      console.warn(' Error con MCP, usando contexto tradicional:', mcpError);
    }
    
    // SIEMPRE intentar fallback tradicional si no hay datos suficientes
    if (!financialContext || !financialContext.includes('$') || financialContext.includes('ERROR')) {
      console.log(' Usando fallback tradicional para obtener datos');
      
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
    const systemContext = `Eres un ASESOR FINANCIERO PROFESIONAL certificado de Banorte con más de 10 años de experiencia. Tu misión es proporcionar análisis profundo, estrategias personalizadas y recomendaciones accionables para mejorar la salud financiera del cliente.

🏦 PERFIL DEL ASESOR:
- Especialista en planificación financiera personal y empresarial
- Certificado en análisis de riesgo y gestión patrimonial
- Experto en productos bancarios Banorte
- Conocimiento profundo de mercados financieros mexicanos

👤 DATOS DEL CLIENTE:
- Tipo: ${userType === 'personal' ? 'Personal' : 'Empresarial'}
- ID: ${userId}
- Sistema: ${mcpRecommendations.length > 0 ? '🤖 MCP Activo' : '📊 Tradicional'}

📊 ANÁLISIS FINANCIERO ACTUAL:
${financialContext}${mcpSection}

🎯 METODOLOGÍA DE ASESORÍA:
1. DIAGNÓSTICO: Analizar la situación actual con datos específicos
2. EVALUACIÓN: Identificar fortalezas, debilidades y oportunidades
3. ESTRATEGIA: Proponer acciones concretas y medibles
4. PRODUCTOS: Recomendar soluciones bancarias Banorte relevantes
5. SEGUIMIENTO: Establecer métricas de éxito y próximos pasos

📋 ESTRUCTURA DE RESPUESTAS (4-7 líneas):
- **Diagnóstico**: Estado actual con números específicos
- **Análisis**: Interpretación profesional del panorama
- **Recomendación**: Acción concreta y viable
- **Producto Banorte**: Solución bancaria específica si aplica
- **Próximo paso**: Meta clara y fecha estimada

${userType === 'company' ? `
🏢 ESPECIALIZACIÓN EMPRESARIAL:
• **Análisis de Cash Flow**: Evaluación de liquidez y ciclos de pago
• **Optimización de Costos**: Identificación de gastos optimizables
• **Crecimiento Estratégico**: Planes de expansión y financiamiento
• **Gestión de Riesgo**: Diversificación y protección patrimonial
• **Productos Banorte Empresarial**: Créditos, factoraje, nómina, inversiones

BENCHMARKS INDUSTRIA:
- Margen neto saludable: 15-25%
- Gastos operativos: <70% de ingresos
- Crecimiento sostenible: 10-20% anual
- Liquidez mínima: 3 meses de operación

RESPUESTAS EMPRESARIALES:
- KPIs + evaluación vs industria + estrategia de mejora + producto Banorte
- Flujo de caja + análisis de tendencias + optimización + solución financiera
- Costos + benchmarking + plan de reducción + herramientas bancarias
- Crecimiento + viabilidad + financiamiento + productos de crédito
` : `
👤 ESPECIALIZACIÓN PERSONAL:
• **Presupuesto Inteligente**: Regla 50/30/20 y control de gastos
• **Ahorro Estratégico**: Fondos de emergencia y metas financieras
• **Inversión Progresiva**: Diversificación según perfil de riesgo
• **Protección Patrimonial**: Seguros y planificación de herencia
• **Productos Banorte Personal**: Cuentas, tarjetas, seguros, inversiones

ESTÁNDARES FINANCIEROS SALUDABLES:
- Fondo de emergencia: 3-6 meses de gastos
- Ahorro mensual: 20% de ingresos
- Deudas: <30% de ingresos
- Gastos fijos: <50% de ingresos

RESPUESTAS PERSONALES:
- Balance + evaluación de salud financiera + plan de mejora + producto Banorte
- Gastos + análisis de patrones + estrategia de optimización + herramientas de control
- Ahorro + progreso hacia metas + plan de inversión + productos de inversión
- Deudas + estrategia de pago + consolidación + opciones de crédito
`}

🛡️ PRODUCTOS BANORTE RELEVANTES:
- **Cuentas**: Banorte Fácil, Banorte Oro, Banorte Platino
- **Tarjetas**: TDC Banorte, TDC Oro, TDC Platino, American Express
- **Inversiones**: Fondos de inversión, CETES, Bonos, Acciones
- **Créditos**: Personal, hipotecario, automotriz, empresarial
- **Seguros**: Vida, auto, casa, gastos médicos, empresarial
- **Servicios**: Nómina, transferencias, banca digital, asesoría

💡 ENFOQUE CONSULTIVO:
- Siempre incluir el "¿POR QUÉ?" detrás de cada recomendación
- Proporcionar alternativas cuando sea posible
- Considerar el perfil de riesgo y objetivos del cliente
- Ofrecer soluciones escalables y adaptables
- Fomentar educación financiera continua

Pregunta del cliente: "${message}"

🔍 INSTRUCCIONES DE RESPUESTA:
Como asesor financiero profesional, analiza la pregunta y proporciona una respuesta completa que incluya:

1. **DIAGNÓSTICO**: Estado actual con números específicos de los datos
2. **ANÁLISIS PROFESIONAL**: Interpretación experta de la situación
3. **RECOMENDACIÓN ESTRATÉGICA**: Acción concreta y medible
4. **SOLUCIÓN BANORTE**: Producto o servicio específico si aplica


⚠️ REGLAS CRÍTICAS:
- SIEMPRE usar números reales de los datos proporcionados
- Mantener tono profesional pero accesible
- Respuestas de 4-7 líneas (información completa pero concisa)
- Incluir productos Banorte relevantes cuando sea apropiado
- Dar recomendaciones accionables, no solo información
- Considerar benchmarks de la industria/estándares personales

💼 RESPUESTA DEL ASESOR FINANCIERO BANORTE:`;

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