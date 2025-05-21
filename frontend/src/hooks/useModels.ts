import { useState, useEffect } from 'react';
import { ModelInfo } from '../types';
import { getAvailableModels } from '../services/api';

export const useModels = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAvailableModels();
      setModels(data);
    } catch (err) {
      setError('Failed to load models');
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return { models, loading, error, refreshModels: fetchModels };
};