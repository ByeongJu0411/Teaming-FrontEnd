"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { gsap } from "gsap";
import styles from "./count.module.css";

export interface BentoCardProps {
  color?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  textAutoHide?: boolean;
  disableAnimations?: boolean;
}

export interface BentoProps {
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
}

// API 응답 타입 정의
interface LandingStats {
  totalUserCount: number;
  totalTeamCount: number;
  completeTeamCount: number;
}

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = "59, 130, 246";
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

const createParticleElement = (x: number, y: number, color: string = DEFAULT_GLOW_COLOR): HTMLDivElement => {
  const el = document.createElement("div");
  el.className = styles.particle;
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const ParticleCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  disableAnimations?: boolean;
  style?: React.CSSProperties;
  particleCount?: number;
  glowColor?: string;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
}> = ({
  children,
  className = "",
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  enableMagnetism = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLDivElement[]>([]);
  const particlesInitialized = useRef(false);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        },
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true) as HTMLDivElement;
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" });

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();

      if (enableTilt) {
        gsap.to(element, {
          scale: 1.02,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableTilt) {
        gsap.to(element, {
          scale: 1,
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, glowColor]);

  return (
    <div
      ref={cardRef}
      className={`${className} ${styles.particleContainer}`}
      style={{ ...style, position: "relative", overflow: "hidden" }}
    >
      {children}
    </div>
  );
};

const MagicBento: React.FC<BentoProps> = ({
  enableStars = true,
  disableAnimations = false,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = true,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = false,
}) => {
  const [stats, setStats] = useState<LandingStats>({
    totalUserCount: 0,
    totalTeamCount: 0,
    completeTeamCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useState(false)[0];
  const shouldDisableAnimations = disableAnimations || isMobile;

  // API 호출 함수
  const fetchLandingStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/landing`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LandingStats = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch landing stats:", error);
      setError("데이터를 불러오는데 실패했습니다.");
      // 에러 시 기본값 유지
      setStats({
        totalUserCount: 999,
        totalTeamCount: 100,
        completeTeamCount: 2,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchLandingStats();
  }, [fetchLandingStats]);

  // 카드 데이터 생성 (API 데이터 기반)
  const cardData: BentoCardProps[] = [
    {
      color: "rgba(13, 13, 25, 0.8)",
      title: `${stats.totalTeamCount}팀`,
      subtitle: "현재 만들어진 티밍룸",
      description: "많은 팀들이 티밍과 함께합니다",
    },
    {
      color: "rgba(13, 13, 25, 0.8)",
      title: `${stats.totalUserCount}명`,
      subtitle: "현재 가입된 이용자",
      description: "많은 분들이 티밍과 함께합니다",
    },
    {
      color: "rgba(13, 13, 25, 0.8)",
      title: `${stats.completeTeamCount}팀`,
      subtitle: "프로젝트 완수한 팀",
      description: "티밍과 함께 작업 마무리를 지어보세요",
    },
  ];

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className={styles.bentoContainer}>
        <div className={styles.bentoGrid}>
          <div className={styles.leftColumn}>
            <div className={`${styles.card} ${styles.cardSmall}`} style={{ backgroundColor: "rgba(13, 13, 25, 0.8)" }}>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>로딩중...</h2>
                <div className={styles.cardSubtitle}>데이터를 불러오는 중</div>
              </div>
            </div>
            <div className={`${styles.card} ${styles.cardSmall}`} style={{ backgroundColor: "rgba(13, 13, 25, 0.8)" }}>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>로딩중...</h2>
                <div className={styles.cardSubtitle}>데이터를 불러오는 중</div>
              </div>
            </div>
          </div>
          <div className={styles.rightColumn}>
            <div className={`${styles.card} ${styles.cardLarge}`} style={{ backgroundColor: "rgba(13, 13, 25, 0.8)" }}>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>로딩중...</h2>
                <div className={styles.cardSubtitle}>데이터를 불러오는 중</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bentoContainer}>
      {error && <div style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}>{error}</div>}

      <div className={styles.bentoGrid}>
        {/* 왼쪽 컬럼 - 총 팀 수와 총 사용자 수 */}
        <div className={styles.leftColumn}>
          {/* 총 팀 수 카드 */}
          {enableStars ? (
            <ParticleCard
              className={`${styles.card} ${styles.cardSmall}`}
              style={
                {
                  backgroundColor: cardData[0].color,
                  "--glow-color": glowColor,
                } as React.CSSProperties
              }
              disableAnimations={shouldDisableAnimations}
              particleCount={particleCount}
              glowColor={glowColor}
              enableTilt={enableTilt}
              clickEffect={clickEffect}
              enableMagnetism={enableMagnetism}
            >
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{cardData[0].title}</h2>
                <div className={styles.cardSubtitle}>{cardData[0].subtitle}</div>
                <p className={styles.cardDescription}>{cardData[0].description}</p>
              </div>
            </ParticleCard>
          ) : (
            <div className={`${styles.card} ${styles.cardSmall}`} style={{ backgroundColor: cardData[0].color }}>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{cardData[0].title}</h2>
                <div className={styles.cardSubtitle}>{cardData[0].subtitle}</div>
                <p className={styles.cardDescription}>{cardData[0].description}</p>
              </div>
            </div>
          )}

          {/* 총 사용자 수 카드 */}
          {enableStars ? (
            <ParticleCard
              className={`${styles.card} ${styles.cardSmall}`}
              style={
                {
                  backgroundColor: cardData[1].color,
                  "--glow-color": glowColor,
                } as React.CSSProperties
              }
              disableAnimations={shouldDisableAnimations}
              particleCount={particleCount}
              glowColor={glowColor}
              enableTilt={enableTilt}
              clickEffect={clickEffect}
              enableMagnetism={enableMagnetism}
            >
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{cardData[1].title}</h2>
                <div className={styles.cardSubtitle}>{cardData[1].subtitle}</div>
                <p className={styles.cardDescription}>{cardData[1].description}</p>
              </div>
            </ParticleCard>
          ) : (
            <div className={`${styles.card} ${styles.cardSmall}`} style={{ backgroundColor: cardData[1].color }}>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{cardData[1].title}</h2>
                <div className={styles.cardSubtitle}>{cardData[1].subtitle}</div>
                <p className={styles.cardDescription}>{cardData[1].description}</p>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽 컬럼 - 완료된 팀 수 */}
        <div className={styles.rightColumn}>
          {enableStars ? (
            <ParticleCard
              className={`${styles.card} ${styles.cardLarge}`}
              style={
                {
                  backgroundColor: cardData[2].color,
                  "--glow-color": glowColor,
                } as React.CSSProperties
              }
              disableAnimations={shouldDisableAnimations}
              particleCount={particleCount}
              glowColor={glowColor}
              enableTilt={enableTilt}
              clickEffect={clickEffect}
              enableMagnetism={enableMagnetism}
            >
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{cardData[2].title}</h2>
                <div className={styles.cardSubtitle}>{cardData[2].subtitle}</div>
                <p className={styles.cardDescription}>{cardData[2].description}</p>
              </div>
            </ParticleCard>
          ) : (
            <div className={`${styles.card} ${styles.cardLarge}`} style={{ backgroundColor: cardData[2].color }}>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{cardData[2].title}</h2>
                <div className={styles.cardSubtitle}>{cardData[2].subtitle}</div>
                <p className={styles.cardDescription}>{cardData[2].description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MagicBento;
