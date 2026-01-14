"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
    Plus,
    CheckSquare,
    Loader2,
    AlertCircle,
    Trash2,
    Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Task {
    id: string;
    title: string;
    is_mandatory: boolean;
    is_completed: boolean;
    due_date: string;
    completed_at?: string | null;
}

export default function TarefasPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [isMandatory, setIsMandatory] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    async function fetchTasks() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .eq("due_date", today)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("tasks").insert([
                {
                    title,
                    is_mandatory: isMandatory,
                    is_completed: false,
                    due_date: new Date().toISOString().split('T')[0],
                },
            ]);

            if (error) throw error;

            setTitle("");
            setIsMandatory(false);
            setShowForm(false);
            fetchTasks();
        } catch (error) {
            console.error("Error adding task:", error);
            alert("Erro ao adicionar tarefa.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function toggleTask(task: Task) {
        try {
            const isCompleting = !task.is_completed;
            const { error } = await supabase
                .from("tasks")
                .update({
                    is_completed: isCompleting,
                    completed_at: isCompleting ? new Date().toISOString() : null
                })
                .eq("id", task.id);

            if (error) throw error;
            fetchTasks();
        } catch (error) {
            console.error("Error updating task:", error);
        }
    }

    async function deleteTask(id: string) {
        try {
            const { error } = await supabase
                .from("tasks")
                .delete()
                .eq("id", id);

            if (error) throw error;
            fetchTasks();
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    }

    const mandatoryPending = tasks.filter(t => t.is_mandatory && !t.is_completed).length;

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                        Disciplina
                    </h2>
                    <h1 className="text-4xl font-bold text-gradient">Tarefas Diárias</h1>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                    <Plus className="w-5 h-5" />
                    Nova Tarefa
                </button>
            </header>

            {mandatoryPending > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 text-amber-400">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p className="text-sm font-medium">
                        Atenção: Você tem {mandatoryPending} {mandatoryPending === 1 ? "tarefa obrigatória pendente" : "tarefas obrigatórias pendentes"} para hoje!
                    </p>
                </div>
            )}

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border-primary/20 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">O que precisa ser feito?</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Revisar campanhas de tráfego"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsMandatory(!isMandatory)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium",
                                        isMandatory
                                            ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                                            : "bg-white/5 border-white/10 text-muted-foreground"
                                    )}
                                >
                                    <Star className={cn("w-4 h-4", isMandatory && "fill-amber-400")} />
                                    Obrigatória
                                </button>
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
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Tarefa"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="glass-card p-12 text-center rounded-2xl border-dashed border-white/10">
                        <CheckSquare className="w-12 h-12 text-white/5 mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhuma tarefa para hoje. Comece o dia com foco!</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {tasks.map((task) => (
                            <motion.div
                                layout
                                key={task.id}
                                className={cn(
                                    "glass-card p-4 rounded-2xl flex items-center justify-between group transition-all",
                                    task.is_completed ? "opacity-60 grayscale-[0.5]" : "border-l-4",
                                    !task.is_completed && task.is_mandatory ? "border-l-amber-500" : "border-l-transparent"
                                )}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        onClick={() => toggleTask(task)}
                                        className={cn(
                                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                            task.is_completed
                                                ? "bg-primary border-primary text-white"
                                                : "border-white/20 hover:border-primary"
                                        )}
                                    >
                                        {task.is_completed && <CheckSquare className="w-4 h-4" />}
                                    </button>
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "font-medium transition-all",
                                            task.is_completed && "line-through text-muted-foreground"
                                        )}>
                                            {task.title}
                                        </span>
                                        {task.is_mandatory && (
                                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter flex items-center gap-1">
                                                <Star className="w-2.5 h-2.5 fill-amber-500" />
                                                Obrigatória
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
