import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
    try {
        const body = await req.json();

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
        if (status === 'approved' || status === 'paid') {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

            const { error } = await supabase.from('sales').insert([
                {
                    amount: Number(amount),
                    origin: 'Lojou',
                    description: `Venda Lojou: ${product?.name || 'Produto'} (${customer?.email || 'Cliente'})`,
                    sale_date: new Date().toISOString(),
                    external_id: externalId,
                },
            ]);

            if (error) throw error;

            // Trigger Web Push Notification
            try {
                const { data: goalData } = await supabase
                    .from('goals')
                    .select('user_id')
                    .eq('type', 'annual')
                    .single();

                if (goalData?.user_id) {
                    await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseServiceKey}`
                        },
                        body: JSON.stringify({
                            userId: goalData.user_id,
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

        return NextResponse.json({ success: true, message: 'Status ignorado' });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
