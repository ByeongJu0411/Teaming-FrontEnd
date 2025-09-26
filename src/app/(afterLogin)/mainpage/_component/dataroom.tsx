"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import styles from "./dataroom.module.css";
import { IoChevronBack } from "react-icons/io5";
import { FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileAlt, FaDownload } from "react-icons/fa";

interface ModalProps {
  setModal: () => void;
  roomId: string;
  members: Array<{
    memberId: number;
    name: string;
    avatarKey?: string;
    avatarVersion?: number;
    avatarUrl?: string;
  }>;
}

interface FileItem {
  fileId: number;
  sortOrder: number;
  uploaderId: number;
  name: string;
  type: "IMAGE" | "FILE" | "VIDEO" | "AUDIO";
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  downloadUrl: string | null;
  antiVirusScanStatus: string;
  transcodeStatus: string;
  ready: boolean;
}

interface UserFiles {
  userId: number;
  userName: string;
  userAvatar: string;
  files: FileItem[];
}

const DataRoom = ({ setModal, roomId, members }: ModalProps) => {
  const { data: session } = useSession();
  const [filesData, setFilesData] = useState<UserFiles[]>([]);
  const [loading, setLoading] = useState(true);

  const preventOffModal = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  // 멤버 정보 찾기 - avatarUrl 우선 사용
  const getMemberInfo = (uploaderId: number) => {
    const member = members.find((m) => m.memberId === uploaderId);
    if (member) {
      // ActionBar에서 전달받은 avatarUrl 우선 사용
      const avatarUrl = member.avatarUrl || "";
      return {
        name: member.name,
        avatar: avatarUrl || "👤",
      };
    }
    return {
      name: `사용자 ${uploaderId}`,
      avatar: "👤",
    };
  };

  // 파일 목록 조회
  useEffect(() => {
    const fetchFiles = async () => {
      if (!session?.accessToken) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/rooms/${roomId}/files`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("파일 목록 조회 실패");
        }

        const data = await response.json();
        console.log("파일 데이터:", data);
        console.log("멤버 데이터:", members);

        // 사용자별로 파일 그룹화
        const groupedByUser: { [key: number]: UserFiles } = {};

        data.forEach((file: FileItem) => {
          console.log("파일의 uploaderId:", file.uploaderId);

          if (!groupedByUser[file.uploaderId]) {
            const memberInfo = getMemberInfo(file.uploaderId);
            console.log(`uploaderId ${file.uploaderId}에 대한 멤버 정보:`, memberInfo);

            groupedByUser[file.uploaderId] = {
              userId: file.uploaderId,
              userName: memberInfo.name,
              userAvatar: memberInfo.avatar,
              files: [],
            };
          }
          groupedByUser[file.uploaderId].files.push(file);
        });

        setFilesData(Object.values(groupedByUser));
      } catch (error) {
        console.error("파일 조회 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, session, members]);

  // 파일 다운로드
  const handleDownload = async (fileId: number, fileName: string) => {
    if (!session?.accessToken) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080"}/files/download-url/${fileId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("다운로드 URL 생성 실패");
      }

      const data = await response.json();

      if (data.url) {
        const link = document.createElement("a");
        link.href = data.url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("파일 다운로드 오류:", error);
      alert("파일 다운로드에 실패했습니다.");
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) {
      return <FaFilePdf className={styles.fileIcon} style={{ color: "#e53e3e" }} />;
    } else if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
      return <FaFilePowerpoint className={styles.fileIcon} style={{ color: "#dd6b20" }} />;
    } else if (mimeType.includes("word") || mimeType.includes("document")) {
      return <FaFileWord className={styles.fileIcon} style={{ color: "#3182ce" }} />;
    } else {
      return <FaFileAlt className={styles.fileIcon} style={{ color: "#666" }} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
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
          <h2 className={styles.modalTitle}>자료실</h2>
        </div>

        {/* 자료실 내용 */}
        <div className={styles.modalContent}>
          {loading ? (
            <div className={styles.loading}>파일을 불러오는 중...</div>
          ) : filesData.length === 0 ? (
            <div className={styles.noFiles}>업로드된 파일이 없습니다.</div>
          ) : (
            filesData.map((userItem) => (
              <div key={userItem.userId} className={styles.userSection}>
                {/* 유저 정보 */}
                <div className={styles.userHeader}>
                  <div className={styles.userAvatar}>
                    {userItem.userAvatar.startsWith("http") ? (
                      <Image
                        src={userItem.userAvatar}
                        alt={userItem.userName}
                        width={32}
                        height={32}
                        className={styles.avatarImage}
                        unoptimized
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.textContent = "👤";
                          }
                        }}
                      />
                    ) : (
                      <span className={styles.emojiAvatar}>{userItem.userAvatar}</span>
                    )}
                  </div>
                  <span className={styles.userName}>{userItem.userName}</span>
                </div>

                {/* 파일 리스트 */}
                <div className={styles.fileList}>
                  {userItem.files.length > 0 ? (
                    userItem.files.map((file) => (
                      <div key={file.fileId} className={styles.fileItem}>
                        <div className={styles.fileInfo}>
                          {getFileIcon(file.mimeType)}
                          <div className={styles.fileDetails}>
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>{formatFileSize(file.byteSize)}</span>
                          </div>
                        </div>
                        <button
                          className={styles.downloadButton}
                          onClick={() => handleDownload(file.fileId, file.name)}
                          title="다운로드"
                        >
                          <FaDownload size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noFiles}>업로드된 파일이 없습니다.</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DataRoom;
