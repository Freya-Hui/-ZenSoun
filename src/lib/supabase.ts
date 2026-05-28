import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
    }
  }
  return supabaseInstance;
}

// Interfaces matching database structures
export interface BookAnswer {
  id?: number;
  quote: string;
  category?: string;
  created_at?: string;
}

export interface CloudDiary {
  id?: string;
  user_id?: string;
  date: string;
  mood: string;
  note: string;
  answer_quote?: string;
  rating?: number;
  created_at?: string;
}

/**
 * Fetch quotes dynamically from Supabase
 * Falls back to local list if Supabase is not configured or fails
 */
export async function fetchAnswerQuotes(): Promise<string[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('book_quotes')
      .select('quote')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching Supabase book_quotes:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((item: any) => item.quote);
    }
  } catch (err) {
    console.error('Supabase request exception:', err);
  }
  return null;
}

/**
 * Add a new quote to the Supabase library
 */
export async function addAnswerQuote(quote: string, category: string = 'general'): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('book_quotes')
      .insert([{ quote, category }]);

    if (error) {
      console.error('Error inserting quote to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception adding quote:', err);
    return false;
  }
}
