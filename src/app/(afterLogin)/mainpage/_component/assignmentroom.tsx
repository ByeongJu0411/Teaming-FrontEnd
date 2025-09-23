"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./assignmentroom.module.css";
import { IoChevronBack } from "react-icons/io5";
import AssignmentList from "./_assignment/AssignmentList";
import AssignmentDetail from "./_assignment/AssignmentDetail";
import SubmissionModal from "./_assignment/SubmissionModal";
import ViewSubmissionModal from "./_assignment/ViewSubmissionModal";

// 방 멤버 타입 (ActionBar에서 가져온 것과 동일)
interface RoomMember {
  memberId: number;
  lastReadMessageId: number;
  name: string;
  avatarKey: string;
  avatarVersion: number;
  roomRole: "LEADER" | string;
}

// AssignmentDetail에서 사용하는 Member 타입
interface Member {
  id: string;
  name: string;
  avatar: string;
}

interface ModalProps {
  setModal: () => void;
  roomId: string;
  members: RoomMember[]; // optional을 제거하고 필수로 변경
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

// 기본 아바타 생성 함수
const generateAvatar = (name: string): string => {
  const avatars = ["🐱", "🐶", "🐰", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵"];
  const index = name.length % avatars.length;
  return avatars[index];
};

const AssignmentRoom = ({ setModal, roomId, members }: ModalProps) => {
  const { data: session } = useSession();

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<Assignment["submissions"][0] | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

  // 실제 방 멤버를 AssignmentDetail에서 사용하는 형식으로 변환
  const convertedMembers: Member[] = Array.isArray(members)
    ? members.map((member: RoomMember) => ({
        id: member.memberId.toString(),
        name: member.name || "알 수 없는 사용자",
        avatar: member.avatarKey
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/files/${member.avatarKey}?v=${member.avatarVersion}`
          : generateAvatar(member.name || "Unknown"),
      }))
    : [];

  // 디버깅용 로그
  console.log("AssignmentRoom - members:", members);
  console.log("AssignmentRoom - convertedMembers:", convertedMembers);

  const preventOffModal = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  // 과제 제출 처리
  const handleSubmitAssignment = async (data: { text: string; files: File[] }) => {
    if (!selectedAssignment || !session?.accessToken) return;

    try {
      setIsLoading(true); // 로딩 상태 설정

      // API 스펙에 맞는 FormData 또는 JSON 구성
      const formData = new FormData();

      // assignmentId와 description을 FormData에 추가
      formData.append("assignmentId", selectedAssignment.id);
      formData.append("description", data.text);

      // 파일들을 FormData에 추가
      data.files.forEach((file, index) => {
        formData.append(`files`, file); // 또는 files[${index}] 형식
      });

      console.log("과제 제출 요청:");
      console.log("- assignmentId:", selectedAssignment.id);
      console.log("- description:", data.text);
      console.log("- files:", data.files);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/rooms/${roomId}/assignment/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            // multipart/form-data의 경우 Content-Type을 명시하지 않음 (브라우저가 자동 설정)
          },
          body: formData,
        }
      );

      console.log("과제 제출 API 응답 상태:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 403) {
          throw new Error("과제 제출 권한이 없습니다.");
        } else if (response.status === 404) {
          throw new Error("존재하지 않는 과제입니다.");
        } else {
          const errorText = await response.text();
          console.error("과제 제출 API 오류:", errorText);
          throw new Error(`서버 오류가 발생했습니다. (${response.status}): ${errorText}`);
        }
      }

      // 응답 처리 (JSON이 있는 경우에만 파싱)
      let result = null;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const responseText = await response.text();
        if (responseText) {
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.warn("JSON 파싱 실패, 하지만 제출은 성공:", responseText);
          }
        }
      }

      console.log("과제 제출 성공:", result || "응답 본문 없음");

      // 성공 처리
      setShowSubmissionModal(false);
      setSubmissionText("");
      setSubmissionFiles([]);
      alert("과제가 성공적으로 제출되었습니다!");

      // 과제 목록 새로고침
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("과제 제출 실패:", error);
      alert(`과제 제출에 실패했습니다:\n${error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}`);
    } finally {
      setIsLoading(false); // 로딩 상태 해제
    }
  };

  const canSubmit = (assignment: Assignment) => {
    // 현재 로그인한 사용자의 실제 멤버 ID 찾기
    const currentUserName = session?.user?.name;
    const currentUserEmail = session?.user?.email;

    console.log("canSubmit 검사:");
    console.log("- 현재 사용자 이름:", currentUserName);
    console.log("- 현재 사용자 이메일:", currentUserEmail);
    console.log("- 방 멤버들:", members);

    // 현재 사용자를 방 멤버 목록에서 찾기
    let currentUserId = null;
    const currentMember = members.find(
      (member) => member.name === currentUserName || member.memberId.toString() === session?.user?.id?.toString()
    );

    if (currentMember) {
      currentUserId = currentMember.memberId.toString();
      console.log("- 찾은 현재 사용자 ID:", currentUserId);
    } else {
      console.log("- 현재 사용자를 방 멤버에서 찾을 수 없음");
    }

    console.log("- assignment.submissions:", assignment.submissions);
    console.log("- assignment.assignedMembers:", assignment.assignedMembers);

    if (!currentUserId) {
      console.log("- 현재 사용자 ID를 찾을 수 없음");
      return false;
    }

    // 현재 사용자가 이 과제에 할당되었는지 확인
    const isAssigned = assignment.assignedMembers.includes(currentUserId);
    console.log("- 현재 사용자가 과제에 할당됨:", isAssigned);

    if (!isAssigned) {
      console.log("- 현재 사용자가 이 과제에 할당되지 않음");
      return false;
    }

    // 현재 사용자의 제출 상태 확인
    const mySubmission = assignment.submissions.find((s) => s.memberId === currentUserId);
    console.log("- 내 제출 정보:", mySubmission);

    const canSubmitResult = mySubmission?.status === "대기";
    console.log("- 제출 가능 여부:", canSubmitResult);

    return canSubmitResult;
  };

  const handleViewSubmission = (submission: Assignment["submissions"][0]) => {
    if (submission.status === "제출완료" && submission.submissionData) {
      setViewingSubmission(submission);
      setShowViewModal(true);
    }
  };

  const handleAssignmentSelect = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
  };

  const handleSubmitClick = () => {
    setShowSubmissionModal(true);
  };

  // 과제 생성 완료 시 새로고침
  const handleAssignmentCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div onClick={setModal} className={styles.modalBackground}>
      <div onClick={preventOffModal} className={styles.modal}>
        <div className={styles.modalHeader}>
          <button onClick={setModal} className={styles.backButton}>
            <IoChevronBack size={24} />
          </button>
          <h2 className={styles.modalTitle}>과제 확인하기</h2>
        </div>

        <div className={styles.modalBody}>
          <AssignmentList
            roomId={roomId}
            selectedAssignment={selectedAssignment}
            onAssignmentSelect={handleAssignmentSelect}
            members={convertedMembers} // 변환된 멤버 배열 전달
            refreshTrigger={refreshTrigger}
          />

          <AssignmentDetail
            assignment={selectedAssignment}
            members={convertedMembers} // 변환된 멤버 배열 전달
            onSubmitClick={handleSubmitClick}
            onViewSubmission={handleViewSubmission}
            canSubmit={canSubmit}
          />
        </div>

        {selectedAssignment && (
          <SubmissionModal
            assignment={selectedAssignment}
            isOpen={showSubmissionModal}
            onClose={() => setShowSubmissionModal(false)}
            onSubmit={handleSubmitAssignment} // 기존 함수 유지 (호환성)
            submissionText={submissionText}
            setSubmissionText={setSubmissionText}
            submissionFiles={submissionFiles}
            setSubmissionFiles={setSubmissionFiles}
            roomId={roomId} // roomId 전달
            onSuccess={() => {
              // 제출 성공 시 새로고침
              setRefreshTrigger((prev) => prev + 1);
            }}
          />
        )}

        <ViewSubmissionModal
          submission={viewingSubmission}
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
        />
      </div>
    </div>
  );
};

export default AssignmentRoom;
