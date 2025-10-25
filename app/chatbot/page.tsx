"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DashboardSidebar from '@/components/DashboardSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatbotPage() {
  const [userType, setUserType] = useState<'personal' | 'company'>('personal');
  const [userId, setUserId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu asistente financiero de Banorte potenciado por tecnología MCP (Model Context Protocol). 🤖\n\nPuedo ayudarte con:\n• 📊 Análisis avanzado de KPIs\n• 🔮 Predicciones financieras inteligentes\n• ⚡ Optimizaciones presupuestarias\n• 🎯 Escenarios "qué pasaría si"\n• 💡 Recomendaciones personalizadas\n\n¿En qué puedo ayudarte hoy?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Obtener información de la sesión
    const storedUserType = sessionStorage.getItem('userType') as 'personal' | 'company';
    const storedUserId = sessionStorage.getItem('userId');
    
    if (!storedUserType || !storedUserId) {
      window.location.href = '/login';
      return;
    }

    setUserType(storedUserType);
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessageToGemini = async (message: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userType,
          userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error en la respuesta del servidor');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error al enviar mensaje a Gemini:', error);
      return 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const botResponse = await sendMessageToGemini(inputMessage);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, ocurrió un error. Por favor, inténtalo de nuevo.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        {/* Sidebar */}
        <DashboardSidebar userType={userType} userId={userId} />
        
        {/* Main Content */}
        <SidebarInset className="flex-1 w-full">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white w-full">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-gray-300 mx-2" />
            <h1 className="text-xl font-semibold text-gray-900">
              ChatBot Financiero MCP
            </h1>
          </header>

          {/* Chat Content */}
          <div className="flex-1 bg-gray-50 p-6 w-full min-h-0 overflow-hidden">
            <Card className="w-full h-[calc(100vh-8rem)] flex flex-col max-w-none">
              <CardHeader className="shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-red-600" />
                  Asistente Financiero Banorte MCP
                
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Pregúntame sobre tus finanzas con tecnología MCP. Obten análisis avanzados, predicciones y consejos personalizados
                </p>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 w-full ${
                        message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-red-600 text-white'
                        }`}
                      >
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div
                        className={`max-w-[calc(100%-3rem)] min-w-0 rounded-lg p-3 wrap-break-word ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap wrap-break-word overflow-wrap-anywhere">{message.text}</p>
                        <span
                          className={`text-xs mt-1 block ${
                            message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="max-w-[calc(100%-3rem)] min-w-0 bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-500">Escribiendo...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t bg-white p-4">
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu pregunta sobre finanzas..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {userType === 'company' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('🤖 Analiza mis KPIs con tecnología MCP avanzada')}
                          disabled={isLoading}
                          className="border-purple-200 hover:border-purple-300"
                        >
                          🤖 Análisis MCP Avanzado
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('🔮 Predice mis tendencias financieras para los próximos 3 meses usando MCP')}
                          disabled={isLoading}
                          className="border-blue-200 hover:border-blue-300"
                        >
                          🔮 Predicción MCP
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('⚡ Optimiza mi presupuesto con recomendaciones MCP inteligentes')}
                          disabled={isLoading}
                          className="border-green-200 hover:border-green-300"
                        >
                          ⚡ Optimización MCP
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('🎯 Calcula escenarios "qué pasaría si" usando herramientas MCP')}
                          disabled={isLoading}
                          className="border-orange-200 hover:border-orange-300"
                        >
                          🎯 Escenarios MCP
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Cuáles son mis KPIs más recientes?')}
                          disabled={isLoading}
                        >
                          📊 Ver KPIs actuales
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('Analiza mis gastos por categoría del último mes')}
                          disabled={isLoading}
                        >
                          📈 Analizar gastos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Qué recomendaciones tienes para mejorar mi margen de ganancia?')}
                          disabled={isLoading}
                        >
                          💡 Mejorar márgenes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Cómo está mi tendencia de crecimiento mes a mes?')}
                          disabled={isLoading}
                        >
                          📉 Tendencias
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('🤖 Genera un reporte financiero personal completo usando MCP')}
                          disabled={isLoading}
                          className="border-purple-200 hover:border-purple-300"
                        >
                          🤖 Reporte MCP Personal
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('💡 Dame recomendaciones inteligentes MCP para mis finanzas personales')}
                          disabled={isLoading}
                          className="border-blue-200 hover:border-blue-300"
                        >
                          💡 Consejos MCP Inteligentes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Cómo está mi situación financiera actual?')}
                          disabled={isLoading}
                        >
                          💰 Mi situación actual
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('Analiza mis gastos por categoría')}
                          disabled={isLoading}
                        >
                          📊 Analizar gastos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Cómo puedo ahorrar más dinero?')}
                          disabled={isLoading}
                        >
                          🏦 Tips de ahorro
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('Dame consejos para mejorar mis finanzas')}
                          disabled={isLoading}
                        >
                          💡 Consejos personalizados
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
