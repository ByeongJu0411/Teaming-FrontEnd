"use client";
import React, { useRef } from "react";
import { FiX, FiUpload, FiFile } from "react-icons/fi";
import styles from "./SubmissionModal.module.css";

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

interface SubmissionModalProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { text: string; files: File[] }) => void;
  submissionText: string;
  setSubmissionText: (text: string) => void;
  submissionFiles: File[];
  setSubmissionFiles: React.Dispatch<React.SetStateAction<File[]>>;
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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = () => {
    onSubmit({ text: submissionText, files: submissionFiles });
  };

  return (
    <div className={styles.submissionModalBackground} onClick={onClose}>
      <div className={styles.submissionModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.submissionHeader}>
          <h3>과제 제출하기</h3>
          <button className={styles.closeButton} onClick={onClose}>
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
          <button className={styles.cancelButton} onClick={onClose}>
            취소
          </button>
          <button
            className={styles.confirmSubmitButton}
            onClick={handleSubmit}
            disabled={!submissionText.trim() && submissionFiles.length === 0}
          >
            제출하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;
