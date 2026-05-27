import api, { ENDPOINTS } from "@shared/api";
import { saveTokens } from "@entities/auth/helpers";
import type {
  UniversityInfo,
  UniversityPeer,
  UniversityStats,
  UpdateUniversityInfoPayload,
} from "./types";

export async function updateUniversityInfo(
  payload: UpdateUniversityInfoPayload,
): Promise<UniversityInfo> {
  const response = await api.post(
    `${ENDPOINTS.ACCOUNT}/UpdateUniversityInfo`,
    payload,
  );

  // Save new JWT token if returned (contains updated universityEmailVerified claim)
  if (response.data.token && response.data.refreshToken) {
    saveTokens({
      token: response.data.token,
      refreshToken: response.data.refreshToken,
    });
  }

  return response.data;
}

export async function clearUniversityInfo(): Promise<string> {
  const response = await api.delete(`${ENDPOINTS.ACCOUNT}/ClearUniversityInfo`);
  return response.data;
}

export async function getUniversityPeers(
  universityDomain?: string,
  facultyCode?: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<UniversityPeer[]> {
  const params = new URLSearchParams();
  if (universityDomain) params.set("universityDomain", universityDomain);
  if (facultyCode) params.set("facultyCode", facultyCode);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  const response = await api.get(
    `${ENDPOINTS.ACCOUNT}/GetUniversityPeers?${params}`,
  );
  return response.data;
}

export async function getUniversityStats(): Promise<UniversityStats> {
  const response = await api.get(`${ENDPOINTS.ACCOUNT}/GetUniversityStats`);
  return response.data;
}

export async function updateInterests(
  interests: string[],
): Promise<{ interests: string[] }> {
  const response = await api.post(`${ENDPOINTS.ACCOUNT}/UpdateInterests`, {
    interests,
  });
  return response.data;
}

export async function getUniversityPosts(
  universityDomain: string,
  facultyCode?: string,
  page: number = 1,
  pageSize: number = 30,
): Promise<unknown[]> {
  const params = new URLSearchParams();
  params.set("universityDomain", universityDomain);
  if (facultyCode) params.set("facultyCode", facultyCode);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  const response = await api.get(`${ENDPOINTS.BLOG}/GetByUniversity?${params}`);
  return response.data;
}

export interface EmailVerificationStatus {
  universityEmailVerified: boolean;
  universityDomain: string | null;
  universityName: string | null;
  email: string | null;
}

export async function sendUniversityVerificationEmail(
  universityDomain?: string,
  universityName?: string
): Promise<{
  message: string;
  email: string;
}> {
  const params = new URLSearchParams();
  if (universityDomain) params.append("universityDomain", universityDomain);
  if (universityName) params.append("universityName", universityName);

  const url = `${ENDPOINTS.ACCOUNT}/SendUniversityVerificationEmail${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await api.post(url);
  return response.data;
}

export async function verifyUniversityEmail(token: string): Promise<{
  message: string;
  universityEmailVerified: boolean;
  token?: string;
  refreshToken?: string;
}> {
  const response = await api.get(
    `${ENDPOINTS.ACCOUNT}/VerifyUniversityEmail?token=${token}`,
  );
  return response.data;
}

export async function resendUniversityVerificationEmail(): Promise<{
  message: string;
  email: string;
}> {
  const response = await api.post(
    `${ENDPOINTS.ACCOUNT}/ResendUniversityVerificationEmail`,
  );
  return response.data;
}

export async function getUniversityEmailVerificationStatus(): Promise<EmailVerificationStatus> {
  const response = await api.get(
    `${ENDPOINTS.ACCOUNT}/GetUniversityEmailVerificationStatus`,
  );
  return response.data;
}
