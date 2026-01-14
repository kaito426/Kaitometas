import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Webhook Error: Missing environment variables');
        return NextResponse.json({ success: false, error: 'Configuração do servidor incompleta (Env Vars)' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = {};
    let rawText = '';

    try {
        rawText = await req.text();

        // Log the raw request immediately for debugging
        await supabase.from('webhook_logs').insert([
            {
                payload: { rawText },
                headers: Object.fromEntries(req.headers.entries()),
                path: '/api/webhooks/lojou/raw'
            }
        ]);

        try {
            body = JSON.parse(rawText);
        } catch (e) {
            console.error('Failed to parse JSON:', rawText, e);
            return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
        }

        // Log the parsed body
        await supabase.from('webhook_logs').insert([
            {
                payload: body,
                headers: Object.fromEntries(req.headers.entries()),
                path: '/api/webhooks/lojou/parsed'
            }
        ]);

        // Lojou Webhook Fields
        const {
            status,
            amount,
            product,
            customer,
            order_number,
            transaction_id
        } = body;

        // MANDATORY: Only process approved sales
        // Extended list of potential success statuses from various payment platforms
        const successStatuses = [
            'approved', 'paid', 'completed', 'finalized',
            'success', 'confirmed', 'complete', 'processed',
            'settled', 'captured', 'accepted'
        ];
        const isApproved = successStatuses.includes(status?.toLowerCase?.() || '');

        if (isApproved) {
            // MANDATORY: Deduplication using order_number or transaction_id
            const externalId = order_number || transaction_id;

            if (externalId) {
                const { data: existing } = await supabase
                    .from('sales')
                    .select('id')
                    .eq('external_id', externalId)
                    .single();

                if (existing) {
                    return NextResponse.json({ success: true, message: 'Venda já registrada (duplicada)' });
                }
            }

            // Get the main user ID (Kaito)
            const { data: goalData } = await supabase
                .from('goals')
                .select('user_id')
                .eq('type', 'annual')
                .single();

            const userId = goalData?.user_id || 'a424fb0a-95a8-4c17-9d22-f40f23c2dee4';

            const { error } = await supabase.from('sales').insert([
                {
                    amount: Number(amount),
                    origin: 'Lojou',
                    description: `Venda Lojou: ${product?.name || 'Produto'} (${customer?.email || 'Cliente'})`,
                    sale_date: new Date().toISOString(),
                    external_id: externalId,
                    user_id: userId
                },
            ]);

            if (error) throw error;

            // Award XP for sale (200 XP)
            await supabase.rpc('award_xp', {
                target_user_id: userId,
                xp_amount: 200
            });

            // Trigger Web Push Notification
            try {
                if (userId) {
                    await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseServiceKey}`
                        },
                        body: JSON.stringify({
                            userId: userId,
                            title: '💰 Venda Registrada!',
                            body: `Valor: ${amount} MZN - ${product?.name || 'Produto'}`,
                            url: '/vendas'
                        })
                    });
                }
            } catch (notifyError) {
                console.error('Failed to send push notification:', notifyError);
            }

            return NextResponse.json({ success: true, message: 'Venda registrada com sucesso' });
        }

        return NextResponse.json({ success: true, message: `Status ignorado: ${status}` });
    } catch (error: unknown) {
        console.error('Webhook Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Log error even if processing fails
        await supabase.from('webhook_logs').insert([
            {
                payload: { error: errorMessage, rawBody: body },
                headers: Object.fromEntries(req.headers.entries()),
                path: '/api/webhooks/lojou/error'
            }
        ]);

        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
