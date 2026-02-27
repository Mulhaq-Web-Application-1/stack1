"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Home, Users, FolderTree, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/groups", label: "Groups", Icon: FolderTree },
  { href: "/dashboard/pages", label: "Pages", Icon: FileText },
  { href: "/dashboard/profile", label: "Profile", Icon: Users },
];

export function DashboardNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="flex flex-row gap-2 p-4 md:flex-col">
      {links.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(href)
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
