"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { register, saveTokens } from "@entities/auth";
import { setCookie } from "@shared/api";
import { UniversityOnboardingModal } from "@features/university-onboarding";
import { getUniversityDomain } from "@shared/lib/universities";
import classes from "./sign-up.module.scss";

interface FieldErrors {
  userName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
}

const SignUpPage = () => {
  const router = useRouter();

  const [account, setAccount] = useState({
    userName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange = (field: string, value: string) => {
    setAccount({ ...account, [field]: value });
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors({ ...fieldErrors, [field]: undefined });
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!account.userName.trim()) {
      errors.userName = "Username can't be blank";
    }

    if (!account.email.trim()) {
      errors.email = "Email can't be blank";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) {
      errors.email = "Email should be in a proper email address format";
    }

    if (!account.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number can't be blank";
    } else if (!/^[0-9]*$/.test(account.phoneNumber)) {
      errors.phoneNumber = "Phone number should contain digits only";
    }

    if (!account.password) {
      errors.password = "Password can't be blank";
    } else if (account.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    } else if (!/[a-z]/.test(account.password)) {
      errors.password = "Password must contain at least one lowercase letter";
    }

    if (!account.confirmPassword) {
      errors.confirmPassword = "Confirm password can't be blank";
    } else if (account.password !== account.confirmPassword) {
      errors.confirmPassword = "Password and confirm password do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register(account);
      saveTokens(response);

      // Save email for university detection
      const email = response.email || account.email;
      setCookie("user_email", email);

      // Check if user has a university email
      const uniDomain = getUniversityDomain(email);
      if (uniDomain) {
        setLoggedInEmail(email);
        setShowOnboarding(true);
      } else {
        router.push("/home");
      }
    } catch (err: unknown) {
      console.error("Registration failed", err);
      const error = err as { 
        response?: { 
          data?: { 
            errors?: Record<string, string[]>;
            detail?: string;
          } | string 
        } 
      };
      
      const data = error?.response?.data;
      const errors = typeof data === "object" ? data?.errors : null;
      
      if (errors?.DuplicateUserName || errors?.DuplicateEmail) {
        setFieldErrors({ ...fieldErrors, email: "This email is already taken" });
      } else if (errors?.PasswordTooShort) {
        setFieldErrors({ ...fieldErrors, password: "Password must be at least 6 characters" });
      } else if (errors?.PasswordRequiresLower) {
        setFieldErrors({ ...fieldErrors, password: "Password must contain at least one lowercase letter" });
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    router.push("/home");
  };

  return (
    <>
      <form className={classes.container} onSubmit={handleSubmit}>
        <h2 className={classes.title}>Sign Up</h2>

        <div className={classes.formGroup}>
          <label className={classes.formLabel}>Username</label>
          <input
            type="text"
            className={fieldErrors.userName ? classes.inputError : classes.input}
            name="userName"
            value={account.userName}
            onChange={(e) => handleChange(e.target.name, e.target.value)}
          />
          {fieldErrors.userName && (
            <span className={classes.fieldError}>{fieldErrors.userName}</span>
          )}
        </div>

        <div className={classes.formGroup}>
          <label className={classes.formLabel}>Email</label>
          <input
            //type="email"
            className={fieldErrors.email ? classes.inputError : classes.input}
            name="email"
            value={account.email}
            onChange={(e) => handleChange(e.target.name, e.target.value)}
          />
          {fieldErrors.email && (
            <span className={classes.fieldError}>{fieldErrors.email}</span>
          )}
        </div>

        <div className={classes.formGroup}>
          <label className={classes.formLabel}>Phone Number</label>
          <input
            type="tel"
            className={fieldErrors.phoneNumber ? classes.inputError : classes.input}
            name="phoneNumber"
            value={account.phoneNumber}
            onChange={(e) => handleChange(e.target.name, e.target.value)}
          />
          {fieldErrors.phoneNumber && (
            <span className={classes.fieldError}>{fieldErrors.phoneNumber}</span>
          )}
        </div>

        <div className={classes.formGroup}>
          <label className={classes.formLabel}>Password</label>
          <input
            type="password"
            className={fieldErrors.password ? classes.inputError : classes.input}
            name="password"
            value={account.password}
            onChange={(e) => handleChange(e.target.name, e.target.value)}
          />
          {fieldErrors.password && (
            <span className={classes.fieldError}>{fieldErrors.password}</span>
          )}
        </div>

        <div className={classes.formGroup}>
          <label className={classes.formLabel}>Confirm Password</label>
          <input
            type="password"
            className={fieldErrors.confirmPassword ? classes.inputError : classes.input}
            name="confirmPassword"
            value={account.confirmPassword}
            onChange={(e) => handleChange(e.target.name, e.target.value)}
          />
          {fieldErrors.confirmPassword && (
            <span className={classes.fieldError}>{fieldErrors.confirmPassword}</span>
          )}
        </div>

        {error && <div className={classes.errorMessage}>{error}</div>}

        <button type="submit" className={classes.button} disabled={isSubmitting}>
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </button>

        <div className={classes.links}>
          Already have an account? <a href="/sign-in">Sign in</a>
        </div>
      </form>

      {showOnboarding && (
        <UniversityOnboardingModal
          email={loggedInEmail}
          onComplete={handleOnboardingComplete}
          forceShow={true}
        />
      )}
    </>
  );
};

export default SignUpPage;
