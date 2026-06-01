"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Tooltip from "@mui/material/Tooltip";
import LightboxImage from "@shared/ui/lightbox-image";
import VideoPlayer from "@shared/ui/video-player";
import { Blog } from "@entities/blog-post";
import { useMedia } from "@entities/media/lib/useMedia";
import { fetchImageWithFallbacks } from "@entities/image";
import { useUniversityTranslation } from "@shared/lib/universities/useUniversityTranslation";
import {
  getUniversityLogoBasePath,
  getFacultyLogoBasePath,
  getMajorWithYear,
} from "@shared/lib/universities";
import { UserLogo } from "../user-logo";
import { IconBar } from "./components";
import classes from "./blog-post.module.scss";

interface BlogPostProps extends Blog {
  className?: string;
  isLiked?: boolean;
  isCommented?: boolean;
  width?: number;
  height?: number;
}

const BlogPost = ({
  className,
  id,
  mediaKey,
  mediaType,
  user,
  description,
  isLiked,
  likeCount,
  isCommented,
  commentCount,
  width = 700,
}: BlogPostProps) => {
  const router = useRouter();
  const { mediaSrc } = useMedia(
    mediaKey || null,
    (mediaType as "image" | "video") || null,
  );

  const {
    logoKey: userLogoKey,
    userName,
    id: userId,
    universityDomain,
    facultyCode,
    majorKey,
    yearOfStudy,
  } = user;

  const [uniLogoUrl, setUniLogoUrl] = useState<string | null>(null);
  const [facultyLogoUrl, setFacultyLogoUrl] = useState<string | null>(null);

  const { translateUniversity, translateFaculty, translateMajor } =
    useUniversityTranslation();
  const translatedUniversity = translateUniversity(universityDomain);
  const translatedFaculty = translateFaculty(universityDomain, facultyCode);
  const translatedMajor = translateMajor(majorKey);
  const { major: majorAbbr, majorYear } = getMajorWithYear(
    majorKey,
    yearOfStudy,
  );
  const majorDisplayName = translatedMajor || "";

  useEffect(() => {
    if (!universityDomain) {
      setUniLogoUrl(null);
      return;
    }
    const basePath = getUniversityLogoBasePath(universityDomain);
    if (!basePath) return;
    fetchImageWithFallbacks(basePath, ["png", "svg", "jpg", "jpeg"])
      .then(setUniLogoUrl)
      .catch(() => setUniLogoUrl(null));
  }, [universityDomain]);

  useEffect(() => {
    if (!universityDomain || !facultyCode) {
      setFacultyLogoUrl(null);
      return;
    }
    const basePath = getFacultyLogoBasePath(universityDomain, facultyCode);
    if (!basePath) return;
    fetchImageWithFallbacks(basePath, ["png", "svg", "jpg", "jpeg"])
      .then(setFacultyLogoUrl)
      .catch(() => setFacultyLogoUrl(null));
  }, [universityDomain, facultyCode]);

  const goToDetails = () => {
    router.push(`details?id=${id}`);
  };

  const goToUserPosts = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/user-posts?id=${userId}`);
  };

  const goToUniversityMembers = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push("/university-members");
  };

  const goToFacultyMembers = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!facultyCode) return;
    router.push(
      `/university-members/faculty?facultyCode=${encodeURIComponent(facultyCode)}`,
    );
  };

  const goToMajorMembers = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!majorKey || !facultyCode) return;
    router.push(
      `/university-members/major?facultyCode=${encodeURIComponent(facultyCode)}&majorKey=${encodeURIComponent(majorKey)}`,
    );
  };

  const goToMajorYearMembers = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!majorKey || !facultyCode || !yearOfStudy) return;
    router.push(
      `/university-members/major-year?facultyCode=${encodeURIComponent(facultyCode)}&majorKey=${encodeURIComponent(majorKey)}&yearOfStudy=${yearOfStudy}`,
    );
  };

  return (
    <div
      className={`${classes.blogPostContainer} ${className}`}
      onClick={goToDetails}
    >
      <div className={classes.avatarColumn}>
        <UserLogo
          className={classes.userLogo}
          logoKey={userLogoKey}
          size={50}
          onClick={goToUserPosts}
        />
      </div>
      <div className={classes.contentColumn}>
        <div className={classes.userHeader}>
          <p className={classes.userName} onClick={goToUserPosts}>
            {userName}
          </p>
          {(uniLogoUrl || facultyLogoUrl || majorAbbr) && (
            <div className={classes.affiliationLogos}>
              {uniLogoUrl && (
                <Tooltip
                  title={
                    <div className={classes.logoTooltip}>
                      <img
                        src={uniLogoUrl}
                        alt="University"
                        className={classes.tooltipLogo}
                      />
                      <span>{translatedUniversity || "University"}</span>
                    </div>
                  }
                  arrow
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: "white",
                        color: "#1d1d1f",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        "& .MuiTooltip-arrow": { color: "white" },
                      },
                    },
                  }}
                >
                  <img
                    src={uniLogoUrl}
                    alt="University"
                    className={classes.affiliationLogo}
                    onClick={goToUniversityMembers}
                  />
                </Tooltip>
              )}
              {facultyLogoUrl && (
                <Tooltip
                  title={
                    <div className={classes.logoTooltip}>
                      <img
                        src={facultyLogoUrl}
                        alt="Faculty"
                        className={classes.tooltipLogo}
                      />
                      <span>{translatedFaculty || "Faculty"}</span>
                    </div>
                  }
                  arrow
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: "white",
                        color: "#1d1d1f",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        "& .MuiTooltip-arrow": { color: "white" },
                      },
                    },
                  }}
                >
                  <img
                    src={facultyLogoUrl}
                    alt="Faculty"
                    className={classes.affiliationLogo}
                    onClick={goToFacultyMembers}
                  />
                </Tooltip>
              )}
              {majorAbbr && (
                <Tooltip
                  title={majorDisplayName}
                  arrow
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: "white",
                        color: "#1d1d1f",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        fontSize: "13px",
                        fontWeight: 500,
                        "& .MuiTooltip-arrow": { color: "white" },
                      },
                    },
                  }}
                >
                  <span
                    className={classes.majorChip}
                    onClick={goToMajorMembers}
                  >
                    {majorAbbr}
                  </span>
                </Tooltip>
              )}
              {majorYear && (
                <Tooltip
                  title={majorDisplayName}
                  arrow
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: "white",
                        color: "#1d1d1f",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        fontSize: "13px",
                        fontWeight: 500,
                        "& .MuiTooltip-arrow": { color: "white" },
                      },
                    },
                  }}
                >
                  <span
                    className={classes.majorYearChip}
                    onClick={goToMajorYearMembers}
                  >
                    {majorYear}
                  </span>
                </Tooltip>
              )}
            </div>
          )}
        </div>
        <div className={classes.blogPostLabel}>{description}</div>
        {mediaType === "video" && mediaSrc ? (
          <VideoPlayer
            src={mediaSrc}
            width={width}
            className={classes.blogPostImage}
          />
        ) : mediaType === "image" && mediaSrc ? (
          <LightboxImage
            className={`${classes.blogPostImage}`}
            src={mediaSrc}
            width={width}
            alt="post"
          />
        ) : null}
        <IconBar
          id={id}
          isLiked={isLiked ?? false}
          likeCount={likeCount}
          isCommented={isCommented ?? false}
          commentCount={commentCount}
          width={width}
        />
      </div>
    </div>
  );
};

export default BlogPost;
