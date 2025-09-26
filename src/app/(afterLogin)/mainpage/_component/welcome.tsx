"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import styles from "./welcome.module.css";
import TextType from "@/app/_component/TextType";

// API 응답 타입 정의
interface Assignment {
  assignmentId: number;
  roomId: number;
  title: string;
  description: string;
  due: string; // 필드명을 deadline에서 due로 수정
  status: string; // "IN_PROGRESS" | "COMPLETED"
}

// 화면 표시용 타입
interface ScheduleItem {
  id: number;
  title: string;
  subtitle: string;
  status: string;
  color: string;
  deadline: Date;
}

interface WelcomeProps {
  refreshTrigger?: number;
}

export default function Welcome({ refreshTrigger }: WelcomeProps) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  // 마감일 포맷 함수
  const formatDeadline = (deadline: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `오늘 ${deadline.getHours().toString().padStart(2, "0")}:${deadline
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    } else if (diffDays === 1) {
      return `내일 ${deadline.getHours().toString().padStart(2, "0")}:${deadline
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    } else if (diffDays > 0) {
      const month = deadline.getMonth() + 1;
      const date = deadline.getDate();
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      const dayOfWeek = days[deadline.getDay()];
      return `${month}월 ${date}일 (${dayOfWeek})까지`;
    } else {
      return "기한 만료";
    }
  };

  // 상태별 색상 결정
  const getStatusColor = (status: string, deadline: Date): string => {
    if (status === "COMPLETED") return "#10b981"; // 초록색 - 완료

    const now = new Date();
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 24) return "#ef4444"; // 빨간색 - 24시간 이내
    if (diffHours <= 72) return "#f59e0b"; // 주황색 - 3일 이내
    return "#3b82f6"; // 파란색 - 여유 있음
  };

  // 과제 데이터 가져오기
  const fetchAssignments = useCallback(async () => {
    if (!session?.accessToken || !session?.isBackendAuthenticated) {
      console.log("Welcome: 세션 또는 토큰이 없어서 API 호출하지 않음");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = session.accessToken;
      console.log("Welcome: 과제 API 요청 시작");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/rooms/assignments`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Welcome: Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Welcome: Error response:", errorText);
        throw new Error(`서버 오류가 발생했습니다. (${response.status})`);
      }

      const data: Assignment[] = await response.json();
      console.log("Welcome: 받은 과제 데이터:", data);

      // 데이터 변환 및 마감일 기준 정렬
      const convertedItems: ScheduleItem[] = data
        .map((assignment) => {
          const deadline = new Date(assignment.due); // due 필드 사용
          return {
            id: assignment.assignmentId,
            title: `${assignment.title} - ${formatDeadline(deadline)}`,
            subtitle: assignment.description,
            status: assignment.status === "COMPLETED" ? "completed" : "ongoing",
            color: getStatusColor(assignment.status, deadline),
            deadline: deadline,
          };
        })
        .sort((a, b) => a.deadline.getTime() - b.deadline.getTime()); // 마감일 가까운 순 정렬

      setScheduleItems(convertedItems);
    } catch (err) {
      console.error("Welcome: 과제 목록을 가져오는데 실패했습니다:", err);
      setError(err instanceof Error ? err.message : "과제 목록을 불러올 수 없습니다");
      setScheduleItems([]);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, session?.isBackendAuthenticated]);

  // 초기 로딩
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // refreshTrigger로 새로고침
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log("Welcome: 과제 생성으로 인한 새로고침, refreshTrigger:", refreshTrigger);
      fetchAssignments();
    }
  }, [refreshTrigger, fetchAssignments]);

  return (
    <div className={styles.welcomeSection}>
      <div className={styles.welcomeMessage}>
        <div className={styles.messageLine}>
          <TextType
            text="우리의 팀플"
            typingSpeed={50}
            loop={false}
            startOnVisible={true}
            className={styles.typewriterText}
            as="div"
          />
        </div>
        <div className={styles.messageLine}>
          <TextType
            text="더 빠르고 더 스마트하게"
            typingSpeed={50}
            initialDelay={1000}
            loop={false}
            startOnVisible={true}
            className={styles.typewriterText}
            as="div"
          />
        </div>
      </div>

      {/* 일정 한눈에 섹션 */}
      <div className={styles.scheduleSection}>
        <div className={styles.scheduleHeader}>일정 한눈에</div>

        <div className={styles.scheduleList}>
          {loading ? (
            <div className={styles.scheduleMessage}>일정을 불러오는 중...</div>
          ) : error ? (
            <div className={styles.scheduleMessage}>{error}</div>
          ) : scheduleItems.length === 0 ? (
            <div className={styles.scheduleMessage}>등록된 과제가 없습니다</div>
          ) : (
            scheduleItems.map((item, index) => (
              <div
                key={item.id}
                className={styles.scheduleItem}
                style={{
                  animationDelay: `${3400 + index * 200}ms`,
                }}
              >
                <div className={styles.statusIndicator} style={{ backgroundColor: item.color }}></div>
                <div className={styles.scheduleContent}>
                  <div className={styles.scheduleTitle}>{item.title}</div>
                  <div className={styles.scheduleSubtitle}>{item.subtitle}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
