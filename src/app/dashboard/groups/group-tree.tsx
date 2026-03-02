"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Users, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toDisplayUrl } from "@/lib/image-url";

type GroupTreeItem = {
  id: string;
  name: string;
  logoUrl?: string | null;
  _count?: { pages: number; members?: number };
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
    <ul className={cn("space-y-3", depth > 0 && "ml-4 space-y-3 border-l-2 border-border pl-4")}>
      {groups.map((group) => (
        <li key={group.id}>
          <Link href={`/dashboard/groups/${group.id}`} className="block">
            <Card className="overflow-hidden transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-muted relative">
                  {group.logoUrl ? (
                    <Image
                      src={toDisplayUrl(group.logoUrl) ?? group.logoUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-foreground">{group.name}</p>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {group._count?.members ?? (Array.isArray(group.members) ? group.members.length : 0)} members
                    </span>
                    {(group._count?.pages ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {group._count?.pages} pages
                      </span>
                    )}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          {group.childGroups && group.childGroups.length > 0 ? (
            <div className="mt-3">
              <GroupTree groups={group.childGroups} depth={depth + 1} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
