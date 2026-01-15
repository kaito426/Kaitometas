const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPush() {
    console.log('Testing push notification...');

    // Get a user ID from push_subscriptions
    const { data: subs, error: subError } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .limit(1);

    if (subError || !subs || subs.length === 0) {
        console.error('No subscriptions found in DB.');
        return;
    }

    const userId = subs[0].user_id;
    console.log(`Sending test notification to user: ${userId}`);

    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
            userId: userId,
            title: '🚨 Teste Manual!',
            body: 'Este é um teste disparado via script.',
            url: '/configuracoes'
        })
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
}

testPush();
