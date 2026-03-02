import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toDisplayUrl } from "@/lib/image-url";
import { FolderTree } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { title: true, description: true },
  });
  if (!page) return {};
  return { title: page.title, description: page.description ?? undefined };
}

export default async function PublicPageDetails({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      group: {
        select: {
          name: true,
          logoUrl: true,
          parentGroup: { select: { name: true, logoUrl: true } },
        },
      },
    },
  });

  if (!page) notFound();

  const coverUrl = toDisplayUrl(page.coverPhotoUrl);
  const parentLogoUrl = toDisplayUrl(page.parentGroupLogoUrl);
  const childLogoUrl = toDisplayUrl(page.childGroupLogoUrl);
  const groupLogoUrl = toDisplayUrl(page.group.logoUrl);

  const hasLogos = parentLogoUrl || groupLogoUrl || childLogoUrl;

  return (
    <div className="min-h-screen bg-muted/40 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border bg-background shadow-lg overflow-hidden">
        {/* Cover photo */}
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            width={0}
            height={0}
            sizes="(min-width: 640px) 672px, 100vw"
            style={{ width: "100%", height: "auto" }}
            priority
          />
        ) : (
          <div className="h-4 w-full bg-border" />
        )}

        <div className="p-6 space-y-4">
          {/* Logo row + title */}
          <div className="flex items-center gap-4">
            {hasLogos && (
              <div className="flex items-center gap-2 shrink-0">
                {parentLogoUrl && (
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden border bg-muted">
                    <Image src={parentLogoUrl} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                )}
                {groupLogoUrl && (
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden border bg-muted">
                    <Image src={groupLogoUrl} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                )}
                {childLogoUrl && (
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden border bg-muted">
                    <Image src={childLogoUrl} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                )}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight truncate">{page.title}</h1>
              {page.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {page.description}
                </p>
              )}
            </div>
          </div>

          {/* Group attribution */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-4">
            <FolderTree className="h-3.5 w-3.5 shrink-0" />
            {page.group.parentGroup
              ? `${page.group.parentGroup.name} · ${page.group.name}`
              : page.group.name}
          </div>
        </div>
      </div>
    </div>
  );
}
