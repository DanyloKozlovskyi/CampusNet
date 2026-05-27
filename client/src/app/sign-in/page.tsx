"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@shared/ui/inputs/input";
import Button from "@shared/ui/buttons/button";
import { login, saveTokens } from "@entities/auth";
import { getPersonalInfo } from "@entities/user";
import { useUniversityStore } from "@entities/university";
import { setCookie } from "@shared/api";
import classes from "./sign-in.module.scss";

const SignInPage = () => {
  const router = useRouter();

  const [account, setAccount] = useState({
    email: "",
    password: "",
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const { setUniversityInfo } = useUniversityStore();

  const handleChange = (field: string, value: string) => {
    setAccount((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
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
    } catch (err) {
      console.error("Sign-in failed:", err);
      setLoginError("Invalid email or password");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={classes.container}>
      <h2 className={classes.title}>Sign In</h2>
      <Input
        type="email"
        placeholder="Email"
        value={account.email}
        onChange={(e) => handleChange("email", e.target.value)}
        className={classes.input}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={account.password}
        onChange={(e) => handleChange("password", e.target.value)}
        className={classes.input}
        required
      />
      {loginError && (
        <div className={classes.errorMessage}>{loginError}</div>
      )}
      <Button type="submit" className={classes.button}>
        Sign In
      </Button>

      <div className={classes.links}>
        <a href="/sign-up">Sign up</a>
      </div>
    </form>
  );
};

export default SignInPage;
