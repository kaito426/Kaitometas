"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn, formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  Target,
  Calendar,
  ArrowUpRight,
  Loader2,
  CheckSquare,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { GoalManager } from "@/components/GoalManager";

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  type: 'annual' | 'monthly' | 'weekly';
  currency: string;
}

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  is_mandatory: boolean;
}

export default function Dashboard() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [secondaryGoals, setSecondaryGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch the main annual goal
      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .select("*")
        .eq("type", "annual")
        .eq("is_active", true)
        .single();

      if (goalError) throw goalError;
      setGoal(goalData);

      // Fetch secondary goals
      const { data: secondaryData, error: secondaryError } = await supabase
        .from("goals")
        .select("*")
        .neq("type", "annual")
        .eq("is_active", true);

      if (secondaryError) throw secondaryError;
      setSecondaryGoals(secondaryData || []);

      // Fetch total sales
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("amount");

      if (salesError) throw salesError;

      const total = salesData.reduce((acc, sale) => acc + Number(sale.amount), 0);
      setTotalSales(total);

      // Fetch today's tasks
      const today = new Date().toISOString().split('T')[0];
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("due_date", today)
        .limit(5);

      if (taskError) throw taskError;
      setTasks(taskData || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!goal) return <div>Meta não encontrada.</div>;

  const progress = (totalSales / goal.target_amount) * 100;
  const remaining = goal.target_amount - totalSales;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
          Visão Geral
        </h2>
        <h1 className="text-4xl font-bold text-gradient">Dashboard</h1>
      </header>

      {/* Main Goal Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 rounded-3xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Target className="w-32 h-32 text-primary" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary mb-4">
            <Target className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wider text-sm">Meta Principal 2026</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
            <div className="text-6xl font-black tracking-tighter">
              {formatCurrency(totalSales)}
            </div>
            <div className="text-muted-foreground text-xl pb-1">
              de {formatCurrency(goal.target_amount)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-primary">{progress.toFixed(2)}%</span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full premium-gradient shadow-[0_0_20px_rgba(168,85,247,0.5)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Faltam</div>
              <div className="text-xl font-bold">
                {remaining > 0
                  ? formatCurrency(remaining)
                  : "Meta Atingida! 🚀"}
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Vendas Totais</div>
              <div className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                {formatCurrency(totalSales)}
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Status</div>
              <div className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Em Execução
              </div>
            </div>
          </div>

          {/* Goal Manager - Add Value & History */}
          <GoalManager onUpdate={fetchData} />
        </div>
      </motion.div>

      {/* Secondary Goals Grid */}
      {secondaryGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {secondaryGoals.map((sg) => (
            <motion.div
              key={sg.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 rounded-2xl border-white/5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{sg.name}</span>
                </div>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border",
                  sg.type === 'monthly' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                )}>
                  {sg.type === 'monthly' ? 'Mensal' : 'Semanal'}
                </span>
              </div>
              <div className="text-xl font-bold mb-4">
                {formatCurrency(sg.target_amount)}
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full",
                    sg.type === 'monthly' ? "bg-blue-500" : "bg-purple-500"
                  )}
                  style={{ width: '0%' }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions & Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-primary" />
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/vendas"
              className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-sm font-medium flex flex-col items-center gap-2 group"
            >
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              Nova Venda
            </Link>
            <Link
              href="/gastos"
              className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-sm font-medium flex flex-col items-center gap-2 group"
            >
              <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                <Plus className="w-5 h-5 text-red-400" />
              </div>
              Novo Gasto
            </Link>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              Tarefas de Hoje
            </h3>
            <Link href="/tarefas" className="text-xs text-primary hover:underline">Ver todas</Link>
          </div>

          <div className="space-y-3">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    task.is_completed ? "bg-emerald-500" : task.is_mandatory ? "bg-red-500" : "bg-white/20"
                  )} />
                  <span className={cn("text-sm", task.is_completed && "line-through text-muted-foreground")}>
                    {task.title}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic py-4 text-center">
                Nenhuma tarefa pendente para hoje.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
