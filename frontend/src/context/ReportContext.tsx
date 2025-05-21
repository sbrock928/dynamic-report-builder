import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ReportLayout } from '../types';
import { getReportLayouts } from '../services/api';

interface ReportContextType {
  reports: ReportLayout[];
  loading: boolean;
  error: string | null;
  refreshReports: () => Promise<void>;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<ReportLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReportLayouts();
      setReports(data);
    } catch (err) {
      setError('Failed to load reports');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshReports();
  }, []);

  return (
    <ReportContext.Provider value={{ reports, loading, error, refreshReports }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = (): ReportContextType => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};