import axios from 'axios';
import { 
  Schema, 
  SchemaCreate, 
  ReportLayout, 
  ReportLayoutCreate,
  ReportDataRequest,
  ReportDataResponse
} from '../types';

const API_URL = 'http://localhost:8000';

// Schema API
export const getSchemas = async (): Promise<Schema[]> => {
  const response = await axios.get<Schema[]>(`${API_URL}/schemas/`);
  return response.data;
};

export const getSchema = async (id: number): Promise<Schema> => {
  const response = await axios.get<Schema>(`${API_URL}/schemas/${id}`);
  return response.data;
};

export const createSchema = async (schema: SchemaCreate): Promise<Schema> => {
  const response = await axios.post<Schema>(`${API_URL}/schemas/`, schema);
  return response.data;
};

export const updateSchema = async (id: number, schema: SchemaCreate): Promise<Schema> => {
  const response = await axios.put<Schema>(`${API_URL}/schemas/${id}`, schema);
  return response.data;
};

export const deleteSchema = async (id: number): Promise<boolean> => {
  const response = await axios.delete<boolean>(`${API_URL}/schemas/${id}`);
  return response.data;
};

export const getPydanticCode = async (id: number): Promise<string> => {
  const response = await axios.get<string>(`${API_URL}/schemas/${id}/pydantic-code`);
  return response.data;
};

// Report API
export const getReportLayouts = async (): Promise<ReportLayout[]> => {
  const response = await axios.get<ReportLayout[]>(`${API_URL}/reports/`);
  return response.data;
};

export const getReportLayout = async (id: number): Promise<ReportLayout> => {
  const response = await axios.get<ReportLayout>(`${API_URL}/reports/${id}`);
  return response.data;
};

export const createReportLayout = async (layout: ReportLayoutCreate): Promise<ReportLayout> => {
  const response = await axios.post<ReportLayout>(`${API_URL}/reports/`, layout);
  return response.data;
};

export const updateReportLayout = async (id: number, layout: ReportLayoutCreate): Promise<ReportLayout> => {
  const response = await axios.put<ReportLayout>(`${API_URL}/reports/${id}`, layout);
  return response.data;
};

export const deleteReportLayout = async (id: number): Promise<boolean> => {
  const response = await axios.delete<boolean>(`${API_URL}/reports/${id}`);
  return response.data;
};

export const runReport = async (request: ReportDataRequest): Promise<ReportDataResponse> => {
  const response = await axios.post<ReportDataResponse>(`${API_URL}/reports/run`, request);
  return response.data;
};

export const getCycleCodes = async (): Promise<string[]> => {
  const response = await axios.get<string[]>(`${API_URL}/reports/cycles`);
  return response.data;
};