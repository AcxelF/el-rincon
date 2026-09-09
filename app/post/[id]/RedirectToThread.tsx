"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToThread({ id, valid }: { id: string; valid: boolean }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(valid ? `/?post=${id}` : "/");
  }, [id, valid, router]);

  return null;
}
