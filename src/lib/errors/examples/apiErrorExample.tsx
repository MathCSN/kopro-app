import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ApiClient } from '@/lib/errors/apiErrorHandler';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const apiClient = new ApiClient('https://api.example.com', {
  timeout: 10000,
  retries: 2,
  retryDelay: 1000,
});

export function APIErrorExample() {
  const { handleError } = useErrorHandler();
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const fetchWithApiClient = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get('/users');
      setData(result);
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const createWithApiClient = async () => {
    setLoading(true);
    try {
      const result = await apiClient.post('/users', {
        name: 'John Doe',
        email: 'john@example.com',
      });
      setData(result);
    } catch (error) {
      handleError(error, 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const fetchFromSupabase = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);

      if (error) throw error;
      setData(profiles);
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des profils');
    } finally {
      setLoading(false);
    }
  };

  const updateSupabaseWithError = async () => {
    setLoading(true);
    try {
      const { data: updated, error } = await supabase
        .from('profiles')
        .update({ first_name: 'Updated' })
        .eq('id', 'non-existent-id')
        .select()
        .single();

      if (error) throw error;
      setData(updated);
    } catch (error) {
      handleError(error, 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">API Error Handling Examples</h2>

      <div className="space-x-2 space-y-2">
        <Button onClick={fetchWithApiClient} disabled={loading}>
          GET Request
        </Button>

        <Button onClick={createWithApiClient} disabled={loading}>
          POST Request
        </Button>

        <Button onClick={fetchFromSupabase} disabled={loading}>
          Supabase Query
        </Button>

        <Button onClick={updateSupabaseWithError} disabled={loading}>
          Supabase Error (404)
        </Button>
      </div>

      {loading && <p>Loading...</p>}
      {data && (
        <pre className="bg-muted p-4 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
