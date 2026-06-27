import PortalGate from "@/components/admin-shell/PortalGate";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PortalGate>{children}</PortalGate>;
}
