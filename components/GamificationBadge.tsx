"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface UserStats {
    xp: number;
    level: number;
    streak: number;
}

export function GamificationBadge() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();

        // Real-time subscription
        const channel = supabase
            .channel('user-stats-changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'user_stats'
            }, (payload) => {
                setStats(payload.new as UserStats);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchStats() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('user_stats')
                .select('xp, level, streak')
                .eq('user_id', user.id)
                .single();

            if (data) setStats(data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading || !stats) return null;

    const xpToNextLevel = stats.level * 1000;
    const progress = (stats.xp % 1000) / 10; // Percentage of current level

    return (
        <div className="space-y-4 p-4 glass-card rounded-2xl border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Nível</p>
                        <p className="text-xl font-black text-white leading-none">{stats.level}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Zap className="w-4 h-4 fill-amber-500" />
                        <span>{stats.streak} Dias</span>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-muted-foreground">Progresso XP</span>
                    <span className="text-primary">{stats.xp % 1000} / 1000</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-primary to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    />
                </div>
            </div>
        </div>
    );
}
