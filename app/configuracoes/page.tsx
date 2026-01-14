"use client";

import { useState, useEffect } from "react";
import { Shield, Bell, Bot, Database, Copy, Check, LogOut } from "lucide-react";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const [webhookUrl, setWebhookUrl] = useState("");
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        // In a real production app, this would be your Vercel/Production URL
        if (typeof window !== "undefined") {
            setWebhookUrl(`${window.location.origin}/api/webhooks/lojou`);
        }
    }, []);

    if (!mounted) {
        return null;
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="space-y-8 pb-20 md:pb-8">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                        Sistema
                    </h2>
                    <h1 className="text-4xl font-bold text-gradient">Configurações</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-sm font-bold"
                >
                    <LogOut className="w-4 h-4" />
                    Sair
                </button>
            </header>

            <div className="grid gap-6">
                {/* Web Push Manager */}
                <PushNotificationManager />

                <section className="glass-card p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Integração Lojou (Webhook)
                    </h3>

                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Copie a URL abaixo e cole no painel da Lojou para automatizar o registro de vendas.
                        </p>

                        <div className="flex items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/10">
                            <code className="flex-1 text-xs text-primary font-mono break-all">
                                {webhookUrl}
                            </code>
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all text-muted-foreground hover:text-white"
                            >
                                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                <div className="text-xs font-bold text-emerald-400 uppercase mb-1">Status</div>
                                <div className="text-sm">Aguardando eventos...</div>
                            </div>
                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                <div className="text-xs font-bold text-blue-400 uppercase mb-1">Meta Vinculada</div>
                                <div className="text-sm">Meta Principal 2026</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="glass-card p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        Infraestrutura
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Database className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <div className="font-medium">Supabase</div>
                                    <div className="text-xs text-muted-foreground">Banco de Dados & Auth</div>
                                </div>
                            </div>
                            <div className="text-xs font-bold text-emerald-400 uppercase tracking-tighter">Conectado</div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <div className="font-medium">Telegram Bot</div>
                                    <div className="text-xs text-muted-foreground">Alertas de Tarefas</div>
                                </div>
                            </div>
                            <div className="text-xs font-bold text-primary uppercase tracking-tighter">Configurado</div>
                        </div>
                    </div>
                </section>

                <section className="glass-card p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-4">Sobre o Kaito Vision</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Este é um sistema de uso exclusivamente pessoal, focado em disciplina, visão e execução.
                        Desenvolvido para acompanhar a meta de 1.000.000 MZN e garantir que as tarefas diárias sejam cumpridas sem falhas.
                    </p>
                    <div className="mt-6 pt-6 border-t border-white/5 text-[10px] text-muted-foreground uppercase tracking-widest">
                        Versão 1.1.0 • 2026
                    </div>
                </section>
            </div>
        </div>
    );
}
