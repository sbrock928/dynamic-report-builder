import { useState, useEffect } from 'react';
import { getCycleCodes } from '../services/api';

export const useCycleCodes = () => {
  const [cycleCodes, setCycleCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCycleCodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCycleCodes();
      setCycleCodes(data);
    } catch (err) {
      setError('Failed to load cycle codes');
      console.error('Error loading cycle codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycleCodes();
  }, []);

  return { cycleCodes, loading, error, refreshCycleCodes: fetchCycleCodes };
};