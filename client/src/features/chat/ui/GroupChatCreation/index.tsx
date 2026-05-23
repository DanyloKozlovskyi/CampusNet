import React, { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useChatStore } from "../../model/store";
import classes from "./GroupChatCreation.module.scss";
import api from "@shared/api/interceptor-api";
import { UserLogo } from "@core-components/user-logo";

interface User {
  id: string;
  name?: string;
  logoKey?: string;
  description?: string;
}

export const GroupChatCreation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"select" | "name">("select");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { createGroupConversation, selectConversation } = useChatStore();

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get(
          `/account/filterUsers?query=${encodeURIComponent(query)}`,
        );
        setUsers(response.data);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleUserToggle = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleNext = () => {
    if (selectedUsers.length >= 2) {
      setStep("name");
    }
  };

  const handleBack = () => {
    if (step === "name") {
      setStep("select");
    } else {
      handleClose();
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 2) return;

    const participantIds = selectedUsers.map((u) => u.id);
    const conversationId = await createGroupConversation(
      groupName,
      participantIds,
    );

    if (conversationId) {
      selectConversation(conversationId);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("select");
    setQuery("");
    setUsers([]);
    setSelectedUsers([]);
    setGroupName("");
  };

  if (!isOpen) {
    return (
      <button
        className={classes.openButton}
        onClick={() => setIsOpen(true)}
        title="Create group chat"
        type="button"
      >
        <GroupAddIcon />
        <span>New Group</span>
      </button>
    );
  }

  if (step === "name") {
    const showNameError = groupName.length === 0;

    return (
      <div className={classes.groupCreation}>
        <div className={classes.header}>
          <button
            className={classes.backButton}
            onClick={handleBack}
            type="button"
          >
            <ArrowBackIcon />
          </button>
          <h3>New Group</h3>
          <button
            className={classes.createButton}
            onClick={handleCreateGroup}
            disabled={!groupName.trim()}
            type="button"
          >
            Create
          </button>
        </div>

        <div className={classes.groupNameSection}>
          <label className={classes.groupNameLabel}>
            Group Name <span className={classes.required}>*</span>
          </label>
          <input
            type="text"
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={100}
            autoFocus
            className={`${classes.groupNameInput} ${showNameError ? classes.inputError : ""}`}
          />
          {showNameError && (
            <span className={classes.errorText}>Group name is required</span>
          )}
        </div>

        <div className={classes.selectedSection}>
          <h4>Participants: {selectedUsers.length}</h4>
          <div className={classes.selectedList}>
            {selectedUsers.map((user) => (
              <div key={user.id} className={classes.selectedUser}>
                <UserLogo
                  className={classes.avatar}
                  logoKey={user.logoKey || null}
                  size={32}
                />
                <span className={classes.userName}>
                  {user.name || "Unknown User"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.groupCreation}>
      <div className={classes.header}>
        <button
          className={classes.backButton}
          onClick={handleBack}
          type="button"
        >
          <ArrowBackIcon />
        </button>
        <h3>Add Members</h3>
        <button
          className={classes.nextButton}
          onClick={handleNext}
          disabled={selectedUsers.length < 2}
          type="button"
        >
          Next
        </button>
      </div>

      <div className={classes.selectedChips}>
        {selectedUsers.map((user) => (
          <div key={user.id} className={classes.chip}>
            <UserLogo
              className={classes.chipAvatar}
              logoKey={user.logoKey || null}
              size={24}
            />
            <span>{user.name || "Unknown"}</span>
            <button
              onClick={() => handleUserToggle(user)}
              className={classes.chipRemove}
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className={classes.inputWrapper}>
        <SearchIcon className={classes.searchIcon} />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className={classes.resultsList}>
        {isLoading ? (
          <div className={classes.loading}>Searching...</div>
        ) : users.length > 0 ? (
          users.map((user) => {
            const isSelected = selectedUsers.some((u) => u.id === user.id);
            return (
              <div
                key={user.id}
                className={`${classes.userItem} ${isSelected ? classes.selected : ""}`}
                onClick={() => handleUserToggle(user)}
              >
                <UserLogo
                  className={classes.avatar}
                  logoKey={user.logoKey || null}
                  size={40}
                />
                <div className={classes.userInfo}>
                  <span className={classes.userName}>
                    {user.name || "Unknown User"}
                  </span>
                  {user.description && (
                    <span className={classes.userDesc}>{user.description}</span>
                  )}
                </div>
                {isSelected && (
                  <CheckCircleIcon className={classes.checkIcon} />
                )}
              </div>
            );
          })
        ) : query ? (
          <div className={classes.noResults}>No users found</div>
        ) : (
          <div className={classes.placeholder}>
            Search people to add to group
          </div>
        )}
      </div>
    </div>
  );
};
