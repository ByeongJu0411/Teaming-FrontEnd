"use client";
import React from "react";
import { FiClock, FiUser } from "react-icons/fi";
import styles from "./AssignmentList.module.css";

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

interface AssignmentListProps {
  assignments: Assignment[];
  selectedAssignment: Assignment | null;
  onAssignmentSelect: (assignment: Assignment) => void;
  members: Member[];
}

const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  selectedAssignment,
  onAssignmentSelect,
  members,
}) => {
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

  const getCompletionRate = (assignment: Assignment) => {
    const completed = assignment.submissions.filter((s) => s.status === "제출완료").length;
    return Math.round((completed / assignment.submissions.length) * 100);
  };

  return (
    <div className={styles.assignmentList}>
      <div className={styles.listHeader}>
        <h3>진행중인 과제 ({assignments.length})</h3>
      </div>

      <div className={styles.assignments}>
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className={`${styles.assignmentCard} ${selectedAssignment?.id === assignment.id ? styles.selected : ""}`}
            onClick={() => onAssignmentSelect(assignment)}
          >
            <div className={styles.cardHeader}>
              <h4 className={styles.assignmentTitle}>{assignment.title}</h4>
              <span className={styles.statusBadge} style={{ backgroundColor: getStatusColor(assignment.status) }}>
                {assignment.status}
              </span>
            </div>

            <div className={styles.cardInfo}>
              <div className={styles.infoRow}>
                <FiUser size={14} />
                <span>담당자: {assignment.creator}</span>
              </div>
              <div className={styles.infoRow}>
                <FiClock size={14} />
                <span>마감: {formatDateShort(assignment.dueDate)}</span>
              </div>
            </div>

            <div className={styles.progressInfo}>
              <div className={styles.memberAvatars}>
                {assignment.assignedMembers.slice(0, 3).map((memberId) => (
                  <div key={memberId} className={styles.memberAvatar}>
                    {getMemberAvatar(memberId)}
                  </div>
                ))}
                {assignment.assignedMembers.length > 3 && (
                  <div className={styles.memberAvatar}>+{assignment.assignedMembers.length - 3}</div>
                )}
              </div>
              <div className={styles.completionRate}>완료율: {getCompletionRate(assignment)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignmentList;
