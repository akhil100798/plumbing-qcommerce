"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { clearStoredToken, getStoredToken } from "@/services/apiClient";
import { logout } from "@/services/superAdminService";
import type { CurrentAdminAccess } from "@/services/rbacService";

interface AdminShellProps { currentUser: CurrentAdminAccess; children: React.ReactNode; }
type LinkItem = { label: string; href: string };
type DisabledItem = { label: string; comingSoon: true };

const superAdminItems: Array<LinkItem | DisabledItem> = [
  { label: "Dashboard", href: "/dashboard" }, { label: "Users", href: "/users" }, { label: "Admin Users", href: "/admins" }, { label: "Roles & Permissions", href: "/roles" }, { label: "System Health", href: "/system-health" }, { label: "Audit Logs", comingSoon: true }, { label: "Settings", comingSoon: true },
];
const operationsItems: LinkItem[] = [
  { label: "Operations Dashboard", href: "/operations" }, { label: "Product Orders", href: "/operations/orders" }, { label: "Service Jobs", href: "/operations/service-jobs" }, { label: "Material Requests", href: "/operations/material-requests" }, { label: "Delivery Partners", href: "/operations/delivery-partners" }, { label: "Delayed Orders", href: "/operations/delayed" }, { label: "Reassignments", href: "/operations/reassignments" },
];
const financeItems: LinkItem[] = [
  { label: "Finance Dashboard", href: "/finance" }, { label: "Payments", href: "/finance/payments" }, { label: "Store Settlements", href: "/finance/settlements" }, { label: "Plumber Payouts", href: "/finance/payouts/plumbers" }, { label: "Delivery Payouts", href: "/finance/payouts/delivery-partners" }, { label: "Refunds", href: "/finance/refunds" }, { label: "Commission Report", href: "/finance/commission-report" },
];
const supportItems: LinkItem[] = [
  { label: "Support Dashboard", href: "/support" }, { label: "Tickets", href: "/support/tickets" }, { label: "Escalations", href: "/support/escalations" }, { label: "Create Ticket", href: "/support/create-ticket" }, { label: "User Context", href: "/support/user-context" },
];
const plumberManagerItems: LinkItem[] = [
  { label: "Plumber Dashboard", href: "/plumber-manager" }, { label: "Plumbers", href: "/plumber-manager/plumbers" }, { label: "KYC Approvals", href: "/plumber-manager/kyc" }, { label: "Performance", href: "/plumber-manager/performance" }, { label: "Earnings", href: "/plumber-manager/earnings" },
];
const marketingItems: LinkItem[] = [
  { label: "Marketing Dashboard", href: "/marketing" }, { label: "Offers & Coupons", href: "/marketing/offers" }, { label: "Campaigns", href: "/marketing/campaigns" }, { label: "Banners", href: "/marketing/banners" }, { label: "Push Notifications", href: "/marketing/notifications" }, { label: "User Segments", href: "/marketing/segments" }, { label: "Reports", href: "/marketing/reports" },
];
const futureAdminItems: DisabledItem[] = [

];
function titleFromPathname(pathname: string) { if (pathname === "/dashboard") return "Platform Overview"; if (pathname === "/users") return "User Management"; if (pathname.startsWith("/users/")) return "User Details"; if (pathname === "/admins") return "Admin Users"; if (pathname === "/roles") return "Roles & Permissions"; if (pathname === "/system-health") return "System Health"; if (pathname.startsWith("/operations/orders/")) return "Product Order Detail"; if (pathname.startsWith("/operations/service-jobs/")) return "Service Job Detail"; if (pathname.startsWith("/operations")) return "Operations Admin"; if (pathname.startsWith("/finance/payments/")) return "Payment Detail"; if (pathname.startsWith("/finance")) return "Finance Admin"; if (pathname.startsWith("/support/tickets/")) return "Ticket Detail"; if (pathname.startsWith("/support")) return "Support Admin"; if (pathname.startsWith("/plumber-manager")) return "Plumber Manager"; if (pathname.startsWith("/marketing")) return "Marketing Admin"; return "Admin Portal"; }
function roleLabel(role: string) { return role.replaceAll("_", " "); }
function initials(fullName: string) { return fullName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join(""); }
function NavLink({ label, href, pathname }: { label: string; href: string; pathname: string }) { const active = pathname === href || (!["/operations", "/finance", "/support", "/plumber-manager", "/marketing"].includes(href) && pathname.startsWith(`${href}/`)); return <Link href={href} className={active ? "admin-nav-item admin-nav-item-active" : "admin-nav-item"}><span>{label}</span></Link>; }
function DisabledNav({ label }: { label: string }) { return <div className="admin-nav-item admin-nav-item-disabled"><span>{label}</span><span className="admin-nav-note">Coming soon</span></div>; }

export default function AdminShell({ currentUser, children }: AdminShellProps) {
  const pathname = usePathname(); const router = useRouter(); const [loggingOut, setLoggingOut] = useState(false); const pageTitle = useMemo(() => titleFromPathname(pathname), [pathname]);
  const canUseSuperAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN"; const canUseOperations = canUseSuperAdmin || currentUser.role === "OPERATIONS_ADMIN"; const canUseFinance = canUseSuperAdmin || currentUser.role === "FINANCE_ADMIN"; const canUseSupport = canUseSuperAdmin || currentUser.role === "SUPPORT_ADMIN"; const canUsePlumberManager = canUseSuperAdmin || currentUser.role === "PLUMBER_MANAGER"; const canUseMarketing = canUseSuperAdmin || currentUser.role === "MARKETING_ADMIN";
  async function handleLogout() { setLoggingOut(true); try { if (getStoredToken()) await logout().catch(() => undefined); } finally { clearStoredToken(); router.replace("/"); } }
  return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-sidebar-brand"><div className="admin-mark">P</div><div><div className="admin-brand-name">PlumbCommerce</div><div className="admin-brand-subtitle">Admin Portal</div></div></div><div className="admin-sidebar-profile"><div className="admin-avatar">{initials(currentUser.fullName)}</div><div><div className="admin-profile-name">{currentUser.fullName}</div><div className="admin-profile-email">{currentUser.email}</div><div className="admin-profile-role">{roleLabel(currentUser.role)}</div></div></div><nav className="admin-nav">{canUseSuperAdmin ? superAdminItems.map((item) => "comingSoon" in item ? <DisabledNav key={item.label} label={item.label} /> : <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} />) : null}{canUseOperations ? operationsItems.map((item) => <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} />) : null}{canUseFinance ? financeItems.map((item) => <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} />) : null}{canUseSupport ? supportItems.map((item) => <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} />) : null}{canUsePlumberManager ? plumberManagerItems.map((item) => <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} />) : null}{canUseMarketing ? marketingItems.map((item) => <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} />) : null}{canUseSuperAdmin ? futureAdminItems.map((item) => <DisabledNav key={item.label} label={item.label} />) : null}</nav></aside><div className="admin-shell-main"><header className="admin-topbar"><div><div className="page-title">{pageTitle}</div><div className="page-subtitle">Operational, financial, support, workforce, and marketing control for the platform core</div></div><div className="admin-topbar-right"><div className="admin-profile-chip"><div className="admin-avatar admin-avatar-sm">{initials(currentUser.fullName)}</div><div><div className="admin-profile-name">{currentUser.fullName}</div><div className="admin-profile-email">{currentUser.role}</div></div></div><button type="button" className="button button-secondary" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? "Signing out" : "Logout"}</button></div></header><main className="admin-page">{children}</main></div></div>;
}