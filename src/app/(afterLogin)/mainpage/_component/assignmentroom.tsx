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
}

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

// 테스트용 과제 데이터
const testAssignments: Assignment[] = [
  {
    id: "1",
    title: "자료조사 2장 과제부여",
    description:
      "자료조사를 하셨다면 한 장정도 과제를 부여합니다.\n과제시간에 맞춰서 과제 제출해주시면 감사하겠습니다.",
    creator: "팀장 최순조",
    assignedMembers: ["1", "2", "3"],
    dueDate: "2024-09-20T15:00:00Z",
    status: "진행중",
    createdAt: "2024-09-15T10:00:00Z",
    submissions: [
      {
        memberId: "1",
        memberName: "권민석",
        status: "제출완료",
        submittedAt: "2024-09-18T14:30:00Z",
        submissionData: {
          text: "자료조사를 완료했습니다. 첨부된 문서에 상세한 내용이 정리되어 있으니 확인 부탁드립니다.",
          files: [
            { name: "자료조사_보고서.pdf", size: 2048576 },
            { name: "참고자료.docx", size: 1024000 },
          ],
        },
      },
      { memberId: "2", memberName: "정치학 존잘남", status: "대기" },
      { memberId: "3", memberName: "팀플하기싫다", status: "대기" },
    ],
  },
  {
    id: "2",
    title: "프레젠테이션 자료 준비",
    description: "다음 주 발표를 위한 PPT 자료를 준비해주세요.\n각자 담당 파트에 대해 10분 분량으로 작성하시면 됩니다.",
    creator: "팀장 최순조",
    assignedMembers: ["1", "2"],
    dueDate: "2024-09-25T18:00:00Z",
    status: "진행중",
    createdAt: "2024-09-16T09:00:00Z",
    submissions: [
      { memberId: "1", memberName: "권민석", status: "대기" },
      { memberId: "2", memberName: "정치학 존잘남", status: "대기" },
    ],
  },
];

// 테스트용 팀원 데이터
const testMembers = [
  { id: "1", name: "권민석", avatar: "🐱" },
  { id: "2", name: "정치학 존잘남", avatar: "😎" },
  { id: "3", name: "팀플하기싫다", avatar: "😩" },
];

const AssignmentRoom = ({ setModal }: ModalProps) => {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>(testAssignments);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<Assignment["submissions"][0] | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);

  const preventOffModal = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleSubmitAssignment = (data: { text: string; files: File[] }) => {
    if (!selectedAssignment) return;

    // 과제 제출 로직
    const submissionData = {
      assignmentId: selectedAssignment.id,
      text: data.text,
      files: data.files,
      submittedAt: new Date().toISOString(),
    };

    console.log("과제 제출:", submissionData);

    // 제출 상태 업데이트
    setAssignments((prev) =>
      prev.map((assignment) => {
        if (assignment.id === selectedAssignment.id) {
          return {
            ...assignment,
            submissions: assignment.submissions.map((submission) => {
              if (submission.memberId === "1") {
                // 현재 사용자 ID
                return {
                  ...submission,
                  status: "제출완료" as const,
                  submittedAt: new Date().toISOString(),
                  submissionData: {
                    text: data.text,
                    files: data.files.map((file) => ({
                      name: file.name,
                      size: file.size,
                    })),
                  },
                };
              }
              return submission;
            }),
          };
        }
        return assignment;
      })
    );

    // 선택된 과제도 업데이트
    if (selectedAssignment) {
      const updatedAssignment = {
        ...selectedAssignment,
        submissions: selectedAssignment.submissions.map((submission) => {
          if (submission.memberId === "1") {
            return {
              ...submission,
              status: "제출완료" as const,
              submittedAt: new Date().toISOString(),
              submissionData: {
                text: data.text,
                files: data.files.map((file) => ({
                  name: file.name,
                  size: file.size,
                })),
              },
            };
          }
          return submission;
        }),
      };
      setSelectedAssignment(updatedAssignment);
    }

    // 모달 닫기 및 폼 리셋
    setShowSubmissionModal(false);
    setSubmissionText("");
    setSubmissionFiles([]);
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
        {/* 헤더 */}
        <div className={styles.modalHeader}>
          <button onClick={setModal} className={styles.backButton}>
            <IoChevronBack size={24} />
          </button>
          <h2 className={styles.modalTitle}>과제 확인하기</h2>
        </div>

        <div className={styles.modalBody}>
          {/* 과제 목록 */}
          <AssignmentList
            assignments={assignments}
            selectedAssignment={selectedAssignment}
            onAssignmentSelect={handleAssignmentSelect}
            members={testMembers}
          />

          {/* 과제 상세 정보 */}
          <AssignmentDetail
            assignment={selectedAssignment}
            members={testMembers}
            onSubmitClick={handleSubmitClick}
            onViewSubmission={handleViewSubmission}
            canSubmit={canSubmit}
          />
        </div>

        {/* 과제 제출 모달 */}
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

        {/* 제출 내용 확인 모달 */}
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
