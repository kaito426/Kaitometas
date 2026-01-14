/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    const email = 'kaitoluismiropo@gmail.com';
    const password = 'AVEmaria12';

    console.log(`Attempting to create/update user: ${email}`);

    // 1. Delete existing user to start clean
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const existingUser = users.users.find(u => u.email === email);
    if (existingUser) {
        console.log('Deleting existing user...');
        await supabase.auth.admin.deleteUser(existingUser.id);
    }

    // 2. Create user via Admin API (this handles all internal tables correctly)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (createError) {
        console.error('Error creating user:', createError);
        return;
    }

    const userId = newUser.user.id;
    console.log(`User created successfully! ID: ${userId}`);

    // 3. Link data
    console.log('Linking data to new user ID...');
    await supabase.from('goals').update({ user_id: userId }).is('user_id', null);
    await supabase.from('sales').update({ user_id: userId }).is('user_id', null);
    await supabase.from('expenses').update({ user_id: userId }).is('user_id', null);
    await supabase.from('tasks').update({ user_id: userId }).is('user_id', null);

    // Also update any that might have the OLD ID if it changed
    await supabase.from('goals').update({ user_id: userId }).neq('user_id', userId);
    await supabase.from('sales').update({ user_id: userId }).neq('user_id', userId);
    await supabase.from('expenses').update({ user_id: userId }).neq('user_id', userId);
    await supabase.from('tasks').update({ user_id: userId }).neq('user_id', userId);

    console.log('Done!');
}

run();
