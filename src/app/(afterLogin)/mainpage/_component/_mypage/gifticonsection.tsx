/* eslint-disable @next/next/no-img-element */
"use client";
import styles from "@/app/(afterLogin)/mainpage/_component/mypage.module.css";
import { useState } from "react";

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

export default function GifticonSection() {
  // 기프티콘 목록 상태
  const [gifticons, setGifticons] = useState<Gifticon[]>([
    {
      id: "1",
      type: "메가커피",
      name: "아이스 아메리카노",
      description: "메가커피 아이스 아메리카노 1개",
      receivedDate: "2024.09.08",
      isUsed: false,
      expiryDate: "2024.12.31",
      barcode: "1234567890123",
      icon: "/megacoffe.webp",
    },
    {
      id: "2",
      type: "스타벅스",
      name: "아이스 아메리카노",
      description: "스타벅스 아이스 아메리카노 1개",
      receivedDate: "2024.09.05",
      isUsed: true,
      expiryDate: "2024.12.31",
      barcode: "9876543210987",
      icon: "/starbucks.png",
    },
    {
      id: "3",
      type: "스타벅스",
      name: "아이스 음료 + 크루아상 세트",
      description: "스타벅스 아이스 음료 1개 + 프렌치 크루아상",
      receivedDate: "2024.09.01",
      isUsed: false,
      expiryDate: "2024.12.31",
      barcode: "5678901234567",
      icon: "/starbucks.png",
    },
  ]);

  const [selectedTab, setSelectedTab] = useState<"all" | "unused" | "used">("all");

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
