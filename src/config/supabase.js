// Central place to initialize the Supabase client.
// Reads URL and API key from env. Keep the key server-side only.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.warn('Supabase credentials are not set. Set SUPABASE_URL and SUPABASE_KEY.');
}

// Create the client used across controllers/services
export const supabase = createClient(url || '', key || '');

// Table name kept in env for flexibility, default to the schema.sql table
export const TABLE = process.env.SUPABASE_TABLE || 'websites';
