"use client";
import React from "react";
import { FiX, FiFile } from "react-icons/fi";
import styles from "./ViewSubmissionModal.module.css";

interface Submission {
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
}

interface ViewSubmissionModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewSubmissionModal: React.FC<ViewSubmissionModalProps> = ({ submission, isOpen, onClose }) => {
  if (!isOpen || !submission) return null;

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

  return (
    <div className={styles.submissionModalBackground} onClick={onClose}>
      <div className={styles.submissionModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.submissionHeader}>
          <h3>{submission.memberName}님의 제출 내용</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.submissionContent}>
          <div className={styles.submissionInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>제출자:</span>
              <span>{submission.memberName}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>제출일:</span>
              <span>{submission.submittedAt && formatDate(submission.submittedAt)}</span>
            </div>
          </div>

          {submission.submissionData && (
            <div className={styles.submissionViewForm}>
              {submission.submissionData.text && (
                <div className={styles.formSection}>
                  <label className={styles.formLabel}>제출 내용</label>
                  <div className={styles.submissionTextView}>{submission.submissionData.text}</div>
                </div>
              )}

              {submission.submissionData.files.length > 0 && (
                <div className={styles.formSection}>
                  <label className={styles.formLabel}>첨부 파일</label>
                  <div className={styles.fileList}>
                    {submission.submissionData.files.map((file, index) => (
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
          <button className={styles.cancelButton} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewSubmissionModal;
