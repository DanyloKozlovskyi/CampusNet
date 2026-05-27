"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getPersonalInfo,
  getUserId,
  getFollowStatus,
  FollowStatus,
} from "@entities/user";
import { EditProfileButton } from "@features/edit-profile";
import { UserLogo } from "@core-components/user-logo";
import PageHeader from "@shared/ui/page-header";
import Loader from "@shared/ui/loader";
import Separator from "@shared/ui/separator";
import BlogPost from "@core-components/blog-post";
import { fetchUserPosts } from "@entities/blog-post/helpers";
import NoResultsFound from "@shared/ui/no-results-found";
import {
  getUniversityDomain,
  getUniversityLogoBasePath,
  getFacultyLogoBasePath,
} from "@shared/lib/universities";
import { useUniversityTranslation } from "@shared/lib/universities/useUniversityTranslation";
import { UniversityOnboardingModal } from "@features/university-onboarding";
import { fetchImageWithFallbacks } from "@entities/image";
import {
  updateInterests,
  sendUniversityVerificationEmail,
  getUniversityEmailVerificationStatus,
} from "@entities/university";
import { useCurrentUser } from "@shared/lib/hooks/useCurrentUser";
import SchoolIcon from "@mui/icons-material/School";
import EditIcon from "@mui/icons-material/Edit";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SeparatorLayout from "../layout/separator-layout";
import { useAccountStore } from "./useAccountStore";
import classes from "./account.module.scss";

