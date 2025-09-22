"use client";
import React from "react";
import { FiCheckCircle, FiCircle } from "react-icons/fi";
import styles from "./AssignmentDetail.module.css";

interface Assignment {
  id: string;
  title: string;
  description: string;
  creator: string;
  assignedMembers: string[];
  dueDate: string;
  status: "진행중" | "완료" | "마감";
  createdAt: string;
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
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({
  assignment,
  members,
  onSubmitClick,
  onViewSubmission,
  canSubmit,
}) => {
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
      default:
        return "#3b82f6";
    }
  };

  const getMemberAvatar = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member?.avatar || "👤";
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
    <div className={styles.assignmentDetail}>
      <div className={styles.detailHeader}>
        <h3>{assignment.title}</h3>
        <span className={styles.statusBadge} style={{ backgroundColor: getStatusColor(assignment.status) }}>
          {assignment.status}
        </span>
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
            {canSubmit(assignment) && (
              <button className={styles.submitButton} onClick={onSubmitClick}>
                과제 제출하기
              </button>
            )}
          </div>
          <div className={styles.submissionList}>
            {assignment.submissions.map((submission) => (
              <div
                key={submission.memberId}
                className={`${styles.submissionItem} ${submission.status === "제출완료" ? styles.clickable : ""}`}
                onClick={() => onViewSubmission(submission)}
              >
                <div className={styles.submissionMember}>
                  <div className={styles.memberAvatar}>{getMemberAvatar(submission.memberId)}</div>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
