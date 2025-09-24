"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FiClock, FiUser } from "react-icons/fi";
import styles from "./AssignmentList.module.css";

// API 응답 타입
interface AssignmentApiResponse {
  assignmentId: number;
  title: string;
  description: string;
  assignedMemberIds: number[];
  due: string;
  status: "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELED";
  creatorId?: number;
  creatorName?: string;
  createdAt?: string;
  isCancelled?: boolean;
  submissions: {
    submitterId: number;
    description: string;
    createdAt: string;
    updatedAt: string;
    files: {
      fileId: number;
      fileName: string;
      fileType: "IMAGE" | "DOCUMENT" | "VIDEO" | "AUDIO" | "OTHER";
      mimeType: string;
      fileSize: number;
    }[];
  }[];
}

// 제출 현황 타입
interface SubmissionStatus {
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
}

// 컴포넌트에서 사용할 타입
interface Assignment {
  id: string;
  title: string;
  description: string;
  creator: string;
  assignedMembers: string[];
  dueDate: string;
  status: "진행중" | "완료" | "마감" | "취소";
  createdAt: string;
  submissions: SubmissionStatus[];
  isCancelled?: boolean;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
}

interface AssignmentListProps {
  roomId?: number;
  selectedAssignment: Assignment | null;
  onAssignmentSelect: (assignment: Assignment | null) => void;
  members: Member[];
  refreshTrigger?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080";

const AssignmentList: React.FC<AssignmentListProps> = ({
  roomId,
  selectedAssignment,
  onAssignmentSelect,
  members,
  refreshTrigger,
}) => {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 취소된 과제 ID들을 로컬스토리지에서 관리
  const getCancelledAssignments = useCallback((): string[] => {
    if (typeof window === "undefined") return [];
    const cancelled = localStorage.getItem("cancelledAssignments");
    return cancelled ? JSON.parse(cancelled) : [];
  }, []);

  // API 응답을 컴포넌트 형식으로 변환 - useCallback으로 메모이제이션
  const transformApiResponse = useCallback(
    (apiData: AssignmentApiResponse): Assignment => {
      // 과제에 할당된 멤버들의 제출 현황 생성
      const submissions: SubmissionStatus[] = apiData.assignedMemberIds.map((memberId) => {
        const member = members.find((m) => m.id === memberId.toString());
        const memberName = member?.name || `사용자 ${memberId}`;
        const memberSubmission = apiData.submissions.find((submission) => submission.submitterId === memberId);

        if (memberSubmission) {
          return {
            memberId: memberId.toString(),
            memberName,
            submittedAt: memberSubmission.updatedAt,
            status: "제출완료" as const,
            submissionData: {
              text: memberSubmission.description,
              files: memberSubmission.files.map((file) => ({
                name: file.fileName,
                size: file.fileSize,
                url: undefined,
              })),
            },
          };
        } else {
          return {
            memberId: memberId.toString(),
            memberName,
            status: "대기" as const,
          };
        }
      });

      // 상태 결정 로직
      const getKoreanStatus = (
        apiData: AssignmentApiResponse,
        submissions: SubmissionStatus[]
      ): "진행중" | "완료" | "마감" | "취소" => {
        // 서버에서 취소 상태를 제공하는 경우 우선 확인
        if (apiData.status === "CANCELED" || apiData.isCancelled) {
          return "취소";
        }

        const completedCount = submissions.filter((s) => s.status === "제출완료").length;
        const totalCount = submissions.length;
        const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        // 현재 시간과 마감일 비교
        const now = new Date();
        const dueDate = new Date(apiData.due);
        const isOverdue = dueDate < now;

        // 상태 결정 우선순위
        if (completionRate === 100) {
          return "완료";
        } else if (isOverdue) {
          return "마감";
        } else {
          return "진행중";
        }
      };

      // 과제 생성자 이름 찾기
      const getCreatorName = (apiData: AssignmentApiResponse): string => {
        if (apiData.creatorName) {
          return apiData.creatorName;
        }

        if (apiData.creatorId) {
          const creator = members.find((m) => m.id === apiData.creatorId?.toString());
          if (creator) {
            return creator.name;
          }
        }

        return "담당자";
      };

      return {
        id: apiData.assignmentId.toString(),
        title: apiData.title,
        description: apiData.description,
        creator: getCreatorName(apiData),
        assignedMembers: apiData.assignedMemberIds.map((id) => id.toString()),
        dueDate: apiData.due,
        status: getKoreanStatus(apiData, submissions),
        createdAt:
          apiData.createdAt ||
          (apiData.submissions.length > 0 ? apiData.submissions[0].createdAt : new Date().toISOString()),
        submissions,
        isCancelled: apiData.status === "CANCELED" || apiData.isCancelled || false,
      };
    },
    [members]
  );

  // 과제 목록 API 호출 - useCallback으로 메모이제이션
  const loadAssignments = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!roomId || isNaN(roomId)) {
        setError("유효한 방 ID가 필요합니다.");
        setAssignments([]);
        setLoading(false);
        return;
      }

