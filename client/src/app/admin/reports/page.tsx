"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getReports,
  resolveReport,
  Report,
  ReportStatus,
  ReportReason,
  ResolveAction,
  ReportReasonLabels,
  ReportStatusLabels,
} from "@entities/report";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import PendingIcon from "@mui/icons-material/Pending";
import classes from "./reports.module.scss";

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pageSize = 10;

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getReports(statusFilter, page, pageSize);
      setReports(response.reports);
      setTotalCount(response.totalCount);
    } catch (err: unknown) {
      console.error("Failed to fetch reports:", err);
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 403) {
        setError("Access denied. Admin privileges required.");
      } else {
        setError("Failed to load reports");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter]);

  const handleResolve = async (reportId: string, action: ResolveAction, banReason?: string) => {
    setProcessingId(reportId);
    try {
      await resolveReport(reportId, { action, banReason });
      await fetchReports();
    } catch (err) {
      console.error("Failed to resolve report:", err);
      setError("Failed to resolve report");
    } finally {
      setProcessingId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.Pending:
        return <PendingIcon color="warning" />;
      case ReportStatus.Resolved:
        return <CheckCircleIcon color="success" />;
      case ReportStatus.Dismissed:
        return <BlockIcon color="disabled" />;
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1 className={classes.title}>Report Management</h1>
        <div className={classes.filters}>
          <select
            className={classes.filterSelect}
            value={statusFilter ?? "all"}
            onChange={(e) => {
              const val = e.target.value;
              setStatusFilter(val === "all" ? undefined : Number(val) as ReportStatus);
              setPage(1);
            }}
          >
            <option value="all">All Reports</option>
            <option value={ReportStatus.Pending}>Pending</option>
            <option value={ReportStatus.Resolved}>Resolved</option>
            <option value={ReportStatus.Dismissed}>Dismissed</option>
          </select>
        </div>
      </div>

      {error && <div className={classes.errorMessage}>{error}</div>}

      {isLoading ? (
        <div className={classes.loading}>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className={classes.empty}>No reports found</div>
      ) : (
        <>
          <div className={classes.reportList}>
            {reports.map((report) => (
              <div key={report.id} className={classes.reportCard}>
                <div className={classes.reportHeader}>
                  <div className={classes.reportStatus}>
                    {getStatusIcon(report.status)}
                    <span>{ReportStatusLabels[report.status]}</span>
                  </div>
                  <span className={classes.reportDate}>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className={classes.reportBody}>
                  <div className={classes.reportSection}>
                    <span className={classes.label}>Reported User:</span>
                    <span className={classes.value}>
                      {report.reportedUserName} ({report.reportedUserEmail})
                    </span>
                  </div>

                  <div className={classes.reportSection}>
                    <span className={classes.label}>University Info:</span>
                    <span className={classes.value}>
                      {report.reportedUserUniversity || "N/A"} / {report.reportedUserFaculty || "N/A"} / {report.reportedUserMajor || "N/A"}
                    </span>
                  </div>

                  <div className={classes.reportSection}>
                    <span className={classes.label}>Reason:</span>
                    <span className={classes.reasonBadge}>
                      {ReportReasonLabels[report.reason as ReportReason]}
                    </span>
                  </div>

                  {report.description && (
                    <div className={classes.reportSection}>
                      <span className={classes.label}>Description:</span>
                      <p className={classes.description}>{report.description}</p>
                    </div>
                  )}

                  <div className={classes.reportSection}>
                    <span className={classes.label}>Reported By:</span>
                    <span className={classes.value}>{report.reporterName}</span>
                  </div>
                </div>

                {report.status === ReportStatus.Pending && (
                  <div className={classes.reportActions}>
                    <button
                      className={classes.banBtn}
                      onClick={() => handleResolve(report.id, ResolveAction.Ban)}
                      disabled={processingId === report.id}
                    >
                      {processingId === report.id ? "Processing..." : "Ban User"}
                    </button>
                    <button
                      className={classes.dismissBtn}
                      onClick={() => handleResolve(report.id, ResolveAction.Dismiss)}
                      disabled={processingId === report.id}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={classes.pagination}>
              <button
                className={classes.pageBtn}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className={classes.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                className={classes.pageBtn}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
