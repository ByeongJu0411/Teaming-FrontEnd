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

  // ActionBar에서 전달받은 avatarUrl 우선 사용
  const convertedMembers: Member[] = Array.isArray(members)
    ? members.map((member: RoomMember) => {
        // avatarUrl이 있으면 우선 사용, 없으면 이모지
        const avatar = member.avatarUrl || generateAvatar(member.name || "Unknown");

        console.log("AssignmentRoom - 멤버 변환:", {
          memberId: member.memberId,
          name: member.name,
          avatarUrl: member.avatarUrl,
          finalAvatar: avatar,
        });

        return {
          id: member.memberId.toString(),
          name: member.name || "알 수 없는 사용자",
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

    const isAssigned = assignment.assignedMembers.includes(currentUserId);
    console.log("- 현재 사용자가 과제에 할당됨:", isAssigned);

    if (!isAssigned) {
      console.log("- 현재 사용자가 이 과제에 할당되지 않음");
      return false;
    }

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

  const handleAssignmentSelect = (assignment: Assignment | null) => {
    setSelectedAssignment(assignment);
  };

  const handleSubmitClick = () => {
    setShowSubmissionModal(true);
  };

  const handleAssignmentUpdate = (updatedAssignment: Assignment) => {
    console.log("handleAssignmentUpdate 호출됨:", updatedAssignment);

    if (selectedAssignment?.id === updatedAssignment.id) {
      setSelectedAssignment(updatedAssignment);
    }

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

        {selectedAssignment && (
          <SubmissionModal
            assignment={selectedAssignment}
            isOpen={showSubmissionModal}
            onClose={() => setShowSubmissionModal(false)}
            onSubmit={handleSubmitAssignment}
            submissionText={submissionText}
            setSubmissionText={setSubmissionText}
            submissionFiles={submissionFiles}
            setSubmissionFiles={setSubmissionFiles}
            roomId={roomId}
            onSuccess={() => {
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
