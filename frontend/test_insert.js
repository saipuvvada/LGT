import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yioaurhictrbynmsjmbp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpb2F1cmhpY3RyYnlubXNqbWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MzI3ODUsImV4cCI6MjA5NTIwODc4NX0.9hgo6Ggmy8LZPJ_0TIdUyO_DdFEdmQR3uc3S7rUNwmw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await supabase
      .from('sales_persons')
      .insert([{
        sales_person_id: 'SP_TEST',
        name: 'Test Agent',
        phone: '1234567890',
        referral_code: 'TEST_REF',
        commission_earned: 0.00
      }])
      .select();

    if (error) {
      console.error('Error inserting:', error);
    } else {
      console.log('Success! Inserted:', data);
    }
  } catch (err) {
    console.error('Catch block error:', err);
  }
}

test();
