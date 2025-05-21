import axios from 'axios';
import { 
  UDF, 
  UDFCreate, 
  ReportLayout, 
  ReportLayoutCreate,
  ReportDataRequest,
  ReportDataResponse,
  ModelInfo,
  ModelField
} from '../types';

const API_URL = 'http://localhost:8000';

// UDF API
export const getUdfs = async (): Promise<UDF[]> => {
  const response = await axios.get<UDF[]>(`${API_URL}/udfs/`);
  return response.data;
};

export const getUdf = async (id: number): Promise<UDF> => {
  const response = await axios.get<UDF>(`${API_URL}/udfs/${id}`);
  return response.data;
};

export const createUdf = async (udf: UDFCreate): Promise<UDF> => {
  const response = await axios.post<UDF>(`${API_URL}/udfs/`, udf);
  return response.data;
};

export const updateUdf = async (id: number, udf: UDFCreate): Promise<UDF> => {
  const response = await axios.put<UDF>(`${API_URL}/udfs/${id}`, udf);
  return response.data;
};

export const deleteUdf = async (id: number): Promise<boolean> => {
  const response = await axios.delete<boolean>(`${API_URL}/udfs/${id}`);
  return response.data;
};

export const getPydanticCode = async (id: number): Promise<string> => {
  const response = await axios.get<string>(`${API_URL}/udfs/${id}/pydantic-code`);
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

// Model Registry API
export const getAvailableModels = async (): Promise<ModelInfo[]> => {
  const response = await axios.get<ModelInfo[]>(`${API_URL}/models/`);
  return response.data;
};

export const getModelFields = async (modelId: string): Promise<ModelField[]> => {
  const response = await axios.get<ModelField[]>(`${API_URL}/models/${modelId}/fields`);
  return response.data;
};