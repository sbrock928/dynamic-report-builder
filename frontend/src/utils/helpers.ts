import { UDF } from '../types';

/**
 * Filters UDFs by aggregation level
 * @param udfs List of all UDFs
 * @param aggregationLevel The aggregation level to filter by
 * @returns Filtered list of UDFs
 */
export const filterUdfsByAggregationLevel = (
  udfs: UDF[], 
  aggregationLevel: string | null
): UDF[] => {
  if (!aggregationLevel) return [];
  return udfs.filter(udf => udf.aggregation_level === aggregationLevel);
};

/**
 * Exports report data to CSV format
 * @param data The report data
 * @param fields The fields to include
 * @param fileName The file name to save as
 */
export const exportToCsv = (
  data: Record<string, any>[], 
  fields: string[], 
  fileName: string
): void => {
  if (data.length === 0 || fields.length === 0) {
    console.error('No data or fields to export');
    return;
  }

  // Create CSV content
  const header = fields.join(',');
  const rows = data.map((row) => {
    return fields
      .map((field) => {
        const value = row[field];
        return typeof value === 'string' ? `"${value}"` : value;
      })
      .join(',');
  });
  const csvContent = `${header}\n${rows.join('\n')}`;

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Creates a safe filename from a given string
 * @param name The name to sanitize
 * @returns A safe filename
 */
export const createSafeFileName = (name: string): string => {
  return name.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
};