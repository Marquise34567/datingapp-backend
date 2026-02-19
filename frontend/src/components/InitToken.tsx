"use client";

import { useEffect } from "react";

export default function InitToken() {
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        await fetch('/api/token', { method: 'POST', credentials: 'include' });
      } catch (e) {
        // ignore
      }
    }
    init();
    return () => { mounted = false; };
  }, []);
  return null;
}
