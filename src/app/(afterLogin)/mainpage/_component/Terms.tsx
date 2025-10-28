"use client";

import { JSX } from "react";
import styles from "./Legal.module.css";

interface TermsProps {
  onClose: () => void;
}

export default function Terms({ onClose }: TermsProps): JSX.Element {
  return (
    <div className={styles.legalPage}>
      <div className={styles.header}>
        <button onClick={onClose} className={styles.backButton}>
          ✕
        </button>
        <h1 className={styles.title}>Teaming 이용약관</h1>
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
          <h2 className={styles.articleTitle}>제1조 (목적)</h2>
          <p className={styles.paragraph}>
            본 약관은 Teaming(이하 &quot;서비스&quot;)의 이용과 관련하여, 회사와 이용자 간 권리‧의무 및 책임 사항,
            서비스 이용조건과 절차, 예치금(보증금) 운영 원칙 등을 정함을 목적으로 합니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제2조 (정의)</h2>
          <ul className={`${styles.list} ${styles.bulletList}`}>
            <li className={styles.listItem}>
              <span className={styles.highlight}>&quot;서비스&quot;</span>란 팀 프로젝트(이하 &quot;팀플&quot;)의 효율적
              수행을 지원하기 위해 팀 채팅방 개설, 진행 관리, 예치금 운영, 완료 인증 및 페널티 집행 등 기능을 제공하는
              Teaming을 말합니다.
            </li>
            <li className={styles.listItem}>
              <span className={styles.highlight}>&quot;팀룸&quot;</span>이란 서비스 내에서 팀플을 위해 개설되는
              공간(채팅방·보드 등)을 말합니다.
            </li>
            <li className={styles.listItem}>
              <span className={styles.highlight}>&quot;예치금(보증금)&quot;</span>이란 팀룸 참여자가 팀플 완주 의지를
              담보하기 위해 인원수 기준으로 납부하는 금액을 말합니다.
            </li>
            <li className={styles.listItem}>
              <span className={styles.highlight}>&quot;완주&quot;</span>란 팀룸 개설 시 설정된 기간·목표·산출물 등 완료
              기준에 따라 서비스 내 완료 인증 절차(예: 전원 확인, 리더 승인, 제출물 업로드 등)를 거쳐 회사가 시스템상
              완료 상태로 처리한 것을 말합니다.
            </li>
            <li className={styles.listItem}>
              <span className={styles.highlight}>&quot;페널티&quot;</span>란 미완주자 등에 대해 예치금을 활용해 기프티콘
              등 디지털 상품을 구매하도록 하는 조치 및 그 집행 절차를 말합니다.
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제3조 (약관의 효력 및 변경)</h2>
          <p className={styles.paragraph}>
            본 약관은 앱/웹 화면 게시 또는 기타 방법으로 공지함으로써 효력이 발생합니다.
          </p>
          <p className={styles.paragraph}>
            회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경사유를 최소
            7일(이용자에게 불리하거나 중대한 변경은 30일) 전에 공지합니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제4조 (이용계약의 성립 및 계정)</h2>
          <p className={styles.paragraph}>서비스는 만 14세 이상의 개인이 가입할 수 있습니다.</p>
          <p className={styles.paragraph}>
            이용계약은 이용자가 약관에 동의하고, 회사가 정한 절차에 따라 가입을 승인함으로써 성립합니다.
          </p>
          <p className={styles.paragraph}>
            이용자는 계정 정보(이메일, 이름, 프로필 사진 등)를 정확하게 제공해야 하며, 허위 정보 제공으로 인한 책임은
            이용자에게 있습니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제5조 (서비스 내용)</h2>
          <p className={styles.paragraph}>
            팀룸 개설 및 참여, 팀 채팅/알림, 일정·산출물 관리, 완주 인증, 예치금 납부/환급, 페널티 집행 기능 등을
            제공합니다.
          </p>
          <p className={styles.paragraph}>
            회사는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있습니다. 중대한 변경의 경우 사전
            공지합니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제6조 (예치금(보증금) 납부)</h2>
          <p className={styles.paragraph}>
            팀룸 개설자는 인원수 기준 예치금 단가, 목표, 기간, 완료 기준 등을 설정할 수 있으며, 참여자는 입장 시
            예치금을 결제합니다.
          </p>
          <p className={styles.paragraph}>
            결제는 회사가 지정한 전자결제수단(결제대행사(PG) 등)을 통해 처리되며, 회사는 카드번호 등 민감한 결제정보를
            직접 보관하지 않습니다.
          </p>
          <p className={styles.paragraph}>
            회사는 예치금에 대해 별도 고지된 범위 내에서 서비스 이용수수료 및 PG 수수료를 공제할 수 있습니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제7조 (완주 인증 및 환급)</h2>
          <p className={styles.paragraph}>
            팀플이 완료 기준을 충족하여 완주 인증이 이루어지면, 회사는 각 참여자 예치금에서 수수료 등을 제외한 금액을
            환급합니다.
          </p>
          <p className={styles.paragraph}>
            환급 시기, 방법, 소요 기간은 결제수단 및 PG사 정책, 금융기관 상황 등에 따라 달라질 수 있으며, 서비스 화면에
            안내합니다.
          </p>
          <p className={styles.paragraph}>
            완료 기준 및 인증 절차는 팀룸 설정 시 확정되며, 진행 중 변경 시 참여자에게 고지합니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제8조 (미완주, 이탈 및 페널티)</h2>
          <p className={styles.paragraph}>
            아래 각 호에 해당하는 경우, 해당 참여자의 예치금 전부 또는 일부가 페널티 재원으로 전환될 수 있습니다.
          </p>
          <ul className={`${styles.list} ${styles.bulletList}`}>
            <li className={styles.listItem}>팀룸 설정 기간 내 완료 기준 미충족</li>
            <li className={styles.listItem}>중도 이탈/장기 미참여 등 팀룸 설정상 불이익 사유 발생</li>
            <li className={styles.listItem}>허위 인증, 부정행위 등 공정성 저해</li>
          </ul>
          <p className={styles.paragraph}>
            페널티 재원은 서비스 내 정책에 따라 기프티콘 등 디지털 상품 구매에 사용되며, 분배 기준(예: 성실 참여자 보상
            등)은 팀룸 설정 또는 서비스 정책에 따릅니다.
          </p>
          <p className={styles.paragraph}>
            페널티로 전환된 예치금 및 이미 구매된 디지털 상품은 원칙적으로 환불되지 않습니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제9조 (수수료 및 비용)</h2>
          <p className={styles.paragraph}>
            회사는 서비스 제공에 대한 이용수수료를 부과할 수 있으며, 구체적 내용은 서비스 화면에 고지합니다.
          </p>
          <p className={styles.paragraph}>
            결제/환급 과정에서 발생하는 PG 수수료·금융비용 등은 정책에 따라 공제될 수 있습니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제10조 (이용자 의무)</h2>
          <p className={styles.paragraph}>이용자는 다음 행위를 해서는 안 됩니다.</p>
          <ul className={`${styles.list} ${styles.bulletList}`}>
            <li className={styles.listItem}>타인의 계정 사용, 개인정보 도용</li>
            <li className={styles.listItem}>허위 완료 인증, 출석/성과의 조작, 담합</li>
            <li className={styles.listItem}>욕설·모욕·차별·혐오 표현, 불법정보 유통</li>
            <li className={styles.listItem}>서비스 장애 유발, 리버스 엔지니어링 등 기술적 침해</li>
            <li className={styles.listItem}>저작권·상표권 등 제3자 권리 침해</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제11조 (콘텐츠 권리)</h2>
          <p className={styles.paragraph}>
            이용자가 서비스에 게시·전송하는 자료의 저작권은 원칙적으로 이용자에게 귀속됩니다.
          </p>
          <p className={styles.paragraph}>
            이용자는 서비스 운영·개선·홍보를 위해 회사가 해당 자료를 비독점적으로 이용(저장·복제·전송·편집 등)할 수 있는
            범위 내 사용권을 회사에 부여합니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제12조 (서비스의 중단)</h2>
          <p className={styles.paragraph}>
            시스템 점검·장애, 천재지변 등 불가피한 사유가 있는 경우 서비스 제공이 일시 중단될 수 있습니다.
          </p>
          <p className={styles.paragraph}>회사는 긴급 상황을 제외하고 사전 공지에 노력합니다.</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제13조 (계약 해지 및 이용제한)</h2>
          <p className={styles.paragraph}>이용자는 언제든지 회원 탈퇴를 신청할 수 있습니다.</p>
          <p className={styles.paragraph}>
            이용자가 본 약관을 위반하거나 서비스 질서를 심각하게 해치는 경우, 회사는 경고·일시정지·영구이용정지 등
            필요한 조치를 할 수 있습니다.
          </p>
          <p className={styles.paragraph}>이용정지 시 이미 발생한 페널티 전환·수수료 부과 등은 유효합니다.</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제14조 (면책)</h2>
          <p className={styles.paragraph}>회사는 다음 사유로 발생한 손해에 대해 책임을 지지 않습니다.</p>
          <ul className={`${styles.list} ${styles.bulletList}`}>
            <li className={styles.listItem}>이용자의 귀책(정보오류, 규칙 위반 등)</li>
            <li className={styles.listItem}>통신장애·PG사·금융기관 사유 등 회사가 통제 불가능한 사유</li>
            <li className={styles.listItem}>팀플의 내용·수준·완료 기준 적정성에 관한 분쟁</li>
          </ul>
          <p className={styles.paragraph}>단, 회사의 고의 또는 중과실이 입증된 경우에는 그러하지 않습니다.</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제15조 (분쟁처리 및 관할)</h2>
          <p className={styles.paragraph}>서비스 이용과 관련한 문의·이의제기는 고객센터를 통해 접수합니다.</p>
          <p className={styles.paragraph}>
            본 약관은 대한민국 법률에 따르며, 분쟁이 소송으로 이어질 경우 서울중앙지방법원을 전속 관할로 합니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.articleTitle}>제16조 (약관의 해석)</h2>
          <p className={styles.paragraph}>약관에 명시되지 않은 사항은 관련 법령 또는 일반적인 상관례를 따릅니다.</p>
        </div>

        <div className={styles.note}>
          <p className={styles.noteTitle}>📌 중요 안내</p>
          <p className={styles.noteText}>
            본 약관은 2025년 9월 14일부터 시행됩니다. 약관에 동의하지 않는 경우 서비스 이용이 제한될 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
