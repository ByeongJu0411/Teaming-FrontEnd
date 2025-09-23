"use client";
import React, { useEffect, useState } from "react";
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
  status: "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
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

// 컴포넌트에서 사용할 타입
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
  roomId?: string;
  selectedAssignment: Assignment | null;
  onAssignmentSelect: (assignment: Assignment) => void;
  members: Member[];
  refreshTrigger?: number; // 새로고침 트리거 추가
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

  // roomId 변환
  console.log("AssignmentList: roomId 변환 과정:");
  console.log("- 원본 roomId:", roomId, "타입:", typeof roomId);

  const currentRoomId = roomId && roomId !== "test-room" ? parseInt(roomId, 10) : null;

  console.log("- 변환된 currentRoomId:", currentRoomId, "타입:", typeof currentRoomId);
  console.log("- isNaN check:", isNaN(currentRoomId as number));

  // API 응답을 컴포넌트 형식으로 변환 - 핵심 부분
  const transformApiResponse = (apiData: AssignmentApiResponse): Assignment => {
    const getKoreanStatus = (status: string) => {
      switch (status) {
        case "COMPLETED":
          return "완료";
        case "OVERDUE":
          return "마감";
        case "IN_PROGRESS":
        default:
          return "진행중";
      }
    };

    // 과제에 할당된 멤버들의 제출 현황 생성 - 핵심 로직
    const submissions = apiData.assignedMemberIds.map((memberId) => {
      // members 배열에서 해당 멤버 찾기 (id를 string으로 비교)
      const member = members.find((m) => m.id === memberId.toString());
      const memberName = member?.name || `사용자 ${memberId}`;

      // 해당 멤버의 제출 정보 찾기
      const memberSubmission = apiData.submissions.find((submission) => submission.submitterId === memberId);

      if (memberSubmission) {
        // 제출 완료된 경우
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
        // 아직 제출하지 않은 경우
        return {
          memberId: memberId.toString(),
          memberName,
          status: "대기" as const,
        };
      }
    });

    return {
      id: apiData.assignmentId.toString(),
      title: apiData.title,
      description: apiData.description,
      creator: "담당자",
      assignedMembers: apiData.assignedMemberIds.map((id) => id.toString()),
      dueDate: apiData.due,
      status: getKoreanStatus(apiData.status),
      createdAt: apiData.submissions.length > 0 ? apiData.submissions[0].createdAt : new Date().toISOString(),
      submissions,
    };
  };

  // 과제 목록 API 호출
  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // roomId 유효성 검사
      if (!currentRoomId || isNaN(currentRoomId)) {
        setError("유효한 방 ID가 필요합니다.");
        setAssignments([]);
        setLoading(false);
        return;
      }

      // 토큰 검사
      const token = session?.accessToken;
      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      if (!session?.isBackendAuthenticated) {
        throw new Error("백엔드 인증이 완료되지 않았습니다.");
      }

      console.log("AssignmentList: API 호출 시작 - roomId:", currentRoomId);
      console.log("AssignmentList: API URL:", `${API_BASE_URL}/rooms/${currentRoomId}/assignment`);

      const response = await fetch(`${API_BASE_URL}/rooms/${currentRoomId}/assignment`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("AssignmentList: Response status:", response.status);

      if (!response.ok) {
        if (response.status === 400) {
          // 400 에러의 경우 빈 배열로 처리
          console.warn("AssignmentList: 400 에러 - 빈 과제 목록으로 처리");
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
      console.log("AssignmentList: Raw response:", responseText);

      let data: AssignmentApiResponse[];
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("서버 응답을 파싱할 수 없습니다.");
      }

      if (!Array.isArray(data)) {
        throw new Error("서버 응답이 배열 형식이 아닙니다.");
      }

      console.log("AssignmentList: 변환 전 API 데이터:", data);
      console.log("AssignmentList: 사용 가능한 멤버 목록:", members);

      const transformedAssignments = data.map(transformApiResponse);
      console.log("AssignmentList: 변환 후 과제 데이터:", transformedAssignments);

      setAssignments(transformedAssignments);
    } catch (error) {
      console.error("AssignmentList: 과제 로드 실패:", error);
      setError(error instanceof Error ? error.message : "과제를 불러올 수 없습니다.");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // roomId나 세션이 변경될 때 API 호출
  useEffect(() => {
    console.log("AssignmentList useEffect 실행:");
    console.log("- session:", !!session);
    console.log("- session.isBackendAuthenticated:", session?.isBackendAuthenticated);
    console.log("- currentRoomId:", currentRoomId);
    console.log("- roomId 원본:", roomId);

    if (session && session.isBackendAuthenticated && currentRoomId) {
      console.log("API 호출 조건 만족 - loadAssignments 실행");
      loadAssignments();
    } else {
      console.log("API 호출 조건 불만족:");
      console.log("  session:", !!session);
      console.log("  isBackendAuthenticated:", session?.isBackendAuthenticated);
      console.log("  currentRoomId:", currentRoomId);

      if (!currentRoomId) {
        setError("유효한 방 ID가 필요합니다.");
        setLoading(false);
      }
    }
  }, [currentRoomId, session]);

  // refreshTrigger가 변경되면 새로고침
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && session && session.isBackendAuthenticated && currentRoomId) {
      console.log("AssignmentList: refreshTrigger로 인한 새로고침:", refreshTrigger);
      loadAssignments();
    }
  }, [refreshTrigger]);

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
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentList;
