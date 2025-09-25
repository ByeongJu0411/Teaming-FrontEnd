"use client";
import React, { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { FiX, FiUpload, FiFile } from "react-icons/fi";
import styles from "./SubmissionModal.module.css";

interface Assignment {
  id: string;
  title: string;
  description: string;
  creator: string;
  assignedMembers: string[];
  dueDate: string;
  status: "진행중" | "완료" | "마감" | "취소"; // 취소 상태 추가
  createdAt: string;
  isCancelled?: boolean; // 취소 여부 플래그 추가
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

interface SubmissionModalProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { text: string; files: File[] }) => void; // 옵셔널로 변경
  submissionText: string;
  setSubmissionText: (text: string) => void;
  submissionFiles: File[];
  setSubmissionFiles: React.Dispatch<React.SetStateAction<File[]>>;
  roomId: number; // roomId 추가
  onSuccess?: () => void; // 성공 시 콜백 추가
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onSubmit,
  submissionText,
  setSubmissionText,
  submissionFiles,
  setSubmissionFiles,
  roomId,
  onSuccess,
}) => {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  // API 호출 함수
  const submitAssignment = async () => {
    if (!session?.accessToken || !session?.isBackendAuthenticated) {
      alert("인증이 필요합니다. 로그인 상태를 확인해주세요.");
      return;
    }

    if (!submissionText.trim() && submissionFiles.length === 0) {
      alert("제출 내용이나 파일을 추가해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // API 스펙에 맞는 JSON 데이터 구성
      const submissionData = {
        assignmentId: parseInt(assignment.id), // number 형식으로 변환
        description: submissionText.trim(),
        fileIds: [], // 현재는 파일 업로드 기능이 없으므로 빈 배열
      };

      console.log("과제 제출 요청:");
      console.log("- roomId:", roomId);
      console.log("- submissionData:", submissionData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/rooms/${roomId}/assignments/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify(submissionData),
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
        } else if (response.status === 405) {
          throw new Error("서버에서 이 방법을 지원하지 않습니다. API 엔드포인트를 확인해주세요.");
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (parseError) {
            console.warn("JSON 파싱 실패, 하지만 제출은 성공:", responseText);
          }
        }
      }

      console.log("과제 제출 성공:", result || "응답 본문 없음");

      // 성공 처리
      alert("과제가 성공적으로 제출되었습니다!");

      // 상태 초기화
      setSubmissionText("");
      setSubmissionFiles([]);

      // 성공 콜백 호출 (부모에서 새로고침 등 처리)
      if (onSuccess) {
        onSuccess();
      }

      // 기존 onSubmit 콜백도 호출 (호환성 유지)
      if (onSubmit) {
        onSubmit({ text: submissionText, files: submissionFiles });
      }

      // 모달 닫기
      onClose();
    } catch (error) {
      console.error("과제 제출 실패:", error);
      alert(`과제 제출에 실패했습니다:\n${error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    submitAssignment();
  };

  return (
    <div className={styles.submissionModalBackground} onClick={onClose}>
      <div className={styles.submissionModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.submissionHeader}>
          <h3>과제 제출하기</h3>
          <button className={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.submissionContent}>
          <div className={styles.assignmentSummary}>
            <h4>{assignment.title}</h4>
            <p>마감일: {formatDate(assignment.dueDate)}</p>
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
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
                <button
                  className={styles.fileUploadButton}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
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
                      <button
                        className={styles.removeFileButton}
                        onClick={() => removeFile(index)}
                        disabled={isSubmitting}
                      >
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
          <button className={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>
            취소
          </button>
          <button
            className={styles.confirmSubmitButton}
            onClick={handleSubmit}
            disabled={(!submissionText.trim() && submissionFiles.length === 0) || isSubmitting}
          >
            {isSubmitting ? "제출 중..." : "제출하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;
