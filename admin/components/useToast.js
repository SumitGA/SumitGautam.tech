"use client";
import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const Toast = toast ? (
    <div className={`toast ${toast.type}`}>{toast.message}</div>
  ) : null;

  return { show, Toast };
}
