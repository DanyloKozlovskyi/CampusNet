"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyUniversityEmail } from "@entities/university";
import { saveTokens } from "@entities/auth/helpers";
import { setCookie } from "@shared/api";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import styles from "./verify-university-email.module.scss";

type VerificationStatus = "loading" | "success" | "error" | "expired";

export default function VerifyUniversityEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided");
      return;
    }

    const verify = async () => {
      try {
        const result = await verifyUniversityEmail(token);
        if (result.token && result.refreshToken) {
          saveTokens({
            token: result.token,
            refreshToken: result.refreshToken,
          });
        }
        setStatus("success");
      } catch (err: unknown) {
        const error = err as { response?: { data?: string } };
        const message = error?.response?.data || "Verification failed";
        if (message.toLowerCase().includes("expired")) {
          setStatus("expired");
        } else {
          setStatus("error");
        }
        setErrorMessage(message);
      }
    };

    verify();
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
            <h1 className={styles.title}>Verifying your email...</h1>
            <p className={styles.subtitle}>
              Please wait while we verify your university email.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className={styles.iconSuccess}>
              <CheckCircleIcon sx={{ fontSize: 64 }} color="success" />
            </div>
            <h1 className={styles.title}>Email Verified!</h1>
            <p className={styles.subtitle}>
              Your university email has been successfully verified. You now have
              full access to university features and chats.
            </p>
            <p
              className={styles.subtitle}
              style={{ opacity: 0.7, marginTop: 8 }}
            >
              You can close this tab and return to the app.
            </p>
            <div className={styles.actions}>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  window.close();
                }}
              >
                Close Tab
              </button>
              <button className={styles.secondaryBtn} onClick={handleGoHome}>
                Go to Home
              </button>
            </div>
          </>
        )}

        {status === "expired" && (
          <>
            <div className={styles.iconError}>
              <AccessTimeIcon sx={{ fontSize: 64 }} color="error" />
            </div>
            <h1 className={styles.title}>Link Expired</h1>
            <p className={styles.subtitle}>
              This verification link has expired. Please request a new
              verification email from your account settings.
            </p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={handleGoToAccount}>
                Go to Account
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className={styles.iconError}>
              <CancelIcon sx={{ fontSize: 64 }} color="error" />
            </div>
            <h1 className={styles.title}>Verification Failed</h1>
            <p className={styles.subtitle}>
              {errorMessage ||
                "We couldn't verify your email. The link may be invalid or already used."}
            </p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={handleGoToAccount}>
                Go to Account
              </button>
              <button className={styles.secondaryBtn} onClick={handleGoHome}>
                Go to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
