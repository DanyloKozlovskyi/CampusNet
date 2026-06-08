export enum ReportStatus {
  Pending = 0,
  Resolved = 1,
  Dismissed = 2,
}

export enum ReportReason {
  FakeUniversity = 0,
  FakeFaculty = 1,
  FakeMajor = 2,
  Impersonation = 3,
  Other = 4,
}

export enum ResolveAction {
  Ban = 0,
  Dismiss = 1,
}

export interface CreateReportDto {
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName?: string;
  reportedUserId: string;
  reportedUserName?: string;
  reportedUserEmail?: string;
  reportedUserUniversity?: string;
  reportedUserFaculty?: string;
  reportedUserMajor?: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface ReportsResponse {
  reports: Report[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ResolveReportDto {
  action: ResolveAction;
  banReason?: string;
}

export interface BanUserDto {
  reason: string;
}

export const ReportReasonLabels: Record<ReportReason, string> = {
  [ReportReason.FakeUniversity]: "Fake University Affiliation",
  [ReportReason.FakeFaculty]: "Fake Faculty Affiliation",
  [ReportReason.FakeMajor]: "Fake Major/Program",
  [ReportReason.Impersonation]: "Impersonation",
  [ReportReason.Other]: "Other",
};

export const ReportStatusLabels: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: "Pending",
  [ReportStatus.Resolved]: "Resolved",
  [ReportStatus.Dismissed]: "Dismissed",
};
