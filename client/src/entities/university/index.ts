export { useUniversityStore } from "./store";
export {
  updateUniversityInfo,
  clearUniversityInfo,
  getUniversityPeers,
  getUniversityStats,
  getUniversityPosts,
  updateInterests,
  sendUniversityVerificationEmail,
  verifyUniversityEmail,
  resendUniversityVerificationEmail,
  getUniversityEmailVerificationStatus,
} from "./api";
export type {
  UniversityInfo,
  UniversityPeer,
  UniversityStats,
  UpdateUniversityInfoPayload,
} from "./types";
export type { EmailVerificationStatus } from "./api";
