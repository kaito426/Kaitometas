import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

Deno.serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
        const chatId = Deno.env.get('TELEGRAM_CHAT_ID')

        if (!botToken || !chatId) {
            return new Response(JSON.stringify({ error: 'Telegram credentials missing' }), { status: 400 })
        }

        // Get mandatory tasks not completed for today
        const today = new Date().toISOString().split('T')[0]
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('title')
            .eq('due_date', today)
            .eq('is_mandatory', true)
            .eq('is_completed', false)

        if (error) throw error

        if (tasks && tasks.length > 0) {
            const taskList = tasks.map(t => `• ${t.title}`).join('\n')
            const message = `🚨 *KAITO VISION - ALERTA DE DISCIPLINA*\n\nVocê tem tarefas obrigatórias pendentes para hoje:\n\n${taskList}\n\nNão falhe com a sua visão! 👊`

            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            })

            const result = await response.json()

            // Trigger Web Push Notification
            try {
                const { data: goalData } = await supabase
                    .from('goals')
                    .select('user_id')
                    .eq('type', 'annual')
                    .single();

                if (goalData?.user_id) {
                    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                        },
                        body: JSON.stringify({
                            userId: goalData.user_id,
                            title: '⏰ Tarefa Pendente!',
                            body: `Você tem ${tasks.length} tarefas obrigatórias pendentes para hoje.`,
                            url: '/tarefas'
                        })
                    });
                }
            } catch (notifyError) {
                console.error('Failed to send push notification:', notifyError);
            }

            return new Response(JSON.stringify({ success: true, result }), { status: 200 })
        }

        return new Response(JSON.stringify({ success: true, message: 'No pending mandatory tasks' }), { status: 200 })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
