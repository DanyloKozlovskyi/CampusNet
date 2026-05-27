"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GroupsIcon from "@mui/icons-material/Groups";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useUniversityStore } from "@entities/university";
import { chatApi } from "@entities/chat";
import { fetchImageWithFallbacks } from "@entities/image";
import {
  getUniversityLogoBasePath,
  getFacultyLogoBasePath,
} from "@shared/lib/universities";
import { useUniversityTranslation } from "@shared/lib/universities/useUniversityTranslation";
import { useCurrentUser } from "@shared/lib/hooks/useCurrentUser";
import { useIntl } from "react-intl";
import EmailIcon from "@mui/icons-material/Email";
import classes from "./university-chat.module.scss";

const UniversityChatPanel = () => {
  const router = useRouter();
  const {
    isUniversityMode,
    universityDomain,
    universityName,
    facultyCode,
    facultyName,
    major,
    majorKey,
    yearOfStudy,
  } = useUniversityStore();
  const { universityEmailVerified } = useCurrentUser();

  const [uniLogoUrl, setUniLogoUrl] = useState<string | null>(null);
  const [facultyLogoUrl, setFacultyLogoUrl] = useState<string | null>(null);
  const { translateUniversity, translateFaculty, translateMajor } =
    useUniversityTranslation();

  const translatedUniName = translateUniversity(universityDomain);
  const translatedFacultyName = translateFaculty(universityDomain, facultyCode);
  const translatedMajor = translateMajor(majorKey);
  const intl = useIntl();
  const yearLabel = intl.formatMessage({
    id: "chat.year",
    defaultMessage: "Year",
  });

  useEffect(() => {
    if (!universityDomain) return;
    const basePath = getUniversityLogoBasePath(universityDomain);
    if (!basePath) return;
    fetchImageWithFallbacks(basePath, ["png", "svg", "jpg", "jpeg"])
      .then(setUniLogoUrl)
      .catch(() => setUniLogoUrl(null));
  }, [universityDomain]);

  useEffect(() => {
    if (!universityDomain || !facultyCode) return;
    const basePath = getFacultyLogoBasePath(universityDomain, facultyCode);
    if (!basePath) return;
    fetchImageWithFallbacks(basePath, ["png", "svg", "jpg", "jpeg"])
      .then(setFacultyLogoUrl)
      .catch(() => setFacultyLogoUrl(null));
  }, [universityDomain, facultyCode]);

  if (!isUniversityMode || !universityDomain) return null;

  if (!universityEmailVerified) {
    return (
      <div className={classes.panel}>
        <div className={classes.panelTitle}>Community Chats</div>
        <div className={classes.verificationRequired}>
          <div className={classes.verificationIcon}>
            <EmailIcon fontSize="large" color="action" />
          </div>
          <div className={classes.verificationText}>
            Verify your university email to access community chats
          </div>
        </div>
      </div>
    );
  }

  const handleJoinUniChat = async () => {
    try {
      const { conversationId } = await chatApi.joinUniversityChat(
        universityDomain,
        universityName ?? universityDomain,
      );
      router.push(`/chat?conversation=${conversationId}`);
    } catch {
      router.push("/chat");
    }
  };

  const handleJoinFacultyChat = async () => {
    if (!facultyCode) return;
    try {
      const { conversationId } = await chatApi.joinFacultyChat(
        universityDomain,
        facultyCode,
        facultyName ?? facultyCode,
      );
      router.push(`/chat?conversation=${conversationId}`);
    } catch {
      router.push("/chat");
    }
  };

  const handleJoinMajorChat = async () => {
    if (!facultyCode || !major || !majorKey) return;
    try {
      const { conversationId } = await chatApi.joinMajorChat(
        universityDomain,
        facultyCode,
        majorKey,
        major,
      );
      router.push(`/chat?conversation=${conversationId}`);
    } catch {
      router.push("/chat");
    }
  };

  const handleJoinMajorYearChat = async () => {
    if (!facultyCode || !major || !majorKey || !yearOfStudy) return;
    try {
      const { conversationId } = await chatApi.joinMajorYearChat(
        universityDomain,
        facultyCode,
        majorKey,
        major,
        yearOfStudy,
      );
      router.push(`/chat?conversation=${conversationId}`);
    } catch {
      router.push("/chat");
    }
  };

  return (
    <div className={classes.panel}>
      <div className={classes.panelTitle}>Community Chats</div>

      <div className={classes.chatLink} onClick={handleJoinUniChat}>
        <div className={classes.uniChatIcon}>
          {uniLogoUrl ? (
            <img
              src={uniLogoUrl}
              alt="University"
              className={classes.chatLogo}
            />
          ) : (
            <GroupsIcon fontSize="inherit" />
          )}
        </div>
        <div className={classes.chatInfo}>
          <div className={classes.chatName}>
            {translatedUniName || universityDomain}
          </div>
          <div className={classes.chatDesc}>University-wide chat</div>
        </div>
        <ChevronRightIcon className={classes.joinArrow} fontSize="inherit" />
      </div>

      {facultyCode && (
        <div className={classes.chatLink} onClick={handleJoinFacultyChat}>
          <div className={classes.facultyChatIcon}>
            {facultyLogoUrl ? (
              <img
                src={facultyLogoUrl}
                alt="Faculty"
                className={classes.chatLogo}
              />
            ) : (
              <GroupsIcon fontSize="inherit" />
            )}
          </div>
          <div className={classes.chatInfo}>
            <div className={classes.chatName}>
              {translatedFacultyName || facultyCode}
            </div>
            <div className={classes.chatDesc}>Faculty chat</div>
          </div>
          <ChevronRightIcon className={classes.joinArrow} fontSize="inherit" />
        </div>
      )}

      {facultyCode && major && (
        <div className={classes.chatLink} onClick={handleJoinMajorChat}>
          <div className={classes.majorChatIcon}>
            <MenuBookIcon fontSize="inherit" />
          </div>
          <div className={classes.chatInfo}>
            <div className={classes.chatName}>{translatedMajor || major}</div>
            <div className={classes.chatDesc}>Major chat</div>
          </div>
          <ChevronRightIcon className={classes.joinArrow} fontSize="inherit" />
        </div>
      )}

      {facultyCode && major && yearOfStudy && (
        <div className={classes.chatLink} onClick={handleJoinMajorYearChat}>
          <div className={classes.yearChatIcon}>
            <CalendarTodayIcon fontSize="inherit" />
          </div>
          <div className={classes.chatInfo}>
            <div className={classes.chatName}>
              {translatedMajor || major} – {yearLabel} {yearOfStudy}
            </div>
            <div className={classes.chatDesc}>Classmates chat</div>
          </div>
          <ChevronRightIcon className={classes.joinArrow} fontSize="inherit" />
        </div>
      )}
    </div>
  );
};

export { UniversityChatPanel };
