import React, { useState, useEffect } from "react";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { fetchImageWithFallbacks } from "@entities/image";
import {
  getUniversityLogoBasePath,
  getFacultyLogoBasePath,
} from "@shared/lib/universities";
import { useUniversityTranslation } from "@shared/lib/universities/useUniversityTranslation";
import {
  Conversation,
  ConversationType,
  isUniversityChatType,
} from "../../model/types";
import { ConversationAvatar } from "../ConversationAvatar";
import classes from "./ConversationItem.module.scss";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId?: string;
  onClick: () => void;
  onLeave?: (conversationId: string) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  currentUserId,
  onClick,
  onLeave,
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const isUniversityType = isUniversityChatType(conversation.type);
  const { translateConversationName } = useUniversityTranslation();

  useEffect(() => {
    // Major and MajorYear use icons, not logos
    if (
      conversation.type === ConversationType.Major ||
      conversation.type === ConversationType.MajorYear
    ) {
      return;
    }

    if (!isUniversityType || !conversation.universityDomain) return;

    let basePath: string | null = null;

    if (
      conversation.type === ConversationType.Faculty &&
      conversation.facultyCode
    ) {
      basePath = getFacultyLogoBasePath(
        conversation.universityDomain,
        conversation.facultyCode,
      );
    }

    if (!basePath && conversation.type === ConversationType.University) {
      basePath = getUniversityLogoBasePath(conversation.universityDomain);
    }

    if (!basePath) {
      basePath = getUniversityLogoBasePath(conversation.universityDomain);
    }

    if (basePath) {
      fetchImageWithFallbacks(basePath, ["png", "svg", "jpg", "jpeg"])
        .then(setLogoUrl)
        .catch(() => setLogoUrl(null));
    }
  }, [
    conversation.type,
    conversation.universityDomain,
    conversation.facultyCode,
    isUniversityType,
  ]);

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const isDirectChat =
    conversation.type === ConversationType.Direct ||
    conversation.type === undefined;
  const isGroupChat = !isDirectChat && !isUniversityType;
  const otherParticipant = currentUserId
    ? conversation.participants.find((p) => p.userId !== currentUserId) ||
      conversation.participants[0]
    : conversation.participants[0];

  const translatedName = translateConversationName(conversation);
  const displayName = isUniversityType
    ? translatedName || conversation.name || "Community Chat"
    : isGroupChat
      ? conversation.name || `Group (${conversation.participants.length})`
      : otherParticipant?.name || "Unknown User";

  const renderAvatar = () => (
    <ConversationAvatar
      type={conversation.type ?? ConversationType.Direct}
      logoUrl={logoUrl}
      name={displayName}
      fallbackLogoKey={
        isDirectChat
          ? otherParticipant?.logoKey || null
          : conversation.logoKey || null
      }
      size="small"
    />
  );

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenuPos({ x: rect.right, y: rect.top });
    setShowContextMenu(true);
  };

  const handleLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    onLeave?.(conversation.conversationId);
  };

  useEffect(() => {
    if (showContextMenu) {
      const handleClickOutside = () => setShowContextMenu(false);
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("contextmenu", handleClickOutside);
      };
    }
  }, [showContextMenu]);

  return (
    <>
      <div
        className={`${classes.conversationItem} ${isActive ? classes.active : ""} ${showContextMenu ? classes.contextActive : ""}`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
      >
        {renderAvatar()}

        <div className={classes.content}>
          <div className={classes.header}>
            <span className={classes.userName}>{displayName}</span>
            <span className={classes.time}>
              {formatTime(conversation.lastMessage?.createdAt)}
            </span>
          </div>

          <div className={classes.lastMessage}>
            {conversation.lastMessage?.content || "No messages yet"}
          </div>
        </div>

        {conversation.unreadCount > 0 && (
          <span className={classes.unreadBadge}>
            {conversation.unreadCount}
          </span>
        )}
      </div>

      {showContextMenu && onLeave && (
        <div
          className={classes.contextMenu}
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
        >
          <button className={classes.contextMenuItem} onClick={handleLeave}>
            <ExitToAppIcon fontSize="small" />
            <span>Leave chat</span>
          </button>
        </div>
      )}
    </>
  );
};
