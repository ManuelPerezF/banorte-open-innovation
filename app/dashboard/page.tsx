"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getPersonalExpenses } from "@/services/personalExpenses";
import { getCompanyExpenses } from "@/services/companyExpenses";
import DashboardSidebar from "@/components/DashboardSidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendPositive?: boolean;
}

const StatsCard = ({
  title,
  value,
  subtitle,
  trend,
  trendPositive,
}: StatsCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      {trend && (
        <p
          className={`text-xs mt-1 ${
            trendPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

interface DailyTransaction {
  date: string;
  day: number;
  ingresos: number;
  gastos: number;
}

interface MonthlyExpense {
  month: string;
  amount: number;
}

const TransactionChart = ({ data }: { data: DailyTransaction[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="text-gray-400 mb-2">📊</div>
        <p className="text-sm">No hay transacciones registradas en octubre</p>
      </div>
    );
  }

  const chartConfig = {
    ingresos: { label: "Ingresos", color: "#10b981" },
    gastos: { label: "Gastos", color: "#ef4444" },
  } satisfies ChartConfig;

  return (
    <div className="w-full h-[280px]"> {/* Ajuste del alto */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="none" vertical={false} horizontal={false} />
          <defs>
            <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="#10b981"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="#10b981"
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="fillGastos" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="#ef4444"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="#ef4444"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
          />
          <ChartTooltip
            cursor={false}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Día {label}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Ingresos
                        </span>
                        <span className="font-bold text-green-600">
                          ${payload[0]?.value?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Gastos
                        </span>
                        <span className="font-bold text-red-600">
                          ${payload[1]?.value?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            dataKey="ingresos"
            type="natural"
            fill="url(#fillIngresos)"
            fillOpacity={0.4}
            stroke="#10b981"
            strokeWidth={2}
          />
          <Area
            dataKey="gastos"
            type="natural"
            fill="url(#fillGastos)"
            fillOpacity={0.4}
            stroke="#ef4444"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function DashboardPage() {
  const [userType, setUserType] = useState<"personal" | "company">("personal");
  const [userId, setUserId] = useState<string>("");
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [dailyTransactions, setDailyTransactions] = useState<DailyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUserType = sessionStorage.getItem("userType") as "personal" | "company";
    const storedUserId = sessionStorage.getItem("userId");

    if (!storedUserType || !storedUserId) {
      window.location.href = "/login";
      return;
    }

    setUserType(storedUserType);
    setUserId(storedUserId);
    loadDashboardData(storedUserType, storedUserId);
  }, []);

  const loadDashboardData = async (type: "personal" | "company", id: string) => {
    setIsLoading(true);
    try {
      const data =
        type === "personal"
          ? await getPersonalExpenses(parseInt(id))
          : await getCompanyExpenses(id);

      const income = data.filter((t: any) => t.tipo === "ingreso").reduce((a: number, b: any) => a + b.monto, 0);
      const expenses = data.filter((t: any) => t.tipo === "gasto").reduce((a: number, b: any) => a + b.monto, 0);

      setTotalIncome(income);
      setTotalExpenses(expenses);

      // Solo datos de octubre 2025
      const transactions = data.filter((t: any) => {
        const d = new Date(t.fecha);
        return d.getMonth() === 9 && d.getFullYear() === 2025;
      });

      const daysInMonth = 31;
      const dailyData: DailyTransaction[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayTx = transactions.filter((t: any) => new Date(t.fecha).getDate() === day);
        const ingresos = dayTx.filter((t: any) => t.tipo === "ingreso").reduce((a: number, b: any) => a + b.monto, 0);
        const gastos = dayTx.filter((t: any) => t.tipo === "gasto").reduce((a: number, b: any) => a + b.monto, 0);

        dailyData.push({ date: `${day} oct`, day, ingresos, gastos });
      }

      setDailyTransactions(dailyData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const netBalance = totalIncome - totalExpenses;
  const balancePercentage =
    totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : "0";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-700 mx-auto mb-4"></div>
          <p className="text-red-700">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <DashboardSidebar userType={userType} userId={userId} />
        <SidebarInset className="flex-1 w-full">
          <header className="flex h-16 items-center gap-2 border-b px-6 bg-white w-full">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-semibold text-gray-900">
              Dashboard {userType === "personal" ? "Personal" : "Empresarial"}
            </h1>
          </header>

          <div className="flex-1 bg-gray-50 p-6 w-full min-h-0 overflow-hidden">
            <div className="w-full h-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard
                  title="Ingresos Totales"
                  value={`$${totalIncome.toLocaleString()}`}
                  subtitle="Total de ingresos"
                  trend="+12.5% vs mes anterior"
                  trendPositive={true}
                />
                <StatsCard
                  title="Gastos Totales"
                  value={`$${totalExpenses.toLocaleString()}`}
                  subtitle="Total de gastos"
                  trend="-3.2% vs mes anterior"
                  trendPositive={true}
                />
                <StatsCard
                  title="Balance Neto"
                  value={`$${netBalance.toLocaleString()}`}
                  subtitle={`${balancePercentage}% de margen`}
                  trend={
                    netBalance >= 0 ? "Balance positivo" : "Balance negativo"
                  }
                  trendPositive={netBalance >= 0}
                />
              </div>

              {/* Gráfico responsivo sin scroll */}
              <Card className="shadow-lg border-0 w-full">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    Ingresos y Gastos por Día - Octubre 2025
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 pb-2 h-[320px] overflow-hidden">
                  <TransactionChart data={dailyTransactions} />
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}