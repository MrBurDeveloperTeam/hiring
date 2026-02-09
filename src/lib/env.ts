/// <reference types="vite/client" />

const requiredEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export const env = {
  supabaseUrl: requiredEnv('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: requiredEnv('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
};
