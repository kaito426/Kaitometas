// Using native fetch (Node.js 18+)

// Test locally first, then we can test production URL if needed
const url = 'http://localhost:3000/api/webhooks/lojou';

const payload = {
    status: 'approved',
    amount: '1500.00',
    product: { name: 'Produto de Teste Kaito' },
    customer: { email: 'kaito@teste.com' },
    order_number: 'KAITO-' + Date.now(),
    transaction_id: 'TRX-' + Date.now()
};

async function test() {
    console.log('--- Testando Webhook Lojou (Kaito Metas) ---');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log('Status:', res.status);
        try {
            const data = JSON.parse(text);
            console.log('Resposta JSON:', data);
        } catch (e) {
            console.log('Resposta (não JSON):', text);
        }
    } catch (err) {
        console.error('Erro na requisição:', err.message);
        if (err.message.includes('ECONNREFUSED')) {
            console.log('\n[DICA] O servidor local (npm run dev) está rodando?');
        }
    }
}

test();
