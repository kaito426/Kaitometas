"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, X, DollarSign, ListTodo, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ObjectiveFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function ObjectiveForm({ onClose, onSuccess }: ObjectiveFormProps) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [isMonetary, setIsMonetary] = useState<boolean | null>(null);
    const [targetAmount, setTargetAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState<{ title: string }[]>([]);

    const generateAiTasks = async () => {
        if (!name) return;
        setAiLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-coach`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ type: 'task_breakdown', objectiveName: name })
            });
            const data = await response.json();
            const tasks = JSON.parse(data.content);
            setGeneratedTasks(tasks);
        } catch (error) {
            console.error("Error generating tasks:", error);
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from("objectives").insert([
                {
                    name,
                    category,
                    is_monetary: isMonetary,
                    target_amount: isMonetary ? parseFloat(targetAmount) : null,
                    current_amount: 0,
                    status: 'pending',
                    user_id: (await supabase.auth.getUser()).data.user?.id
                },
            ]);

            if (error) throw error;

            // If there are generated tasks, insert them
            if (generatedTasks.length > 0) {
                const { data: { user } } = await supabase.auth.getUser();
                const today = new Date().toISOString().split('T')[0];
                const tasksToInsert = generatedTasks.map(t => ({
                    title: t.title,
                    user_id: user?.id,
                    due_date: today,
                    is_completed: false,
                    is_mandatory: false
                }));
                await supabase.from("tasks").insert(tasksToInsert);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error creating objective:", error);
            alert("Erro ao criar objetivo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md glass-card p-6 rounded-2xl border-primary/20"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Novo Objetivo</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nome do Objetivo</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Comprar Carro ou Ir ao Ginásio"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                        <input
                            type="text"
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Ex: Pessoal, Saúde, Família"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Este objetivo envolve dinheiro?</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setIsMonetary(true)}
                                className={cn(
                                    "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                                    isMonetary === true
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                )}
                            >
                                <DollarSign className="w-6 h-6" />
                                <span className="text-sm font-medium">Sim</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsMonetary(false)}
                                className={cn(
                                    "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                                    isMonetary === false
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                )}
                            >
                                <ListTodo className="w-6 h-6" />
                                <span className="text-sm font-medium">Não</span>
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isMonetary === true && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                            >
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
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-muted-foreground">Plano de Ação (IA)</label>
                            <button
                                type="button"
                                onClick={generateAiTasks}
                                disabled={aiLoading || !name}
                                className="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary/80 flex items-center gap-1 disabled:opacity-50"
                            >
                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                Gerar com IA
                            </button>
                        </div>

                        {generatedTasks.length > 0 && (
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
                                {generatedTasks.map((t, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="w-1 h-1 bg-primary rounded-full" />
                                        {t.title}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || isMonetary === null}
                        className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Objetivo"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
