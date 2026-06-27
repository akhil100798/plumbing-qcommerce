"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import AdminShell from "./AdminShell";
import { clearStoredToken, getStoredToken } from "@/services/apiClient";
import {
  getCurrentAdminAccess,
  FINANCE_PORTAL_ROLES,
  OPERATIONS_PORTAL_ROLES,
  PLUMBER_MANAGER_PORTAL_ROLES,
  MARKETING_PORTAL_ROLES,
  SUPPORT_PORTAL_ROLES,
  SUPER_ADMIN_PORTAL_ROLES,
  type CurrentAdminAccess,
} from "@/services/rbacService";

interface PortalGateProps {
  children: React.ReactNode;
}

const PortalSessionContext = createContext<CurrentAdminAccess | null>(null);

export function usePortalSession() {
  return useContext(PortalSessionContext);
}

export default function PortalGate({ children }: PortalGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<CurrentAdminAccess | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const token = getStoredToken();
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const access = await getCurrentAdminAccess();
        const allowedRoles = pathname.startsWith("/operations") ? OPERATIONS_PORTAL_ROLES : pathname.startsWith("/finance") ? FINANCE_PORTAL_ROLES : pathname.startsWith("/support") ? SUPPORT_PORTAL_ROLES : pathname.startsWith("/plumber-manager") ? PLUMBER_MANAGER_PORTAL_ROLES : pathname.startsWith("/marketing") ? MARKETING_PORTAL_ROLES : SUPER_ADMIN_PORTAL_ROLES;
        if (!(allowedRoles as readonly string[]).includes(access.role)) {
          router.replace(access.role === "OPERATIONS_ADMIN" ? "/operations" : access.role === "FINANCE_ADMIN" ? "/finance" : access.role === "SUPPORT_ADMIN" ? "/support" : access.role === "PLUMBER_MANAGER" ? "/plumber-manager" : access.role === "MARKETING_ADMIN" ? "/marketing" : "/");
          return;
        }

        if (active) {
          setCurrentUser(access);
          setChecking(false);
        }
      } catch {
        clearStoredToken();
        router.replace("/");
      }
    }

    void verifySession();

    return () => {
      active = false;
    };
  }, [router, pathname]);

  if (checking || !currentUser) {
    return (
      <div className="loading-state">
        <div className="loading-card">
          <div className="loading-bar" />
          <div className="loading-copy">Verifying session</div>
        </div>
      </div>
    );
  }

  return (
    <PortalSessionContext.Provider value={currentUser}>
      <AdminShell currentUser={currentUser}>{children}</AdminShell>
    </PortalSessionContext.Provider>
  );
}
