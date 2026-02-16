"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/scan/camera");
  }, [router]);

  return null;
}