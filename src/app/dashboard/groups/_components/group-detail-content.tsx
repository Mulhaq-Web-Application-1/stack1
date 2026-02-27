"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Plus, Users, FolderTree, FileText } from "lucide-react";
import { toDisplayUrl } from "@/lib/image-url";

type GroupWithDetails = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  parentGroup: { id: string; name: string } | null;
  childGroups: Array<{
    id: string;
    name: string;
    logoUrl: string | null;
    _count?: { pages: number };
  }>;
  members: Array<{
    userId: string;
    groupId: string;
    role: string;
    user: {
      id: string;
      email: string | null;
    };
  }>;
  pages: Array<{
    id: string;
    title: string;
    description: string | null;
    coverPhotoUrl: string | null;
  }>;
};

export function GroupDetailContent(props: {
  group: GroupWithDetails;
  isAdmin: boolean;
}) {
  const { group, isAdmin } = props;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl border bg-muted overflow-hidden shrink-0">
            {group.logoUrl ? (
              <img
                src={toDisplayUrl(group.logoUrl) ?? group.logoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <FolderTree className="h-8 w-8" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{group.name}</h1>
            {group.description ? (
              <p className="text-muted-foreground">{group.description}</p>
            ) : null}
            {group.parentGroup ? (
              <p className="text-sm text-muted-foreground mt-1">
                Parent:{" "}
                <Link
                  href={`/dashboard/groups/${group.parentGroup.id}`}
                  className="underline hover:text-foreground"
                >
                  {group.parentGroup.name}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
        {isAdmin ? (
          <Button asChild variant="outline">
            <Link href={`/dashboard/groups/${group.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({group.members.length})
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {group.members.map((m) => (
                <li
                  key={`${m.userId}_${m.groupId}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(m.user.email ?? "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {m.user.email || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Child groups
            </h2>
          </CardHeader>
          <CardContent>
            {group.childGroups.length === 0 ? (
              <p className="text-muted-foreground text-sm">No child groups.</p>
            ) : (
              <ul className="space-y-2">
                {group.childGroups.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/groups/${c.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent"
                    >
                      <div className="h-8 w-8 rounded border bg-muted overflow-hidden">
                        {c.logoUrl ? (
                          <img
                            src={toDisplayUrl(c.logoUrl) ?? c.logoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="font-medium">{c.name}</span>
                      {c._count && c._count.pages > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {c._count.pages} pages
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pages
          </h2>
          {isAdmin ? (
            <Button asChild>
              <Link href={`/dashboard/groups/${group.id}/pages/new`}>
                <Plus className="h-4 w-4 mr-2" />
                New page
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {group.pages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pages yet.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {group.pages.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/groups/${group.id}/pages/${p.id}/edit`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent"
                  >
                    <div className="h-12 w-24 rounded border bg-muted shrink-0 overflow-hidden">
                      {p.coverPhotoUrl ? (
                        <img
                          src={toDisplayUrl(p.coverPhotoUrl) ?? p.coverPhotoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.title}</p>
                      {p.description ? (
                        <p className="text-xs text-muted-foreground truncate">
                          {p.description}
                        </p>
                      ) : null}
                    </div>
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
