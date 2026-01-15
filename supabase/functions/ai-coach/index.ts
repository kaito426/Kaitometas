import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { type, customPrompt, objectiveName } = await req.json()

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch Real-time Data
        const [
            { data: sales },
            { data: goals },
            { data: tasks },
            { data: expenses }
        ] = await Promise.all([
            supabase.from('sales').select('amount, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
            supabase.from('goals').select('title, target_amount, current_amount, type').eq('status', 'active'),
            supabase.from('tasks').select('title, priority, due_date').eq('completed', false),
            supabase.from('expenses').select('amount, category, description').gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        ]);

        // Calculate Totals
        const totalSales = sales?.reduce((sum, sale) => sum + Number(sale.amount), 0) || 0;
        const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
        const profit = totalSales - totalExpenses;
        const pendingTasksCount = tasks?.length || 0;
        const highPriorityTasks = tasks?.filter(t => t.priority === 'high').map(t => t.title).join(', ') || 'Nenhuma';

        // Context String
        const context = `
        DADOS EM TEMPO REAL DO USUÁRIO:
        - Vendas (30 dias): ${totalSales.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
        - Gastos (30 dias): ${totalExpenses.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
        - Lucro Líquido: ${profit.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
        - Tarefas Pendentes: ${pendingTasksCount} (Alta Prioridade: ${highPriorityTasks})
        - Metas Ativas: ${goals?.map(g => `${g.title} (${g.current_amount}/${g.target_amount})`).join('; ')}
        `;

        // Check for available keys
        const openAiKey = Deno.env.get('OPENAI_API_KEY')
        const deepSeekKey = Deno.env.get('DEEPSEEK_API_KEY')

        if (!openAiKey && !deepSeekKey) {
            throw new Error('Missing AI API Key (OPENAI_API_KEY or DEEPSEEK_API_KEY)')
        }

        let systemPrompt = ""
        let userPrompt = ""

        if (type === 'war_mode') {
            systemPrompt = `Você é o Kaito Strategist, um estrategista de negócios agressivo. USE OS DADOS ABAIXO PARA DAR ORDENS ESPECÍFICAS.
            ${context}
            Seu tom é direto, motivador e sério. Ajude o usuário a atingir a meta de 1.000.000 MZN. Responda em markdown.`
            userPrompt = customPrompt || "Me dê um relatório de situação baseado nos meus números."
        } else if (type === 'coach') {
            systemPrompt = `Você é um coach de alta performance. USE OS DADOS ABAIXO.
            ${context}
            Dê um insight curto e poderoso sobre os números atuais. Se o lucro estiver baixo, critique. Se tiver muitas tarefas, mande executar. Seja breve (máximo 3 frases).`
            userPrompt = "Analise meu desempenho atual e me dê um insight."
        } else if (type === 'financial') {
            systemPrompt = `Você é um analista financeiro implacável. USE OS DADOS:
            ${context}
            Encontre desperdícios ou sugira melhorias na margem. Seja breve.`
            userPrompt = "Analise meus gastos e encontre vazamentos."
        } else if (type === 'task_breakdown') {
            systemPrompt = "Você é um gerente de projetos experiente. Quebre o objetivo do usuário em 3 a 5 tarefas práticas e acionáveis. Retorne APENAS um JSON array de objetos com a propriedade 'title'. Exemplo: [{\"title\": \"Pesquisar fornecedores\"}, {\"title\": \"Criar conta no Instagram\"}]. Não use markdown, apenas o JSON cru."
            userPrompt = `O objetivo é: ${objectiveName}`
        } else {
            throw new Error('Invalid type')
        }

        // Determine provider
        const useDeepSeek = !!deepSeekKey;
        const apiUrl = useDeepSeek ? 'https://api.deepseek.com/chat/completions' : 'https://api.openai.com/v1/chat/completions'
        const apiKey = useDeepSeek ? deepSeekKey : openAiKey
        const model = useDeepSeek ? 'deepseek-chat' : 'gpt-4o'

        console.log(`Using ${useDeepSeek ? 'DeepSeek' : 'OpenAI'} for type: ${type}`)

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        })

        const data = await response.json()

        if (data.error) {
            throw new Error(data.error.message || 'AI API Error')
        }

        const content = data.choices?.[0]?.message?.content

        if (!content) {
            throw new Error('No content received from AI')
        }

        return new Response(JSON.stringify({ content }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('AI Coach Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
