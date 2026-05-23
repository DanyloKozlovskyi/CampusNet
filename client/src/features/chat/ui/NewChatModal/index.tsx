import React, { useState, useEffect } from "react";
import Image from "next/image";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { UserLogo } from "@core-components/user-logo";
import { getUploadLogoUrl, saveFileIntoBlob } from "@entities/image";
import { useChatStore } from "../../model/store";
import api from "@shared/api/interceptor-api";
import classes from "./NewChatModal.module.scss";

interface User {
  id: string;
  name?: string;
  logoKey?: string;
  description?: string;
}

type ModalView = "main" | "newChat" | "newGroup" | "groupName";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [view, setView] = useState<ModalView>("main");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupAvatarPreview, setGroupAvatarPreview] = useState<string | null>(
    null,
  );
  const [groupAvatarFile, setGroupAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const { startConversation, createGroupConversation, selectConversation } =
    useChatStore();

  useEffect(() => {
    if (!isOpen) {
      setView("main");
      setQuery("");
      setUsers([]);
      setSelectedUsers([]);
      setGroupName("");
      setGroupAvatarPreview(null);
      setGroupAvatarFile(null);
    }
  }, [isOpen]);

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

  const handleUserClick = async (userId: string) => {
    const conversationId = await startConversation(userId);
    if (conversationId) {
      selectConversation(conversationId);
      onClose();
    }
  };

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
      setView("groupName");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 2) return;

    setIsCreatingGroup(true);
    try {
      let logoKey: string | undefined;
      let logoContentType: string | undefined;

      if (groupAvatarFile) {
        const { uploadUrl, key, contentType } = await getUploadLogoUrl(
          groupAvatarFile.name,
        );
        await saveFileIntoBlob(groupAvatarFile, uploadUrl, contentType);
        logoKey = key;
        logoContentType = contentType;
      }

      const participantIds = selectedUsers.map((u) => u.id);
      const conversationId = await createGroupConversation(
        groupName,
        participantIds,
        logoKey,
        logoContentType,
      );

      if (conversationId) {
        selectConversation(conversationId);
        onClose();
      }
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setGroupAvatarFile(file);
      setGroupAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBack = () => {
    if (view === "groupName") {
      setView("newGroup");
    } else if (view === "newGroup" || view === "newChat") {
      setView("main");
      setQuery("");
      setUsers([]);
      setSelectedUsers([]);
    }
  };

  if (!isOpen) return null;

  const renderMainView = () => (
    <>
      <div className={classes.header}>
        <h2>New Message</h2>
        <button className={classes.closeButton} onClick={onClose} type="button">
          <CloseIcon />
        </button>
      </div>
      <div className={classes.options}>
        <button
          className={classes.optionButton}
          onClick={() => setView("newChat")}
          type="button"
        >
          <div className={classes.optionIcon}>
            <PersonAddIcon />
          </div>
          <div className={classes.optionText}>
            <span className={classes.optionTitle}>New Chat</span>
            <span className={classes.optionDesc}>
              Start a conversation with someone
            </span>
          </div>
        </button>
        <button
          className={classes.optionButton}
          onClick={() => setView("newGroup")}
          type="button"
        >
          <div className={`${classes.optionIcon} ${classes.groupIcon}`}>
            <GroupAddIcon />
          </div>
          <div className={classes.optionText}>
            <span className={classes.optionTitle}>New Group</span>
            <span className={classes.optionDesc}>
              Create a group with multiple people
            </span>
          </div>
        </button>
      </div>
    </>
  );

  const renderNewChatView = () => (
    <>
      <div className={classes.header}>
        <button
          className={classes.backButton}
          onClick={handleBack}
          type="button"
        >
          <ArrowBackIcon />
        </button>
        <h2>New Chat</h2>
        <button className={classes.closeButton} onClick={onClose} type="button">
          <CloseIcon />
        </button>
      </div>
      <div className={classes.searchWrapper}>
        <SearchIcon className={classes.searchIcon} />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className={classes.userList}>
        {isLoading ? (
          <div className={classes.loading}>Searching...</div>
        ) : users.length > 0 ? (
          users.map((user) => (
            <div
              key={user.id}
              className={classes.userItem}
              onClick={() => handleUserClick(user.id)}
            >
              <UserLogo
                className={classes.avatar}
                logoKey={user.logoKey || null}
                size={48}
              />
              <div className={classes.userInfo}>
                <span className={classes.userName}>
                  {user.name || "Unknown User"}
                </span>
                {user.description && (
                  <span className={classes.userDesc}>{user.description}</span>
                )}
              </div>
            </div>
          ))
        ) : query ? (
          <div className={classes.noResults}>No users found</div>
        ) : (
          <div className={classes.placeholder}>
            Search for users to start a conversation
          </div>
        )}
      </div>
    </>
  );

  const renderNewGroupView = () => (
    <>
      <div className={classes.header}>
        <button
          className={classes.backButton}
          onClick={handleBack}
          type="button"
        >
          <ArrowBackIcon />
        </button>
        <h2>Add Members</h2>
        <button
          className={classes.nextButton}
          onClick={handleNext}
          disabled={selectedUsers.length < 2}
          type="button"
        >
          Next
        </button>
      </div>

      {selectedUsers.length > 0 && (
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
      )}

      <div className={classes.searchWrapper}>
        <SearchIcon className={classes.searchIcon} />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className={classes.userList}>
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
                  size={48}
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
            Search people to add to group (minimum 2)
          </div>
        )}
      </div>
    </>
  );

  const renderGroupNameView = () => {
    const showNameError = groupName.length === 0;

    return (
      <>
        <div className={classes.header}>
          <button
            className={classes.backButton}
            onClick={handleBack}
            type="button"
          >
            <ArrowBackIcon />
          </button>
          <h2>New Group</h2>
          <button
            className={classes.createButton}
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || isCreatingGroup}
            type="button"
          >
            {isCreatingGroup ? "Creating..." : "Create"}
          </button>
        </div>

        <div className={classes.groupSetup}>
          <div className={classes.avatarSection}>
            <label className={classes.avatarUpload}>
              {groupAvatarPreview ? (
                <Image
                  src={groupAvatarPreview}
                  alt="Group avatar"
                  width={80}
                  height={80}
                  className={classes.avatarPreview}
                />
              ) : (
                <div className={classes.avatarPlaceholder}>
                  <AddPhotoAlternateIcon />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className={classes.avatarInput}
              />
            </label>
            <span className={classes.avatarHint}>Add group photo</span>
          </div>

          <div className={classes.nameSection}>
            <label className={classes.nameLabel}>
              Group Name <span className={classes.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={100}
              autoFocus
              className={`${classes.nameInput} ${showNameError ? classes.inputError : ""}`}
            />
          </div>
        </div>

        <div className={classes.participantsSection}>
          <h4>Participants ({selectedUsers.length})</h4>
          <div className={classes.participantsList}>
            {selectedUsers.map((user) => (
              <div key={user.id} className={classes.participantItem}>
                <UserLogo
                  className={classes.participantAvatar}
                  logoKey={user.logoKey || null}
                  size={40}
                />
                <span className={classes.participantName}>
                  {user.name || "Unknown User"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
        {view === "main" && renderMainView()}
        {view === "newChat" && renderNewChatView()}
        {view === "newGroup" && renderNewGroupView()}
        {view === "groupName" && renderGroupNameView()}
      </div>
    </div>
  );
};
