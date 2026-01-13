"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import {
    CheckCircle2,
    Circle,
    Plus,
    History,
    Trash2,
    TrendingUp,
    RotateCcw,
    MoreVertical,
    Target,
    ListTodo
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Objective {
    id: string;
    name: string;
    category: string;
    is_monetary: boolean;
    target_amount: number | null;
    current_amount: number;
    status: 'pending' | 'completed';
}

interface Log {
    id: string;
    amount: number;
    description: string;
    created_at: string;
    type: 'adjustment' | 'reversal';
}

interface ObjectiveCardProps {
    objective: Objective;
    onUpdate: () => void;
}

export function ObjectiveCard({ objective, onUpdate }: ObjectiveCardProps) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<Log[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const progress = objective.is_monetary && objective.target_amount
        ? (objective.current_amount / objective.target_amount) * 100
        : 0;

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const { data, error } = await supabase
                .from("objective_logs")
                .select("*")
                .eq("objective_id", objective.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleAddValue = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from("objective_logs").insert([
                {
                    objective_id: objective.id,
                    amount: parseFloat(amount),
                    description: description || "Ajuste manual",
                    type: 'adjustment'
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

    const handleRevert = async (log: Log) => {
        if (!confirm(`Deseja reverter este lançamento de ${formatCurrency(log.amount)}?`)) return;

        setLoading(true);
        try {
            const { error } = await supabase.from("objective_logs").insert([
                {
                    objective_id: objective.id,
                    amount: -log.amount,
                    description: `Reversão: ${log.description}`,
                    type: 'reversal'
                },
            ]);

            if (error) throw error;
            await fetchLogs();
            onUpdate();
        } catch (error) {
            console.error("Error reverting:", error);
            alert("Erro ao reverter.");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async () => {
        try {
            const newStatus = objective.status === 'completed' ? 'pending' : 'completed';
            const { error } = await supabase
                .from("objectives")
                .update({ status: newStatus })
                .eq("id", objective.id);

            if (error) throw error;
            onUpdate();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Tem certeza que deseja excluir este objetivo?")) return;
        try {
            const { error } = await supabase
                .from("objectives")
                .delete()
                .eq("id", objective.id);

            if (error) throw error;
            onUpdate();
        } catch (error) {
            console.error("Error deleting objective:", error);
        }
    };

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`glass-card p-6 rounded-2xl relative overflow-hidden group border-white/5 ${objective.status === 'completed' ? 'opacity-70 grayscale-[0.5]' : ''}`}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${objective.is_monetary ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {objective.is_monetary ? <TrendingUp className="w-5 h-5" /> : <ListTodo className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{objective.name}</h3>
                            <span className="text-xs text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                                {objective.category}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={toggleStatus}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            title={objective.status === 'completed' ? "Reabrir" : "Concluir"}
                        >
                            {objective.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {objective.is_monetary ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="text-2xl font-black">
                                {formatCurrency(objective.current_amount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Meta: {formatCurrency(objective.target_amount || 0)}
                            </div>
                        </div>

                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-1000"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-3 h-3" /> Adicionar
                            </button>
                            <button
                                onClick={() => {
                                    setShowHistoryModal(true);
                                    fetchLogs();
                                }}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <History className="w-3 h-3" /> Histórico
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4">
                        <div className={`p-4 rounded-xl border ${objective.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 text-muted-foreground'}`}>
                            <div className="flex items-center gap-3">
                                {objective.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                <span className="font-medium">
                                    {objective.status === 'completed' ? 'Concluído' : 'Em andamento'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

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
                                <h3 className="text-lg font-bold">Adicionar Valor</h3>
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
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Ex: Depósito mensal"
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
                                <h3 className="text-lg font-bold">Histórico</h3>
                                <button onClick={() => setShowHistoryModal(false)} className="text-muted-foreground hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                                {loadingLogs ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                ) : logs.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">Nenhum registro.</p>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                                            <div>
                                                <p className="font-medium text-sm">{log.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`font-bold text-sm ${log.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {log.amount >= 0 ? '+' : ''}{formatCurrency(log.amount)}
                                                </span>
                                                {log.type !== 'reversal' && (
                                                    <button
                                                        onClick={() => handleRevert(log)}
                                                        className="text-xs text-muted-foreground hover:text-red-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
