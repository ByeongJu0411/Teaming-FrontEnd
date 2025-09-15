"use client";

import { useEffect, useRef } from "react";
import styles from "./reviewlist.module.css";

const reviews = [
  {
    id: 1,
    title: "권익찬님",
    content: "정말 좋은 경험이었습니다. 팀워크가 훌륭했고 프로젝트를 통해 많이 배울 수 있었습니다.",
    author: "권익찬",
  },
  {
    id: 2,
    title: "정성일님",
    content:
      "함께 작업하면서 서로 도우며 성장할 수 있었던 값진 시간이었습니다. 앞으로도 계속 연락하고 지내고 싶습니다.",
    author: "정성일",
  },
  {
    id: 3,
    title: "형님",
    content: "처음엔 낯설었지만 점점 친해지면서 정말 즐겁게 프로젝트에 참여할 수 있었습니다. 좋은 추억이 되었어요.",
    author: "형",
  },
  {
    id: 4,
    title: "김민수님",
    content: "다양한 아이디어를 공유하며 창의적인 해결책을 찾아가는 과정이 정말 흥미로웠습니다.",
    author: "김민수",
  },
  {
    id: 5,
    title: "박지영님",
    content: "서로 다른 배경을 가진 사람들과 협업하며 새로운 관점을 배울 수 있었던 소중한 경험이었습니다.",
    author: "박지영",
  },
  {
    id: 6,
    title: "이준호님",
    content: "도전적인 프로젝트였지만 팀원들과 함께 해결해나가는 과정에서 큰 보람을 느꼈습니다.",
    author: "이준호",
  },
];

export default function ReviewList() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    const scrollSpeed = 0.5; // 스크롤 속도 조절

    const animate = () => {
      if (scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed;

        // 끝에 도달하면 처음으로 돌아가기
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // 마우스 호버시 애니메이션 일시정지
    const handleMouseEnter = () => {
      cancelAnimationFrame(animationId);
    };

    const handleMouseLeave = () => {
      animate();
    };

    scrollContainer.addEventListener("mouseenter", handleMouseEnter);
    scrollContainer.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      if (scrollContainer) {
        scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
        scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.scrollContainer} ref={scrollRef}>
        <div className={styles.cardList}>
          {/* 원본 카드들 */}
          {reviews.map((review) => (
            <div key={review.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  <span>{review.author[0]}</span>
                </div>
                <span className={styles.username}>@{review.author.toLowerCase()}</span>
              </div>
              <p className={styles.cardContent}>{review.content}</p>
            </div>
          ))}
          {/* 무한 스크롤을 위한 복사본 */}
          {reviews.map((review) => (
            <div key={`copy-${review.id}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  <span>{review.author[0]}</span>
                </div>
                <span className={styles.username}>@{review.author.toLowerCase()}</span>
              </div>
              <p className={styles.cardContent}>{review.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 좌우 페이드 효과 */}
      <div className={styles.fadeLeft}></div>
      <div className={styles.fadeRight}></div>
    </div>
  );
}
