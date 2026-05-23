import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import { ConversationItem } from "@entities/chat/ui/ConversationItem";
import { Conversation } from "@entities/chat";
import { NewChatModal } from "../NewChatModal";
import classes from "./ConversationList.module.scss";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentUserId?: string;
  onSelectConversation: (conversationId: string) => void;
  onLeaveConversation?: (conversationId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  currentUserId,
  onSelectConversation,
  onLeaveConversation,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={classes.conversationList}>
      <div className={classes.header}>
        <span>Messages</span>
        <button
          className={classes.newChatButton}
          onClick={() => setIsModalOpen(true)}
          type="button"
          title="New message"
        >
          <AddIcon />
        </button>
      </div>

      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div className={classes.list}>
        {conversations.length === 0 ? (
          <div className={classes.empty}>No conversations yet</div>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.conversationId}
              conversation={conversation}
              isActive={conversation.conversationId === activeConversationId}
              currentUserId={currentUserId}
              onClick={() => onSelectConversation(conversation.conversationId)}
              onLeave={onLeaveConversation}
            />
          ))
        )}
      </div>
    </div>
  );
};
