import { useState } from 'react';
import { ReportDataRequest, ReportDataResponse } from '../types';
import { runReport } from '../services/api';

interface UseReportDataReturn {
  reportData: Record<string, any>[];
  isLoading: boolean;
  error: string | null;
  executeReport: (request: ReportDataRequest) => Promise<void>;
}

export const useReportData = (): UseReportDataReturn => {
  const [reportData, setReportData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeReport = async (request: ReportDataRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await runReport(request);
      setReportData(result.data);
    } catch (err) {
      console.error('Failed to run report:', err);
      setError('Failed to run report');
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reportData,
    isLoading,
    error,
    executeReport
  };
};