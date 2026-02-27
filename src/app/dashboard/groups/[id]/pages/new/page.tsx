import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageForm } from "../../../_components/page-form";
import { ChevronLeft } from "lucide-react";

export default async function NewPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const user = await getOrCreateUser();

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      members: { some: { userId: user.id, role: "admin" } },
    },
    include: { parentGroup: true, childGroups: true },
  });

  if (!group) notFound();

  const parentGroupLogoUrl = group.parentGroup?.logoUrl ?? null;
  const childGroupLogoUrl = group.childGroups[0]?.logoUrl ?? null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href={`/dashboard/groups/${groupId}`} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to group
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold">New page</h1>
      <PageForm
        groupId={groupId}
        page={null}
        defaultParentGroupLogoUrl={parentGroupLogoUrl}
        defaultChildGroupLogoUrl={childGroupLogoUrl}
      />
    </div>
  );
}
