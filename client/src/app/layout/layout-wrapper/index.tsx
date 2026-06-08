"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ClientIntlProvider } from "@app/providers";
import { AuthLayout, MainLayout } from "@app/layout/index";
import { getCookie } from "@shared/api/helpers";
import { SplashScreen } from "@shared/ui/splash-screen";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";
  const isErrorPage = pathname === "/something-went-wrong";
  const isPublicPage = isAuthPage || isErrorPage;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const token = getCookie("access_token");
      if (!token && !isPublicPage) {
        router.push("/sign-in");
      }
    }
  }, [pathname, router, isPublicPage, isMounted]);

  if (!isMounted && !isPublicPage) {
    return null;
  }

  const token = getCookie("access_token");
  if (!token && !isPublicPage) {
    return null;
  }

  return (
    <SplashScreen>
      <ClientIntlProvider>
        {isAuthPage ? (
          <AuthLayout>{children}</AuthLayout>
        ) : isErrorPage ? (
          <>{children}</>
        ) : (
          <MainLayout>{children}</MainLayout>
        )}
      </ClientIntlProvider>
    </SplashScreen>
  );
}
