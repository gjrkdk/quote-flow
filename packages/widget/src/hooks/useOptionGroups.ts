import { useState, useEffect } from 'react';
import type { OptionGroup, OptionGroupsApiResponse } from '../types';

interface UseOptionGroupsOptions {
  apiUrl: string;
  apiKey: string;
  productId: string;
}

interface UseOptionGroupsReturn {
  groups: OptionGroup[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches option groups for a product on mount.
 *
 * - Fetches from GET /api/v1/products/:productId/options
 * - Uses X-API-Key header for authentication
 * - On 404 or network error: sets groups to empty array (product has no options)
 * - On other errors: sets error message
 * - Uses AbortController for cleanup on unmount
 */
export function useOptionGroups(
  options: UseOptionGroupsOptions
): UseOptionGroupsReturn {
  const { apiUrl, apiKey, productId } = options;

  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchOptionGroups = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `${apiUrl}/api/v1/products/${productId}/options`;

        const response = await fetch(url, {
          headers: {
            'X-API-Key': apiKey,
          },
          signal: abortController.signal,
        });

        // 404 or product has no options - not an error, just empty state
        if (response.status === 404) {
          setGroups([]);
          setError(null);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          // Handle RFC 7807 error response
          if (response.status === 401) {
            setError('Authentication failed');
          } else {
            try {
              const errorData = await response.json();
              setError(errorData.detail || 'Failed to fetch option groups');
            } catch {
              setError('Failed to fetch option groups');
            }
          }
          setGroups([]);
          setLoading(false);
          return;
        }

        const data: OptionGroupsApiResponse = await response.json();
        setGroups(data.optionGroups);
        setError(null);
        setLoading(false);
      } catch (err) {
        // Ignore AbortError (happens when request is cancelled)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        // Network error - treat as empty state (product might have no options)
        setGroups([]);
        setError(null);
        setLoading(false);
      }
    };

    fetchOptionGroups();

    // Cleanup: abort in-flight request on unmount
    return () => {
      abortController.abort();
    };
  }, [apiUrl, apiKey, productId]);

  return {
    groups,
    loading,
    error,
  };
}
