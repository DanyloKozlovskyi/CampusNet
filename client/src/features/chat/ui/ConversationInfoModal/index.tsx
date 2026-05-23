"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PeopleIcon from "@mui/icons-material/People";
import {
  Conversation,
  ConversationType,
  ConversationParticipant,
  isUniversityChatType,
  chatApi,
} from "@entities/chat";
import { ConversationAvatar } from "../ConversationAvatar";
import { User } from "@entities/user";
import { fetchImageWithFallbacks } from "@entities/image";
import {
  getUniversityLogoBasePath,
  getFacultyLogoBasePath,
} from "@shared/lib/universities";
import { useUniversityTranslation } from "@shared/lib/universities/useUniversityTranslation";
import UserCard from "@core-components/user-card";
import Loader from "@shared/ui/loader";
import classes from "./ConversationInfoModal.module.scss";

interface ConversationInfoModalProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
  onLeave: () => void;
}

export const ConversationInfoModal: React.FC<ConversationInfoModalProps> = ({
  conversation,
  isOpen,
  onClose,
  onLeave,
}) => {
  const [participants, setParticipants] = useState<ConversationParticipant[]>(
    [],
  );
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const pageSize = 20;

  const isUniversityType = isUniversityChatType(conversation.type);
  const { translateConversationName } = useUniversityTranslation();
  const translatedName = translateConversationName(conversation);

  useEffect(() => {
    if (!isOpen) return;

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
    } else if (conversation.type === ConversationType.University) {
      basePath = getUniversityLogoBasePath(conversation.universityDomain);
    } else {
      basePath = getUniversityLogoBasePath(conversation.universityDomain);
    }

    if (basePath) {
      fetchImageWithFallbacks(basePath, ["png", "svg", "jpg", "jpeg"])
        .then(setLogoUrl)
        .catch(() => setLogoUrl(null));
    }
  }, [isOpen, conversation, isUniversityType]);

  const loadParticipantsRef = useRef<
    (isNext: boolean, search?: string) => Promise<void>
  >(async () => {});

  loadParticipantsRef.current = async (isNext = false, search?: string) => {
    if (isLoading || (!hasMore && isNext)) return;
    setIsLoading(true);
    try {
      const currentPage = isNext ? page : 1;
      const result = await chatApi.getConversationParticipants(
        conversation.conversationId,
        currentPage,
        pageSize,
        search,
      );

      if (!isNext) {
        setParticipants(result.participants);
      } else {
        setParticipants((prev) => [...prev, ...result.participants]);
      }
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      setPage(isNext ? page + 1 : 2);
    } catch (err) {
      console.error("Error fetching participants", err);
      if (!isNext) setParticipants([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadParticipants = useCallback((isNext = false, search?: string) => {
    loadParticipantsRef.current?.(isNext, search);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setParticipants([]);
      setPage(1);
      setHasMore(true);
      loadParticipantsRef.current?.(false, searchQuery || undefined);
    }
  }, [isOpen, searchQuery]);

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = setTimeout(() => {
      setParticipants([]);
      setPage(1);
      setHasMore(true);
      loadParticipantsRef.current?.(false, searchQuery || undefined);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [isOpen, searchQuery]);

  const lastParticipantRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadParticipants(true, searchQuery || undefined);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, loadParticipants, searchQuery],
  );

  const participantToUser = (p: ConversationParticipant): User => ({
    id: p.userId,
    name: p.name || "Unknown",
    userName: p.name?.replace(/\s+/g, "") || "user",
    logoKey: p.logoKey || null,
    logoContentType: p.logoContentType || null,
    description: null,
  });

  if (!isOpen) return null;

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
        <button className={classes.closeButton} onClick={onClose} type="button">
          <CloseIcon />
        </button>

        <div className={classes.header}>
          <ConversationAvatar
            type={conversation.type ?? ConversationType.Group}
            logoUrl={logoUrl}
            name={conversation.name}
            fallbackLogoKey={conversation.logoKey || null}
            size="large"
          />
          <h2 className={classes.name}>
            {translatedName || conversation.name || "Conversation"}
          </h2>
          <span className={classes.memberCount}>{totalCount} members</span>
        </div>

        <div className={classes.actions}>
          <button
            className={classes.leaveButton}
            onClick={onLeave}
            type="button"
          >
            <ExitToAppIcon />
            <span>Leave</span>
          </button>
        </div>

        <div className={classes.membersSection}>
          <div className={classes.membersHeader}>
            <PeopleIcon />
            <span>{totalCount} MEMBERS</span>
          </div>

          <div className={classes.searchWrapper}>
            <SearchIcon className={classes.searchIcon} />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={classes.searchInput}
            />
          </div>

          <div className={classes.membersList}>
            {participants.map((participant, idx) => {
              const isLast = idx === participants.length - 1;
              return (
                <div
                  key={participant.userId}
                  ref={isLast ? lastParticipantRef : null}
                >
                  <UserCard
                    user={participantToUser(participant)}
                    hideFollowButton
                  />
                </div>
              );
            })}

            {isLoading && (
              <Loader isLoading={isLoading} className={classes.loader} />
            )}

            {!hasMore && !isLoading && participants.length === 0 && (
              <div className={classes.noResults}>No members found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
