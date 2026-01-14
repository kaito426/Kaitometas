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
        const { title, body, url, userId, tag } = await req.json()

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Always store notification in DB for the bell icon
        await supabase.from('notifications').insert([{
            user_id: userId,
            title,
            body,
            url,
            is_read: false
        }]);

        // 2. Get user's push subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .eq('user_id', userId)

        if (error) throw error

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                message: 'Notification stored in DB, but no push subscriptions found'
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
        const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'mailto:admin@example.com';

        if (!vapidPublicKey || !vapidPrivateKey) {
            return new Response(JSON.stringify({
                success: true,
                warning: 'Notification stored in DB, but VAPID keys not configured for push'
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Configure web-push
        webpush.setVapidDetails(
            adminEmail,
            vapidPublicKey,
            vapidPrivateKey
        );

        const results: Array<{ endpoint?: string; status?: number; error?: string }> = [];

        for (const sub of subscriptions) {
            try {
                const subscription = JSON.parse(sub.subscription);

                // Create the payload
                const payload = JSON.stringify({
                    title,
                    body,
                    url,
                    tag: tag || 'kaito-sale-' + Date.now()
                });

                // Send notification using web-push library (handles encryption)
                await webpush.sendNotification(subscription, payload);

                results.push({
                    endpoint: subscription.endpoint.substring(0, 60) + '...',
                    status: 201
                });

            } catch (err: any) {
                console.error('Push Error:', err);

                // Check for expired subscription (410 Gone or 404 Not Found)
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('subscription', sub.subscription);
                }

                results.push({ error: err.message || 'Unknown push error' });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Notification stored and push attempted',
            results
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
