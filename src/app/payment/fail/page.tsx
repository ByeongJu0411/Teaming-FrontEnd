// app/payment/fail/page.tsx
"use client";
import { useEffect } from "react";

export default function PaymentFail() {
  useEffect(() => {
    // 부모 창으로 실패 메시지 전송
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: "PAYMENT_FAIL" }, window.location.origin);
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
      결제가 실패했습니다. 창을 닫습니다...
    </div>
  );
}
