"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
    Plus,
    Target,
    Loader2,
    Calendar,
    Trash2,
    Edit2,
    CheckCircle2,
    Circle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Goal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    type: 'annual' | 'monthly' | 'weekly';
    is_active: boolean;
    currency: string;
}

export default function MetasPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [type, setType] = useState<'monthly' | 'weekly'>('monthly');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchGoals();
    }, []);

    async function fetchGoals() {
        try {
            const { data, error } = await supabase
                .from("goals")
                .select("*")
                .neq("type", "annual")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            console.error("Error fetching goals:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("goals").insert([
                {
                    name,
                    target_amount: parseFloat(targetAmount),
                    current_amount: 0,
                    type,
                    is_active: true,
                    currency: 'MZN'
                },
            ]);

            if (error) throw error;

            setName("");
            setTargetAmount("");
            setShowForm(false);
            fetchGoals();
        } catch (error) {
            console.error("Error adding goal:", error);
            alert("Erro ao adicionar meta.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function toggleGoalStatus(goal: Goal) {
        try {
            const { error } = await supabase
                .from("goals")
                .update({ is_active: !goal.is_active })
                .eq("id", goal.id);

            if (error) throw error;
            fetchGoals();
        } catch (error) {
            console.error("Error updating goal:", error);
        }
    }

    async function deleteGoal(id: string) {
        if (!confirm("Tem certeza que deseja excluir esta meta?")) return;
        try {
            const { error } = await supabase
                .from("goals")
                .delete()
                .eq("id", id);

            if (error) throw error;
            fetchGoals();
        } catch (error) {
            console.error("Error deleting goal:", error);
        }
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                        Planejamento
                    </h2>
                    <h1 className="text-4xl font-bold text-gradient">Metas Secundárias</h1>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                    <Plus className="w-5 h-5" />
                    Nova Meta
                </button>
            </header>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border-primary/20 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Nome da Meta</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ex: Meta de Janeiro"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Valor Alvo (MZN)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={targetAmount}
                                        onChange={(e) => setTargetAmount(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Frequência</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setType('monthly')}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl border transition-all font-medium",
                                            type === 'monthly' ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-muted-foreground"
                                        )}
                                    >
                                        Mensal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('weekly')}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl border transition-all font-medium",
                                            type === 'weekly' ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-muted-foreground"
                                        )}
                                    >
                                        Semanal
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-3 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-primary px-8 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Meta"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : goals.length === 0 ? (
                    <div className="col-span-full glass-card p-12 text-center rounded-2xl border-dashed border-white/10">
                        <Target className="w-12 h-12 text-white/5 mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhuma meta secundária definida. Comece a planejar seu sucesso!</p>
                    </div>
                ) : (
                    goals.map((goal) => (
                        <motion.div
                            layout
                            key={goal.id}
                            className={cn(
                                "glass-card p-6 rounded-2xl relative overflow-hidden group transition-all",
                                !goal.is_active && "opacity-60 grayscale-[0.5]"
                            )}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        goal.type === 'monthly' ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                                    )}>
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{goal.name}</h3>
                                        <span className="text-xs text-muted-foreground uppercase tracking-widest">
                                            {goal.type === 'monthly' ? 'Mensal' : 'Semanal'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => toggleGoalStatus(goal)}
                                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                        title={goal.is_active ? "Desativar" : "Ativar"}
                                    >
                                        {goal.is_active ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                                    </button>
                                    <button
                                        onClick={() => deleteGoal(goal.id)}
                                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="text-2xl font-black">
                                        {goal.target_amount.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Status: {goal.is_active ? "Ativa" : "Inativa"}
                                    </div>
                                </div>

                                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-1000",
                                            goal.type === 'monthly' ? "bg-blue-500" : "bg-purple-500"
                                        )}
                                        style={{ width: '0%' }} // Placeholder for progress if linked to sales
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
