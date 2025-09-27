"use client";
import { useEffect } from "react";

export default function PaymentSuccess() {
  useEffect(() => {
    window.close();
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
