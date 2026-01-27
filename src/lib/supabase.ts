import { createClient } from '@supabase/supabase-js';

// PASTE YOUR ACTUAL STRINGS HERE TEMPORARILY
const supabaseUrl = 'https://hwpgvracsvwnspvvtmhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cGd2cmFjc3Z3bnNwdnZ0bWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzM0MjAsImV4cCI6MjA4NTAwOTQyMH0.PUZwqnRWeuToh7uzVgPbwZFL9DmucHPkUkQbz3Lu0eU'; // Replace with your actual key


// DEBUG LOGS - Check your terminal after saving


console.log("--- Supabase Config Check ---");
console.log("URL Found:", !!supabaseUrl); 
console.log("Key Found:", !!supabaseAnonKey);
console.log("-----------------------------");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ MISSING SUPABASE ENVS: Check your .env.local file!");
}
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are missing!");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);