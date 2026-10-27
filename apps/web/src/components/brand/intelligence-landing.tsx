"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { design, landingCopy as copy } from "@/data/accessops-ui";
import { CountValue } from "./count-value";
export function IntelligenceLanding() {
  const video = useRef<HTMLVideoElement>(null),
    [paused, setPaused] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (motion.matches) {
        video.current?.pause();
        setPaused(true);
      }
    };
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);
  function toggle() {
    if (paused)
      void video.current
        ?.play()
        .then(() => setPaused(false))
        .catch(() => setFailed(true));
    else {
      video.current?.pause();
      setPaused(true);
    }
  }
  return (
    <section className="landing-viewport" aria-labelledby="intelligence-title">
      <div className="bg">
        <video
          ref={video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={() => setFailed(true)}
        >
          <source src={design.video} type="video/mp4" />
        </video>
        <div className="bg-shade" />
      </div>
      <div className="landing-hero">
        <div className="trust-row" aria-describedby="reference-claims">
          <div className="trust-rings" aria-hidden="true">
            <span>
              <i className="fa-brands fa-microsoft" />
            </span>
            <span>
              <i className="fa-brands fa-amazon" />
            </span>
            <span>
              <i className="fa-brands fa-google" />
            </span>
          </div>
          <span className="trust-pill">{copy.trust}</span>
        </div>
        <h1 id="intelligence-title" className="intelligence-headline">
          {copy.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p className="intelligence-subheading">{copy.description}</p>
        <Link className="intelligence-cta" href="/dashboard">
          {copy.cta}
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <footer className="landing-statistics">
        <div className="statistics-grid" aria-label={copy.claimNotice}>
          {copy.metrics.map((metric, index) => (
            <div className="reference-stat" key={metric.label}>
              <span className="stat-symbol" aria-hidden="true">
                {metric.symbol}
              </span>
              <div>
                <strong>
                  <CountValue
                    target={metric.value}
                    decimals={metric.decimals}
                    suffix={metric.suffix}
                    index={index}
                  />
                </strong>
                <p>{metric.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="landing-footnote">
          <Link
            id="reference-claims"
            href="/product#reference-claims"
            title={copy.claimDetail}
          >
            {copy.claimNotice}
          </Link>
          <button
            type="button"
            onClick={toggle}
            disabled={failed}
            aria-label={paused ? copy.play : copy.pause}
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
            <span>
              {failed ? copy.static : paused ? copy.play : copy.pause}
            </span>
          </button>
        </div>
      </footer>
    </section>
  );
}