      const token = session?.accessToken;
      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      if (!session?.isBackendAuthenticated) {
        throw new Error("백엔드 인증이 완료되지 않았습니다.");
      }

      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/assignment`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 400) {
          setAssignments([]);
          setError("아직 만들어진 과제가 없습니다.");
          setLoading(false);
          return;
        } else if (response.status === 401) {
          throw new Error("인증이 만료되었습니다.");
        } else {
          throw new Error(`서버 오류가 발생했습니다. (${response.status})`);
        }
      }

      const responseText = await response.text();
      let data: AssignmentApiResponse[];

      try {
        data = JSON.parse(responseText);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (parseError) {
        throw new Error("서버 응답을 파싱할 수 없습니다.");
      }

      if (!Array.isArray(data)) {
        throw new Error("서버 응답이 배열 형식이 아닙니다.");
      }

      const transformedAssignments = data.map((apiData) => {
        const assignment = transformApiResponse(apiData);

        // 로컬스토리지에서 취소 상태 확인
        const cancelledIds = getCancelledAssignments();
        if (cancelledIds.includes(assignment.id)) {
          assignment.isCancelled = true;
          assignment.status = "취소";
        }

        return assignment;
      });

      setAssignments(transformedAssignments);
    } catch (error) {
      console.error("AssignmentList: 과제 로드 실패:", error);
      setError(error instanceof Error ? error.message : "과제를 불러올 수 없습니다.");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [roomId, session, transformApiResponse, getCancelledAssignments]);

  // roomId나 세션이 변경될 때 API 호출
  useEffect(() => {
    if (session && session.isBackendAuthenticated && roomId) {
      loadAssignments();
    } else if (!roomId) {
      setError("유효한 방 ID가 필요합니다.");
      setLoading(false);
    }
  }, [session, roomId, loadAssignments]);

  // refreshTrigger가 변경되면 새로고침
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && session && session.isBackendAuthenticated && roomId) {
      loadAssignments();
    }
  }, [refreshTrigger, session, roomId, loadAssignments]);

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string): string => {
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

  const getMemberAvatar = (memberId: string): string => {
    const member = members.find((m) => m.id === memberId);
    return member?.avatar || "👤";
  };

  const getCompletionRate = (assignment: Assignment): number => {
    if (assignment.submissions.length === 0) return 0;
    const completed = assignment.submissions.filter((s) => s.status === "제출완료").length;
    return Math.round((completed / assignment.submissions.length) * 100);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className={styles.assignmentList}>
        <div className={styles.listHeader}>
          <h3>진행중인 과제</h3>
        </div>
        <div className={styles.loadingMessage}>과제를 불러오는 중...</div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={styles.assignmentList}>
        <div className={styles.listHeader}>
          <h3>진행중인 과제</h3>
        </div>
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={loadAssignments} className={styles.retryButton}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.assignmentList}>
      <div className={styles.listHeader}>
        <h3>진행중인 과제 ({assignments.length})</h3>
      </div>

      <div className={styles.assignments}>
        {assignments.length === 0 ? (
          <div className={styles.emptyMessage}>아직 만들어진 과제가 없습니다.</div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className={`${styles.assignmentCard} ${assignment.isCancelled ? styles.cancelled : ""} ${
                selectedAssignment?.id === assignment.id ? styles.selected : ""
              }`}
              onClick={() => !assignment.isCancelled && onAssignmentSelect(assignment)}
            >
              {assignment.isCancelled && (
                <div className={styles.cancelledOverlay}>
                  <div className={styles.cancelledText}>취소됨</div>
                </div>
              )}

              <div className={styles.cardHeader}>
                <h4 className={styles.assignmentTitle}>{assignment.title}</h4>
                <div className={styles.cardHeaderActions}>
                  <span className={styles.statusBadge} style={{ backgroundColor: getStatusColor(assignment.status) }}>
                    {assignment.status}
                  </span>
                </div>
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
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentList;
