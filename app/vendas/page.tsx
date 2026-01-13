"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn, formatCurrency } from "@/lib/utils";
import {
    Plus,
    TrendingUp,
    Search,
    Loader2,
    Calendar as CalendarIcon,
    Tag,
    MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sale {
    id: string;
    amount: number;
    origin: string;
    description: string;
    sale_date: string;
}

export default function VendasPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [origin, setOrigin] = useState("Manual");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchSales();
    }, []);

    async function fetchSales() {
        try {
            const { data, error } = await supabase
                .from("sales")
                .select("*")
                .order("sale_date", { ascending: false });

            if (error) throw error;
            setSales(data || []);
        } catch (error) {
            console.error("Error fetching sales:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("sales").insert([
                {
                    amount: parseFloat(amount),
                    description,
                    origin,
                    sale_date: new Date().toISOString(),
                },
            ]);

            if (error) throw error;

            // Reset form and refresh list
            setAmount("");
            setDescription("");
            setShowForm(false);
            fetchSales();
        } catch (error) {
            console.error("Error adding sale:", error);
            alert("Erro ao adicionar venda.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                        Receita
                    </h2>
                    <h1 className="text-4xl font-bold text-gradient">Vendas</h1>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                    <Plus className="w-5 h-5" />
                    Registrar Venda
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
                                    <label className="text-sm font-medium text-muted-foreground">Valor (MZN)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Origem</label>
                                    <select
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    >
                                        <option value="Manual">Manual</option>
                                        <option value="Lojou">Lojou</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Descrição / Observação</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ex: Venda de curso X"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
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
                                    className="bg-primary px-8 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sales List */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Histórico de Vendas
                    </h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-white/5">
                                <th className="px-6 py-4 font-medium">Data</th>
                                <th className="px-6 py-4 font-medium">Descrição</th>
                                <th className="px-6 py-4 font-medium">Origem</th>
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
                            ) : sales.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                        Nenhuma venda registrada ainda.
                                    </td>
                                </tr>
                            ) : (
                                sales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {format(new Date(sale.sale_date), "dd MMM, yyyy", { locale: ptBR })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium">{sale.description || "Sem descrição"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border",
                                                sale.origin === "Lojou"
                                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                    : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                            )}>
                                                {sale.origin}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-bold text-emerald-400">
                                                {formatCurrency(sale.amount)}
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
