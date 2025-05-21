export interface SchemaField {
    name: string;
    type: string;
    description?: string;
    required: boolean;
    default?: any;
    enum_values?: any[];
  }
  
  export interface Schema {
    id: number;
    name: string;
    description?: string;
    fields: SchemaField[];
    schema_json: Record<string, any>;
  }
  
  export interface SchemaCreate {
    name: string;
    description?: string;
    fields: SchemaField[];
  }
  
  export interface ReportLayout {
    id: number;
    name: string;
    description?: string;
    schema_id: number;
    layout_json: Record<string, any>;
  }
  
  export interface ReportLayoutCreate {
    name: string;
    description?: string;
    schema_id: number;
    layout_json: Record<string, any>;
  }
  
  export interface ReportDataRequest {
    report_id: number;
    cycle_code: string;
  }
  
  export interface ReportDataResponse {
    report_name: string;
    cycle_code: string;
    data: Record<string, any>[];
  }