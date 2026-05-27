"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import {
  getUniversityDomain,
  getAllFaculties,
  getUniversityLogoBasePath,
  getFacultyLogoBasePath,
  UNIVERSITIES,
} from "@shared/lib/universities";
import type { FacultyRegistry } from "@shared/lib/universities";
import { useUniversityTranslation } from "@shared/lib/universities/useUniversityTranslation";
import {
  useUniversityStore,
  updateUniversityInfo,
  updateInterests,
  sendUniversityVerificationEmail,
  getUniversityEmailVerificationStatus,
} from "@entities/university";
import { fetchImageWithFallbacks } from "@entities/image";
import { chatApi } from "@entities/chat";
import classes from "./university-onboarding.module.scss";

interface Props {
  email: string;
  onComplete: () => void;
  forceShow?: boolean;
}

type Step = "confirm" | "faculty" | "details" | "verify-email" | "success";

interface VerifyEmailStepProps {
  email: string;
  emailError: string | null;
  setEmailError: (error: string | null) => void;
  verificationEmailSent: boolean;
  setVerificationEmailSent: (sent: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  setStep: (step: Step) => void;
  setOnboardingDismissed: (dismissed: boolean) => void;
  universityDomain?: string | null;
  universityName?: string | null;
}

const VerifyEmailStep = ({
  email,
  emailError,
  setEmailError,
  verificationEmailSent,
  setVerificationEmailSent,
  isSubmitting,
  setIsSubmitting,
  setStep,
  setOnboardingDismissed,
  universityDomain,
  universityName,
}: VerifyEmailStepProps) => {
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!verificationEmailSent) return;