const Account = () => {
  const router = useRouter();
  const {
    posts,
    scrollY,
    page,
    hasMore,

    setPosts,
    appendPosts,
    setScrollY,
    incrementPage,
    setHasMore,

    userId,
    setUserId,
    logoKey,
    setLogoKey,
    description,
    setDescription,
    name,
    setName,
    email,
    universityDomain,
    universityName,
    facultyName,
    setAccountInfo,
    interests,
    setInterests,
  } = useAccountStore();

  const [showUniModal, setShowUniModal] = useState(false);
  const [uniLogoUrl, setUniLogoUrl] = useState<string | null>(null);
  const [facultyLogoUrl, setFacultyLogoUrl] = useState<string | null>(null);
  const [editingInterests, setEditingInterests] = useState<string[]>([]);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isSavingInterests, setIsSavingInterests] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const pollingRef = useRef(false);
  const { universityEmailVerified } = useCurrentUser();
  const [pollingVerified, setPollingVerified] = useState(false);
  const isEmailVerified = universityEmailVerified || pollingVerified;

  const [isLoading, setIsLoading] = useState(false);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const pageSize = 5;

  useEffect(() => {
    if (!verificationSent || isEmailVerified) return;

    pollingRef.current = true;
    const interval = setInterval(async () => {
      try {
        const status = await getUniversityEmailVerificationStatus();
        if (status.universityEmailVerified) {
          clearInterval(interval);
          pollingRef.current = false;
          setPollingVerified(true);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      pollingRef.current = false;
    };
  }, [verificationSent, isEmailVerified]);

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getUserId();
      setUserId(id);
    };
    if (!userId) {
      fetchUserId();
    }
  }, [userId, setUserId]);

  useEffect(() => {
    const fetchInfo = async () => {
      const info = await getPersonalInfo();
      setLogoKey(info.logoKey);
      setName(info.name);
      setDescription(info.description ?? "");
      setAccountInfo({
        email: info.email,
        universityDomain: info.universityDomain,
        universityName: info.universityName,
        facultyCode: info.facultyCode,
        facultyName: info.facultyName,
      });
      setInterests(info.interests ?? []);
    };

    if (!logoKey && !name && !description && !email) {
      fetchInfo();
    }
  }, [
    logoKey,
    name,
    description,
    email,
    setLogoKey,
    setName,
    setDescription,
    setAccountInfo,
  ]);

  // Load university logo
  useEffect(() => {
    if (!universityDomain) {
      setUniLogoUrl(null);
      return;
    }
    const base = getUniversityLogoBasePath(universityDomain);
    if (!base) return;
    fetchImageWithFallbacks(base, ["png", "svg", "jpg", "jpeg"])
      .then(setUniLogoUrl)
      .catch(() => setUniLogoUrl(null));
  }, [universityDomain]);

  // Interest editing handlers
  const handleStartEditInterests = () => {
    setEditingInterests([...interests]);
    setIsEditingInterests(true);
  };

  const handleCancelEditInterests = () => {
    setIsEditingInterests(false);
    setEditingInterests([]);
    setCustomTagInput("");
  };

  const handleRemoveInterest = (tag: string) => {
    setEditingInterests((prev) => prev.filter((t) => t !== tag));
  };

  const handleAddCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase();
    if (tag && !editingInterests.includes(tag)) {
      setEditingInterests((prev) => [...prev, tag]);
    }
    setCustomTagInput("");
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const handleSaveInterests = async () => {
    setIsSavingInterests(true);
    try {
      await updateInterests(editingInterests);
      setInterests(editingInterests);
      setIsEditingInterests(false);
      setCustomTagInput("");
    } catch (err) {
      console.error("Failed to save interests:", err);
    } finally {
      setIsSavingInterests(false);
    }
  };

  // Load faculty logo
  const { facultyCode } = useAccountStore();
  const { translateUniversity, translateFaculty } = useUniversityTranslation();
  const translatedUniName = translateUniversity(universityDomain);
  const translatedFacultyName = translateFaculty(universityDomain, facultyCode);
  useEffect(() => {
    if (!universityDomain || !facultyCode) {
      setFacultyLogoUrl(null);
      return;
    }
    const base = getFacultyLogoBasePath(universityDomain, facultyCode);
    if (!base) return;
    fetchImageWithFallbacks(base, ["png", "svg", "jpg", "jpeg"])
      .then(setFacultyLogoUrl)
      .catch(() => setFacultyLogoUrl(null));
  }, [universityDomain, facultyCode]);

  useEffect(() => {
    const loadFollowStatus = async () => {
      if (!userId) return;
      const status = await getFollowStatus(userId);
      setFollowStatus(status);
    };
    loadFollowStatus();
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !userId) return;
    setIsLoading(true);

    const nextPosts = await fetchUserPosts(page, pageSize, userId);
    if (nextPosts.length < pageSize) {
      setHasMore(false);
    }
    appendPosts(nextPosts);
    incrementPage();
    requestAnimationFrame(() => setIsLoading(false));
  }, [
    isLoading,
    hasMore,
    page,
    pageSize,
    userId,
    appendPosts,
    incrementPage,
    setHasMore,
  ]);

  useEffect(() => {
    const fetchInitial = async () => {
      setIsLoading(true);

      const initialPosts = await fetchUserPosts(page, pageSize, userId);

      if (initialPosts.length > 0) {
        setPosts(initialPosts);
        incrementPage();
      } else {
        setPosts([]);
        setHasMore(false);
      }

      requestAnimationFrame(() => setIsLoading(false));
    };
    if (userId && posts?.length === 0) {
      fetchInitial();
    }
  }, [userId]);

  useEffect(() => {
    if (posts.length > 0) {
      window.scrollTo(0, scrollY);
    }
    return () => {
      setScrollY(window.scrollY);
    };
  }, [scrollY]);

  // intersection observer on the last post
  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || !hasMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, loadMore],
  );

  return (
    <div className={classes.accountWrapper}>
      <SeparatorLayout>
        <PageHeader title="Profile" />

        <div className={classes.accountHeader}>
          <UserLogo className={classes.userLogo} logoKey={logoKey} />
          <div className={classes.userName}>{name}</div>
          <div className={classes.description}>{description}</div>
          {followStatus && (
            <div className={classes.followStats}>
              <div
                className={classes.statLink}
                onClick={() => router.push(`/details/${userId}/followers`)}
              >
                <strong>{followStatus.followersCount}</strong> Followers
              </div>
              <div
                className={classes.statLink}
                onClick={() => router.push(`/details/${userId}/following`)}
              >
                <strong>{followStatus.followingCount}</strong> Following
              </div>
            </div>
          )}
          <EditProfileButton
            logoKey={logoKey ?? ""}
            description={description}
            name={name}
          />

          {email && getUniversityDomain(email) && (
            <div className={classes.universitySection}>
              <div className={classes.uniSectionHeader}>
                <SchoolIcon className={classes.uniSectionIcon} />
                <span>University Affiliation</span>
                <button
                  className={classes.uniEditBtn}
                  onClick={() => setShowUniModal(true)}
                  type="button"
                >
                  <EditIcon style={{ fontSize: 16 }} />
                  {universityName ? "Edit" : "Set up"}
                </button>
              </div>

              {universityName ? (
                <>
                  {/* Email verification status */}
                  {!isEmailVerified && (
                    <div className={classes.verificationBanner}>
                      <div className={classes.verificationBannerIcon}>📧</div>
                      <div className={classes.verificationBannerText}>
                        <strong>Email not verified</strong>
                        <span>
                          Verify your email to access university chats
                        </span>
                      </div>
                      <button
                        className={classes.verificationBannerBtn}
                        onClick={async () => {
                          setIsSendingVerification(true);
                          try {
                            await sendUniversityVerificationEmail();
                            setVerificationSent(true);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setIsSendingVerification(false);
                          }
                        }}
                        disabled={isSendingVerification || verificationSent}
                        type="button"
                      >
                        {isSendingVerification
                          ? "Sending..."
                          : verificationSent
                            ? "Email Sent!"
                            : "Send Verification"}
                      </button>
                    </div>
                  )}
                  {isEmailVerified && (
                    <div className={classes.verifiedBadge}>
                      ✅ Email verified
                    </div>
                  )}
                  <div className={classes.uniCards}>
                    <div className={classes.uniCard}>
                      {uniLogoUrl ? (
                        <img
                          src={uniLogoUrl}
                          alt={translatedUniName || universityName}
                          className={classes.uniCardLogo}
                        />
                      ) : (
                        <div className={classes.uniCardLogoPlaceholder}>
                          <SchoolIcon
                            style={{ fontSize: 20, color: "#7c8db0" }}
                          />
                        </div>
                      )}
                      <div className={classes.uniCardInfo}>
                        <div className={classes.uniCardLabel}>University</div>
                        <div className={classes.uniCardName}>
                          {translatedUniName || universityName}
                        </div>
                      </div>
                    </div>

                    {facultyName && (
                      <div className={classes.uniCard}>
                        {facultyLogoUrl ? (
                          <img
                            src={facultyLogoUrl}
                            alt={translatedFacultyName || facultyName}
                            className={classes.uniCardLogo}
                          />
                        ) : (
                          <div className={classes.uniCardLogoPlaceholder}>
                            <SchoolIcon
                              style={{ fontSize: 20, color: "#7c8db0" }}
                            />
                          </div>
                        )}
                        <div className={classes.uniCardInfo}>
                          <div className={classes.uniCardLabel}>Faculty</div>
                          <div className={classes.uniCardName}>
                            {translatedFacultyName || facultyName}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className={classes.uniNotSet}>
                  Not configured yet. Click Edit to set up your university.
                </div>
              )}
            </div>
          )}

          {/* My Interests Section */}
          <div className={classes.interestsSection}>
            <div className={classes.interestsSectionHeader}>
              <LocalOfferIcon className={classes.interestsSectionIcon} />
              <span>My Interests</span>
              {!isEditingInterests && (
                <button
                  className={classes.interestsEditBtn}
                  onClick={handleStartEditInterests}
                  type="button"
                >
                  <EditIcon style={{ fontSize: 16 }} />
                  Edit
                </button>
              )}
            </div>

            {isEditingInterests ? (
              <div className={classes.interestsEditMode}>
                <div className={classes.interestChips}>
                  {editingInterests.map((tag) => (
                    <span key={tag} className={classes.interestChip}>
                      {tag}
                      <button
                        type="button"
                        className={classes.chipRemove}
                        onClick={() => handleRemoveInterest(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {editingInterests.length === 0 && (
                    <span className={classes.noInterests}>
                      No interests added yet
                    </span>
                  )}
                </div>
                <div className={classes.addTagRow}>
                  <input
                    type="text"
                    className={classes.tagInput}
                    placeholder="Add custom tag..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={handleCustomTagKeyDown}
                  />
                  <button
                    type="button"
                    className={classes.addTagBtn}
                    onClick={handleAddCustomTag}
                    disabled={!customTagInput.trim()}
                  >
                    Add
                  </button>
                </div>
                <div className={classes.interestsActions}>
                  <button
                    type="button"
                    className={classes.cancelBtn}
                    onClick={handleCancelEditInterests}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={classes.saveBtn}
                    onClick={handleSaveInterests}
                    disabled={isSavingInterests}
                  >
                    {isSavingInterests ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className={classes.interestChips}>
                {interests.length > 0 ? (
                  interests.map((tag) => (
                    <span key={tag} className={classes.interestChipReadonly}>
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className={classes.noInterests}>
                    No interests set. Click Edit to add your interests.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {showUniModal && email && (
          <UniversityOnboardingModal
            email={email}
            forceShow={true}
            onComplete={() => {
              setShowUniModal(false);
              getPersonalInfo().then((info) => {
                setAccountInfo({
                  email: info.email,
                  universityDomain: info.universityDomain,
                  universityName: info.universityName,
                  facultyCode: info.facultyCode,
                  facultyName: info.facultyName,
                });
                setInterests(info.interests ?? []);
              });
            }}
          />
        )}

        <div style={{ overflow: "auto", height: "100%" }}>
          {posts.map((item, idx) => {
            const isLast = idx === posts.length - 1;
            return (
              <div
                key={item.id}
                ref={isLast ? lastPostRef : null}
                style={{ position: "relative" }}
              >
                <BlogPost className={classes.blogPost} {...item} />
                {idx < posts.length - 1 && <Separator horizontal top="100%" />}
              </div>
            );
          })}

          {isLoading && posts.length === 0 && (
            <div className={classes.loaderWrapperTop}>
              <Loader isLoading />
            </div>
          )}
          {isLoading && posts.length > 0 && (
            <div className={classes.loaderWrapperBottom}>
              <Loader isLoading />
            </div>
          )}

          {!hasMore && <NoResultsFound label="No more posts to show." />}
        </div>
      </SeparatorLayout>
    </div>
  );
};

export default Account;
