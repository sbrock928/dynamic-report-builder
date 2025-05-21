export type AggregationLevel = 'deal' | 'group' | 'tranche';

export interface SchemaField {
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

export interface Schema {
  id: number;
  name: string;
  description?: string;
  base_model: string;
  aggregation_level: AggregationLevel;
  fields: SchemaField[];
  schema_json: Record<string, any>;
}

export interface SchemaCreate {
  name: string;
  description?: string;
  base_model: string;
  aggregation_level: AggregationLevel;
  fields: SchemaField[];
}

export interface ReportLayout {
  id: number;
  name: string;
  description?: string;
  primary_model: string;
  aggregation_level: AggregationLevel;
  schema_ids: number[];
  layout_json: Record<string, any>;
}

export interface ReportLayoutCreate {
  name: string;
  description?: string;
  primary_model: string;
  aggregation_level: AggregationLevel;
  schema_ids: number[];
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
  aggregation_level: AggregationLevel;
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