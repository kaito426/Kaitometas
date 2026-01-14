"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Check, X, ExternalLink, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    title: string;
    body: string;
    url: string;
    is_read: boolean;
    created_at: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchNotifications();

        // Real-time subscription
        const channel = supabase
            .channel('notifications-changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            }, (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Play sound
                try {
                    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                    audio.volume = 0.5;
                    audio.play().catch(e => console.log("Audio play failed:", e));
                } catch (e) {
                    console.error("Audio error:", e);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function markAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    }

    async function clearAll() {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (!error) {
            setNotifications([]);
            setUnreadCount(0);
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-white/5 transition-all group"
            >
                <Bell className={cn("w-6 h-6 transition-all", unreadCount > 0 ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-white")} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-[#0a0a0a]">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 md:right-auto md:left-0 mt-2 w-80 md:w-96 bg-card/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <h3 className="font-bold text-lg">Notificações</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={clearAll}
                                        className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Limpar
                                    </button>
                                    <button onClick={() => setIsOpen(false)}>
                                        <X className="w-4 h-4 text-muted-foreground hover:text-white" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Bell className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                        <p className="text-muted-foreground text-sm">Nenhuma notificação por aqui.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                className={cn(
                                                    "p-4 hover:bg-white/5 transition-colors group relative",
                                                    !n.is_read && "bg-primary/5"
                                                )}
                                            >
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1">
                                                        <h4 className={cn("text-sm font-semibold mb-1", !n.is_read ? "text-white" : "text-muted-foreground")}>
                                                            {n.title}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground mb-2">
                                                            {n.body}
                                                        </p>
                                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                                                            <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}</span>
                                                            {n.url && (
                                                                <a
                                                                    href={n.url}
                                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                                    onClick={() => markAsRead(n.id)}
                                                                >
                                                                    Ver <ExternalLink className="w-2.5 h-2.5" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!n.is_read && (
                                                        <button
                                                            onClick={() => markAsRead(n.id)}
                                                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                                                            title="Marcar como lida"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
