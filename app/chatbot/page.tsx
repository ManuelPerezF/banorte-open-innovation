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
      text: '¡Hola! Soy tu asistente financiero de Banorte. ¿En qué puedo ayudarte hoy?',
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
        console.error(' Error en respuesta:', errorData);
        throw new Error(errorData.error || 'Error en la respuesta del servidor');
      }

      const data = await response.json();
      console.log(' Respuesta recibida:', data.response?.substring(0, 100) + '...');
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
                          onClick={() => setInputMessage('¿Cuáles son mis ingresos y margen actuales?')}
                          disabled={isLoading}
                        >
                          Ingresos y margen
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Cómo van mis ventas este mes?')}
                          disabled={isLoading}
                        >
                          Ventas del mes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('Muéstrame mi distribución de gastos por categoría')}
                          disabled={isLoading}
                        >
                          Gastos por categoría
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿En qué categoría gasto más dinero?')}
                          disabled={isLoading}
                        >
                          Mayor gasto
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Cómo está mi crecimiento mensual?')}
                          disabled={isLoading}
                        >
                          Crecimiento
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Qué puedo optimizar para ahorrar?')}
                          disabled={isLoading}
                        >
                          Optimizar gastos
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Cuál es mi balance actual?')}
                          disabled={isLoading}
                        >
                          Mi balance
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿En qué categoría gasto más?')}
                          disabled={isLoading}
                        >
                          Mayor gasto
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('Muéstrame mis gastos por categoría')}
                          disabled={isLoading}
                        >
                          Gastos por categoría
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Cómo puedo ahorrar más?')}
                          disabled={isLoading}
                        >
                          Tips ahorro
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Estoy gastando mucho?')}
                          disabled={isLoading}
                        >
                          Evaluar gastos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage('¿Cuánto he gastado en total?')}
                          disabled={isLoading}
                        >
                          Total gastado
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
