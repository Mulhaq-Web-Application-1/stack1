import Link from "next/link";
import Image from "next/image";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText, FolderTree } from "lucide-react";
import { toDisplayUrl } from "@/lib/image-url";

export default async function PagesListPage() {
  const user = await getOrCreateUser();

  const pages = await prisma.page.findMany({
    where: {
      group: { members: { some: { userId: user.id } } },
    },
    include: {
      group: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pages</h1>
        <p className="text-muted-foreground">
          All pages from groups you belong to.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Page list
          </h2>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <p className="text-muted-foreground py-4">
              No pages yet. Create a group and add pages from its detail view.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/dashboard/groups/${page.group.id}/pages/${page.id}/edit`}
                  className="rounded-lg border bg-card hover:bg-accent transition-colors overflow-hidden flex flex-col"
                >
                  <div className="relative h-36 w-full bg-muted">
                    {page.coverPhotoUrl ? (
                      <Image
                        src={toDisplayUrl(page.coverPhotoUrl) ?? page.coverPhotoUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <FileText className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 min-w-0">
                    <p className="font-medium truncate">{page.title}</p>
                    {page.description ? (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {page.description}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <FolderTree className="h-3 w-3" />
                      {page.group.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
