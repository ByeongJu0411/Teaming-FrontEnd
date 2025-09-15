"use client";
import styles from "./welcome.module.css";
import TextType from "@/app/_component/TextType";

// 테스트용 일정 데이터
const scheduleItems = [
  {
    id: 1,
    title: "정치학 발표 - 오늘 18:00",
    subtitle: "Discord 오프라인 회의",
    status: "ongoing", // ongoing, completed, upcoming
    color: "#3b82f6", // 파란색
  },
  {
    id: 2,
    title: "마케팅 - 9월 3일 (수)까지",
    subtitle: "자료조사",
    status: "upcoming",
    color: "#8b5cf6", // 보라색
  },
  {
    id: 3,
    title: "대학 생활 계획하기 - 9월 5일 (금)",
    subtitle: "발표 PPT 자료 만들기",
    status: "upcoming",
    color: "#10b981", // 초록색
  },
];

export default function Welcome() {
  return (
    <div className={styles.welcomeSection}>
      <div className={styles.welcomeMessage}>
        <div className={styles.messageLine}>
          <TextType
            text="우리의 팀플"
            typingSpeed={50}
            loop={false}
            startOnVisible={true}
            className={styles.typewriterText}
            as="div"
          />
        </div>
        <div className={styles.messageLine}>
          <TextType
            text="더 빠르고 더 스마트하게"
            typingSpeed={50}
            initialDelay={1000}
            loop={false}
            startOnVisible={true}
            className={styles.typewriterText}
            as="div"
          />
        </div>
      </div>

      {/* 일정 한눈에 섹션 */}
      <div className={styles.scheduleSection}>
        <div className={styles.scheduleHeader}>일정 한눈에</div>

        <div className={styles.scheduleList}>
          {scheduleItems.map((item, index) => (
            <div
              key={item.id}
              className={styles.scheduleItem}
              style={{
                animationDelay: `${3400 + index * 200}ms`, // 헤더 애니메이션 완료 후 시작
              }}
            >
              <div className={styles.statusIndicator} style={{ backgroundColor: item.color }}></div>
              <div className={styles.scheduleContent}>
                <div className={styles.scheduleTitle}>{item.title}</div>
                <div className={styles.scheduleSubtitle}>{item.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
