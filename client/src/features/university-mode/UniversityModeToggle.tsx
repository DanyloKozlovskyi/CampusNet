"use client";

import { useEffect, useState } from "react";
import { useUniversityStore } from "@entities/university";
import { fetchImageWithFallbacks } from "@entities/image";
import { useUniversityTranslation } from "@shared/lib/universities/useUniversityTranslation";
import classes from "./university-mode.module.scss";

const UniversityModeToggle = () => {
  const {
    isUniversityMode,
    setUniversityMode,
    scope,
    setScope,
    universityDomain,
    universityName,
    facultyCode,
    facultyName,
  } = useUniversityStore();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { translateUniversity, translateFaculty } = useUniversityTranslation();
  const translatedUniName = translateUniversity(universityDomain);
  const translatedFacultyName = translateFaculty(universityDomain, facultyCode);

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

  // Don't render if user has no university
  if (!universityDomain || universityDomain === "null") return null;

  const handleToggle = () => {
    setUniversityMode(!isUniversityMode);
  };

  return (
    <div
      className={isUniversityMode ? classes.containerActive : classes.container}
    >
      {logoUrl && (
        <img
          src={logoUrl}
          alt={universityName ?? ""}
          className={classes.uniLogo}
        />
      )}
      <div className={classes.info}>
        <div className={classes.title}>
          {translatedUniName || universityName || universityDomain}
        </div>
        <div className={classes.subtitle}>University Mode</div>
        {isUniversityMode && (
          <div className={classes.scopePills}>
            <button
              className={
                scope === "university" ? classes.pillActive : classes.pill
              }
              onClick={() => setScope("university")}
              type="button"
            >
              University
            </button>
            <button
              className={
                scope === "faculty" ? classes.pillActive : classes.pill
              }
              onClick={() => setScope("faculty")}
              type="button"
            >
              {(translatedFacultyName || facultyName)
                ?.split(" ")
                .slice(0, 2)
                .join(" ") || "Faculty"}
            </button>
          </div>
        )}
      </div>
      <div className={classes.toggleWrapper}>
        <button
          className={isUniversityMode ? classes.toggleActive : classes.toggle}
          onClick={handleToggle}
          type="button"
          aria-label="Toggle university mode"
        />
      </div>
    </div>
  );
};

export { UniversityModeToggle };
