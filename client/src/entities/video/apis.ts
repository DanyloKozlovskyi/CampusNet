import axios from "axios";
import api, { ENDPOINTS } from "@shared/api";
import { StartUploadResponse, CompleteUploadResponse } from "./interfaces";

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ALLOWED_CONTENT_TYPE = "video/mp4";

async function startVideoUpload(
  fileName: string,
  fileSize: number,
  contentType: string,
): Promise<StartUploadResponse> {
  const response = await api.post(`${ENDPOINTS.VIDEOS}/start-upload`, {
    fileName,
    fileSize,
    contentType,
  });
  return response?.data;
}

async function completeVideoUpload(
  storageKey: string,
  title?: string,
  description?: string,
): Promise<CompleteUploadResponse> {
  const response = await api.post(`${ENDPOINTS.VIDEOS}/complete-upload`, {
    storageKey,
    title,
    description,
  });
  return response?.data;
}

async function uploadVideoToR2(
  file: File,
  uploadUrl: string,
  contentType: string,
): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": contentType },
  });
}

async function getSignedVideoUrl(storageKey: string): Promise<string> {
  const response = await api.get(`${ENDPOINTS.VIDEOS}/download-url`, {
    params: { storageKey },
  });
  return response?.data?.url;
}

function validateVideoFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 30MB limit. Your file is ${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)}MB.`,
    };
  }

  if (file.type !== ALLOWED_CONTENT_TYPE) {
    return {
      valid: false,
      error: `Only MP4 videos are allowed. Your file is ${file.type || "unknown type"}.`,
    };
  }

  return { valid: true };
}

export {
  startVideoUpload,
  completeVideoUpload,
  uploadVideoToR2,
  getSignedVideoUrl,
  validateVideoFile,
  MAX_FILE_SIZE,
  ALLOWED_CONTENT_TYPE,
};
