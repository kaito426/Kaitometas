"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn, formatCurrency } from "@/lib/utils";
import {
    Plus,
    Wallet,
    Search,
    Loader2,
    Calendar as CalendarIcon,
    Tag,
    MoreVertical,
    PieChart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Expense {
    id: string;
    amount: number;
    category: string;
    description: string;
    expense_date: string;
}

const categories = [
    { id: "traffic", label: "Tráfego", color: "bg-red-500" },
    { id: "tools", label: "Ferramentas", color: "bg-blue-500" },
    { id: "internet", label: "Internet", color: "bg-cyan-500" },
    { id: "services", label: "Serviços", color: "bg-amber-500" },
    { id: "others", label: "Outros", color: "bg-slate-500" },
];

export default function GastosPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("traffic");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    async function fetchExpenses() {
        try {
            const { data, error } = await supabase
                .from("expenses")
                .select("*")
                .order("expense_date", { ascending: false });

            if (error) throw error;
            setExpenses(data || []);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("expenses").insert([
                {
                    amount: parseFloat(amount),
                    description,
                    category,
                    expense_date: new Date().toISOString(),
                },
            ]);

            if (error) throw error;

            setAmount("");
            setDescription("");
            setShowForm(false);
            fetchExpenses();
        } catch (error) {
            console.error("Error adding expense:", error);
            alert("Erro ao adicionar gasto.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                        Controle
                    </h2>
                    <h1 className="text-4xl font-bold text-gradient">Gastos</h1>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-semibold transition-all border border-white/10"
                >
                    <Plus className="w-5 h-5" />
                    Registrar Gasto
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl md:col-span-2 flex items-center justify-between">
                    <div>
                        <div className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Total Gasto</div>
                        <div className="text-4xl font-black text-red-400">
                            {formatCurrency(totalExpenses)}
                        </div>
                    </div>
                    <PieChart className="w-12 h-12 text-white/10" />
                </div>
                <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
                    <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Aviso</div>
                    <p className="text-xs text-muted-foreground italic">
                        Os gastos registrados aqui não afetam o progresso das suas metas de receita.
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border-red-500/20 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Valor (MZN)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Descrição / Observação</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ex: Assinatura ChatGPT"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors"
                                />
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
                                    className="bg-red-500/80 hover:bg-red-500 px-8 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Expenses List */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-red-400" />
                        Histórico de Gastos
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-white/5">
                                <th className="px-6 py-4 font-medium">Data</th>
                                <th className="px-6 py-4 font-medium">Descrição</th>
                                <th className="px-6 py-4 font-medium">Categoria</th>
                                <th className="px-6 py-4 font-medium text-right">Valor</th>
                                <th className="px-6 py-4 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                    </td>
                                </tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                        Nenhum gasto registrado ainda.
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {format(new Date(expense.expense_date), "dd MMM, yyyy", { locale: ptBR })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium">{expense.description || "Sem descrição"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border bg-white/5 border-white/10"
                                            )}>
                                                {categories.find(c => c.id === expense.category)?.label || expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-bold text-red-400">
                                                {formatCurrency(expense.amount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
