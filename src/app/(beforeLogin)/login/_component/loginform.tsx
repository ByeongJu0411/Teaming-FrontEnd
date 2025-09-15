"use client";

import styles from "./loginform.module.css";
import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className={styles.login_form}>
      <p className={styles.form_title}>로그인</p>

      <div className={styles.input_group}>
        <div className={styles.input_wrapper}>
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.input_wrapper}>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.button_group}>
        <Link href="/mainpage" className={styles.login_button}>
          로그인
        </Link>

        <Link href="/signup" className={styles.signup_button}>
          회원가입
        </Link>
      </div>
    </div>
  );
}
