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

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = "59, 130, 246";
const MOBILE_BREAKPOINT = 768;

const cardData: BentoCardProps[] = [
  {
    color: "rgba(13, 13, 25, 0.8)",
    title: "100팀",
    subtitle: "현재 만들어진 티밍룸",
    description: "많은 팀들이 티밍과 함께합니다",
  },
  {
    color: "rgba(13, 13, 25, 0.8)",
    title: "999명",
    subtitle: "현재 가입된 이용자",
    description: "많은 분들이 티밍과 함께합니다",
  },
  {
    color: "rgba(13, 13, 25, 0.8)",
    title: "2팀",
    subtitle: "프로젝트 완수한 팀",
    description: "티밍과 함께 작업 마무리를 지어보세요",
  },
];

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
  clickEffect = false,
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
  textAutoHide = false,
  enableStars = true,
  enableSpotlight = false,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = true,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = false,
}) => {
  const isMobile = useState(false)[0];
  const shouldDisableAnimations = disableAnimations || isMobile;

  return (
    <div className={styles.bentoContainer}>
      <div className={styles.bentoGrid}>
        {/* 왼쪽 컬럼 - 100팀과 999명 */}
        <div className={styles.leftColumn}>
          {/* 100팀 카드 */}
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

          {/* 999명 카드 */}
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

        {/* 오른쪽 컬럼 - 2팀 */}
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
