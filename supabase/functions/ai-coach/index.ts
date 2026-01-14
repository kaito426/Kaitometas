import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

        // Check for available keys
        const openAiKey = Deno.env.get('OPENAI_API_KEY')
        const deepSeekKey = Deno.env.get('DEEPSEEK_API_KEY')

        if (!openAiKey && !deepSeekKey) {
            throw new Error('Missing AI API Key (OPENAI_API_KEY or DEEPSEEK_API_KEY)')
        }

        let systemPrompt = ""
        let userPrompt = ""

        if (type === 'war_mode') {
            systemPrompt = "Você é o Kaito Strategist, um estrategista de negócios agressivo, focado em resultados, disciplina militar e execução implacável. Você não dá conselhos genéricos. Você dá ordens de batalha. Seu tom é direto, motivador e sério. Você ajuda o usuário a atingir a meta de 1.000.000 MZN. Responda em markdown."
            userPrompt = customPrompt || "Me dê um relatório de situação."
        } else if (type === 'coach') {
            systemPrompt = "Você é um coach de alta performance. Dê um insight curto, provocativo e poderoso sobre como melhorar a produtividade, vendas e disciplina. Seja breve (máximo 2 frases)."
            userPrompt = "Analise meu desempenho atual e me dê um insight."
        } else if (type === 'financial') {
            systemPrompt = "Você é um analista financeiro implacável. Seu objetivo é encontrar desperdícios. Dê uma dica curta e direta sobre como cortar gastos desnecessários e aumentar a margem de lucro. Seja breve."
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
