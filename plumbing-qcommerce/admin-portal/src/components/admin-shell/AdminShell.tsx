"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  Boxes,
  Building,
  CheckSquare,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Image,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Package,
  PlusCircle,
  RefreshCw,
  Rocket,
  RotateCcw,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Truck,
  UserCheck,
  Users,
  Users2,
  Wallet,
  Wrench,
} from "lucide-react";

import { clearStoredToken, getStoredToken } from "@/services/apiClient";
import { logout } from "@/services/superAdminService";
import type { CurrentAdminAccess } from "@/services/rbacService";

interface AdminShellProps { currentUser: CurrentAdminAccess; children: React.ReactNode; }
type LinkItem = { label: string; href: string; icon: LucideIcon };
type DisabledItem = { label: string; comingSoon: true; icon: LucideIcon };

const superAdminItems: Array<LinkItem | DisabledItem> = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Admin Users", href: "/admins", icon: ShieldCheck },
  { label: "Roles & Permissions", href: "/roles", icon: Shield },
  { label: "System Health", href: "/system-health", icon: Activity },
  { label: "Launch Roster", href: "/launch-roster", icon: Rocket },
  { label: "Audit Logs", comingSoon: true, icon: FileText },
  { label: "Settings", comingSoon: true, icon: Settings },
];

const operationsItems: LinkItem[] = [
  { label: "Operations Dashboard", href: "/operations", icon: LayoutDashboard },
  { label: "Product Orders", href: "/operations/orders", icon: Package },
  { label: "Service Jobs", href: "/operations/service-jobs", icon: Wrench },
  { label: "Material Requests", href: "/operations/material-requests", icon: Boxes },
  { label: "Material Pickups", href: "/operations/material-pickups", icon: Truck },
  { label: "Delivery Partners", href: "/operations/delivery-partners", icon: Truck },
  { label: "Delayed Orders", href: "/operations/delayed", icon: Clock },
  { label: "Reassignments", href: "/operations/reassignments", icon: RefreshCw },
];

const financeItems: LinkItem[] = [
  { label: "Finance Dashboard", href: "/finance", icon: LayoutDashboard },
  { label: "Payments", href: "/finance/payments", icon: CreditCard },
  { label: "Store Settlements", href: "/finance/settlements", icon: Building },
  { label: "Plumber Payouts", href: "/finance/payouts/plumbers", icon: Wallet },
  { label: "Delivery Payouts", href: "/finance/payouts/delivery-partners", icon: Truck },
  { label: "Refunds", href: "/finance/refunds", icon: RotateCcw },
  { label: "Commission Report", href: "/finance/commission-report", icon: BarChart3 },
];

const supportItems: LinkItem[] = [
  { label: "Support Dashboard", href: "/support", icon: LifeBuoy },
  { label: "Tickets", href: "/support/tickets", icon: Inbox },
  { label: "Escalations", href: "/support/escalations", icon: ShieldAlert },
  { label: "Create Ticket", href: "/support/create-ticket", icon: PlusCircle },
  { label: "User Context", href: "/support/user-context", icon: UserCheck },
];

const plumberManagerItems: LinkItem[] = [
  { label: "Plumber Dashboard", href: "/plumber-manager", icon: LayoutDashboard },
  { label: "Plumbers", href: "/plumber-manager/plumbers", icon: Users },
  { label: "KYC Approvals", href: "/plumber-manager/kyc", icon: CheckSquare },
  { label: "Performance", href: "/plumber-manager/performance", icon: Award },
  { label: "Earnings", href: "/plumber-manager/earnings", icon: DollarSign },
];

const marketingItems: LinkItem[] = [
  { label: "Marketing Dashboard", href: "/marketing", icon: LayoutDashboard },
  { label: "Offers & Coupons", href: "/marketing/offers", icon: Tag },
  { label: "Campaigns", href: "/marketing/campaigns", icon: Megaphone },
  { label: "Banners", href: "/marketing/banners", icon: Image },
  { label: "Push Notifications", href: "/marketing/notifications", icon: Bell },
  { label: "User Segments", href: "/marketing/segments", icon: Users2 },
  { label: "Reports", href: "/marketing/reports", icon: BarChart3 },
];

const futureAdminItems: DisabledItem[] = [];

