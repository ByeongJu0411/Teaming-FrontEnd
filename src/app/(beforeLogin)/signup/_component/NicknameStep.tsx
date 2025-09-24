import styles from "../signup.module.css";

interface NicknameStepProps {
  nickname: string;
  setNickname: (nickname: string) => void;
}

export default function NicknameStep({ nickname, setNickname }: NicknameStepProps) {
  return (
    <div>
      <h2>닉네임 설정</h2>
      <p>다른 사용자들에게 표시될 닉네임을 입력해주세요.</p>

      <input
        type="text"
        value={nickname}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNickname(e.target.value)}
        placeholder="닉네임을 입력하세요"
        maxLength={12}
        className={styles.input}
      />

      <div className={styles.characterCount}>{nickname.length}/12</div>

      <div className={styles.nicknameGuide}>
        <p>• 2-12자로 입력해주세요</p>
        <p>• 한글, 영문, 숫자 사용 가능합니다</p>
      </div>
    </div>
  );
}
