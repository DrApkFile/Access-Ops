"use client";
import { useEffect, useState } from "react";
export function CountValue({
  target,
  decimals,
  suffix,
  index,
}: {
  target: number;
  decimals: number;
  suffix: string;
  index: number;
}) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    let frame = 0,
      start = 0;
    const draw = (now: number) => {
      start ||= now;
      const elapsed = now - start - (750 + index * 100);
      const p = Math.max(0, Math.min(elapsed / 1300, 1));
      setValue(target * (1 - (1 - p) ** 3));
      if (p < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    const change = () => {
      if (motion.matches) {
        cancelAnimationFrame(frame);
        setValue(target);
      }
    };
    motion.addEventListener("change", change);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", change);
    };
  }, [target, index]);
  return (
    <>
      {value.toFixed(decimals)}
      <small>{suffix}</small>
    </>
  );
}
