"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login, saveTokens } from "@entities/auth";
import { getPersonalInfo } from "@entities/user";
import { useUniversityStore } from "@entities/university";
import { setCookie } from "@shared/api";
import classes from "./sign-in.module.scss";

interface FieldErrors {
  email?: string;
  password?: string;
}

const SignInPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [account, setAccount] = useState({
    email: "",
    password: "",
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { setUniversityInfo } = useUniversityStore();

  useEffect(() => {
    if (searchParams.get("banned") === "true") {
      setLoginError("Your account has been banned. Please contact support.");
    }
  }, [searchParams]);

  const handleChange = (field: string, value: string) => {
    setAccount((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors({ ...fieldErrors, [field]: undefined });
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!account.email.trim()) {
      errors.email = "Email can't be blank";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) {
      errors.email = "Email should be in a proper email address format";
    }

    if (!account.password) {
      errors.password = "Password can't be blank";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await login(account);
      saveTokens(response);

      // Save email for university detection
      const email = response.email || account.email;
      setCookie("user_email", email);

      // Fetch personal info to restore university state from database
      try {
        const userInfo = await getPersonalInfo();
        if (userInfo && userInfo.universityDomain) {
          setUniversityInfo({
            universityDomain: userInfo.universityDomain ?? null,
            universityName: userInfo.universityName ?? null,
            facultyCode: userInfo.facultyCode ?? null,
            facultyName: userInfo.facultyName ?? null,
            major: userInfo.major ?? null,
            majorKey: userInfo.majorKey ?? null,
            yearOfStudy: userInfo.yearOfStudy ?? null,
          });
        }
      } catch (err) {
        console.error("Could not fetch personal info after login", err);
      }

      router.push("/home");
    } catch (err: unknown) {
      console.error("Sign-in failed:", err);
      const error = err as { 
        response?: { 
          data?: { 
            errors?: Record<string, string[]>;
          } 
        } 
      };
      
      const errors = error?.response?.data?.errors;
      
      if (errors?.UserBanned) {
        setLoginError(errors.UserBanned[0] || "Your account has been banned");
      } else if (errors?.InvalidCredentials) {
        setLoginError("Invalid email or password");
      } else {
        setLoginError("Sign in failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={classes.container}>
      <h2 className={classes.title}>Sign In</h2>

      <div className={classes.formGroup}>
        <label className={classes.formLabel}>Email</label>
        <input
          //type="email"
          className={fieldErrors.email ? classes.inputError : classes.input}
          value={account.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        {fieldErrors.email && (
          <span className={classes.fieldError}>{fieldErrors.email}</span>
        )}
      </div>

      <div className={classes.formGroup}>
        <label className={classes.formLabel}>Password</label>
        <input
          type="password"
          className={fieldErrors.password ? classes.inputError : classes.input}
          value={account.password}
          onChange={(e) => handleChange("password", e.target.value)}
        />
        {fieldErrors.password && (
          <span className={classes.fieldError}>{fieldErrors.password}</span>
        )}
      </div>

      {loginError && <div className={classes.errorMessage}>{loginError}</div>}

      <button type="submit" className={classes.button} disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>

      <div className={classes.links}>
        Don&apos;t have an account? <a href="/sign-up">Sign up</a>
      </div>
    </form>
  );
};

export default SignInPage;
