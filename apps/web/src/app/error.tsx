"use client";
import { FallbackPage } from "@/components/brand/fallback-page";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <FallbackPage retry={reset} />;
}
