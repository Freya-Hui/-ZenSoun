import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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

/**
 * Fetch writing prompts dynamically from Supabase
 */
export async function fetchDiaryPrompts(): Promise<string[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('diary_prompts')
      .select('prompt')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching Supabase diary_prompts:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((item: any) => item.prompt);
    }
  } catch (err) {
    console.error('Supabase query prompts exception:', err);
  }
  return null;
}

/**
 * Add a new writing prompt to Supabase
 */
export async function addDiaryPrompt(prompt: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('diary_prompts')
      .insert([{ prompt }]);

    if (error) {
      console.error('Error inserting prompt to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception adding prompt:', err);
    return false;
  }
}

export interface MuyuPreset {
  id?: number;
  theme_name: string;
  base_word: string;
  floatings: string[];
  created_at?: string;
}

/**
 * Fetch Custom Wooden Fish (muyu) corpora from Supabase
 */
export async function fetchMuyuPresets(): Promise<MuyuPreset[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('muyu_presets')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      if (error.message && error.message.includes('Could not find the table')) {
        console.warn('Supabase muyu_presets table not created yet. Local offline presets will be used as fallback.');
      } else {
        console.error('Error fetching Supabase muyu_presets:', error.message);
      }
      return null;
    }

    return data as MuyuPreset[];
  } catch (err) {
    console.error('Exception fetching muyu_presets:', err);
  }
  return null;
}

/**
 * Add a custom Wooden Fish preset to Supabase
 */
export async function addMuyuPreset(preset: MuyuPreset): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('muyu_presets')
      .insert([{
        theme_name: preset.theme_name,
        base_word: preset.base_word,
        floatings: preset.floatings
      }]);

    if (error) {
      if (error.message && error.message.includes('Could not find the table')) {
        console.warn('Supabase muyu_presets table not created yet. Cannot save custom preset to cloud.');
      } else {
        console.error('Error inserting muyu_preset to Supabase:', error.message);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception adding muyu_preset:', err);
    return false;
  }
}


