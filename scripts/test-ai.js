/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAi() {
    console.log('Testing AI Coach function...');

    try {
        const { data: { session } } = await supabase.auth.signInWithPassword({
            email: 'kaitoluismiropo@gmail.com',
            password: 'AVEmaria12'
        });

        if (!session) {
            console.error('Failed to login');
            return;
        }

        console.log('Logged in. Calling function...');

        const response = await fetch(`${supabaseUrl}/functions/v1/ai-coach`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                type: 'war_mode',
                customPrompt: 'Teste de conexão. Responda "OK" se estiver ouvindo.'
            })
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', data);

    } catch (error) {
        console.error('Test Error:', error);
    }
}

testAi();
