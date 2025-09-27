"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();

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
      // 가격 계산: 방 타입 가격 x (방 인원수 - 1)
      const pricePerPerson = parseInt(roomType.price.replace(/[^0-9]/g, ""));
      const amount = pricePerPerson * (memberCount - 1);

      console.log("결제 금액:", amount, "원 (", pricePerPerson, "x", memberCount - 1, ")");

      const token = session?.accessToken;

      if (!token) {
        alert("로그인이 필요합니다.");
        setIsPaymentLoading(false);
        return;
      }

      // 환경변수 사용
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://13.125.193.243:8080";

      const response = await fetch(`${backendUrl}/payment/html?amount=${amount}`, {
        method: "GET",
        headers: {
          Accept: "text/html",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const htmlContent = await response.text();
        console.log("결제 페이지 로드 성공");

        // 결제 HTML을 새 창으로 표시
        const paymentWindow = window.open("", "_blank", "width=600,height=800");
        if (paymentWindow) {
          paymentWindow.document.write(htmlContent);
          paymentWindow.document.close();
        }

        // 결제 성공 메시지
        alert("결제가 성공적으로 완료되었습니다!");

        // 결제 완료 처리 - 채팅방으로 돌아가기
        onPaymentComplete();
        setModal();
      } else if (response.status === 500) {
        console.error("결제 실패: 서버 오류");

        // 결제 실패 메시지
        alert("결제가 실패되었습니다. 다시 시도해주세요.");

        // Payment 모달을 닫지 않고 유지 (다시 시도 가능)
        setIsPaymentLoading(false);
      } else {
        console.error("결제 페이지 로드 실패:", response.status, response.statusText);
        alert("결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
        setIsPaymentLoading(false);
      }
    } catch (error) {
      console.error("결제 API 호출 오류:", error);
      alert("결제 처리 중 네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setIsPaymentLoading(false);
    }
  };

  const priceNumber = parseInt(roomType.price.replace(/[^0-9]/g, ""));
  const calculatedAmount = priceNumber * (memberCount - 1);
  const totalPrice = calculatedAmount;

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
                      src={roomType.icon}
                      alt={roomType.name}
                      width={100}
                      height={100}
                      className={styles.logoImage}
                    />
                  </div>

                  <h2 className={styles.roomTitle}>{roomType.name}</h2>
                  <p className={styles.roomSubtitle}>{roomType.description}</p>

                  <div className={styles.priceDisplay}>
                    <span className={styles.price}>{roomType.price}</span>
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
