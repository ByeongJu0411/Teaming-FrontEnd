// app/payment/success/page.tsx
"use client";
import { useEffect } from "react";

export default function PaymentSuccess() {
  useEffect(() => {
    // 부모 창으로 성공 메시지 전송
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: "PAYMENT_SUCCESS" }, window.location.origin);
    }

    // 2초 후 창 닫기
    const timer = setTimeout(() => {
      window.close();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontSize: "20px",
      }}
    >
      결제가 완료되었습니다. 잠시만 기다려주세요...
    </div>
  );
}
