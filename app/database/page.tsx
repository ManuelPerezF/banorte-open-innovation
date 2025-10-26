"use client";

import React, { useEffect, useState } from "react";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tables } from "@/services/supabasaTypes";
import supabase from "@/services/supabase";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PersonalTransaction = Tables<"personal_tx">;
type CompanyTransaction = Tables<"company_tx">;
type Transaction = PersonalTransaction | CompanyTransaction;

export default function DatabasePage() {
  const [userType, setUserType] = useState<"personal" | "company">("personal");
  const [userId, setUserId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "ingreso" | "gasto">("all");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [categories, setCategories] = useState<string[]>([]);
  
  // Form state
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    tipo: "gasto" as "ingreso" | "gasto",
    monto: "",
    fecha: new Date().toISOString().split('T')[0],
    categoria: "",
    descripcion: "", // para personal
    concepto: "", // para company
  });

  useEffect(() => {
    const storedUserType = sessionStorage.getItem("userType") as "personal" | "company";
    const storedUserId = sessionStorage.getItem("userId");
    
    if (!storedUserType || !storedUserId) {
      window.location.href = "/login";
      return;
    }

    setUserType(storedUserType);
    setUserId(storedUserId);

    fetchTransactions(storedUserType, storedUserId);
  }, []);

  useEffect(() => {
    const uniqueCategories = [...new Set(
      transactions
        .map(tx => tx.categoria)
        .filter((cat): cat is string => typeof cat === 'string' && cat !== null)
    )];
    setCategories(uniqueCategories);
  }, [transactions]);

  const fetchTransactions = async (type: "personal" | "company", id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const table = type === "personal" ? "personal_tx" : "company_tx";
      const idField = type === "personal" ? "user_id" : "empresa_id";

      const { data, error } = await supabase
        .from(table)
        .select("*, categories(name)")
        .eq(idField, type === "personal" ? parseInt(id) : id)
        .order("fecha", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Error al cargar las transacciones");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    try {
      const table = userType === "personal" ? "personal_tx" : "company_tx";
      
      let transactionData: any = {
        tipo: newTransaction.tipo,
        monto: parseFloat(newTransaction.monto),
        fecha: newTransaction.fecha,
        categoria: newTransaction.categoria || null,
        currency: "MXN",
      };

      if (userType === "personal") {
        transactionData.user_id = parseInt(userId);
        transactionData.descripcion = newTransaction.descripcion || null;
      } else {
        transactionData.empresa_id = userId;
        transactionData.concepto = newTransaction.concepto || null;
      }

      const { data, error } = await supabase
        .from(table)
        .insert([transactionData])
        .select();

      if (error) throw error;

      // Refresh transactions
      await fetchTransactions(userType, userId);
      
      // Reset form
      setNewTransaction({
        tipo: "gasto",
        monto: "",
        fecha: new Date().toISOString().split('T')[0],
        categoria: "",
        descripcion: "",
        concepto: "",
      });
      setIsAddingTransaction(false);
    } catch (err) {
      console.error("Error adding transaction:", err);
      alert("Error al agregar la transacción");
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta transacción?")) {
      return;
    }

    try {
      const table = userType === "personal" ? "personal_tx" : "company_tx";
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh transactions
      await fetchTransactions(userType, userId);
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Error al eliminar la transacción");
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter !== "all" && tx.tipo !== filter) return false;
    if (categoryFilter.length === 0) return true;
    return tx.categoria && categoryFilter.includes(tx.categoria);
  }).sort((a, b) => {
    const dateA = new Date(a.fecha).getTime();
    const dateB = new Date(b.fecha).getTime();
    
    if (sortOrder === "desc") {
      return dateB - dateA; // Más recientes primero
    } else {
      return dateA - dateB; // Más antiguos primero
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(prev => {
      const isSelected = prev.includes(category);
      if (isSelected) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const getFilterDisplayText = () => {
    if (categoryFilter.length === 0) return "Todas las categorías";
    if (categoryFilter.length === 1) return categoryFilter[0];
    return `${categoryFilter.length} categorías seleccionadas`;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <DashboardSidebar userType={userType} userId={userId} />
        
        <SidebarInset className="flex-1 w-full">
          {/* Header - Fixed at top */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-gray-300 mx-2" />
            <h1 className="text-xl font-semibold text-gray-900">
              Transacciones {userType === "personal" ? "Personales" : "Empresariales"}
            </h1>
          </header>

          {/* Main Container - Takes remaining height */}
          <div className="h-[calc(100vh-4rem)] bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Add Transaction Card */}
              <Card className="bg-white mb-4">
                <div className="p-4">
                  {!isAddingTransaction ? (
                    <Button 
                      onClick={() => setIsAddingTransaction(true)}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Nueva Transacción
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Nueva Transacción</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsAddingTransaction(false)}
                        >
                          Cancelar
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tipo">Tipo</Label>
                          <Select
                            value={newTransaction.tipo}
                            onValueChange={(value: "ingreso" | "gasto") => 
                              setNewTransaction({...newTransaction, tipo: value})
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ingreso">Ingreso</SelectItem>
                              <SelectItem value="gasto">Gasto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="monto">Monto</Label>
                          <Input
                            id="monto"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newTransaction.monto}
                            onChange={(e) => setNewTransaction({...newTransaction, monto: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="fecha">Fecha</Label>
                          <Input
                            id="fecha"
                            type="date"
                            value={newTransaction.fecha}
                            onChange={(e) => setNewTransaction({...newTransaction, fecha: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="categoria">Categoría</Label>
                          <Select
                            value={newTransaction.categoria}
                            onValueChange={(value: string) => 
                              setNewTransaction({...newTransaction, categoria: value})
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="descripcion">
                            {userType === "personal" ? "Descripción" : "Concepto"}
                          </Label>
                          <Input
                            id="descripcion"
                            placeholder={userType === "personal" ? "Descripción de la transacción" : "Concepto de la transacción"}
                            value={userType === "personal" ? newTransaction.descripcion : newTransaction.concepto}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              if (userType === "personal") {
                                setNewTransaction({...newTransaction, descripcion: e.target.value});
                              } else {
                                setNewTransaction({...newTransaction, concepto: e.target.value});
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleAddTransaction}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          disabled={!newTransaction.monto || parseFloat(newTransaction.monto) <= 0}
                        >
                          Guardar Transacción
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Filters Section - Fixed */}
              <Card className="mb-4">
                <div className="p-4 bg-white">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex flex-wrap gap-4 items-center flex-1">
                      <Select 
                        value={filter} 
                        onValueChange={(value: "all" | "ingreso" | "gasto") => setFilter(value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filtrar por tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="ingreso">Ingresos</SelectItem>
                          <SelectItem value="gasto">Gastos</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={categoryFilter.length === 0 ? 'all' : categoryFilter[0]}
                        onValueChange={(value: string) => {
                          if (value === 'all') {
                            setCategoryFilter([]);
                          } else {
                            handleCategoryChange(value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue>
                            {getFilterDisplayText()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" hideCheckmark>
                            Todas las categorías
                          </SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat} hideCheckmark>
                              <div className="flex items-center gap-2">
                                {categoryFilter.includes(cat) && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                                <span>{cat}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select 
                        value={sortOrder} 
                        onValueChange={(value: "desc" | "asc") => setSortOrder(value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Más recientes</SelectItem>
                          <SelectItem value="asc">Más antiguos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full flex gap-2 flex-wrap mt-2">
                      {filter !== "all" && (
                        <Badge variant="outline" className="capitalize bg-gray-100">
                          {filter}s
                        </Badge>
                      )}
                      {categoryFilter.map(cat => (
                        <Badge 
                          key={cat}
                          variant="outline" 
                          className="bg-gray-100 cursor-pointer"
                          onClick={() => handleCategoryChange(cat)}
                        >
                          {cat} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Transactions List */}
              <Card className="flex-1 relative">
                <div className="absolute inset-0 overflow-y-auto">
                  <div className="p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando transacciones...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center min-h-[400px] text-red-600">
                      {error}
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[400px] text-gray-600">
                      {transactions.length === 0 
                        ? "No hay transacciones disponibles."
                        : "No hay resultados para los filtros seleccionados."}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredTransactions.map((tx: any) => (
                        <div
                          key={tx.id}
                          className={`bg-white rounded-lg shadow-sm border p-4 transition-all hover:shadow-md ${
                            tx.tipo === "ingreso" ? "border-green-100" : "border-red-100"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                  tx.tipo === "ingreso" 
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {tx.tipo === "ingreso" ? "Ingreso" : "Gasto"}
                                </span>
                                {tx.categoria && (
                                  <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                    {tx.categoria}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-900 font-medium">
                                {userType === "company" ? tx.concepto : tx.descripcion || "Sin descripción"}
                              </p>
                              <p className="text-sm text-gray-500">{formatDate(tx.fecha)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`text-lg font-bold ${
                                tx.tipo === "ingreso" ? "text-green-600" : "text-red-600"
                              }`}>
                                {tx.tipo === "ingreso" ? "+" : "-"}{formatCurrency(tx.monto)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                                      )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}