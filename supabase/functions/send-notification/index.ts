import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import * as webpush from 'https://esm.sh/web-push@3.6.7'

Deno.serve(async (req) => {
    try {
        const { title, body, url, userId } = await req.json()

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get user's push subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .eq('user_id', userId)

        if (error) throw error

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: 'No subscriptions found' }), { status: 200 })
        }

        webpush.setVapidDetails(
            'mailto:example@yourdomain.com',
            Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
            Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
        )

        const notifications = subscriptions.map((sub) => {
            return webpush.sendNotification(
                JSON.parse(sub.subscription),
                JSON.stringify({ title, body, url })
            ).catch(err => {
                console.error('Error sending notification:', err)
                // Optionally remove invalid subscription from DB
            })
        })

        await Promise.all(notifications)

        return new Response(JSON.stringify({ success: true }), { status: 200 })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
