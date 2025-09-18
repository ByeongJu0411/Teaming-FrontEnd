"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./payment.module.css";

interface RoomType {
  id: string;
  name: string;
  price: string;
  description: string;
  icon: string;
  iconClass: string;
  isElite?: boolean;
}

interface ModalProps {
  setModal: () => void;
  roomType: RoomType;
  memberCount: number;
  onPaymentComplete: () => void;
}

const PaymentModal = ({ setModal, roomType, memberCount, onPaymentComplete }: ModalProps) => {
  const [step, setStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const preventOffModal = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(2);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePayment = async () => {
    setIsPaymentLoading(true);

    try {
      // API 요청 데이터 준비
      const paymentData = {
        userId: "current_user_id", // 실제 사용자 ID로 변경 필요
        additionalProp1: roomType.id, // 방 타입 ID
        additionalProp2: roomType.name, // 방 이름
        additionalProp3: memberCount.toString(), // 멤버 수
      };

      const response = await fetch("http://13.125.193.243:8080/payment/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        const result = await response.text(); // 응답이 string 타입이므로
        console.log("결제 성공:", result);

        // 결제 성공 처리
        onPaymentComplete();
        setModal();
      } else {
        console.error("결제 실패:", response.status, response.statusText);
        // 에러 처리 - 사용자에게 알림
        alert("결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("결제 API 호출 오류:", error);
      alert("결제 처리 중 네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const priceNumber = parseInt(roomType.price.replace(/[^0-9]/g, ""));
  const totalPrice = priceNumber * memberCount;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div onClick={setModal} className={styles.modalBackground}>
      <div onClick={preventOffModal} className={styles.modal}>
        <div className={styles.paymentCard}>
          {/* 고정된 컨텐츠 영역 */}
          <div className={styles.contentArea}>
            <div className={`${styles.slideContainer} ${isTransitioning ? styles.transitioning : ""}`}>
              <div className={`${styles.slide} ${step === 1 ? styles.active : styles.slideOut}`}>
                {/* 첫 번째 단계 */}
                <div className={styles.stepContent}>
                  <h2 className={styles.cardTitle}>결제가 필요합니다</h2>
                  <p className={styles.cardDescription}>
                    방에 접근하려면 방 설정에 따른 기프티콘 결제가 필요합니다
                    <br />
                    만약 패널티를 받지 않는다면 수수료를 제외하고 전액 환불됩니다
                  </p>
                </div>
              </div>

              <div className={`${styles.slide} ${step === 2 ? styles.active : styles.slideIn}`}>
                {/* 두 번째 단계 */}
                <div className={styles.stepContent}>
                  <div className={styles.brandLogo}>
                    <Image
                      src={roomType.id === "starbucks" ? "/starbucks.png" : "/megacoffee.webp"}
                      alt={roomType.name}
                      width={100}
                      height={100}
                      className={styles.logoImage}
                    />
                  </div>

                  <h2 className={styles.roomTitle}>{roomType.name}</h2>
                  <p className={styles.roomSubtitle}>
                    {roomType.id === "starbucks" ? "스타벅스 아이스 아메리카노 1잔" : "메가커피 아이스 아메리카노 1잔"}
                  </p>

                  <div className={styles.priceDisplay}>
                    <span className={styles.price}>{roomType.id === "starbucks" ? "4,841원" : "2,500원"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 고정된 하단 영역 */}
          <div className={styles.bottomSection}>
            <div className={styles.progressIndicator}>
              <div className={`${styles.progressBar} ${step === 1 ? styles.progressActive : ""}`}></div>
              <div className={`${styles.progressBar} ${step === 2 ? styles.progressActive : ""}`}></div>
            </div>

            <button
              onClick={step === 1 ? handleNext : handlePayment}
              className={styles.actionButton}
              disabled={isTransitioning || isPaymentLoading}
            >
              {step === 1 ? "다음" : isPaymentLoading ? "결제 처리 중..." : "결제하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
