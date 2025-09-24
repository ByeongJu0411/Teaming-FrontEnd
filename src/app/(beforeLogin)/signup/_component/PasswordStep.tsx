import styles from "../signup.module.css";

interface PasswordStepProps {
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
}

export default function PasswordStep({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
}: PasswordStepProps) {
  // 비밀번호 확인
  const isPasswordMatch = password && confirmPassword && password === confirmPassword;
  // 비밀번호 유효성 검사
  const isPasswordValid = password.length >= 8;

  return (
    <div>
      <h2>비밀번호 설정</h2>
      <p>안전한 비밀번호를 설정해주세요.</p>

      <input
        type="password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        placeholder="비밀번호 (8자 이상)"
        className={`${styles.input} ${password && !isPasswordValid ? styles.inputError : ""}`}
      />

      <input
        type="password"
        value={confirmPassword}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
        placeholder="비밀번호 재확인"
        className={`${styles.input} ${confirmPassword && !isPasswordMatch ? styles.inputError : ""}`}
      />

      {password && !isPasswordValid && <p className={styles.errorText}>비밀번호는 8자 이상이어야 합니다.</p>}

      {confirmPassword && !isPasswordMatch && <p className={styles.errorText}>비밀번호가 일치하지 않습니다.</p>}

      {isPasswordMatch && isPasswordValid && <p className={styles.successText}>✓ 비밀번호가 일치합니다.</p>}

      <div className={styles.passwordGuide}>
        <p>• 8자 이상 입력해주세요</p>
        <p>• 영문, 숫자, 특수문자 조합을 권장합니다</p>
      </div>
    </div>
  );
}
