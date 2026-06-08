"use client";

import { useState, useEffect, useRef } from "react";
import { Fade } from "@mui/material";
import Image from "next/image";
import classes from "./splash-screen.module.scss";

interface SplashScreenProps {
  children: React.ReactNode;
  duration?: number;
}

const SPLASH_SHOWN_KEY = "campusnet_splash_shown";

export const SplashScreen = ({ children, duration = 2500 }: SplashScreenProps) => {
  const [showSplash, setShowSplash] = useState<boolean | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const timersRef = useRef<{ fade?: NodeJS.Timeout; hide?: NodeJS.Timeout }>({});

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem(SPLASH_SHOWN_KEY);
    
    if (hasSeenSplash) {
      setShowSplash(false);
    } else {
      setShowSplash(true);
      sessionStorage.setItem(SPLASH_SHOWN_KEY, "true");
      
      timersRef.current.fade = setTimeout(() => {
        setFadeOut(true);
      }, duration);

      timersRef.current.hide = setTimeout(() => {
        setShowSplash(false);
      }, duration + 500);
    }

    return () => {
      if (timersRef.current.fade) clearTimeout(timersRef.current.fade);
      if (timersRef.current.hide) clearTimeout(timersRef.current.hide);
    };
  }, [duration]);

  if (showSplash === null) {
    return null;
  }

  if (showSplash) {
    return (
      <div className={classes.splashContainer}>
        <Fade in={!fadeOut} timeout={500}>
          <div className={classes.splashContent}>
            <Fade in timeout={1500}>
              <div className={classes.logoWrapper}>
                <Image
                  src="/logo.svg"
                  alt="CampusNet"
                  width={300}
                  height={300}
                  priority
                />
              </div>
            </Fade>
          </div>
        </Fade>
      </div>
    );
  }

  return <>{children}</>;
};

export default SplashScreen;
