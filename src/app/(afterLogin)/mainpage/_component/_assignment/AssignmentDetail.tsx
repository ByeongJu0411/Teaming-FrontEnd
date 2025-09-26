"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { FiCheckCircle, FiCircle } from "react-icons/fi";
import Image from "next/image";
import styles from "./AssignmentDetail.module.css";

interface Assignment {
  id: string;
  title: string;
  description: string;
  creator: string;
  assignedMembers: string[];
  dueDate: string;
  status: "진행중" | "완료" | "마감" | "취소";
  createdAt: string;
  isCancelled?: boolean;
  submissions: {
    memberId: string;
    memberName: string;
    submittedAt?: string;
    status: "대기" | "제출완료";
    submissionData?: {
      text: string;
      files: {
        name: string;
        size: number;
        url?: string;
      }[];
    };
  }[];
}

interface Member {
  id: string;
  name: string;
  avatar: string;
}

interface AssignmentDetailProps {
  assignment: Assignment | null;
  members: Member[];
  onSubmitClick: () => void;
  onViewSubmission: (submission: Assignment["submissions"][0]) => void;
  canSubmit: (assignment: Assignment) => boolean;
  roomId: number;
  onAssignmentUpdate?: (updatedAssignment: Assignment) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080";

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({
  assignment,
  members,
  onSubmitClick,
  onViewSubmission,
  canSubmit,
  roomId,
  onAssignmentUpdate,
}) => {
  const { data: session } = useSession();
  const [isCancelling, setIsCancelling] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "완료":
        return "#10b981";
      case "마감":
        return "#ef4444";
      case "취소":
        return "#6b7280";
      default:
        return "#3b82f6";
    }
  };

  // 아바타 데이터 가져오기 (URL인지 이모지인지 구분)
  const getMemberAvatarData = (memberId: string): { type: "url" | "emoji"; value: string } => {
    const member = members.find((m) => m.id === memberId);
    const avatar = member?.avatar || "👤";

    // URL인지 확인 (http로 시작하거나 /로 시작하는 경우)
    if (avatar.startsWith("http") || avatar.startsWith("/")) {
      return { type: "url", value: avatar };
    }

    return { type: "emoji", value: avatar };
  };

  // 과제 취소 API 호출
  const cancelAssignment = async (): Promise<void> => {
    if (!assignment || !session?.accessToken || !session?.isBackendAuthenticated) {
      alert("인증이 필요합니다.");
      return;
    }

    const confirmCancel = window.confirm("정말로 이 과제를 취소하시겠습니까?");
    if (!confirmCancel) return;

    setIsCancelling(true);

    try {
      console.log("과제 취소 요청:", { roomId, assignmentId: assignment.id });

      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/assignments/${assignment.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      console.log("과제 취소 API 응답 상태:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("과제 취소 API 오류 응답:", errorText);

        if (response.status === 401) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 403) {
          throw new Error("과제 취소 권한이 없습니다.");
        } else if (response.status === 404) {
          throw new Error("존재하지 않는 과제입니다.");
        } else {
          throw new Error(`서버 오류가 발생했습니다. (${response.status}): ${errorText}`);
        }
      }

      // 성공 시 과제 상태 업데이트
      const updatedAssignment = {
        ...assignment,
        isCancelled: true,
        status: "취소" as const,
      };

      // 부모 컴포넌트에 업데이트된 과제 정보 전달
      if (onAssignmentUpdate) {
        onAssignmentUpdate(updatedAssignment);
        console.log("onAssignmentUpdate 호출됨:", updatedAssignment);
      }

      alert("과제가 취소되었습니다.");
    } catch (error) {
      console.error("과제 취소 실패:", error);
      alert(`과제 취소에 실패했습니다:\n${error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}`);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!assignment) {
    return (
      <div className={styles.assignmentDetail}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>과제를 선택해주세요</h3>
          <p>왼쪽에서 과제를 선택하면 상세 정보를 확인할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.assignmentDetail} ${assignment.isCancelled ? styles.cancelled : ""}`}>
      <div className={styles.detailHeader}>
        <h3>{assignment.title}</h3>
        <span className={styles.statusBadge} style={{ backgroundColor: getStatusColor(assignment.status) }}>
          {assignment.status}
        </span>
        <div className={styles.headerActions}>
          {!assignment.isCancelled && (
            <button
              className={`${styles.cancelButton} ${isCancelling ? styles.cancelling : ""}`}
              onClick={cancelAssignment}
              disabled={isCancelling}
            >
              {isCancelling ? <div className={styles.loadingSpinner}></div> : "과제 취소"}
            </button>
          )}
        </div>
      </div>

      <div className={styles.detailContent}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>과제 설명</h4>
          <div className={styles.description}>
            {assignment.description.split("\n").map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>과제 정보</h4>
          <div className={styles.assignmentInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>생성자:</span>
              <span>{assignment.creator}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>생성일:</span>
              <span>{formatDate(assignment.createdAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>마감일:</span>
              <span>{formatDate(assignment.dueDate)}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>제출 현황</h4>
            {canSubmit(assignment) && !assignment.isCancelled && (
              <button className={styles.submitButton} onClick={onSubmitClick}>
                과제 제출하기
              </button>
            )}
          </div>
          <div className={styles.submissionList}>
            {assignment.submissions.map((submission) => {
              const avatarData = getMemberAvatarData(submission.memberId);

              return (
                <div
                  key={submission.memberId}
                  className={`${styles.submissionItem} ${submission.status === "제출완료" ? styles.clickable : ""}`}
                  onClick={() => onViewSubmission(submission)}
                >
                  <div className={styles.submissionMember}>
                    <div className={styles.memberAvatar}>
                      {avatarData.type === "url" ? (
                        <Image
                          src={avatarData.value}
                          alt={submission.memberName}
                          width={32}
                          height={32}
                          className={styles.avatarImage}
                          unoptimized
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              const emojiSpan = parent.querySelector("span") as HTMLElement;
                              if (emojiSpan) {
                                emojiSpan.style.display = "flex";
                              }
                            }
                          }}
                        />
                      ) : null}
                      <span
                        className={styles.emojiAvatar}
                        style={{ display: avatarData.type === "url" ? "none" : "flex" }}
                      >
                        {avatarData.value}
                      </span>
                    </div>
                    <span className={styles.memberName}>{submission.memberName}</span>
                  </div>

                  <div className={styles.submissionStatus}>
                    {submission.status === "제출완료" ? (
                      <>
                        <FiCheckCircle color="#10b981" size={16} />
                        <div className={styles.submissionDetails}>
                          <span className={styles.submittedText}>
                            {submission.submittedAt && formatDateShort(submission.submittedAt)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <FiCircle color="#666" size={16} />
                        <span className={styles.waitingText}>대기중</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
