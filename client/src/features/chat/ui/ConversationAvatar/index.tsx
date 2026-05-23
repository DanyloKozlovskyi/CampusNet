"use client";
import React from "react";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import { ConversationType } from "@entities/chat";
import { UserLogo } from "@core-components/user-logo";
import classes from "./ConversationAvatar.module.scss";

interface ConversationAvatarProps {
  type: ConversationType;
  logoUrl: string | null;
  name?: string | null;
  fallbackLogoKey?: string | null;
  size?: "small" | "large";
}

export const ConversationAvatar: React.FC<ConversationAvatarProps> = ({
  type,
  logoUrl,
  name,
  fallbackLogoKey,
  size = "small",
}) => {
  const sizeClass = size === "large" ? classes.large : classes.small;

  if (type === ConversationType.Major) {
    return (
      <div
        className={`${classes.avatar} ${classes.iconAvatar} ${classes.majorIcon} ${sizeClass}`}
      >
        <MenuBookIcon />
      </div>
    );
  }

  if (type === ConversationType.MajorYear) {
    return (
      <div
        className={`${classes.avatar} ${classes.iconAvatar} ${classes.yearIcon} ${sizeClass}`}
      >
        <CalendarTodayIcon />
      </div>
    );
  }

  const isUniversityType =
    type === ConversationType.University || type === ConversationType.Faculty;

  if (isUniversityType && logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name || "Conversation"}
        className={`${classes.avatar} ${sizeClass}`}
      />
    );
  }

  if (fallbackLogoKey) {
    return (
      <UserLogo
        className={`${classes.avatar} ${sizeClass}`}
        logoKey={fallbackLogoKey}
        size={size === "large" ? 80 : 40}
      />
    );
  }

  return (
    <div
      className={`${classes.avatar} ${classes.iconAvatar} ${classes.defaultIcon} ${sizeClass}`}
    >
      <PeopleIcon />
    </div>
  );
};
