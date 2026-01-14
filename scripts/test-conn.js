/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing connectivity to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    try {
        console.log('Attempting to sign in...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'kaitoluismiropo@gmail.com',
            password: 'AVEmaria12',
        });

        if (error) {
            console.error('Auth Error:', error.message);
            console.error('Full Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('Success! User ID:', data.user.id);
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

test();
