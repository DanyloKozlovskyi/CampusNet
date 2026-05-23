"use client";

import React, { useEffect } from "react";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import { useChatStore } from "@features/chat/model/store";
import { ConversationList } from "@features/chat/ui/ConversationList";
import { ChatWindow } from "@features/chat/ui/ChatWindow";
import { ConversationType, isUniversityChatType } from "@entities/chat";
import classes from "./GlobalChatWidget.module.scss";

interface GlobalChatWidgetProps {
  token: string;
  currentUserId: string;
}

export const GlobalChatWidget: React.FC<GlobalChatWidgetProps> = ({
  token,
  currentUserId,
}) => {
  const {
    connection,
    conversations,
    activeConversationId,
    messages,
    isLoading,
    initializeConnection,
    disconnectConnection,
    selectConversation,
    sendMessage,
    loadConversations,

    loadMoreMessages,
    hasMore,
    isFetchingOlder,
    widgetState,
    setWidgetState,
  } = useChatStore();

  useEffect(() => {
    if (token && !connection) {
      initializeConnection(token);
      loadConversations();
    }

    return () => {
      if (connection) {
        disconnectConnection();
      }
    };
  }, [
    token,
    connection,
    initializeConnection,
    loadConversations,
    disconnectConnection,
  ]);

  const handleToggle = () => {
    if (widgetState === "collapsed") {
      setWidgetState("list");
    } else {
      setWidgetState("collapsed");
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    setWidgetState("chat");
  };

  const handleBack = () => {
    setWidgetState("list");
  };

  const handleSendMessage = (
    content?: string,
    mediaKey?: string,
    mediaContentType?: string,
    mediaType?: string,
  ) => {
    if (activeConversationId) {
      sendMessage(
        activeConversationId,
        content,
        mediaKey,
        mediaContentType,
        mediaType,
      );
    }
  };

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0,
  );
  const activeConversation = conversations.find(
    (c) => c.conversationId === activeConversationId,
  );

  const isDirectChat =
    activeConversation?.type === ConversationType.Direct ||
    activeConversation?.type === undefined;
  const otherParticipant = activeConversation?.participants.find(
    (p) => p.userId !== currentUserId,
  ) || activeConversation?.participants[0];

  const chatTitle = isDirectChat
    ? otherParticipant?.name || "Unknown User"
    : activeConversation?.name ||
      `Group (${activeConversation?.participants.length || 0})`;

  if (widgetState === "collapsed") {
    return (
      <div className={`${classes.chatWidget} ${classes.collapsed}`}>
        <button
          className={classes.toggleButton}
          onClick={handleToggle}
          type="button"
        >
          <ChatIcon />
          {totalUnread > 0 && (
            <span className={classes.badge}>{totalUnread}</span>
          )}
        </button>
      </div>
    );
  }

  if (widgetState === "list") {
    return (
      <div className={`${classes.chatWidget} ${classes.list}`}>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          currentUserId={currentUserId}
          onSelectConversation={handleSelectConversation}
        />
        <button
          className={classes.toggleButton}
          onClick={handleToggle}
          type="button"
          style={{ position: "absolute", bottom: "16px", right: "16px" }}
        >
          <CloseIcon />
        </button>
      </div>
    );
  }

  return (
    <div className={`${classes.chatWidget} ${classes.chat}`}>
      <ChatWindow
        key={activeConversationId}
        messages={messages}
        currentUserId={currentUserId}
        conversation={activeConversation}
        otherUser={
          isDirectChat && otherParticipant
            ? {
                id: otherParticipant.userId,
                name: otherParticipant.name,
                logoKey: otherParticipant.logoKey,
              }
            : !isDirectChat
              ? {
                  id: "",
                  name: chatTitle,
                  logoKey: undefined,
                }
              : undefined
        }
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onClose={handleBack}
        loadMoreMessages={loadMoreMessages}
        hasMore={hasMore}
        isFetchingOlder={isFetchingOlder}
      />
    </div>
  );
};
