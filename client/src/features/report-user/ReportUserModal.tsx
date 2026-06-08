"use client";

import { useState } from "react";
import { useIntl } from "react-intl";
import { Modal, Backdrop, Box, Fade } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReportIcon from "@mui/icons-material/Report";
import { createReport, ReportReason } from "@entities/report";
import classes from "./report-user.module.scss";

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName?: string;
}

export const ReportUserModal = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
}: ReportUserModalProps) => {
  const intl = useIntl();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reasons = [
    { key: ReportReason.FakeUniversity, label: intl.formatMessage({ id: "report.reason.fake-university" }) },
    { key: ReportReason.FakeFaculty, label: intl.formatMessage({ id: "report.reason.fake-faculty" }) },
    { key: ReportReason.FakeMajor, label: intl.formatMessage({ id: "report.reason.fake-major" }) },
    { key: ReportReason.Impersonation, label: intl.formatMessage({ id: "report.reason.impersonation" }) },
    { key: ReportReason.Other, label: intl.formatMessage({ id: "report.reason.other" }) },
  ];

  const handleSubmit = async () => {
    if (selectedReason === null) {
      setError(intl.formatMessage({ id: "report.error-select-reason" }));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createReport({
        reportedUserId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      console.error("Failed to submit report:", err);
      setError(intl.formatMessage({ id: "report.error-submit-failed" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 300 } }}
    >
      <Fade in={isOpen}>
        <Box className={classes.modal}>
          <div className={classes.header}>
            <div className={classes.headerTitle}>
              <ReportIcon color="error" />
              <span>{intl.formatMessage({ id: "report.title" })}</span>
            </div>
            <button className={classes.closeBtn} onClick={handleClose} type="button">
              <CloseIcon fontSize="small" />
            </button>
          </div>

          {success ? (
            <div className={classes.successSection}>
              <div className={classes.successTitle}>{intl.formatMessage({ id: "report.success-title" })}</div>
              <p className={classes.successText}>
                {intl.formatMessage({ id: "report.success-text" })}
              </p>
              <button className={classes.primaryBtn} onClick={handleClose} type="button">
                {intl.formatMessage({ id: "report.btn-close" })}
              </button>
            </div>
          ) : (
            <>
              {reportedUserName && (
                <p className={classes.subtitle}>
                  {intl.formatMessage({ id: "report.reporting" })} <strong>{reportedUserName}</strong>
                </p>
              )}

              <div className={classes.formGroup}>
                <label className={classes.formLabel}>{intl.formatMessage({ id: "report.reason-label" })}</label>
                <div className={classes.reasonList}>
                  {reasons.map((reason) => (
                    <label key={reason.key} className={classes.reasonItem}>
                      <input
                        type="radio"
                        name="reason"
                        value={reason.key}
                        checked={selectedReason === reason.key}
                        onChange={() => setSelectedReason(reason.key)}
                      />
                      <span>{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={classes.formGroup}>
                <label className={classes.formLabel}>{intl.formatMessage({ id: "report.description-label" })}</label>
                <textarea
                  className={classes.textarea}
                  placeholder={intl.formatMessage({ id: "report.description-placeholder" })}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  rows={4}
                />
              </div>

              {error && <div className={classes.errorMessage}>{error}</div>}

              <div className={classes.actions}>
                <button
                  className={classes.secondaryBtn}
                  onClick={handleClose}
                  type="button"
                  disabled={isSubmitting}
                >
                  {intl.formatMessage({ id: "report.btn-cancel" })}
                </button>
                <button
                  className={classes.primaryBtn}
                  onClick={handleSubmit}
                  type="button"
                  disabled={isSubmitting || selectedReason === null}
                >
                  {isSubmitting ? intl.formatMessage({ id: "report.btn-submitting" }) : intl.formatMessage({ id: "report.btn-submit" })}
                </button>
              </div>
            </>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};
