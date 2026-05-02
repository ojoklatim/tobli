import { createClient } from '@insforge/sdk';

const baseUrl = (import.meta.env.VITE_INSFORGE_URL || '').replace(/\/+$/, '');

export const insforge = createClient({
  baseUrl,
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
});
