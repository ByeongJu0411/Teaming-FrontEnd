"use client";
import styles from "@/app/(afterLogin)/mainpage/_component/mypage.module.css";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function DangerSection() {
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // 로그아웃 API 호출 함수
  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoggingOut(true);

      const token = session?.accessToken;

      if (!token) {
        // 토큰이 없어도 클라이언트 세션 정리
        console.log("토큰이 없지만 클라이언트 세션 정리 진행");
        await signOut({
          callbackUrl: "/",
          redirect: true,
        });
        return;
      }

      console.log("로그아웃 API 호출 중...");

      // 서버에 로그아웃 요청 (리프레시 토큰 무효화)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/log-out`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("로그아웃 응답 상태:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("로그아웃 API 실패:", errorText);

        // API 실패해도 클라이언트 세션은 정리
        console.log("API 실패했지만 클라이언트 세션 정리 진행");
      } else {
        console.log("서버 로그아웃 성공");
      }

      // 성공/실패 여부와 관계없이 클라이언트 세션 정리
      // NextAuth signOut은 액세스 토큰을 클라이언트에서 직접 처분
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("로그아웃 중 오류:", error);

      // 네트워크 오류가 발생해도 클라이언트 세션 정리
      console.log("네트워크 오류 발생, 클라이언트 세션 정리 진행");
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 회원탈퇴 API 호출 함수
  const handleDeleteAccount = async (): Promise<void> => {
    try {
      // 확인 다이얼로그
      const confirmed = window.confirm(
        "정말로 회원탈퇴를 진행하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 데이터가 삭제됩니다."
      );

      if (!confirmed) {
        return;
      }

      // 추가 확인
      const doubleConfirmed = window.confirm(
        "마지막 확인입니다.\n\n회원탈퇴를 진행하면 계정과 관련된 모든 정보가 영구적으로 삭제됩니다.\n\n정말 계속하시겠습니까?"
      );

      if (!doubleConfirmed) {
        return;
      }

      setIsDeleting(true);

      const token = session?.accessToken;

      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      if (!session?.isBackendAuthenticated) {
        alert("백엔드 인증이 완료되지 않았습니다.");
        return;
      }

      console.log("회원탈퇴 API 호출 중...");

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/withdraw`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("회원탈퇴 응답 상태:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("회원탈퇴 실패:", errorText);

        if (response.status === 401) {
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (response.status === 403) {
          alert("접근 권한이 없습니다.");
        } else if (response.status === 404) {
          alert("사용자를 찾을 수 없습니다.");
        } else {
          alert(`회원탈퇴 처리 중 오류가 발생했습니다. (${response.status})`);
        }
        return;
      }

      console.log("회원탈퇴 성공");

      // 성공 시 로그아웃 및 홈페이지로 이동
      alert("회원탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");

      // NextAuth 세션 종료 (액세스 토큰 클라이언트에서 처분)
      await signOut({
        callbackUrl: "/", // 홈페이지로 리다이렉트
        redirect: true,
      });
    } catch (error) {
      console.error("회원탈퇴 중 오류:", error);
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.dangerSection}>
      <div className={styles.sectionCard}>
        <h3 className={styles.dangerTitle}>계정 관리</h3>

        <button className={styles.logoutBtn} onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>

        <button className={styles.deleteAccountBtn} type="button" onClick={handleDeleteAccount} disabled={isDeleting}>
          {isDeleting ? "처리 중..." : "회원탈퇴"}
        </button>
      </div>
    </div>
  );
}
