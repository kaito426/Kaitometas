import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get all unique users who have push subscriptions
        const { data: subscriptions, error: subError } = await supabase
            .from('push_subscriptions')
            .select('user_id, subscription');

        if (subError) throw subError;

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: 'No subscriptions found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Group subscriptions by user_id
        const users = subscriptions.reduce((acc, sub) => {
            if (!acc[sub.user_id]) acc[sub.user_id] = [];
            acc[sub.user_id].push(sub.subscription);
            return acc;
        }, {} as Record<string, string[]>);

        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
        const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'mailto:admin@example.com';

        if (vapidPublicKey && vapidPrivateKey) {
            webpush.setVapidDetails(adminEmail, vapidPublicKey, vapidPrivateKey);
        }

        const results = [];

        // 2. Process each user
        for (const userId of Object.keys(users)) {
            // Get pending tasks count
            const { count } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('completed', false);

            const pendingCount = count || 0;
            let title = "Kaito Vision";
            let body = "Hora de focar nos seus objetivos!";

            // Simple logic for motivation (can be replaced with AI later if needed)
            if (pendingCount > 0) {
                title = `🔥 ${pendingCount} Tarefas Pendentes`;
                const messages = [
                    "A disciplina é a ponte entre metas e realizações.",
                    "Não pare até se orgulhar.",
                    "O sucesso é a soma de pequenos esforços repetidos.",
                    "Seu futuro é criado pelo que você faz hoje.",
                    "Foco total! Vamos zerar essas tarefas."
                ];
                body = messages[Math.floor(Math.random() * messages.length)];
            } else {
                title = "✨ Tudo em dia!";
                body = "Ótimo trabalho! Aproveite para revisar suas metas de longo prazo.";
            }

            // Send to all user's devices
            for (const subStr of users[userId]) {
                try {
                    const subscription = JSON.parse(subStr);
                    const payload = JSON.stringify({
                        title,
                        body,
                        url: '/tarefas',
                        tag: 'scheduled-reminder'
                    });

                    await webpush.sendNotification(subscription, payload);
                    results.push({ userId, status: 'sent' });
                } catch (err: any) {
                    console.error(`Failed to send to user ${userId}:`, err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Cleanup invalid subscription logic here if needed
                    }
                }
            }
        }

        return new Response(JSON.stringify({ success: true, processed: results.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Scheduled Reminder Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
})
