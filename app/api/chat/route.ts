import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from 'next/server';
import { 
  getEnhancedFinancialContext,
  getSmartRecommendations
} from '@/lib/mcp-client';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

    // Obtener contexto financiero ÚNICAMENTE vía MCP
    let financialContext = '';
    let mcpRecommendations: string[] = [];
    
    try {
      console.log('🤖 Obteniendo contexto vía sistema de análisis avanzado...');
      
      // Obtener contexto mejorado vía MCP
      const enhancedContext = await getEnhancedFinancialContext(userType, userId);
      const smartRecommendations = await getSmartRecommendations(userType, userId, message);
      
      financialContext = enhancedContext;
      mcpRecommendations = smartRecommendations;
      
      console.log('✅ Contexto de análisis obtenido exitosamente');
      console.log(`📊 Contexto length: ${financialContext.length}`);
      console.log(`💡 Recomendaciones: ${mcpRecommendations.length}`);
      
    } catch (mcpError) {
      console.error('❌ Error con sistema de análisis:', mcpError);
      
      // Si MCP falla, retornar error informativo
      return NextResponse.json({ 
        response: `🤖 Error del sistema de análisis: ${mcpError instanceof Error ? mcpError.message : 'Error desconocido'}. 
        
El chatbot está configurado para funcionar con tecnología avanzada de análisis financiero. Verifica que:
• El sistema de análisis esté funcionando
• Los datos estén disponibles en la base de datos
• La conexión sea estable

Por favor, intenta de nuevo en unos momentos.`
      });
    }

    // Agregar recomendaciones MCP al contexto
    const mcpSection = mcpRecommendations.length > 0 ? `

🤖 ANÁLISIS INTELIGENTE AVANZADO:
${mcpRecommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}
` : '';

    // Verificar que MCP proporcionó datos
    if (!financialContext || financialContext.trim().length === 0) {
      return NextResponse.json({ 
        response: `🤖 No se pudieron obtener datos financieros para ${userType === 'company' ? 'la empresa' : 'el usuario'} ID: ${userId}.
        
Por favor verifica que:
• Tengas transacciones registradas en la base de datos
• El sistema de análisis esté funcionando correctamente
• Tu ID de ${userType === 'company' ? 'empresa' : 'usuario'} sea válido

Intenta agregar datos en la sección "Datos" primero.`
      });
    }

    // Crear el contexto del prompt basado EXCLUSIVAMENTE en MCP
   const systemContext = `Eres un ASESOR FINANCIERO PROFESIONAL certificado de Banorte con tecnología avanzada de análisis. Tu misión es proporcionar análisis profundo, estrategias personalizadas y recomendaciones accionables basadas en análisis inteligente de datos.

🤖 SISTEMA DE ANÁLISIS AVANZADO:
- Análisis profundo de patrones financieros
- Predicciones inteligentes basadas en datos históricos
- Recomendaciones personalizadas de alta precisión
- Procesamiento de información en tiempo real

🏦 PERFIL DEL ASESOR:
- Especialista en planificación financiera personal y empresarial
- Certificado en análisis de riesgo y gestión patrimonial
- Experto en productos bancarios Banorte
- Conocimiento profundo de mercados financieros mexicanos
- POTENCIADO POR TECNOLOGÍA AVANZADA PARA ANÁLISIS SUPERIOR

👤 DATOS DEL CLIENTE:
- Tipo: ${userType === 'personal' ? 'Personal' : 'Empresarial'}
- ID: ${userId}
- Sistema: 🤖 ANÁLISIS AVANZADO ACTIVADO

📊 ANÁLISIS FINANCIERO INTELIGENTE:
${financialContext}${mcpSection}

🎯 METODOLOGÍA AVANZADA:
1. DIAGNÓSTICO INTELIGENTE: Análisis de patrones con IA
2. EVALUACIÓN PREDICTIVA: Identificación de tendencias futuras
3. ESTRATEGIA PERSONALIZADA: Recomendaciones basadas en datos
4. PRODUCTOS OPTIMIZADOS: Soluciones Banorte con mayor ajuste al perfil

📋 ESTRUCTURA DE RESPUESTAS (4-7 líneas):
- **Diagnóstico IA**: Estado actual con análisis de patrones
- **Predicción Inteligente**: Tendencias identificadas por el sistema
- **Solución Banorte**: Solución bancaria con mayor compatibilidad


${userType === 'company' ? `
🏢 ESPECIALIZACIÓN EMPRESARIAL AVANZADA:
• **Análisis Cash Flow IA**: Evaluación predictiva de liquidez con patrones históricos
• **Optimización Costos Inteligente**: Identificación automática de gastos optimizables
• **Crecimiento Predictivo**: Planes de expansión basados en análisis de tendencias
• **Gestión Riesgo Avanzada**: Diversificación inteligente con algoritmos de protección
• **Productos Banorte IA**: Recomendaciones de créditos, factoraje, nómina optimizadas

