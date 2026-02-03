import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function NetworkErrorExample() {
  const { handleError, withErrorHandling, retry } = useErrorHandler();
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const fetchDataWithBasicErrorHandling = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) throw new Error('Network request failed');
      const result = await response.json();
      setData(result);
    } catch (error) {
      handleError(error, 'Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchDataWithWrapper = async () => {
    setLoading(true);
    const result = await withErrorHandling(async () => {
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) throw new Error('Network request failed');
      return response.json();
    }, 'Échec du chargement des données');

    if (result) {
      setData(result);
    }
    setLoading(false);
  };

  const fetchDataWithRetry = async () => {
    setLoading(true);
    try {
      const result = await retry(
        async () => {
          const response = await fetch('https://api.example.com/data');
          if (!response.ok) throw new Error('Network request failed');
          return response.json();
        },
        {
          maxRetries: 3,
          delay: 1000,
          backoff: true,
        }
      );
      setData(result);
    } catch (error) {
      handleError(error, 'Échec après plusieurs tentatives');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Network Error Handling Examples</h2>

      <div className="space-x-2">
        <Button onClick={fetchDataWithBasicErrorHandling} disabled={loading}>
          Fetch with Basic Error Handling
        </Button>

        <Button onClick={fetchDataWithWrapper} disabled={loading}>
          Fetch with Wrapper
        </Button>

        <Button onClick={fetchDataWithRetry} disabled={loading}>
          Fetch with Retry (3x)
        </Button>
      </div>

      {loading && <p>Loading...</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
