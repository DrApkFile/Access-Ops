"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { design, siteLinks, ui } from "@/data/accessops-ui";
export function SiteHeader() {
  const pathname = usePathname(),
    [open, setOpen] = useState(false),
    toggle = useRef<HTMLButtonElement>(null),
    sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const content = document.querySelector<HTMLElement>("[data-page-content]");
    document.body.classList.add("menu-open");
    if (content) content.inert = true;
    const frame = requestAnimationFrame(() =>
      sheet.current?.querySelector<HTMLAnchorElement>("a")?.focus(),
    );
    const close = () => {
      setOpen(false);
      toggle.current?.focus();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "Tab") {
        const targets = [
          toggle.current,
          ...Array.from(
            sheet.current?.querySelectorAll<HTMLElement>("a,button") ?? [],
          ),
        ].filter((x): x is HTMLElement => !!x);
        const first = targets[0],
          last = targets.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const resize = () => {
      if (innerWidth > 720) close();
    };
    addEventListener("keydown", key);
    addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      document.body.classList.remove("menu-open");
      if (content) content.inert = false;
      removeEventListener("keydown", key);
      removeEventListener("resize", resize);
    };
  }, [open]);
  function dismiss() {
    setOpen(false);
    toggle.current?.focus();
  }
  return (
    <>
      <a href="#main-content" className="skip-link">
        {ui.skip}
      </a>
      <header className="ao-site-header">
        <Link
          href="/"
          className="logo-button"
          aria-label={ui.brand}
          onClick={dismiss}
        >
          <img src={design.logo} alt="" width="30" height="30" />
        </Link>
        <nav className="ao-nav-pill" aria-label={ui.navigation}>
          {siteLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
              <span className="nav-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className="ao-sign-in">
          {ui.signIn}
        </Link>
        <button
          ref={toggle}
          type="button"
          className={"menu-toggle " + (open ? "is-open" : "")}
          aria-label={open ? ui.closeMenu : ui.openMenu}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>
      <div className="mobile-menu" hidden={!open}>
        <button
          type="button"
          className="menu-overlay"
          tabIndex={-1}
          aria-label={ui.closeMenu}
          onClick={dismiss}
        />
        <div
          ref={sheet}
          id="mobile-navigation"
          className="menu-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={ui.navigation}
        >
          {siteLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={dismiss}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/dashboard" className="menu-sign-in" onClick={dismiss}>
            {ui.signIn}
          </Link>
        </div>
      </div>
    </>
  );
}
