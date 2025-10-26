import supabase from "./supabase";
import { Tables } from "./supabasaTypes";

type PersonalTransaction = Tables<"personal_tx">;

async function getPersonalExpenses(userId: number) {
  const { data, error } = await supabase
    .from("personal_tx")
    .select("*")
    .eq("user_id", userId)
    .order("fecha", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getPersonalExpensesByCategory(userId: number) {
  const { data, error } = await supabase
    .from("personal_tx")
    .select(
      `
            monto,
            tipo,
            categoria
        `
    )
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  // Agrupar por categoría
  const groupedExpenses = data?.reduce((acc, expense) => {
    const category = expense.categoria || "Sin categoría";
    if (!acc[category]) {
      acc[category] = { ingresos: 0, gastos: 0 };
    }

    if (expense.tipo === "ingreso") {
      acc[category].ingresos += expense.monto;
    } else {
      acc[category].gastos += expense.monto;
    }

    return acc;
  }, {} as Record<string, { ingresos: number; gastos: number }>);

  return groupedExpenses;
}

async function getMonthlyExpenseSummary(userId: number) {
  const { data, error } = await supabase
    .from("personal_tx")
    .select("*")
    .eq("user_id", userId)
    .gte(
      "fecha",
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    );

  if (error) {
    throw new Error(error.message);
  }

  const summary = data?.reduce(
    (acc, tx) => {
      if (tx.tipo === "ingreso") {
        acc.totalIngresos += tx.monto;
      } else {
        acc.totalGastos += tx.monto;
      }
      return acc;
    },
    { totalIngresos: 0, totalGastos: 0 }
  );

  return {
    ...summary,
    balance: summary ? summary.totalIngresos - summary.totalGastos : 0,
  };
}

// Nueva función que incluye TODOS los datos históricos (sin filtro de mes)
async function getAllTimeExpenseSummary(userId: number) {
  const { data, error } = await supabase
    .from("personal_tx")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const summary = data?.reduce(
    (acc, tx) => {
      if (tx.tipo === "ingreso") {
        acc.totalIngresos += tx.monto;
      } else {
        acc.totalGastos += tx.monto;
      }
      return acc;
    },
    { totalIngresos: 0, totalGastos: 0 }
  );

  return {
    ...summary,
    balance: summary ? summary.totalIngresos - summary.totalGastos : 0,
  };
}

export {
  getPersonalExpenses,
  getPersonalExpensesByCategory,
  getMonthlyExpenseSummary,
  getAllTimeExpenseSummary,
  type PersonalTransaction,
};
