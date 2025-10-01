"use client";
import React from "react";
import { FiX, FiFile } from "react-icons/fi";
import { useSession } from "next-auth/react";
import styles from "./ViewSubmissionModal.module.css";

interface Submission {
  memberId: string;
  memberName: string;
  submittedAt?: string;
  status: "대기" | "제출완료";
  submissionData?: {
    text: string;
    files: {
      fileId: string; // 파일 ID 추가
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
  const { data: session } = useSession();

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

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      if (!session?.accessToken) {
        alert("인증이 필요합니다. 로그인 상태를 확인해주세요.");
        return;
      }

      console.log("파일 다운로드 시작:", { fileId, fileName });

      // 스웨거 API 호출 - Presigned GET URL 발급
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/files/download-url/${fileId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      console.log("API 응답 상태:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 403) {
          throw new Error("파일 다운로드 권한이 없습니다.");
        } else if (response.status === 404) {
          throw new Error("파일을 찾을 수 없습니다.");
        } else {
          const errorText = await response.text();
          console.error("API 오류 응답:", errorText);
          throw new Error(`파일 다운로드 중 오류가 발생했습니다. (${response.status})`);
        }
      }

      const result = await response.json();
      console.log("다운로드 URL 발급 성공:", result);

      // 발급받은 URL로 파일 다운로드
      if (result.url) {
        // 새 창에서 다운로드 (브라우저에서 직접 다운로드)
        const link = document.createElement("a");
        link.href = result.url;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("파일 다운로드 완료:", fileName);
      } else {
        throw new Error("다운로드 URL을 받지 못했습니다.");
      }
    } catch (error) {
      console.error("파일 다운로드 실패:", error);
      alert(
        `파일 다운로드에 실패했습니다:\n${error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}`
      );
    }
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
                        <button
                          className={styles.downloadButton}
                          onClick={() => handleDownloadFile(file.fileId, file.name)}
                        >
                          다운로드
                        </button>
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
