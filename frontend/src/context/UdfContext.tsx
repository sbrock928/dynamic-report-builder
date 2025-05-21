import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UDF } from '../types';
import { getUdfs } from '../services/api';

interface UdfContextType {
  udfs: UDF[];
  loading: boolean;
  error: string | null;
  refreshUdfs: () => Promise<void>;
}

const UdfContext = createContext<UdfContextType | undefined>(undefined);

export const UdfProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [udfs, setUdfs] = useState<UDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUdfs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUdfs();
      setUdfs(data);
    } catch (err) {
      setError('Failed to load UDFs');
      console.error('Error loading UDFs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUdfs();
  }, []);

  return (
    <UdfContext.Provider value={{ udfs, loading, error, refreshUdfs }}>
      {children}
    </UdfContext.Provider>
  );
};

export const useUdfs = (): UdfContextType => {
  const context = useContext(UdfContext);
  if (context === undefined) {
    throw new Error('useUdfs must be used within a UdfProvider');
  }
  return context;
};