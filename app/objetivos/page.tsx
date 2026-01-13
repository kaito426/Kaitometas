"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ObjectiveCard } from "@/components/ObjectiveCard";
import { ObjectiveForm } from "@/components/ObjectiveForm";
import { Plus, Target, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ObjetivosPage() {
    const [objectives, setObjectives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const fetchObjectives = async () => {
        try {
            const { data, error } = await supabase
                .from("objectives")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setObjectives(data || []);
        } catch (error) {
            console.error("Error fetching objectives:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchObjectives();
    }, []);

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                        Foco & Disciplina
                    </h2>
                    <h1 className="text-4xl font-bold text-gradient">Meus Objetivos</h1>
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                    <Plus className="w-5 h-5" />
                    Novo Objetivo
                </button>
            </header>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : objectives.length === 0 ? (
                <div className="glass-card p-12 text-center rounded-2xl border-dashed border-white/10">
                    <Target className="w-12 h-12 text-white/5 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum objetivo definido. Comece agora!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {objectives.map((obj) => (
                        <ObjectiveCard key={obj.id} objective={obj} onUpdate={fetchObjectives} />
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showForm && (
                    <ObjectiveForm
                        onClose={() => setShowForm(false)}
                        onSuccess={fetchObjectives}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
