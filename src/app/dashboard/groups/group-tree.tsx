"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toDisplayUrl } from "@/lib/image-url";

type GroupTreeItem = {
  id: string;
  name: string;
  logoUrl?: string | null;
  _count?: { pages: number };
  members?: unknown[];
  childGroups?: GroupTreeItem[];
};

export function GroupTree({
  groups,
  depth = 0,
}: {
  groups: GroupTreeItem[];
  depth?: number;
}) {
  return (
    <ul className={cn("space-y-1", depth > 0 && "ml-4 border-l-2 border-border pl-4")}>
      {groups.map((group) => (
        <li key={group.id} className="py-2">
          <Link
            href={`/dashboard/groups/${group.id}`}
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
          >
            <div className="h-10 w-10 rounded-lg border bg-muted overflow-hidden shrink-0 relative">
              {group.logoUrl ? (
                <Image
                  src={toDisplayUrl(group.logoUrl) ?? group.logoUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  <ChevronRight className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{group.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {Array.isArray(group.members) ? group.members.length : 0} members
                </span>
                {(group._count?.pages ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {group._count?.pages} pages
                  </span>
                )}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
          {group.childGroups && group.childGroups.length > 0 ? (
            <GroupTree groups={group.childGroups} depth={depth + 1} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
