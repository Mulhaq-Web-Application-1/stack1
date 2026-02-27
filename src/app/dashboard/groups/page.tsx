import Link from "next/link";
import Image from "next/image";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, FolderTree } from "lucide-react";
import { GroupTree } from "./group-tree";
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
  const rootGroups = allGroups.filter((g) => !g.parentGroupId);
  const childOnlyGroups = allGroups.filter((g) => g.parentGroupId);

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
            Group tree
          </h2>
        </CardHeader>
        <CardContent>
          {allGroups.length === 0 ? (
            <p className="text-muted-foreground py-4">
              You are not in any groups yet. Create one or get invited.
            </p>
          ) : rootGroups.length > 0 ? (
            <GroupTree groups={rootGroups} />
          ) : (
            <ul className="space-y-2">
              {childOnlyGroups.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/dashboard/groups/${g.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent"
                  >
                    <div className="h-10 w-10 rounded-lg border bg-muted shrink-0 overflow-hidden relative">
                      {g.logoUrl ? (
                        <Image
                          src={toDisplayUrl(g.logoUrl) ?? g.logoUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : null}
                    </div>
                    <span className="font-medium">{g.name}</span>
                    {g.parentGroup && (
                      <span className="text-xs text-muted-foreground">
                        Parent: {g.parentGroup.name}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
