"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: "messages" | "visitor-chat";
  external?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/messages", label: "Messages", icon: "✉️", badge: "messages" },
  { href: "/admin/visitor-messages", label: "Visitor Messages", icon: "💬", badge: "visitor-chat" },
  { href: "/admin/projects", label: "Projects", icon: "📁" },
  { href: "/admin/profile", label: "Hassan’s Profile", icon: "👤" },
  { href: "/admin/missions", label: "Daily Missions", icon: "🎯" },
  { href: "/admin/games", label: "Games & Challenges", icon: "🎮" },
  { href: "/admin/submissions", label: "Submissions", icon: "📥" },
  { href: "/admin/badges", label: "Badges & Rewards", icon: "🏅" },
  { href: "/admin/resources", label: "Learning Resources", icon: "📚" },
  { href: "/admin/settings", label: "Website Settings", icon: "⚙️" },
  { href: "/", label: "View Public Website", icon: "🌐", external: true },
];

const COLLAPSE_KEY = "hassan-admin-sidebar-collapsed";

function circledCount(count: number): string {
  const circled = ["⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  if (count >= 0 && count <= 10) return circled[count];
  return String(count);
}

export function AdminShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [visitorUnreadCount, setVisitorUnreadCount] = useState(0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      setCollapsed(false);
    }
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const [messagesRes, visitorRes] = await Promise.all([
        fetch("/api/admin/messages/unread"),
        fetch("/api/admin/visitor-chat/unread"),
      ]);
      const messagesData = await messagesRes.json();
      const visitorData = await visitorRes.json();
      if (messagesData.ok) setUnreadCount(Number(messagesData.unreadCount) || 0);
      if (visitorData.ok) setVisitorUnreadCount(Number(visitorData.unreadCount) || 0);
    } catch {
      // Keep previous count if the request fails.
    }
  }, []);

  useEffect(() => {
    refreshUnread();
    const onChange = () => refreshUnread();
    window.addEventListener("hassan:messages-changed", onChange);
    window.addEventListener("hassan:visitor-chat-changed", onChange);
    const timer = window.setInterval(refreshUnread, 15000);
    return () => {
      window.removeEventListener("hassan:messages-changed", onChange);
      window.removeEventListener("hassan:visitor-chat-changed", onChange);
      window.clearInterval(timer);
    };
  }, [refreshUnread]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // Ignore storage errors.
      }
      return next;
    });
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    // Hard navigation so public pages re-read the destroyed session cookie.
    window.location.assign("/admin/login");
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebarWidth = collapsed ? "w-[88px]" : "w-[280px]";

  return (
    <div className="admin-shell">
      <div className="flex min-h-screen">
        <aside
          id="admin-sidebar"
          className={[
            "admin-sidebar-panel",
            sidebarWidth,
            "fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-200 md:static md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          ].join(" ")}
          aria-label="Admin Panel navigation"
        >
          <div className="flex items-start justify-between gap-2 border-b border-white/10 p-4">
            <div className={collapsed ? "sr-only" : ""}>
              <p className="text-lg font-extrabold tracking-tight text-white">Admin Panel</p>
              <p className="mt-1 text-sm text-blue-100">Welcome, Admin</p>
              <p className="mt-0.5 text-xs text-slate-300">{name}</p>
            </div>
            {collapsed ? (
              <p className="mx-auto text-center text-xs font-bold uppercase tracking-wide text-blue-200">
                Admin
              </p>
            ) : null}
            <button
              type="button"
              className="admin-icon-btn md:hidden"
              aria-label="Close sidebar"
              onClick={() => setMobileOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="border-b border-white/10 p-3">
            <button
              type="button"
              className="admin-icon-btn w-full justify-center"
              aria-expanded={!collapsed}
              aria-controls="admin-sidebar"
              onClick={toggleCollapsed}
            >
              <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
              <span className={collapsed ? "sr-only" : ""}>
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
              </span>
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin sections">
            {NAV_ITEMS.map((item) => {
              const active = !item.external && isActive(item.href);
              const badgeCount =
                item.badge === "messages"
                  ? unreadCount
                  : item.badge === "visitor-chat"
                    ? visitorUnreadCount
                    : 0;
              const showBadge = Boolean(item.badge) && badgeCount > 0;
              const className = [
                "admin-nav-item",
                active ? "is-active" : "",
                collapsed ? "is-collapsed" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const content = (
                <>
                  <span className="admin-nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className={collapsed ? "sr-only" : "admin-nav-label"}>{item.label}</span>
                  {showBadge ? (
                    <span
                      className="admin-nav-badge"
                      aria-label={`${badgeCount} unread`}
                      title={`${badgeCount} unread`}
                    >
                      {circledCount(badgeCount)}
                    </span>
                  ) : null}
                </>
              );

              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                    title={item.label}
                    onClick={() => setMobileOpen(false)}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={className}
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {content}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              className="admin-nav-item admin-logout-btn w-full"
              onClick={logout}
              title="Logout"
            >
              <span className="admin-nav-icon" aria-hidden="true">
                🚪
              </span>
              <span className={collapsed ? "sr-only" : "admin-nav-label"}>Logout</span>
            </button>
          </div>
        </aside>

        <div
          className={[
            "flex min-w-0 flex-1 flex-col transition-[margin] duration-200",
            "md:ml-0",
          ].join(" ")}
        >
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <button
              type="button"
              className="admin-btn secondary min-h-11 md:hidden"
              aria-expanded={mobileOpen}
              aria-controls="admin-sidebar"
              onClick={() => setMobileOpen(true)}
            >
              ☰ Menu
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-700">Secure parent/guardian area</p>
              <p className="truncate text-xs text-slate-500">
                Contact managed by Hassan’s parent/guardian.
              </p>
            </div>
            <button
              type="button"
              className="admin-btn secondary hidden min-h-11 sm:inline-flex"
              onClick={toggleCollapsed}
            >
              {collapsed ? "Expand nav" : "Collapse nav"}
            </button>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
          aria-label="Close sidebar backdrop"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

export function notifyMessagesChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("hassan:messages-changed"));
  }
}

export function notifyVisitorChatChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("hassan:visitor-chat-changed"));
  }
}
