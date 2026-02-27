import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageForm } from "../../../../_components/page-form";
import { DeletePageButton } from "./delete-page-button";
import { ChevronLeft } from "lucide-react";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string; pageId: string }>;
}) {
  const { id: groupId, pageId } = await params;
  const user = await getOrCreateUser();

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      members: { some: { userId: user.id, role: "admin" } },
    },
    include: { parentGroup: true, childGroups: true },
  });

  if (!group) notFound();

  const page = await prisma.page.findFirst({
    where: { id: pageId, groupId },
  });

  if (!page) notFound();

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href={`/dashboard/groups/${groupId}`} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to group
        </Link>
      </Button>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit page</h1>
        <DeletePageButton pageId={pageId} groupId={groupId} />
      </div>
      <PageForm
        groupId={groupId}
        page={{
          id: page.id,
          title: page.title,
          description: page.description,
          coverPhotoUrl: page.coverPhotoUrl,
          parentGroupLogoUrl: page.parentGroupLogoUrl,
          childGroupLogoUrl: page.childGroupLogoUrl,
        }}
        defaultParentGroupLogoUrl={group.parentGroup?.logoUrl ?? null}
        defaultChildGroupLogoUrl={group.childGroups[0]?.logoUrl ?? null}
      />
    </div>
  );
}
