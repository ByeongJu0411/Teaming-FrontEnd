"use client";
import { useEffect } from "react";

export default function PaymentFail() {
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
      결제가 실패했습니다. 창을 닫습니다...
    </div>
  );
}
