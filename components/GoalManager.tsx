"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import {
    Plus,
    History,
    X,
    Loader2,
    RotateCcw,
    ArrowUpRight,
    ArrowDownLeft
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

interface GoalManagerProps {
    onUpdate: () => void;
}

export function GoalManager({ onUpdate }: GoalManagerProps) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<Sale[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from("sales")
                .select("*")
                .order("sale_date", { ascending: false })
                .limit(20);

            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleAddValue = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from("sales").insert([
                {
                    amount: parseFloat(amount),
                    description: description || "Ajuste Manual",
                    origin: "Manual",
                    sale_date: new Date().toISOString(),
                },
            ]);

            if (error) throw error;

            setAmount("");
            setDescription("");
            setShowAddModal(false);
            onUpdate();
        } catch (error) {
            console.error("Error adding value:", error);
            alert("Erro ao adicionar valor.");
        } finally {
            setLoading(false);
        }
    };

    const handleRevert = async (sale: Sale) => {
        if (!confirm(`Deseja reverter este lançamento de ${formatCurrency(sale.amount)}?`)) return;

        setLoading(true);
        try {
            const { error } = await supabase.from("sales").insert([
                {
                    amount: -sale.amount,
                    description: `Reversão: ${sale.description}`,
                    origin: "Reversão",
                    sale_date: new Date().toISOString(),
                },
            ]);

            if (error) throw error;

            await fetchHistory();
            onUpdate();
        } catch (error) {
            console.error("Error reverting value:", error);
            alert("Erro ao reverter valor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (showHistoryModal) {
            fetchHistory();
        }
    }, [showHistoryModal]);

    return (
        <>
            <div className="flex gap-2 mt-6">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Valor
                </button>
                <button
                    onClick={() => setShowHistoryModal(true)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/80 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                    <History className="w-4 h-4" />
                    Histórico
                </button>
            </div>

            {/* Add Value Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md glass-card p-6 rounded-2xl border-primary/20"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">Adicionar Valor Manual</h3>
                                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddValue} className="space-y-4">
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
                                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Ex: Ajuste mensal"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {showHistoryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg glass-card p-6 rounded-2xl border-white/10 max-h-[80vh] flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">Histórico de Lançamentos</h3>
                                <button onClick={() => setShowHistoryModal(false)} className="text-muted-foreground hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar">
                                {loadingHistory ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado.</p>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${item.amount >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {item.amount >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{item.description || "Sem descrição"}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(item.sale_date), "dd MMM yyyy, HH:mm", { locale: ptBR })} • {item.origin}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`font-bold text-sm ${item.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                                                </span>
                                                {item.origin !== "Reversão" && (
                                                    <button
                                                        onClick={() => handleRevert(item)}
                                                        className="text-xs text-muted-foreground hover:text-red-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Reverter este lançamento"
                                                    >
                                                        <RotateCcw className="w-3 h-3" /> Reverter
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
