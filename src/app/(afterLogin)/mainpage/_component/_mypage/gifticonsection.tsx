/* eslint-disable @next/next/no-img-element */
"use client";
import styles from "@/app/(afterLogin)/mainpage/_component/mypage.module.css";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Gifticon {
  id: string;
  type: "메가커피" | "스타벅스";
  name: string;
  description: string;
  receivedDate: string;
  isUsed: boolean;
  expiryDate: string;
  barcode: string;
  icon: string;
}

// API 응답 타입
interface GifticonApiResponse {
  code: string;
  expirationDate: string;
  grade: string;
}

export default function GifticonSection() {
  const { data: session } = useSession();
  const [gifticons, setGifticons] = useState<Gifticon[]>([]);
  const [selectedTab, setSelectedTab] = useState<"all" | "unused" | "used">("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 기프티콘 목록 조회 API
  const fetchGifticons = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const token = session?.accessToken;

      if (!token) {
        throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");
      }

      if (!session?.isBackendAuthenticated) {
        if (session?.backendError?.hasError) {
          throw new Error(session.backendError.message || "백엔드 인증에 실패했습니다.");
        } else {
          throw new Error("백엔드 인증이 완료되지 않았습니다.");
        }
      }

      // 사용자 이메일 가져오기 (자체 로그인 또는 소셜 로그인)
      let userEmail = "";
      if (session?.provider && session.provider !== "credentials") {
        // 소셜 로그인인 경우
        userEmail = session.user?.email || "";
      } else {
        // 자체 로그인인 경우 - 먼저 사용자 정보 조회
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("사용자 정보를 가져올 수 없습니다.");
        }

        const userData = await userResponse.json();
        userEmail = userData.email;
      }

      if (!userEmail) {
        throw new Error("사용자 이메일을 확인할 수 없습니다.");
      }

      console.log("기프티콘 조회 API 호출:", userEmail);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/gifticon?email=${encodeURIComponent(userEmail)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("기프티콘 조회 실패:", errorText);

        if (response.status === 401) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 403) {
          throw new Error("접근 권한이 없습니다.");
        } else {
          throw new Error(`서버 오류가 발생했습니다. (${response.status})`);
        }
      }

      const data: GifticonApiResponse[] = await response.json();
      console.log("기프티콘 조회 성공:", data);

      // API 응답을 UI 형식으로 변환
      const transformedGifticons: Gifticon[] = data.map((item, index) => {
        // grade에 따라 타입과 아이콘 결정
        const isStarbucks = item.grade === "ELITE";
        const type: "메가커피" | "스타벅스" = isStarbucks ? "스타벅스" : "메가커피";
        const icon = isStarbucks ? "/starbucks.png" : "/megacoffe.webp";

        return {
          id: `${item.code}-${index}`,
          type: type,
          name: isStarbucks ? "프리미엄 음료 쿠폰" : "아이스 아메리카노",
          description: isStarbucks ? "스타벅스 프리미엄 음료 1개" : "메가커피 아이스 아메리카노 1개",
          receivedDate: new Date().toLocaleDateString("ko-KR").replace(/\. /g, ".").slice(0, -1),
          isUsed: false,
          expiryDate: item.expirationDate,
          barcode: item.code,
          icon: icon,
        };
      });

      setGifticons(transformedGifticons);
    } catch (err) {
      console.error("기프티콘 조회 중 오류:", err);
      setError(err instanceof Error ? err.message : "기프티콘을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [
    session?.accessToken,
    session?.isBackendAuthenticated,
    session?.backendError?.hasError,
    session?.backendError?.message,
    session?.provider,
    session?.user?.email,
  ]);

  useEffect(() => {
    if (session) {
      fetchGifticons();
    }
  }, [session, fetchGifticons]);

  // 기프티콘 사용 처리
  const handleUseGifticon = (id: string): void => {
    setGifticons(gifticons.map((gift) => (gift.id === id ? { ...gift, isUsed: true } : gift)));
    alert("기프티콘이 사용 처리되었습니다.");
  };

  // 기프티콘 필터링
  const getFilteredGifticons = (): Gifticon[] => {
    switch (selectedTab) {
      case "unused":
        return gifticons.filter((gift) => !gift.isUsed);
      case "used":
        return gifticons.filter((gift) => gift.isUsed);
      default:
        return gifticons;
    }
  };

  const unusedCount = gifticons.filter((gift) => !gift.isUsed).length;
  const usedCount = gifticons.filter((gift) => gift.isUsed).length;

  if (loading) {
    return (
      <div className={styles.gifticonSection}>
        <div className={styles.sectionCard}>
          <div className={styles.loadingMessage}>기프티콘 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.gifticonSection}>
        <div className={styles.sectionCard}>
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <button onClick={fetchGifticons} className={styles.retryButton}>
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gifticonSection}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>내 기프티콘</h3>
          <div className={styles.gifticonSummary}>
            <span className={styles.gifticonCount}>
              미사용 {unusedCount}개 · 사용완료 {usedCount}개
            </span>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className={styles.tabMenu}>
          <button
            className={`${styles.tabBtn} ${selectedTab === "all" ? styles.active : ""}`}
            onClick={() => setSelectedTab("all")}
            type="button"
          >
            전체 ({gifticons.length})
          </button>
          <button
            className={`${styles.tabBtn} ${selectedTab === "unused" ? styles.active : ""}`}
            onClick={() => setSelectedTab("unused")}
            type="button"
          >
            미사용 ({unusedCount})
          </button>
          <button
            className={`${styles.tabBtn} ${selectedTab === "used" ? styles.active : ""}`}
            onClick={() => setSelectedTab("used")}
            type="button"
          >
            사용완료 ({usedCount})
          </button>
        </div>

        {/* 기프티콘 목록 */}
        <div className={styles.gifticonList}>
          {getFilteredGifticons().length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🎁</span>
              <p className={styles.emptyMessage}>
                {selectedTab === "unused"
                  ? "미사용 기프티콘이 없습니다."
                  : selectedTab === "used"
                  ? "사용완료된 기프티콘이 없습니다."
                  : "받은 기프티콘이 없습니다."}
              </p>
            </div>
          ) : (
            getFilteredGifticons().map((gifticon) => (
              <div key={gifticon.id} className={`${styles.gifticonCard} ${gifticon.isUsed ? styles.used : ""}`}>
                <div className={styles.gifticonIcon}>
                  <img src={gifticon.icon} alt={gifticon.type} />
                </div>

                <div className={styles.gifticonInfo}>
                  <div className={styles.gifticonHeader}>
                    <h4 className={styles.gifticonName}>{gifticon.name}</h4>
                    <span className={`${styles.gifticonStatus} ${gifticon.isUsed ? styles.used : styles.unused}`}>
                      {gifticon.isUsed ? "사용완료" : "미사용"}
                    </span>
                  </div>

                  <p className={styles.gifticonDescription}>{gifticon.description}</p>

                  <div className={styles.gifticonMeta}>
                    <span className={styles.gifticonDate}>받은 날짜: {gifticon.receivedDate}</span>
                    <span className={styles.gifticonExpiry}>유효기간: {gifticon.expiryDate}</span>
                  </div>

                  {!gifticon.isUsed && (
                    <div className={styles.gifticonBarcode}>
                      <span className={styles.barcodeLabel}>바코드: </span>
                      <span className={styles.barcodeNumber}>{gifticon.barcode}</span>
                    </div>
                  )}
                </div>

                <div className={styles.gifticonActions}>
                  {!gifticon.isUsed && (
                    <button className={styles.useBtn} onClick={() => handleUseGifticon(gifticon.id)} type="button">
                      사용하기
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <p className={styles.gifticonDescription}>
          팀플 벌칙으로 받은 기프티콘입니다. 바코드를 매장에서 제시하여 사용하세요.
        </p>
      </div>
    </div>
  );
}
