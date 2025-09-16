"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "./assignmentroom.module.css";
import { IoChevronBack } from "react-icons/io5";
import { FiClock, FiUser, FiCheckCircle, FiCircle, FiUpload, FiFile, FiX } from "react-icons/fi";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preventOffModal = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

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
    const member = testMembers.find((m) => m.id === memberId);
    return member?.avatar || "👤";
  };

  const getCompletionRate = (assignment: Assignment) => {
    const completed = assignment.submissions.filter((s) => s.status === "제출완료").length;
    return Math.round((completed / assignment.submissions.length) * 100);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSubmissionFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setSubmissionFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmitAssignment = () => {
    if (!selectedAssignment) return;

    // 과제 제출 로직
    const submissionData = {
      assignmentId: selectedAssignment.id,
      text: submissionText,
      files: submissionFiles,
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
                    text: submissionText,
                    files: submissionFiles.map((file) => ({
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
                text: submissionText,
                files: submissionFiles.map((file) => ({
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
          <div className={styles.assignmentList}>
            <div className={styles.listHeader}>
              <h3>진행중인 과제 ({assignments.length})</h3>
            </div>

            <div className={styles.assignments}>
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={`${styles.assignmentCard} ${
                    selectedAssignment?.id === assignment.id ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedAssignment(assignment)}
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

          {/* 과제 상세 정보 */}
          <div className={styles.assignmentDetail}>
            {selectedAssignment ? (
              <>
                <div className={styles.detailHeader}>
                  <h3>{selectedAssignment.title}</h3>
                  <span
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(selectedAssignment.status) }}
                  >
                    {selectedAssignment.status}
                  </span>
                </div>

                <div className={styles.detailContent}>
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>과제 설명</h4>
                    <div className={styles.description}>
                      {selectedAssignment.description.split("\n").map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>과제 정보</h4>
                    <div className={styles.assignmentInfo}>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>생성자:</span>
                        <span>{selectedAssignment.creator}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>생성일:</span>
                        <span>{formatDate(selectedAssignment.createdAt)}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>마감일:</span>
                        <span>{formatDate(selectedAssignment.dueDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <h4 className={styles.sectionTitle}>제출 현황</h4>
                      {selectedAssignment && canSubmit(selectedAssignment) && (
                        <button className={styles.submitButton} onClick={() => setShowSubmissionModal(true)}>
                          과제 제출하기
                        </button>
                      )}
                    </div>
                    <div className={styles.submissionList}>
                      {selectedAssignment.submissions.map((submission) => (
                        <div
                          key={submission.memberId}
                          className={`${styles.submissionItem} ${
                            submission.status === "제출완료" ? styles.clickable : ""
                          }`}
                          onClick={() => handleViewSubmission(submission)}
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
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <h3>과제를 선택해주세요</h3>
                <p>왼쪽에서 과제를 선택하면 상세 정보를 확인할 수 있습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 과제 제출 모달 */}
        {showSubmissionModal && selectedAssignment && (
          <div className={styles.submissionModalBackground} onClick={() => setShowSubmissionModal(false)}>
            <div className={styles.submissionModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.submissionHeader}>
                <h3>과제 제출하기</h3>
                <button className={styles.closeButton} onClick={() => setShowSubmissionModal(false)}>
                  <FiX size={20} />
                </button>
              </div>

              <div className={styles.submissionContent}>
                <div className={styles.assignmentSummary}>
                  <h4>{selectedAssignment.title}</h4>
                  <p>마감일: {formatDate(selectedAssignment.dueDate)}</p>
                </div>

                <div className={styles.submissionForm}>
                  <div className={styles.formSection}>
                    <label className={styles.formLabel}>제출 내용</label>
                    <textarea
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="과제에 대한 설명이나 제출 내용을 작성해주세요..."
                      className={styles.submissionTextarea}
                      rows={6}
                    />
                  </div>

                  <div className={styles.formSection}>
                    <label className={styles.formLabel}>파일 첨부</label>
                    <div className={styles.fileUploadArea}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        style={{ display: "none" }}
                      />
                      <button className={styles.fileUploadButton} onClick={() => fileInputRef.current?.click()}>
                        <FiUpload size={16} />
                        파일 선택
                      </button>
                      <span className={styles.fileUploadText}>파일을 선택하거나 드래그해서 업로드하세요</span>
                    </div>

                    {submissionFiles.length > 0 && (
                      <div className={styles.fileList}>
                        {submissionFiles.map((file, index) => (
                          <div key={index} className={styles.fileItem}>
                            <div className={styles.fileInfo}>
                              <FiFile size={16} />
                              <span className={styles.fileName}>{file.name}</span>
                              <span className={styles.fileSize}>({formatFileSize(file.size)})</span>
                            </div>
                            <button className={styles.removeFileButton} onClick={() => removeFile(index)}>
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.submissionFooter}>
                <button className={styles.cancelButton} onClick={() => setShowSubmissionModal(false)}>
                  취소
                </button>
                <button
                  className={styles.confirmSubmitButton}
                  onClick={handleSubmitAssignment}
                  disabled={!submissionText.trim() && submissionFiles.length === 0}
                >
                  제출하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 제출 내용 확인 모달 */}
        {showViewModal && viewingSubmission && (
          <div className={styles.submissionModalBackground} onClick={() => setShowViewModal(false)}>
            <div className={styles.submissionModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.submissionHeader}>
                <h3>{viewingSubmission.memberName}님의 제출 내용</h3>
                <button className={styles.closeButton} onClick={() => setShowViewModal(false)}>
                  <FiX size={20} />
                </button>
              </div>

              <div className={styles.submissionContent}>
                <div className={styles.submissionInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>제출자:</span>
                    <span>{viewingSubmission.memberName}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>제출일:</span>
                    <span>{viewingSubmission.submittedAt && formatDate(viewingSubmission.submittedAt)}</span>
                  </div>
                </div>

                {viewingSubmission.submissionData && (
                  <div className={styles.submissionViewForm}>
                    {viewingSubmission.submissionData.text && (
                      <div className={styles.formSection}>
                        <label className={styles.formLabel}>제출 내용</label>
                        <div className={styles.submissionTextView}>{viewingSubmission.submissionData.text}</div>
                      </div>
                    )}

                    {viewingSubmission.submissionData.files.length > 0 && (
                      <div className={styles.formSection}>
                        <label className={styles.formLabel}>첨부 파일</label>
                        <div className={styles.fileList}>
                          {viewingSubmission.submissionData.files.map((file, index) => (
                            <div key={index} className={styles.fileViewItem}>
                              <div className={styles.fileInfo}>
                                <FiFile size={16} />
                                <span className={styles.fileName}>{file.name}</span>
                                <span className={styles.fileSize}>({formatFileSize(file.size)})</span>
                              </div>
                              <button className={styles.downloadButton}>다운로드</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.submissionFooter}>
                <button className={styles.cancelButton} onClick={() => setShowViewModal(false)}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentRoom;
