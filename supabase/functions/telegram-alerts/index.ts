import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

Deno.serve(async (_req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
        const chatId = Deno.env.get('TELEGRAM_CHAT_ID')

        if (!botToken || !chatId) {
            throw new Error('Missing Telegram configuration')
        }

        // 1. Check for pending mandatory tasks for today
        const today = new Date().toISOString().split('T')[0]
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('due_date', today)
            .eq('is_mandatory', true)
            .eq('is_completed', false)

        if (tasksError) throw tasksError

        if (tasks && tasks.length > 0) {
            const taskList = tasks.map((t: any) => `• ${t.title}`).join('\n')
            const message = `⚠️ *Atenção Kaito!*\n\nVocê tem ${tasks.length} tarefas obrigatórias pendentes para hoje:\n\n${taskList}\n\n_Não deixe para depois!_`

            // Send Telegram message
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            })

            // Also trigger a push notification via the other function
            // We use the internal URL if possible, or the public one
            const projectUrl = Deno.env.get('SUPABASE_URL') ?? ''
            const functionUrl = `${projectUrl}/functions/v1/send-notification`

            // Get the user ID from the first task (assuming all tasks belong to the same user for now)
            const userId = tasks[0].user_id

            await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                },
                body: JSON.stringify({
                    userId: userId,
                    title: '⚠️ Tarefas Pendentes',
                    body: `Você tem ${tasks.length} tarefas obrigatórias para hoje!`,
                    url: '/tarefas'
                })
            })

            return new Response(JSON.stringify({ success: true, tasks_count: tasks.length }), {
                headers: { 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify({ success: true, message: 'No pending mandatory tasks' }), {
            headers: { 'Content-Type': 'application/json' },
        })

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
