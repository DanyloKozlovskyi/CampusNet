"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatIcon from "@mui/icons-material/Chat";
import Tooltip from "@mui/material/Tooltip";
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getUserId,
} from "@entities/user";
import { fetchImageWithFallbacks } from "@entities/image";
import { UserLogo } from "@core-components/user-logo";
import { useChatStore } from "@features/chat/model/store";
import { UniversityPeer } from "@entities/university";
import { useUniversityTranslation } from "@shared/lib/universities/useUniversityTranslation";
import {
  getFacultyLogoBasePath,
  getMajorWithYear,
} from "@shared/lib/universities";
import classes from "./university-member-card.module.scss";

type Props = {
  member: UniversityPeer;
  showFacultyLogo?: boolean;
};

export default function UniversityMemberCard({
  member,
  showFacultyLogo = false,
}: Props) {
  const router = useRouter();
  const { openChatWithUser } = useChatStore();
  const { translateFaculty, translateMajor } = useUniversityTranslation();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [facultyLogoUrl, setFacultyLogoUrl] = useState<string | null>(null);

  const { major: majorAbbr, majorYear } = getMajorWithYear(
    member.majorKey,
    member.yearOfStudy,
  );

  const translatedFaculty = translateFaculty(
    member.universityDomain,
    member.facultyCode,
  );
  const translatedMajor = translateMajor(member.majorKey);
  const majorDisplayName = translatedMajor || member.major || "";

  // Fetch faculty logo when in university view
  useEffect(() => {
    if (!showFacultyLogo || !member.universityDomain || !member.facultyCode) {
      setFacultyLogoUrl(null);
      return;
    }
    const basePath = getFacultyLogoBasePath(
      member.universityDomain,
      member.facultyCode,
    );
    if (!basePath) return;
    fetchImageWithFallbacks(basePath, ["png", "svg", "jpg", "jpeg"])
      .then(setFacultyLogoUrl)
      .catch(() => setFacultyLogoUrl(null));
  }, [showFacultyLogo, member.universityDomain, member.facultyCode]);

  useEffect(() => {
    const checkFollowStatus = async () => {
      const currentUserId = await getUserId();
      setIsCurrentUser(currentUserId === member.id);
      if (currentUserId && currentUserId !== member.id) {
        const status = await getFollowStatus(member.id);
        setIsFollowing(status?.isFollowing ?? false);
      }
    };
    checkFollowStatus();
  }, [member.id]);

  const goToUserPosts = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    router.push(`/user-posts?id=${userId}`);
  };

  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    openChatWithUser(member.id);
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(member.id);
        setIsFollowing(false);
      } else {
        await followUser(member.id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Follow action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAcademicRoleLabel = (role: string | null) => {
    switch (role) {
      case "student":
        return "Student";
      case "lecturer":
        return "Lecturer";
      case "ta":
        return "Teaching Assistant";
      case "alumni":
        return "Alumni";
      default:
        return null;
    }
  };

  const goToFacultyMembers = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!member.facultyCode) return;
    router.push(
      `/university-members/faculty?facultyCode=${encodeURIComponent(member.facultyCode)}`,
    );
  };

  const goToMajorMembers = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!member.majorKey || !member.facultyCode) return;
    router.push(
      `/university-members/major?facultyCode=${encodeURIComponent(member.facultyCode)}&majorKey=${encodeURIComponent(member.majorKey)}`,
    );
  };

  const goToMajorYearMembers = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!member.majorKey || !member.facultyCode || !member.yearOfStudy) return;
    router.push(
      `/university-members/major-year?facultyCode=${encodeURIComponent(member.facultyCode)}&majorKey=${encodeURIComponent(member.majorKey)}&yearOfStudy=${member.yearOfStudy}`,
    );
  };

  return (
    <div className={classes.card} onClick={(e) => goToUserPosts(e, member.id)}>
      <UserLogo logoKey={member.logoKey} className={classes.avatar} size={56} />

      <div className={classes.info}>
        <div className={classes.nameRow}>
          <span className={classes.name}>{member.name}</span>
          {member.academicRole && (
            <span className={classes.roleBadge}>
              {getAcademicRoleLabel(member.academicRole)}
            </span>
          )}
          {facultyLogoUrl && (
            <Tooltip
              title={
                <div className={classes.facultyTooltip}>
                  <img
                    src={facultyLogoUrl}
                    alt="Faculty"
                    className={classes.facultyTooltipLogo}
                  />
                  <span>{translatedFaculty || member.facultyName}</span>
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
                    "& .MuiTooltip-arrow": {
                      color: "white",
                    },
                  },
                },
              }}
            >
              <img
                src={facultyLogoUrl}
                alt="Faculty"
                className={classes.facultyLogo}
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
                    "& .MuiTooltip-arrow": {
                      color: "white",
                    },
                  },
                },
              }}
            >
              <span className={classes.majorChip} onClick={goToMajorMembers}>
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
                    "& .MuiTooltip-arrow": {
                      color: "white",
                    },
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
      </div>

      <div className={classes.actions}>
        <button
          className={classes.messageBtn}
          onClick={handleMessage}
          type="button"
        >
          <ChatIcon />
        </button>
        {!isCurrentUser && (
          <button
            className={`${classes.followButton} ${isFollowing ? classes.following : ""}`}
            onClick={handleFollow}
            disabled={isLoading}
            type="button"
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
    </div>
  );
}
