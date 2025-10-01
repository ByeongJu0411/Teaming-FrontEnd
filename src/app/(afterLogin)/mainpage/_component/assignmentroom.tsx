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
  avatarUrl?: string; // avatarUrl 필드 추가
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
  roomId: number;
  members: RoomMember[];
}

// 컴포넌트에서 사용할 타입 - fileId 필드 추가
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
        fileId: string; // ✅ fileId 필드 추가
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
  const [, setIsLoading] = useState(false);

  // ActionBar에서 전달받은 avatarUrl 우선 사용 - 안전성 검사 추가
  const convertedMembers: Member[] = Array.isArray(members)
    ? members.map((member: RoomMember) => {
        // 안전한 기본값 처리
        const memberId = member?.memberId ?? 0;
        const memberName = member?.name || "알 수 없는 사용자";

        // avatarUrl이 있으면 우선 사용, 없으면 이모지
        const avatar = member?.avatarUrl || generateAvatar(memberName);

        console.log("AssignmentRoom - 멤버 변환:", {
          memberId: memberId,
          name: memberName,
          avatarUrl: member?.avatarUrl,
          finalAvatar: avatar,
        });

        return {
          id: memberId.toString(),
          name: memberName,
          avatar: avatar,
        };
      })
    : [];

  console.log("AssignmentRoom - 원본 members:", members);
  console.log("AssignmentRoom - convertedMembers:", convertedMembers);

  const preventOffModal = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleSubmitAssignment = async (data: { text: string; files: File[] }) => {
    console.log("handleSubmitAssignment 호출됨 (SubmissionModal이 직접 처리)");
  };

  const canSubmit = (assignment: Assignment) => {
    const currentUserName = session?.user?.name;
    const currentUserEmail = session?.user?.email;

    console.log("canSubmit 검사:");
    console.log("- 현재 사용자 이름:", currentUserName);
    console.log("- 현재 사용자 이메일:", currentUserEmail);
    console.log("- 방 멤버들:", members);

    let currentUserId = null;

    // 안전한 멤버 찾기
    if (Array.isArray(members) && members.length > 0) {
      const currentMember = members.find(
        (member) =>
          member && (member.name === currentUserName || member.memberId.toString() === session?.user?.id?.toString())
      );

      if (currentMember) {
        currentUserId = currentMember.memberId.toString();
        console.log("- 찾은 현재 사용자 ID:", currentUserId);
      } else {
        console.log("- 현재 사용자를 방 멤버에서 찾을 수 없음");
      }
    }

    console.log("- assignment.submissions:", assignment.submissions);
    console.log("- assignment.assignedMembers:", assignment.assignedMembers);

    if (!currentUserId) {
      console.log("- 현재 사용자 ID를 찾을 수 없음");
      return false;
    }

    // 과제 할당 여부 확인
    const isAssigned = Array.isArray(assignment.assignedMembers) && assignment.assignedMembers.includes(currentUserId);
    console.log("- 현재 사용자가 과제에 할당됨:", isAssigned);

    if (!isAssigned) {
      console.log("- 현재 사용자가 이 과제에 할당되지 않음");
      return false;
    }

    // 제출 상태 확인
    const mySubmission = Array.isArray(assignment.submissions)
      ? assignment.submissions.find((s) => s && s.memberId === currentUserId)
      : null;
    console.log("- 내 제출 정보:", mySubmission);

    const canSubmitResult = mySubmission?.status === "대기";
    console.log("- 제출 가능 여부:", canSubmitResult);

    return canSubmitResult;
  };

  const handleViewSubmission = (submission: Assignment["submissions"][0]) => {
    if (submission && submission.status === "제출완료" && submission.submissionData) {
      console.log("ViewSubmission 열기:", submission);
      setViewingSubmission(submission);
      setShowViewModal(true);
    } else {
      console.log("제출 데이터가 없거나 아직 제출되지 않음:", submission);
    }
  };

  const handleAssignmentSelect = (assignment: Assignment | null) => {
    console.log("과제 선택됨:", assignment?.id);
    setSelectedAssignment(assignment);
  };

  const handleSubmitClick = () => {
    console.log("과제 제출 모달 열기");
    setShowSubmissionModal(true);
  };

  const handleAssignmentUpdate = (updatedAssignment: Assignment) => {
    console.log("handleAssignmentUpdate 호출됨:", updatedAssignment);

    if (selectedAssignment?.id === updatedAssignment.id) {
      setSelectedAssignment(updatedAssignment);
    }

    // 목록 새로고침 트리거
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSubmissionSuccess = () => {
    console.log("과제 제출 성공, 목록 새로고침");
    setShowSubmissionModal(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleViewModalClose = () => {
    console.log("ViewSubmission 모달 닫기");
    setShowViewModal(false);
    setViewingSubmission(null);
  };

  const handleSubmissionModalClose = () => {
    console.log("Submission 모달 닫기");
    setShowSubmissionModal(false);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // 에러 바운더리 역할
  if (!Array.isArray(members)) {
    console.error("members가 배열이 아닙니다:", members);
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
            <div style={{ padding: "20px", textAlign: "center" }}>멤버 정보를 불러오는 중 오류가 발생했습니다.</div>
          </div>
        </div>
      </div>
    );
  }

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
            members={convertedMembers}
            refreshTrigger={refreshTrigger}
          />

          <AssignmentDetail
            assignment={selectedAssignment}
            members={convertedMembers}
            onSubmitClick={handleSubmitClick}
            onViewSubmission={handleViewSubmission}
            canSubmit={canSubmit}
            roomId={roomId}
            onAssignmentUpdate={handleAssignmentUpdate}
          />
        </div>

        {/* 과제 제출 모달 */}
        {selectedAssignment && (
          <SubmissionModal
            assignment={selectedAssignment}
            isOpen={showSubmissionModal}
            onClose={handleSubmissionModalClose}
            onSubmit={handleSubmitAssignment}
            submissionText={submissionText}
            setSubmissionText={setSubmissionText}
            submissionFiles={submissionFiles}
            setSubmissionFiles={setSubmissionFiles}
            roomId={roomId}
            onSuccess={handleSubmissionSuccess}
          />
        )}

        {/* 제출 내용 보기 모달 */}
        <ViewSubmissionModal submission={viewingSubmission} isOpen={showViewModal} onClose={handleViewModalClose} />
      </div>
    </div>
  );
};

export default AssignmentRoom;