function titleFromPathname(pathname: string) { if (pathname.startsWith("/launch-roster")) return "Launch Roster"; if (pathname === "/dashboard") return "Platform Overview"; if (pathname === "/users") return "User Management"; if (pathname.startsWith("/users/")) return "User Details"; if (pathname === "/admins") return "Admin Users"; if (pathname === "/roles") return "Roles & Permissions"; if (pathname === "/system-health") return "System Health"; if (pathname.startsWith("/operations/orders/")) return "Product Order Detail"; if (pathname.startsWith("/operations/service-jobs/")) return "Service Job Detail"; if (pathname.startsWith("/operations")) return "Operations Admin"; if (pathname.startsWith("/finance/payments/")) return "Payment Detail"; if (pathname.startsWith("/finance")) return "Finance Admin"; if (pathname.startsWith("/support/tickets/")) return "Ticket Detail"; if (pathname.startsWith("/support")) return "Support Admin"; if (pathname.startsWith("/plumber-manager")) return "Plumber Manager"; if (pathname.startsWith("/marketing")) return "Marketing Admin"; return "Admin Portal"; }
function roleLabel(role: string) { return role.replaceAll("_", " "); }
function initials(fullName: string) { return fullName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join(""); }

function NavLink({ label, href, pathname, icon: Icon }: { label: string; href: string; pathname: string; icon: LucideIcon }) {
  const active = pathname === href || (!["/operations", "/finance", "/support", "/plumber-manager", "/marketing"].includes(href) && pathname.startsWith(`${href}/`));
  return (
    <Link href={href} className={active ? "admin-nav-item admin-nav-item-active" : "admin-nav-item"}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
        <Icon size={18} strokeWidth={2} />
        <span>{label}</span>
      </span>
    </Link>
  );
}

function DisabledNav({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <div className="admin-nav-item admin-nav-item-disabled">
      <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
        <Icon size={18} strokeWidth={2} />
        <span>{label}</span>
      </span>
      <span className="admin-nav-note">Coming soon</span>
    </div>
  );
}

export default function AdminShell({ currentUser, children }: AdminShellProps) {
  const pathname = usePathname(); const router = useRouter(); const [loggingOut, setLoggingOut] = useState(false); const pageTitle = useMemo(() => titleFromPathname(pathname), [pathname]);
  const canUseSuperAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN"; const canUseOperations = canUseSuperAdmin || currentUser.role === "OPERATIONS_ADMIN"; const canUseFinance = canUseSuperAdmin || currentUser.role === "FINANCE_ADMIN"; const canUseSupport = canUseSuperAdmin || currentUser.role === "SUPPORT_ADMIN"; const canUsePlumberManager = canUseSuperAdmin || currentUser.role === "PLUMBER_MANAGER"; const canUseMarketing = canUseSuperAdmin || currentUser.role === "MARKETING_ADMIN";
  async function handleLogout() { setLoggingOut(true); try { if (getStoredToken()) await logout().catch(() => undefined); } finally { clearStoredToken(); router.replace("/"); } }
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-mark" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wrench size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="admin-brand-name">PlumbCommerce</div>
            <div className="admin-brand-subtitle">Admin Portal</div>
          </div>
        </div>
        <div className="admin-sidebar-profile">
          <div className="admin-avatar">{initials(currentUser.fullName)}</div>
          <div>
            <div className="admin-profile-name">{currentUser.fullName}</div>
            <div className="admin-profile-email">{currentUser.email}</div>
            <div className="admin-profile-role">{roleLabel(currentUser.role)}</div>
          </div>
        </div>
        <nav className="admin-nav">
          {canUseSuperAdmin ? superAdminItems.map((item) => "comingSoon" in item ? <DisabledNav key={item.label} label={item.label} icon={item.icon} /> : <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} icon={item.icon} />) : null}
          {canUseOperations ? operationsItems.map((item) => <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} icon={item.icon} />) : null}
          {canUseFinance ? financeItems.map((item) => <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} icon={item.icon} />) : null}
          {canUseSupport ? supportItems.map((item) => <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} icon={item.icon} />) : null}
          {canUsePlumberManager ? plumberManagerItems.map((item) => <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} icon={item.icon} />) : null}
          {canUseMarketing ? marketingItems.map((item) => <NavLink key={item.href} label={item.label} href={item.href} pathname={pathname} icon={item.icon} />) : null}
          {canUseSuperAdmin ? futureAdminItems.map((item) => <DisabledNav key={item.label} label={item.label} icon={item.icon} />) : null}
        </nav>
      </aside>
      <div className="admin-shell-main">
        <header className="admin-topbar">
          <div>
            <div className="page-title">{pageTitle}</div>
            <div className="page-subtitle">Operational, financial, support, workforce, and marketing control for the platform core</div>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-profile-chip">
              <div className="admin-avatar admin-avatar-sm">{initials(currentUser.fullName)}</div>
              <div>
                <div className="admin-profile-name">{currentUser.fullName}</div>
                <div className="admin-profile-email">{currentUser.role}</div>
              </div>
            </div>
            <button type="button" className="button button-secondary" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? "Signing out" : "Logout"}
            </button>
          </div>
        </header>
        <main className="admin-page">{children}</main>
      </div>
    </div>
  );
}
