import api, { ENDPOINTS } from "@shared/api";
import {
  CreateReportDto,
  Report,
  ReportsResponse,
  ReportStatus,
  ResolveReportDto,
  BanUserDto,
} from "./types";

export const createReport = async (dto: CreateReportDto): Promise<{ message: string; reportId: string }> => {
  const response = await api.post(`${ENDPOINTS.REPORT}`, dto);
  return response.data;
};

export const getReports = async (
  status?: ReportStatus,
  page: number = 1,
  pageSize: number = 20
): Promise<ReportsResponse> => {
  const params = new URLSearchParams();
  if (status !== undefined) params.append("status", status.toString());
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());
  
  const response = await api.get(`${ENDPOINTS.REPORT}?${params.toString()}`);
  return response.data;
};

export const getReport = async (id: string): Promise<Report> => {
  const response = await api.get(`${ENDPOINTS.REPORT}/${id}`);
  return response.data;
};

export const resolveReport = async (
  id: string,
  dto: ResolveReportDto
): Promise<{ message: string; reportId: string; status: ReportStatus }> => {
  const response = await api.post(`${ENDPOINTS.REPORT}/${id}/resolve`, dto);
  return response.data;
};

export const banUser = async (
  userId: string,
  dto: BanUserDto
): Promise<{ message: string; userId: string }> => {
  const response = await api.post(`${ENDPOINTS.REPORT}/ban/${userId}`, dto);
  return response.data;
};

export const unbanUser = async (
  userId: string
): Promise<{ message: string; userId: string }> => {
  const response = await api.post(`${ENDPOINTS.REPORT}/unban/${userId}`);
  return response.data;
};
