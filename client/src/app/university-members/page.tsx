"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@shared/lib/hooks/useCurrentUser";
import {
  useUniversityStore,
  getUniversityPeers,
  UniversityPeer,
} from "@entities/university";
import { fetchImageWithFallbacks } from "@entities/image";
import { useUniversityTranslation } from "@shared/lib/universities/useUniversityTranslation";
import NoResultsFound from "@shared/ui/no-results-found";
import Loader from "@shared/ui/loader";
import UniversityMemberCard from "./university-member-card";
import classes from "./university-members.module.scss";

const PAGE_SIZE = 20;

export default function UniversityMembersPage() {
  const router = useRouter();
  const { universityEmailVerified } = useCurrentUser();
  const { universityDomain, universityName, facultyCode, facultyName, scope } =
    useUniversityStore();
  const { translateUniversity, translateFaculty } = useUniversityTranslation();

  const [members, setMembers] = useState<UniversityPeer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const translatedUniName = translateUniversity(universityDomain);
  const translatedFacultyName = translateFaculty(universityDomain, facultyCode);

  // Redirect if user doesn't have verified university email
  useEffect(() => {
    if (!universityEmailVerified) {
      router.push("/home");
    }
  }, [universityEmailVerified, router]);

  // Fetch university logo
  useEffect(() => {
    if (!universityDomain) return;
    fetchImageWithFallbacks(`universities/${universityDomain}/logo`, [
      "png",
      "svg",
      "jpg",
      "jpeg",
    ])
      .then(setLogoUrl)
      .catch(() => setLogoUrl(null));
  }, [universityDomain]);

  const loadMembers = useCallback(
    async (isNext = false, currentPage = 1) => {
      if (!universityDomain) return;

      setIsLoading(true);
      try {
        const facultyFilter = scope === "faculty" ? facultyCode : undefined;
        const result = await getUniversityPeers(
          universityDomain,
          facultyFilter ?? undefined,
          undefined, // majorKey
          undefined, // yearOfStudy
          currentPage,
          PAGE_SIZE,
        );

        if (!isNext) {
          setMembers(result);
          setPage(2);
        } else {
          setMembers((prev) => [...prev, ...result]);
          setPage((prev) => prev + 1);
        }
        setHasMore(result.length === PAGE_SIZE);
      } catch (err) {
        console.error("Error fetching university members", err);
        if (!isNext) setMembers([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [universityDomain, facultyCode, scope],
  );

  // Initial load and reload when scope changes
  useEffect(() => {
    if (universityEmailVerified && universityDomain) {
      setMembers([]);
      setPage(1);
      setHasMore(true);
      loadMembers(false, 1);
    }
  }, [universityDomain, scope, universityEmailVerified, loadMembers]);

  const lastMemberRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMembers(true, page);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, loadMembers, page],
  );

  if (!universityEmailVerified) {
    return null;
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        {logoUrl && (
          <img
            src={logoUrl}
            alt={universityName ?? "University"}
            className={classes.universityLogo}
          />
        )}
        <div className={classes.headerInfo}>
          <h1 className={classes.title}>
            {translatedUniName || universityName || universityDomain}
          </h1>
          <p className={classes.subtitle}>
            {scope === "faculty"
              ? translatedFacultyName || facultyName || "Faculty Members"
              : "University Members"}
          </p>
        </div>
      </div>

      <div className={classes.scopeTabs}>
        <button
          className={`${classes.tab} ${scope === "university" ? classes.activeTab : ""}`}
          onClick={() => useUniversityStore.getState().setScope("university")}
          type="button"
        >
          All University
        </button>
        <button
          className={`${classes.tab} ${scope === "faculty" ? classes.activeTab : ""}`}
          onClick={() => useUniversityStore.getState().setScope("faculty")}
          type="button"
        >
          {(translatedFacultyName || facultyName)
            ?.split(" ")
            .slice(0, 2)
            .join(" ") || "My Faculty"}
        </button>
      </div>

      <div className={classes.membersList}>
        {members.map((member, idx) => {
          const isLast = idx === members.length - 1;
          return (
            <div key={member.id} ref={isLast ? lastMemberRef : null}>
              <UniversityMemberCard
                member={member}
                showFacultyLogo={scope === "university"}
              />
            </div>
          );
        })}
        <Loader
          isLoading={isLoading}
          className={
            members.length > 0
              ? classes.loaderWrapperBottom
              : classes.loaderWrapperTop
          }
        />
        {!hasMore && !isLoading && (
          <NoResultsFound
            label={
              members.length > 0 ? "No more members." : "No members found."
            }
          />
        )}
      </div>
    </div>
  );
}
