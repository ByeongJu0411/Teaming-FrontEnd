"use client";
import React, { useEffect, useState } from "react";
import styles from "./assignmentroom.module.css";
import { IoChevronBack } from "react-icons/io5";
import AssignmentList from "./_assignment/AssignmentList";
import AssignmentDetail from "./_assignment/AssignmentDetail";
import SubmissionModal from "./_assignment/SubmissionModal";
import ViewSubmissionModal from "./_assignment/ViewSubmissionModal";

interface ModalProps {
  setModal: () => void;
  roomId?: string;
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

// 테스트용 팀원 데이터
const testMembers = [
  { id: "1", name: "권민석", avatar: "🐱" },
  { id: "2", name: "정치학 존잘남", avatar: "😎" },
  { id: "3", name: "팀플하기싫다", avatar: "😩" },
];

const AssignmentRoom = ({ setModal, roomId }: ModalProps) => {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<Assignment["submissions"][0] | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);

  const preventOffModal = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  // 과제 제출 처리 (임시 - 실제로는 API 호출 필요)
  const handleSubmitAssignment = async (data: { text: string; files: File[] }) => {
    if (!selectedAssignment) return;

    try {
      // 여기에 과제 제출 API 호출 로직 추가
      console.log("과제 제출:", {
        assignmentId: selectedAssignment.id,
        text: data.text,
        files: data.files,
      });

      // 임시로 로컬 상태 업데이트
      setShowSubmissionModal(false);
      setSubmissionText("");
      setSubmissionFiles([]);
      alert("과제가 성공적으로 제출되었습니다.");
    } catch (error) {
      console.error("Failed to submit assignment:", error);
      alert("과제 제출에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const canSubmit = (assignment: Assignment) => {
    const mySubmission = assignment.submissions.find((s) => s.memberId === "1");
    return mySubmission?.status === "대기";
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
          {/* AssignmentList가 자체적으로 API 호출 */}
          <AssignmentList
            roomId={roomId}
            selectedAssignment={selectedAssignment}
            onAssignmentSelect={handleAssignmentSelect}
            members={testMembers}
          />

          <AssignmentDetail
            assignment={selectedAssignment}
            members={testMembers}
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
            onSubmit={handleSubmitAssignment}
            submissionText={submissionText}
            setSubmissionText={setSubmissionText}
            submissionFiles={submissionFiles}
            setSubmissionFiles={setSubmissionFiles}
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
