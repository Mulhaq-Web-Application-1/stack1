import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { GroupForm } from "../../group-form";
import { ChevronLeft } from "lucide-react";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateUser();

  const [group, parentGroups] = await Promise.all([
    prisma.group.findFirst({
      where: {
        id,
        members: { some: { userId: user.id, role: "admin" } },
      },
    }),
    prisma.group.findMany({
      where: { id: { not: id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!group) notFound();

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href={`/dashboard/groups/${id}`} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to group
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold">Edit group</h1>
      <GroupForm
        group={{
          id: group.id,
          name: group.name,
          description: group.description,
          logoUrl: group.logoUrl,
          parentGroupId: group.parentGroupId,
        }}
        parentGroups={parentGroups}
      />
    </div>
  );
}
