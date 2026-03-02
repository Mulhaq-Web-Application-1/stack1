import Link from "next/link";
import Image from "next/image";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, FolderTree, ChevronRight } from "lucide-react";
import { toDisplayUrl } from "@/lib/image-url";

const GROUPS_PAGE_SIZE = 100;

export default async function GroupsPage() {
  const user = await getOrCreateUser();

  // Single batched query: eager-load tree shape with counts only (no N+1, no full member lists)
  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    take: GROUPS_PAGE_SIZE,
    orderBy: { groupId: "asc" },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          parentGroupId: true,
          parentGroup: { select: { id: true, name: true } },
          childGroups: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              _count: { select: { pages: true, members: true } },
            },
          },
          _count: { select: { pages: true, members: true } },
        },
      },
    },
  });

  const allGroups = memberships.map((m) => m.group);

  function GroupCard({
    g,
    showSubgroups,
  }: {
    g: (typeof allGroups)[number];
    showSubgroups?: boolean;
  }) {
    return (
      <Card className="h-full overflow-hidden transition-colors hover:bg-muted/50">
        <CardContent className="p-4">
          <Link href={`/dashboard/groups/${g.id}`} className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-muted relative">
              {g.logoUrl ? (
                <Image
                  src={toDisplayUrl(g.logoUrl) ?? g.logoUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <FolderTree className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate text-foreground">{g.name}</p>
              {g.parentGroup && (
                <p className="text-xs text-muted-foreground">
                  Parent: {g.parentGroup.name}
                </p>
              )}
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{(g._count?.members ?? 0)} members</span>
                <span>·</span>
                <span>{(g._count?.pages ?? 0)} pages</span>
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
          {showSubgroups && g.childGroups && g.childGroups.length > 0 ? (
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Subgroups
              </p>
              <div className="flex flex-wrap gap-1.5">
                {g.childGroups.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/dashboard/groups/${ch.id}`}
                    className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/80"
                  >
                    {ch.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Groups</h1>
          <p className="text-muted-foreground">
            Your groups and hierarchy.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/groups/new">
            <Plus className="h-4 w-4 mr-2" />
            New group
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Your groups
          </h2>
        </CardHeader>
        <CardContent>
          {allGroups.length === 0 ? (
            <p className="text-muted-foreground py-4">
              You are not in any groups yet. Create one or get invited.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allGroups.map((g) => (
                <GroupCard
                  key={g.id}
                  g={g}
                  showSubgroups={!g.parentGroupId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
