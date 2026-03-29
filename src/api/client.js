import { supabase } from '../lib/supabase';

export const apiClient = {
  entities: {
    Room: {
      list: async () => {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) return [];

        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      },

      create: async (/** @type {{ name: string; description: string; language: string }} */ room) => {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error('Trebuie să fii logat.');

        const { data, error } = await supabase
          .from('rooms')
          .insert({
            owner_id: user.id,
            name: room.name,
            description: room.description || '',
            language: room.language || 'javascript',
            status: 'idle',
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      },

      delete: async (/** @type {string} */ id) => {
        const { error } = await supabase
          .from('rooms')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      },
    },
  },
};