    pollingRef.current = true;
    const interval = setInterval(async () => {
      try {
        const status = await getUniversityEmailVerificationStatus();
        if (status.universityEmailVerified) {
          clearInterval(interval);
          pollingRef.current = false;
          setStep("faculty");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      pollingRef.current = false;
    };
  }, [verificationEmailSent, setStep]);

  return (
    <div className={classes.successSection}>
      <div className={classes.successIcon}>📧</div>
      <div className={classes.successTitle}>Verify your email</div>
      <div className={classes.successSubtitle}>
        To access university chats and features, please verify your university
        email address.
      </div>
      <div className={classes.emailInfo}>
        <strong>{email}</strong>
      </div>
      {emailError && <div className={classes.errorMessage}>{emailError}</div>}
      {verificationEmailSent ? (
        <div className={classes.successMessage}>
          Verification email sent! Check your inbox.

        </div>
      ) : null}
      <div className={classes.actions} style={{ marginTop: 20 }}>
        <button
          className={classes.primaryBtn}
          onClick={async () => {
            setEmailError(null);
            setIsSubmitting(true);
            try {
              await sendUniversityVerificationEmail(
                universityDomain || undefined,
                universityName || undefined
              );
              setVerificationEmailSent(true);
            } catch (err) {
              setEmailError(
                "Failed to send verification email. Please try again.",
              );
              console.error(err);
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting || verificationEmailSent}
          type="button"
        >
          {isSubmitting
            ? "Sending..."
            : verificationEmailSent
              ? "Email Sent"
              : "Send Verification Email"}
        </button>
        <button
          className={classes.secondaryBtn}
          onClick={() => {
            setStep("faculty");
          }}
          type="button"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

const UniversityOnboardingModal = ({ email, onComplete, forceShow }: Props) => {
  const {
    setUniversityInfo,
    setOnboardingDismissed,
    onboardingDismissed,
    universityDomain: storedDomain,
  } = useUniversityStore();

  const uniDomain = getUniversityDomain(email);
  const university = uniDomain ? UNIVERSITIES[uniDomain] : null;
  const { translateUniversity, translateFaculty, translateMajor } =
    useUniversityTranslation();

  const [step, setStep] = useState<Step>("confirm");
  const [uniLogoUrl, setUniLogoUrl] = useState<string | null>(null);
  const [facultyLogos, setFacultyLogos] = useState<Record<string, string>>({});
  const [selectedFacultyCode, setSelectedFacultyCode] = useState<string | null>(
    null,
  );
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [selectedMajorKey, setSelectedMajorKey] = useState<string>("");
  const [yearOfStudy, setYearOfStudy] = useState<number>(1);
  const [academicRole, setAcademicRole] = useState<string>("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailAlreadyVerified, setEmailAlreadyVerified] = useState(false);
  const totalSteps = emailAlreadyVerified ? 3 : 4;

  // Don't show if: no university match, already onboarded, or already dismissed
  const shouldShow =
    forceShow || (!!university && !onboardingDismissed && !storedDomain);

  // Load university logo
  useEffect(() => {
    if (!university || !uniDomain) return;
    const logoBaseUrl = getUniversityLogoBasePath(uniDomain);
    if (!logoBaseUrl) {
      setUniLogoUrl(null);
      return;
    }
    fetchImageWithFallbacks(logoBaseUrl, ["png", "svg", "jpg", "jpeg"])
      .then(setUniLogoUrl)
      .catch(() => setUniLogoUrl(null));
  }, [university, uniDomain]);

  // Load faculty logos when entering faculty step
  useEffect(() => {
    if (step !== "faculty" || !uniDomain) return;

    const faculties = getAllFaculties(uniDomain);
    faculties.forEach(({ code }) => {
      const fLogoBaseUrl = getFacultyLogoBasePath(uniDomain, code);
      if (fLogoBaseUrl) {
        fetchImageWithFallbacks(fLogoBaseUrl, ["png", "svg", "jpg", "jpeg"])
          .then((url) => setFacultyLogos((prev) => ({ ...prev, [code]: url })))
          .catch(() => { });
      }
    });
  }, [step, uniDomain]);

  const handleDismiss = useCallback(() => {
    setOnboardingDismissed(true);
    onComplete();
  }, [setOnboardingDismissed, onComplete]);

  const handleConfirmYes = async () => {
    try {
      const status = await getUniversityEmailVerificationStatus();
      if (status.universityEmailVerified) {
        setEmailAlreadyVerified(true);
        setStep("faculty");
      } else {
        setEmailAlreadyVerified(false);
        setStep("verify-email");
      }
    } catch {
      setStep("verify-email");
    }
  };

  const handleSelectFaculty = (code: string) => {
    setSelectedFacultyCode(code);
    setSelectedMajor("");
    setSelectedMajorKey("");
    // Auto-populate interests from faculty
    if (uniDomain) {
      const faculty = UNIVERSITIES[uniDomain]?.faculties[code];
      if (faculty?.interests) {
        setInterests([...faculty.interests]);
      }
    }
    setStep("details");
  };

  const handleRemoveInterest = (tag: string) => {
    setInterests((prev) => prev.filter((t) => t !== tag));
  };

  const handleAddCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase();
    if (tag && !interests.includes(tag)) {
      setInterests((prev) => [...prev, tag]);
    }
    setCustomTagInput("");
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const selectedFaculty: FacultyRegistry | null =
    uniDomain && selectedFacultyCode
      ? (UNIVERSITIES[uniDomain]?.faculties[selectedFacultyCode] ?? null)
      : null;

  const handleSubmit = async () => {
    if (!uniDomain || !university || !selectedFacultyCode || !selectedFaculty)
      return;
    setIsSubmitting(true);

    try {
      await updateUniversityInfo({
        universityDomain: uniDomain,
        universityName: university.name,
        facultyCode: selectedFacultyCode,
        facultyName: selectedFaculty.name,
        major: selectedMajor || null,
        majorKey: selectedMajorKey || null,
        yearOfStudy,
        academicRole,
      });

      await updateInterests(interests);

      try {
        await chatApi.joinUniversityChat(uniDomain, university.name);

        await chatApi.joinFacultyChat(
          uniDomain,
          selectedFacultyCode,
          selectedFaculty.name,
        );

        if (selectedMajor && selectedMajorKey) {
          await chatApi.joinMajorChat(
            uniDomain,
            selectedFacultyCode,
            selectedMajorKey,
            selectedMajor,
          );

          await chatApi.joinMajorYearChat(
            uniDomain,
            selectedFacultyCode,
            selectedMajorKey,
            selectedMajor,
            yearOfStudy,
          );
        }
      } catch (chatErr) {
        console.error("Failed to join university chats:", chatErr);
      }

      setUniversityInfo({
        universityDomain: uniDomain,
        universityName: university.name,
        facultyCode: selectedFacultyCode,
        facultyName: selectedFaculty.name,
        major: selectedMajor || null,
        majorKey: selectedMajorKey || null,
        yearOfStudy,
      });

      setStep("success");
    } catch (err) {
      console.error("Failed to save university info:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shouldShow) return null;

  const faculties = uniDomain ? getAllFaculties(uniDomain) : [];

  return (
    <div className={classes.overlay} onClick={handleDismiss}>
      <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={classes.header}>
          <span className={classes.stepLabel}>
            {step === "confirm" && `Step 1 of ${totalSteps}`}
            {step === "verify-email" && `Step 2 of ${totalSteps}`}
            {step === "faculty" && `Step ${emailAlreadyVerified ? 2 : 3} of ${totalSteps}`}
            {step === "details" && `Step ${emailAlreadyVerified ? 3 : 4} of ${totalSteps}`}
            {step === "success" && "Done!"}
          </span>
          <button
            className={classes.closeBtn}
            onClick={handleDismiss}
            type="button"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {step === "confirm" && university && (
          <>
            <div className={classes.logoSection}>
              {uniLogoUrl ? (
                <img
                  src={uniLogoUrl}
                  alt={university.name}
                  className={classes.uniLogo}
                />
              ) : (
                <div className={classes.uniLogo} />
              )}
              <div className={classes.uniName}>
                {translateUniversity(uniDomain) || university.name}
              </div>
            </div>
            <div className={classes.question}>
              Are you associated with this university?
            </div>
            <div className={classes.actions}>
              <button
                className={classes.primaryBtn}
                onClick={handleConfirmYes}
                type="button"
              >
                Yes, I am
              </button>
              <button
                className={classes.secondaryBtn}
                onClick={handleDismiss}
                type="button"
              >
                Not now
              </button>
            </div>
          </>
        )}

        {step === "verify-email" && (
          <VerifyEmailStep
            email={email}
            emailError={emailError}
            setEmailError={setEmailError}
            verificationEmailSent={verificationEmailSent}
            setVerificationEmailSent={setVerificationEmailSent}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            setStep={setStep}
            setOnboardingDismissed={setOnboardingDismissed}
            universityDomain={uniDomain}
            universityName={university?.name}
          />
        )}

        {step === "faculty" && (
          <>
            <div className={classes.logoSection}>
              <div className={classes.uniName}>Choose your faculty</div>
            </div>
            <div className={classes.facultyList}>
              {faculties.map(({ code, faculty }) => (
                <div
                  key={code}
                  className={
                    selectedFacultyCode === code
                      ? classes.facultyItemSelected
                      : classes.facultyItem
                  }
                  onClick={() => handleSelectFaculty(code)}
                >
                  {facultyLogos[code] ? (
                    <img
                      src={facultyLogos[code]}
                      alt={faculty.name}
                      className={classes.facultyLogo}
                    />
                  ) : (
                    <div className={classes.facultyLogo} />
                  )}
                  <div className={classes.facultyInfo}>
                    <div className={classes.facultyName}>
                      {translateFaculty(uniDomain, code) || faculty.name}
                    </div>
                    <div className={classes.facultyCode}>{code}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === "details" && selectedFaculty && (
          <>
            <div className={classes.logoSection}>
              {selectedFacultyCode && facultyLogos[selectedFacultyCode] ? (
                <img
                  src={facultyLogos[selectedFacultyCode]}
                  alt={selectedFaculty.name}
                  className={classes.uniLogo}
                />
              ) : (
                <div className={classes.uniLogo} />
              )}
              <div className={classes.uniName}>
                {translateFaculty(uniDomain, selectedFacultyCode) ||
                  selectedFaculty.name}
              </div>
            </div>

            <div className={classes.formGroup}>
              <label className={classes.formLabel}>Major</label>
              <select
                className={classes.formSelect}
                value={selectedMajor}
                onChange={(e) => {
                  const majorIndex = selectedFaculty.majors.indexOf(
                    e.target.value,
                  );
                  setSelectedMajor(e.target.value);
                  setSelectedMajorKey(
                    majorIndex >= 0
                      ? selectedFaculty.majorKeys[majorIndex]
                      : "",
                  );
                }}
              >
                <option value="">Select major…</option>
                {selectedFaculty.majors.map((m, idx) => (
                  <option key={m} value={m}>
                    {translateMajor(selectedFaculty.majorKeys[idx]) || m}
                  </option>
                ))}
              </select>
            </div>

            <div className={classes.formGroup}>
              <label className={classes.formLabel}>Year of study</label>
              <select
                className={classes.formSelect}
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className={classes.formGroup}>
              <label className={classes.formLabel}>Role</label>
              <select
                className={classes.formSelect}
                value={academicRole}
                onChange={(e) => setAcademicRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="ta">Teaching Assistant</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>

            <div className={classes.formGroup}>
              <label className={classes.formLabel}>Interests</label>
              <div className={classes.interestChips}>
                {interests.map((tag) => (
                  <span key={tag} className={classes.interestChip}>
                    {tag}
                    <button
                      type="button"
                      className={classes.chipRemove}
                      onClick={() => handleRemoveInterest(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className={classes.addTagRow}>
                <input
                  type="text"
                  className={classes.formInput}
                  placeholder="Add custom tag..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={handleCustomTagKeyDown}
                />
                <button
                  type="button"
                  className={classes.addTagBtn}
                  onClick={handleAddCustomTag}
                  disabled={!customTagInput.trim()}
                >
                  Add
                </button>
              </div>
            </div>

            <div className={classes.actions}>
              <button
                className={classes.secondaryBtn}
                onClick={() => setStep("faculty")}
                type="button"
              >
                Back
              </button>
              <button
                className={classes.primaryBtn}
                onClick={handleSubmit}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? "Saving…" : "Confirm"}
              </button>
            </div>
          </>
        )}



        {step === "success" && (
          <div className={classes.successSection}>
            <div className={classes.successIcon}>🎓</div>
            <div className={classes.successTitle}>You&apos;re all set!</div>
            <div className={classes.successSubtitle}>
              {verificationEmailSent
                ? "Check your email to complete verification. University features will be available after you verify."
                : "You can now switch to University Mode to see posts from your classmates and join faculty chats."}
            </div>
            <div className={classes.actions} style={{ marginTop: 20 }}>
              <button
                className={classes.primaryBtn}
                onClick={onComplete}
                type="button"
              >
                Get started
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { UniversityOnboardingModal };
