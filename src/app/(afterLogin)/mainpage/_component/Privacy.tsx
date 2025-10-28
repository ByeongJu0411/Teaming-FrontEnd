"use client";

import { JSX } from "react";
import styles from "./Legal.module.css";

interface PrivacyProps {
  onClose: () => void;
}

export default function Privacy({ onClose }: PrivacyProps): JSX.Element {
  return (
    <div className={styles.legalPage}>
      <div className={styles.header}>
        <button onClick={onClose} className={styles.backButton}>
          ✕
        </button>
        <h1 className={styles.title}>Teaming 개인정보 처리방침</h1>
        <div className={styles.metaInfo}>
          <div className={styles.metaItem}>
            <span>📅</span>
            <span>공고일자: 2025년 9월 14일</span>
          </div>
          <div className={styles.metaItem}>
            <span>✅</span>
            <span>시행일자: 2025년 9월 14일</span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제1조 (수집하는 개인정보 항목)</h2>

          <p className={styles.paragraph}>
            <span className={styles.highlight}>회원 가입/로그인:</span> 이메일, 이름, 프로필 사진(소셜 로그인 시 제공
            범위 내)
          </p>

          <p className={styles.paragraph}>
            <span className={styles.highlight}>서비스 이용 중 생성정보:</span> 팀룸 정보(참여 기록, 역할, 진행상태),
            메시지 메타데이터(전송시각 등), 알림 수신 기록, 접속 기록(IP, 기기·OS 식별자, 앱 버전)
          </p>

          <p className={styles.paragraph}>
            <span className={styles.highlight}>결제/환급 관련:</span> 예치금 결제 및 환급 내역, 거래 식별값(주문/거래 ID
            등)
          </p>

          <div className={styles.note}>
            <p className={styles.noteText}>
              회사는 카드번호 등 민감한 결제정보를 직접 수집·보관하지 않으며, 결제 대행사는 관련 법령에 따라 정보를
              처리합니다.
            </p>
          </div>

          <p className={styles.paragraph}>
            <span className={styles.highlight}>고객문의/분쟁처리:</span> 문의 내용, 첨부 자료, 처리 기록
          </p>

          <p className={styles.paragraph}>
            <span className={styles.highlight}>선택항목(사용자가 입력한 경우):</span> 소속(대학/회사명), 학과/직무,
            프로필 소개 등
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제2조 (수집 방법)</h2>
          <p className={styles.paragraph}>
            앱/웹 회원가입 및 서비스 이용 과정에서 이용자가 직접 입력하거나, 서비스 이용 중 자동으로 생성·수집됩니다.
            결제정보는 결제대행사(PG)를 통해 수집됩니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제3조 (개인정보의 이용 목적)</h2>
          <ul className={`${styles.list} ${styles.bulletList}`}>
            <li className={styles.listItem}>회원 식별, 계정 관리, 부정이용 방지</li>
            <li className={styles.listItem}>팀룸 운영(참여/진행/완주 인증 등) 및 알림 제공</li>
            <li className={styles.listItem}>예치금 결제·환급 처리, 페널티 집행(디지털 상품 구매 등)</li>
            <li className={styles.listItem}>고객지원, 민원·분쟁 처리, 공지사항 전달</li>
            <li className={styles.listItem}>서비스 품질 향상, 이용통계·로그 분석(개인 식별 불가 형태의 통계화 포함)</li>
            <li className={styles.listItem}>법령상 의무 이행(회계·세무, 보관의무 등)</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제4조 (처리 및 보유 기간)</h2>
          <ul className={`${styles.list} ${styles.bulletList}`}>
            <li className={styles.listItem}>
              <span className={styles.highlight}>회원정보:</span> 회원 탈퇴 시 지체없이 파기. 단, 부정이용 방지 등을
              위해 탈퇴 후 최대 30일간 최소정보를 보관할 수 있음.
            </li>
            <li className={styles.listItem}>
              <span className={styles.highlight}>거래기록(결제/환급 포함):</span> 전자상거래 등에서의 소비자보호에 관한
              법률에 따라 5년 보관
            </li>
            <li className={styles.listItem}>
              <span className={styles.highlight}>소비자 불만·분쟁처리 기록:</span> 3년 보관
            </li>
            <li className={styles.listItem}>
              <span className={styles.highlight}>접속 로그 등 서비스 이용기록:</span> 통신비밀보호 관련 기준에 따라
              3개월 이상 보관
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제5조 (개인정보의 제3자 제공)</h2>
          <p className={styles.paragraph}>
            회사는 원칙적으로 이용자 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만 다음의 경우 제공할 수
            있습니다.
          </p>
          <ul className={`${styles.list} ${styles.bulletList}`}>
            <li className={styles.listItem}>이용자가 사전에 동의한 경우</li>
            <li className={styles.listItem}>법령에 따라 요구되는 경우</li>
            <li className={styles.listItem}>
              서비스 제공에 필수적인 범위에서
              <ul className={styles.subList}>
                <li>결제대행사(PG): 결제·환급 처리(거래 식별값, 금액 등)</li>
                <li>디지털 상품(기프티콘) 공급사: 상품 구매·전송에 필요한 최소 정보(수령 수단 등)</li>
              </ul>
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제6조 (개인정보 처리의 위탁)</h2>
          <p className={styles.paragraph}>회사는 안정적 서비스 제공을 위해 아래 업무를 위탁할 수 있습니다.</p>
          <ul className={`${styles.list} ${styles.bulletList}`}>
            <li className={styles.listItem}>클라우드 인프라/백업</li>
            <li className={styles.listItem}>푸시 알림/메시징</li>
            <li className={styles.listItem}>결제/환급 처리: [PG사명 기재]</li>
            <li className={styles.listItem}>고객지원 시스템</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제7조 (정보주체의 권리)</h2>
          <p className={styles.paragraph}>
            이용자는 언제든지 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지, 동의철회를 요청할 수 있습니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제8조 (아동의 개인정보)</h2>
          <p className={styles.paragraph}>회사는 원칙적으로 만 14세 미만 아동의 회원가입을 허용하지 않습니다.</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제9조 (개인정보의 파기 절차 및 방법)</h2>
          <p className={styles.paragraph}>보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 파기합니다.</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제10조 (안전성 확보 조치)</h2>
          <p className={styles.paragraph}>
            접근권한 관리, 암호화(전송구간/민감정보), 접근기록 보관/점검, 침입 차단/탐지, 물리적 보안 등 법령에 따른
            기술적·관리적 보호조치를 시행합니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제11조 (개인정보 보호책임자)</h2>
          <ul className={`${styles.list} ${styles.bulletList}`}>
            <li className={styles.listItem}>
              <span className={styles.highlight}>성명:</span> [김준]
            </li>
            <li className={styles.listItem}>
              <span className={styles.highlight}>직책:</span> [보안 책임자]
            </li>
            <li className={styles.listItem}>
              <span className={styles.highlight}>연락처:</span> [010-6509-2779], [kjoon418@naver.com]
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제12조 (고지의 의무)</h2>
          <p className={styles.paragraph}>
            법령·정책 또는 서비스 변경에 따라 본 방침이 변경되는 경우, 시행 7일 전(중대한 사항은 30일 전) 서비스 내
            공지합니다.
          </p>
        </div>

        <div className={styles.note}>
          <p className={styles.noteTitle}>🔒 개인정보 보호</p>
          <p className={styles.noteText}>
            Teaming은 이용자의 개인정보를 매우 중요하게 생각하며, 관련 법령을 준수하여 안전하게 관리합니다. 개인정보
            관련 문의사항이 있으신 경우 개인정보 보호책임자에게 연락 주시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
}
