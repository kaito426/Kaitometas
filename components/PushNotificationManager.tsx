"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true);
            checkSubscription();
        } else {
            setLoading(false);
        }
    }, []);

    async function checkSubscription() {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
        setLoading(false);
    }

    async function subscribeToPush() {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });

            setSubscription(sub);

            // Save subscription to Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from("push_subscriptions").upsert({
                    user_id: user.id,
                    subscription: JSON.stringify(sub),
                    updated_at: new Date().toISOString(),
                });
            }
        } catch (error) {
            console.error("Failed to subscribe to push notifications:", error);
        } finally {
            setLoading(false);
        }
    }

    async function unsubscribeFromPush() {
        setLoading(true);
        try {
            if (subscription) {
                await subscription.unsubscribe();
                setSubscription(null);

                // Remove from Supabase
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
                }
            }
        } catch (error) {
            console.error("Failed to unsubscribe from push notifications:", error);
        } finally {
            setLoading(false);
        }
    }

    async function testNotification() {
        setTesting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-notification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userId: session.user.id,
                    title: '🚀 Teste de Notificação!',
                    body: 'Se você está vendo isso, suas notificações estão funcionando!',
                    url: '/configuracoes'
                })
            });
            const data = await response.json();
            console.log('Test notification result:', data);
            alert('Notificação enviada! Verifique se chegou.');
        } catch (error) {
            console.error('Failed to send test notification:', error);
            alert('Erro ao enviar notificação de teste.');
        } finally {
            setTesting(false);
        }
    }

    if (!isSupported) return null;

    return (
        <div className="glass-card p-6 rounded-2xl border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${subscription ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>
                    {subscription ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                </div>
                <div>
                    <h3 className="font-bold">Notificações no Navegador</h3>
                    <p className="text-sm text-muted-foreground">
                        {subscription ? "Você está recebendo alertas diretos." : "Ative para receber alertas de vendas e tarefas."}
                    </p>
                </div>
            </div>

            <button
                onClick={subscription ? unsubscribeFromPush : subscribeToPush}
                disabled={loading}
                className={`px-6 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${subscription
                    ? 'bg-white/5 hover:bg-white/10 text-white'
                    : 'bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    }`}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : subscription ? (
                    "Desativar"
                ) : (
                    "Ativar Alertas"
                )}
            </button>

            {subscription && (
                <button
                    onClick={testNotification}
                    disabled={testing}
                    className="px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm"
                >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Testar"}
                </button>
            )}
        </div>
    );
}
