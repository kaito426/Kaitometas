"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Sparkles, RefreshCw, BrainCircuit, Lightbulb, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Insight {
    id: string;
    content: string;
    type: string;
    created_at: string;
}

export function AICoach() {
    const [insight, setInsight] = useState<Insight | null>(null);
    const [loading, setLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => {
        fetchLatestInsight();
    }, []);

    async function fetchLatestInsight() {
        try {
            const { data, error } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('type', 'coach')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) setInsight(data);
        } catch (error) {
            console.error("Error fetching insight:", error);
        } finally {
            setIsInitialLoading(false);
        }
    }

    async function generateNewInsight() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-coach`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ type: 'coach' })
            });

            const data = await response.json();
            if (data.content) {
                setInsight({
                    id: Math.random().toString(),
                    content: data.content,
                    type: 'coach',
                    created_at: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error("Error generating insight:", error);
        } finally {
            setLoading(false);
        }
    }

    if (isInitialLoading) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-3xl border-primary/20 bg-primary/5 relative overflow-hidden group"
        >
            <div className="absolute -top-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <BrainCircuit className="w-32 h-32 text-primary" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Kaito AI Coach</h3>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Estrategista em Tempo Real</p>
                        </div>
                    </div>
                    <button
                        onClick={generateNewInsight}
                        disabled={loading}
                        className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-primary transition-all disabled:opacity-50"
                        title="Gerar novo insight"
                    >
                        <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {!insight && !loading ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-8 text-center"
                        >
                            <Lightbulb className="w-12 h-12 text-white/5 mx-auto mb-4" />
                            <p className="text-muted-foreground text-sm mb-6">
                                Clique no botão para gerar seu primeiro insight estratégico baseado nos seus dados.
                            </p>
                            <button
                                onClick={generateNewInsight}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
                            >
                                Iniciar Análise
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={insight?.id || 'loading'}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {loading ? (
                                <div className="space-y-3 py-4">
                                    <div className="h-4 bg-white/5 rounded-full w-full animate-pulse" />
                                    <div className="h-4 bg-white/5 rounded-full w-5/6 animate-pulse" />
                                    <div className="h-4 bg-white/5 rounded-full w-4/6 animate-pulse" />
                                </div>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <p className="text-white/90 leading-relaxed whitespace-pre-wrap italic">
                                        &quot;{insight?.content}&quot;
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-400/80">
                                    Foco Sugerido: Alta Performance
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
