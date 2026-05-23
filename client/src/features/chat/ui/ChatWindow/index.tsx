import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import dayjs, { Dayjs } from "dayjs";
import CloseIcon from "@mui/icons-material/Close";
import { CircularProgress } from "@mui/material";
import { MessageBubble } from "@entities/chat/ui/MessageBubble";
import { ChatInput } from "../ChatInput";
import { DateSeparator } from "../DateSeparator";
import { CalendarModal } from "../CalendarModal";
import { ConversationInfoModal } from "../ConversationInfoModal";
import { ConversationAvatar } from "../ConversationAvatar";
import {
  Message,
  Conversation,
  ConversationType,
  isUniversityChatType,
  chatApi,
} from "@entities/chat";
import { fetchImageWithFallbacks } from "@entities/image";
import {
  getUniversityLogoBasePath,
  getFacultyLogoBasePath,
} from "@shared/lib/universities";
import { useUniversityTranslation } from "@shared/lib/universities/useUniversityTranslation";
import { groupMessagesByDate } from "../../lib/groupMessagesByDate";
import classes from "./ChatWindow.module.scss";

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  otherUser?: {
    id: string;
    name?: string;
    logoKey?: string;
  };
  conversation?: Conversation;
  isLoading: boolean;
  onSendMessage: (
    content?: string,
    mediaKey?: string,
    mediaContentType?: string,
    mediaType?: string,
  ) => void;
  onClose?: () => void;

  loadMoreMessages: () => void;
  hasMore: boolean;
  isFetchingOlder: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentUserId,
  otherUser,
  conversation,
  isLoading,
  onSendMessage,
  onClose,

  loadMoreMessages,
  hasMore,
  isFetchingOlder,
}) => {
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const chatItems = useMemo(() => groupMessagesByDate(messages), [messages]);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [universityLogoUrl, setUniversityLogoUrl] = useState<string | null>(
    null,
  );
  const prevMessageCount = useRef(0);
  const userHasScrolled = useRef(false);
  const previousScrollHeight = useRef<number>(0);

  const isUniversityType = isUniversityChatType(conversation?.type);
  const isGroupOrCommunityChat =
    isUniversityType || (conversation && conversation.participants.length > 1);
  const { translateConversationName } = useUniversityTranslation();
  const translatedConversationName = conversation
    ? translateConversationName(conversation)
    : "";

  useEffect(() => {
    if (!isUniversityType || !conversation?.universityDomain) {
      setUniversityLogoUrl(null);
      return;
    }

    let basePath: string | null = null;

    if (
      (conversation.type === ConversationType.Faculty ||
        conversation.type === ConversationType.Major ||
        conversation.type === ConversationType.MajorYear) &&
      conversation.facultyCode
    ) {
      basePath = getFacultyLogoBasePath(
        conversation.universityDomain,
        conversation.facultyCode,
      );
    }

    if (!basePath) {
      basePath = getUniversityLogoBasePath(conversation.universityDomain);
    }

    if (basePath) {
      fetchImageWithFallbacks(basePath, ["png", "svg", "jpg", "jpeg"])
        .then(setUniversityLogoUrl)
        .catch(() => setUniversityLogoUrl(null));
    }
  }, [
    conversation?.type,
    conversation?.universityDomain,
    conversation?.facultyCode,
    isUniversityType,
  ]);

  const handleScroll = () => {
    const container = messagesAreaRef.current;
    if (!container || !isLayoutReady) return;

    if (container.scrollTop === 0 && hasMore && !isFetchingOlder) {
      previousScrollHeight.current = container.scrollHeight;
      loadMoreMessages();
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom > 50) {
      userHasScrolled.current = true;
    } else {
      userHasScrolled.current = false;
    }
  };

  useLayoutEffect(() => {
    const container = messagesAreaRef.current;
    if (container && !isFetchingOlder && previousScrollHeight.current > 0) {
      const heightDifference =
        container.scrollHeight - previousScrollHeight.current;
      container.scrollTop = heightDifference;
      previousScrollHeight.current = 0;
    }
  }, [messages.length, isFetchingOlder]);

  useEffect(() => {
    const container = messagesAreaRef.current;
    if (!container || messages.length === 0) return;

    if (prevMessageCount.current === 0) {
      let lastHeight = 0;
      let stableCount = 0;

      const finalize = () => {
        container.scrollTop = container.scrollHeight;
        setIsLayoutReady(true);
      };

      const intervalId = setInterval(() => {
        if (container.scrollHeight === lastHeight) {
          stableCount++;
        } else {
          stableCount = 0;
          lastHeight = container.scrollHeight;
        }

        if (stableCount >= 3) {
          clearInterval(intervalId);
          finalize();
        }
      }, 50);

      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        finalize();
      }, 2000);

      prevMessageCount.current = messages.length;

      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    }

    if (
      messages.length > prevMessageCount.current &&
      previousScrollHeight.current === 0
    ) {
      if (!userHasScrolled.current) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    }

    prevMessageCount.current = messages.length;
  }, [messages, isLayoutReady]);

  const handleDateSelect = (selectedDate: Dayjs) => {
    setIsLayoutReady(true);
    setCalendarOpen(false);

    requestAnimationFrame(() => {
      const targetMessage = messages.find((m) => {
        const messageDate = dayjs(m.createdAt);
        return !messageDate.isBefore(selectedDate, "day");
      });

      if (targetMessage) {
        const element = messageRefs.current.get(targetMessage.id);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        const container = messagesAreaRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    });
  };

  const handleLeaveConversation = async () => {
    if (!conversation) return;
    try {
      await chatApi.leaveConversation(conversation.conversationId);
      setInfoModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to leave conversation:", error);
    }
  };

  const handleHeaderClick = () => {
    if (isGroupOrCommunityChat && conversation) {
      setInfoModalOpen(true);
    }
  };

  return (
    <div className={classes.chatWindow}>
      <CalendarModal
        open={isCalendarOpen}
        onClose={() => setCalendarOpen(false)}
        onDateSelect={handleDateSelect}
      />
      {conversation && isGroupOrCommunityChat && (
        <ConversationInfoModal
          conversation={conversation}
          isOpen={isInfoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          onLeave={handleLeaveConversation}
        />
      )}
      {(otherUser || isUniversityType) && (
        <div
          className={`${classes.header} ${isGroupOrCommunityChat ? classes.clickable : ""}`}
          onClick={handleHeaderClick}
        >
          <ConversationAvatar
            type={conversation?.type ?? ConversationType.Direct}
            logoUrl={universityLogoUrl}
            name={conversation?.name}
            fallbackLogoKey={
              conversation?.type === ConversationType.Direct ||
              conversation?.type === undefined
                ? otherUser?.logoKey || null
                : conversation?.logoKey || null
            }
            size="small"
          />

          <div className={classes.userInfo}>
            <div className={classes.userName}>
              {isUniversityType
                ? translatedConversationName ||
                  conversation?.name ||
                  "Community Chat"
                : otherUser?.name || "Unknown User"}
            </div>
            <div className={classes.status}>
              {isUniversityType ? "Community" : "Active"}
            </div>
          </div>

          {onClose && (
            <button
              className={classes.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              type="button"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      )}

      <div
        className={classes.messagesArea}
        ref={messagesAreaRef}
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className={classes.loading}>
            <CircularProgress size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className={classes.empty}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {!isLayoutReady && (
              <div className={classes.loading}>
                <CircularProgress size={24} />
              </div>
            )}
            {isFetchingOlder && (
              <div className={classes.loadingOlder}>
                <CircularProgress size={24} />
              </div>
            )}
            <div style={{ visibility: isLayoutReady ? "visible" : "hidden" }}>
              {chatItems.map((item, index) => {
                if ("type" in item && item.type === "date-separator") {
                  return (
                    <DateSeparator
                      key={`date-${index}`}
                      date={item.date}
                      onClick={() => setCalendarOpen(true)}
                    />
                  );
                }
                const message = item as Message;
                const nextItem = chatItems[index + 1];
                const isLastInGroup =
                  !nextItem ||
                  ("type" in nextItem && nextItem.type === "date-separator") ||
                  (nextItem as Message).senderId !== message.senderId;

                return (
                  <div
                    key={message.id}
                    ref={(el) => {
                      messageRefs.current.set(message.id, el);
                    }}
                  >
                    <MessageBubble
                      message={message}
                      isOwn={message.senderId === currentUserId}
                      currentUserId={currentUserId}
                      showAvatar={isLastInGroup}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ChatInput
        onSendMessage={onSendMessage}
        disabled={!otherUser && !isUniversityType}
      />
    </div>
  );
};
