"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Sidebar from "@/layout/sidebar";
import styles from "./AdminShell.module.css";

const SIDEBAR_STORAGE_KEY = "admin-sidebar-collapsed";

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileToggleRef = useRef(null);

  useEffect(() => {
    try {
      setDesktopCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");
    } catch {
      // Sidebar controls remain available when browser storage is disabled.
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        mobileToggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  const toggleDesktopSidebar = () => {
    const nextCollapsed = !desktopCollapsed;
    setDesktopCollapsed(nextCollapsed);
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextCollapsed));
    } catch {
      // A storage restriction should not prevent showing or hiding the menu.
    }
  };

  return (
    <div className={styles.shell} data-sidebar-collapsed={desktopCollapsed}>
      <header className={styles.header}>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 xl:hidden"
          ref={mobileToggleRef}
          aria-controls="admin-sidebar"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          Menu
        </button>
        <button
          type="button"
          className="hidden h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 xl:inline-flex"
          aria-controls="admin-sidebar"
          aria-expanded={!desktopCollapsed}
          onClick={toggleDesktopSidebar}
        >
          {desktopCollapsed ? <PanelLeftOpen size={19} aria-hidden="true" /> : <PanelLeftClose size={19} aria-hidden="true" />}
          {desktopCollapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
        </button>
        <span className="text-sm font-semibold text-slate-700">Admin Panel</span>
      </header>

      <Sidebar
        authenticated={true}
        className={styles.sidebar}
        mobileOpen={mobileOpen}
        desktopCollapsed={desktopCollapsed}
        onMobileClose={() => setMobileOpen(false)}
      />
      {mobileOpen && (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Tutup menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