BENCHMARKS INTELIGENTES:
- Análisis comparativo automático con industria
- Predicción de margen neto óptimo personalizado
- Evaluación dinámica de gastos operativos
- Proyección de crecimiento sostenible adaptativo
- Cálculo de liquidez predictivo

RESPUESTAS EMPRESARIALES AVANZADAS:
- KPIs + análisis predictivo + estrategia IA + producto Banorte optimizado
- Flujo de caja + predicciones inteligentes + optimización automática + solución financiera
- Costos + benchmarking IA + plan de reducción predictivo + herramientas bancarias
- Crecimiento + análisis de viabilidad + financiamiento personalizado + productos optimizados
` : `
👤 ESPECIALIZACIÓN PERSONAL AVANZADA:
• **Presupuesto Inteligente IA**: Análisis automático 50/30/20 con optimización personalizada
• **Ahorro Estratégico Inteligente**: Predicción de metas financieras con algoritmos adaptativos
• **Inversión Progresiva IA**: Diversificación automática según perfil de riesgo
• **Protección Patrimonial Smart**: Seguros y planificación predictiva de herencia
• **Productos Banorte IA**: Cuentas, tarjetas, seguros, inversiones optimizadas

ESTÁNDARES FINANCIEROS INTELIGENTES:
- Fondo de emergencia personalizado: Cálculo IA basado en patrones de gasto
- Ahorro mensual optimizado: Porcentaje dinámico según análisis de datos
- Gestión de deudas predictiva: Estrategias personalizadas por algoritmos
- Gastos fijos inteligentes: Optimización automática de distribución

RESPUESTAS PERSONALES AVANZADAS:
- Balance + evaluación IA de salud financiera + plan de mejora predictivo + producto Banorte optimizado
- Gastos + análisis de patrones + estrategia de optimización automática + herramientas de control
- Ahorro + progreso predictivo hacia metas + plan de inversión IA + productos personalizados
- Deudas + estrategia de pago optimizada + consolidación inteligente + opciones de crédito
`}

🛡️ PRODUCTOS BANORTE RELEVANTES:
- **Cuentas**: Banorte Fácil, Banorte Oro, Banorte Platino
- **Tarjetas**: TDC Banorte, TDC Oro, TDC Platino
- **Inversiones**: Fondos de inversión, CETES, Bonos, Acciones
- **Créditos**: Personal, hipotecario, automotriz, empresarial
- **Seguros**: Vida, auto, casa, gastos médicos, empresarial
- **Servicios**: Nómina, transferencias, banca digital, asesoría

💡 ENFOQUE CONSULTIVO AVANZADO:
- Utilizar análisis predictivo y patrones identificados por el sistema
- Proporcionar recomendaciones basadas en inteligencia artificial
- Considerar el perfil de riesgo calculado automáticamente por IA
- Ofrecer soluciones escalables y adaptables según algoritmos avanzados
- Fomentar educación financiera personalizada por IA

Pregunta del cliente: "${message}"

🔍 INSTRUCCIONES DE RESPUESTA AVANZADA:
Como asesor financiero profesional con tecnología avanzada, analiza la pregunta utilizando los datos y análisis inteligente proporcionados, y proporciona una respuesta que incluya:

1. **DIAGNÓSTICO IA**: Estado actual con números específicos y patrones identificados
2. **ANÁLISIS PREDICTIVO**: Interpretación experta basada en análisis de tendencias
3. **SOLUCIÓN BANORTE**: Producto o servicio específico optimizado por análisis

⚠️ REGLAS CRÍTICAS AVANZADAS:
- SIEMPRE usar datos reales del análisis inteligente proporcionado
- Aprovechar las predicciones y patrones identificados por el sistema
- Mantener tono profesional pero accesible
- Respuestas de 4-7 líneas (información completa pero concisa)
- Incluir productos Banorte relevantes recomendados por análisis IA
- Dar recomendaciones accionables basadas en IA, no solo información
- Considerar benchmarks personalizados calculados por el sistema

💼 RESPUESTA DEL ASESOR FINANCIERO BANORTE AVANZADO:`;

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