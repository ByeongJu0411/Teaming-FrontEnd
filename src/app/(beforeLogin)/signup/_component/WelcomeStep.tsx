import styles from "../signup.module.css";

export default function WelcomeStep() {
  return (
    <div>
      <h2>Teaming에 오신 것을 환영합니다!</h2>
      <p>간단한 단계를 통해 회원가입을 완료해보세요.</p>
      <div className={styles.welcomeList}>
        <p>✓ 이메일 인증</p>
        <p>✓ 비밀번호 설정</p>
        <p>✓ 닉네임 설정</p>
        <p>✓ 프로필 사진 (선택사항)</p>
      </div>
    </div>
  );
}
