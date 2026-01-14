import { NextResponse } from 'next/server';

// GET endpoint for diagnostics - helps verify webhook is accessible
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Webhook Lojou está acessível',
        timestamp: new Date().toISOString(),
        accepted_statuses: [
            'approved', 'paid', 'completed', 'finalized',
            'success', 'confirmed', 'complete', 'processed',
            'settled', 'captured', 'accepted'
        ],
        expected_payload: {
            status: 'approved',
            amount: 'number',
            product: { name: 'string' },
            customer: { email: 'string' },
            order_number: 'string (optional)',
            transaction_id: 'string (optional)'
        }
    });
}
