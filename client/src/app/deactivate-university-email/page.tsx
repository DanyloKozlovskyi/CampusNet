"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useIntl } from "react-intl";
import { deactivateUniversityEmail } from "@entities/university";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import styles from "./deactivate-university-email.module.scss";

type DeactivationStatus = "loading" | "success" | "error" | "expired";

export default function DeactivateUniversityEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const intl = useIntl();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<DeactivationStatus>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const deactivate = async () => {
      try {
        await deactivateUniversityEmail(token);
        setStatus("success");
      } catch (err: unknown) {
        const error = err as { response?: { data?: string } };
        const message = error?.response?.data || "";
        if (message.toLowerCase().includes("expired")) {
          setStatus("expired");
        } else {
          setStatus("error");
        }
      }
    };

    deactivate();
  }, [token]);

  const handleGoHome = () => {
    router.push("/home");
  };

  const handleGoToAccount = () => {
    router.push("/account");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === "loading" && (
          <>
            <div className={styles.icon}>
              <HourglassEmptyIcon sx={{ fontSize: 64 }} color="primary" />
            </div>
            <h1 className={styles.title}>
              {intl.formatMessage({ id: "deactivate-email.loading-title" })}
            </h1>
            <p className={styles.subtitle}>
              {intl.formatMessage({ id: "deactivate-email.loading-subtitle" })}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className={styles.iconSuccess}>
              <RemoveCircleOutlineIcon sx={{ fontSize: 64 }} color="warning" />
            </div>
            <h1 className={styles.title}>
              {intl.formatMessage({ id: "deactivate-email.success-title" })}
            </h1>
            <p className={styles.subtitle}>
              {intl.formatMessage({ id: "deactivate-email.success-subtitle" })}
            </p>
            <p
              className={styles.subtitle}
              style={{ opacity: 0.7, marginTop: 8 }}
            >
              {intl.formatMessage({ id: "deactivate-email.success-hint" })}
            </p>
            <div className={styles.actions}>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  window.close();
                }}
              >
                {intl.formatMessage({ id: "deactivate-email.btn-close" })}
              </button>
              <button className={styles.secondaryBtn} onClick={handleGoHome}>
                {intl.formatMessage({ id: "deactivate-email.btn-home" })}
              </button>
            </div>
          </>
        )}

        {status === "expired" && (
          <>
            <div className={styles.iconError}>
              <AccessTimeIcon sx={{ fontSize: 64 }} color="error" />
            </div>
            <h1 className={styles.title}>
              {intl.formatMessage({ id: "deactivate-email.expired-title" })}
            </h1>
            <p className={styles.subtitle}>
              {intl.formatMessage({ id: "deactivate-email.expired-subtitle" })}
            </p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={handleGoToAccount}>
                {intl.formatMessage({ id: "deactivate-email.btn-account" })}
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className={styles.iconError}>
              <CancelIcon sx={{ fontSize: 64 }} color="error" />
            </div>
            <h1 className={styles.title}>
              {intl.formatMessage({ id: "deactivate-email.error-title" })}
            </h1>
            <p className={styles.subtitle}>
              {!token
                ? intl.formatMessage({ id: "deactivate-email.error-no-token" })
                : intl.formatMessage({ id: "deactivate-email.error-subtitle" })}
            </p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={handleGoToAccount}>
                {intl.formatMessage({ id: "deactivate-email.btn-account" })}
              </button>
              <button className={styles.secondaryBtn} onClick={handleGoHome}>
                {intl.formatMessage({ id: "deactivate-email.btn-home" })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
