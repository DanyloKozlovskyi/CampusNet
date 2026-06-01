"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@shared/lib/hooks/useCurrentUser";
import {
  useUniversityStore,
  getUniversityPeers,
  UniversityPeer,
} from "@entities/university";
import { fetchImageWithFallbacks } from "@entities/image";
import { useUniversityTranslation } from "@shared/lib/universities/useUniversityTranslation";
import {
  getFacultyLogoBasePath,
  getMajorWithYear,
} from "@shared/lib/universities";
import NoResultsFound from "@shared/ui/no-results-found";
import Loader from "@shared/ui/loader";
import UniversityMemberCard from "../university-member-card";
import classes from "../university-members.module.scss";

const PAGE_SIZE = 20;

type FilterType = "faculty" | "major" | "major-year";

export default function FilteredMembersPage({
  params,
}: {
  params: { filter: FilterType };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { universityEmailVerified } = useCurrentUser();
  const { universityDomain } = useUniversityStore();
  const { translateFaculty, translateMajor } = useUniversityTranslation();

  const filterType = params.filter;
  const facultyCode = searchParams.get("facultyCode");
  const majorKey = searchParams.get("majorKey");
  const yearOfStudy = searchParams.get("yearOfStudy");

  const [members, setMembers] = useState<UniversityPeer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const translatedFaculty = translateFaculty(universityDomain, facultyCode);
  const translatedMajor = translateMajor(majorKey);
  const { major: majorAbbr, majorYear } = getMajorWithYear(
    majorKey,
    yearOfStudy ? parseInt(yearOfStudy) : null,
  );

  // Redirect if user doesn't have verified university email
  useEffect(() => {
    if (!universityEmailVerified) {
      router.push("/home");
    }
  }, [universityEmailVerified, router]);

  // Fetch faculty logo
  useEffect(() => {
    if (!universityDomain || !facultyCode) {
      setLogoUrl(null);
      return;
    }
    const basePath = getFacultyLogoBasePath(universityDomain, facultyCode);
    if (!basePath) return;
    fetchImageWithFallbacks(basePath, ["png", "svg", "jpg", "jpeg"])
      .then(setLogoUrl)
      .catch(() => setLogoUrl(null));
  }, [universityDomain, facultyCode]);

  const loadMembers = useCallback(
    async (isNext = false, currentPage = 1) => {
      if (!universityDomain) return;

      setIsLoading(true);
      try {
        const result = await getUniversityPeers(
          universityDomain,
          facultyCode ?? undefined,
          filterType === "major" || filterType === "major-year"
            ? majorKey ?? undefined
            : undefined,
          filterType === "major-year" && yearOfStudy
            ? parseInt(yearOfStudy)
            : undefined,
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
        console.error("Error fetching filtered members", err);
        if (!isNext) setMembers([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [universityDomain, facultyCode, majorKey, yearOfStudy, filterType],
  );

  // Initial load
  useEffect(() => {
    if (universityEmailVerified && universityDomain) {
      setMembers([]);
      setPage(1);
      setHasMore(true);
      loadMembers(false, 1);
    }
  }, [
    universityDomain,
    facultyCode,
    majorKey,
    yearOfStudy,
    universityEmailVerified,
    loadMembers,
  ]);

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

  const getTitle = () => {
    switch (filterType) {
      case "faculty":
        return translatedFaculty || facultyCode || "Faculty";
      case "major":
        return translatedMajor || majorKey || "Major";
      case "major-year":
        return `${translatedMajor || majorKey || "Major"} - Year ${yearOfStudy}`;
      default:
        return "Members";
    }
  };

  const getSubtitle = () => {
    switch (filterType) {
      case "faculty":
        return "Faculty Members";
      case "major":
        return `${majorAbbr || ""} Students`;
      case "major-year":
        return `${majorYear || ""} Students`;
      default:
        return "Members";
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Faculty"
            className={classes.universityLogo}
          />
        )}
        <div className={classes.headerInfo}>
          <h1 className={classes.title}>{getTitle()}</h1>
          <p className={classes.subtitle}>{getSubtitle()}</p>
        </div>
      </div>

      <button
        className={classes.backButton}
        onClick={() => router.push("/university-members")}
        type="button"
      >
        ← Back to University Members
      </button>

      <div className={classes.membersList}>
        {members.map((member, idx) => {
          const isLast = idx === members.length - 1;
          return (
            <div key={member.id} ref={isLast ? lastMemberRef : null}>
              <UniversityMemberCard
                member={member}
                showFacultyLogo={filterType !== "faculty"}
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
