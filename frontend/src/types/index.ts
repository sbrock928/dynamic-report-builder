// frontend/src/types/index.ts
export type AggregationLevel = 'deal' | 'group' | 'tranche';

export interface UDFField {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  source_field?: string;
  calculation_type?: string;
  calculation_params?: Record<string, any>;
  format?: string;
  default?: any;
  enum_values?: any[];
}

export interface UDF {
  id: number;
  name: string;
  description?: string;
  base_model: string;
  aggregation_level: AggregationLevel;
  fields: UDFField[];
  schema_json: Record<string, any>;  // Keeping this as schema_json for now
}

export interface UDFCreate {
  name: string;
  description?: string;
  base_model: string;
  aggregation_level: AggregationLevel;
  fields: UDFField[];
}

export interface ReportLayout {
  id: number;
  name: string;
  description?: string;
  primary_model: string;
  aggregation_level: AggregationLevel;
  udf_ids: number[];  // Changed from schema_ids to udf_ids
  layout_json: Record<string, any>;
}

export interface ReportLayoutCreate {
  name: string;
  description?: string;
  primary_model: string;
  aggregation_level: AggregationLevel;
  udf_ids: number[];  // Changed from schema_ids to udf_ids
  layout_json: Record<string, any>;
}

export interface ReportDataRequest {
  report_id: number;
  cycle_code: string;
  filters?: Record<string, any>;
}

export interface ReportDataResponse {
  report_name: string;
  cycle_code: string;
  data: Record<string, any>[];
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

export interface ModelField {
  name: string;
  type: string;
  primary_key: boolean;
  nullable: boolean;
  foreign_key: boolean;
}

export type CalculationType = 'sum' | 'average' | 'count' | 'min' | 'max' | 'custom';

export interface CalculationParams {
  formula?: string;
  [key: string]: any;
}