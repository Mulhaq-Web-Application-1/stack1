import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GroupDetailContent } from "../_components/group-detail-content";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateUser();

  const group = await prisma.group.findFirst({
    where: {
      id,
      members: { some: { userId: user.id } },
    },
    include: {
      parentGroup: true,
      childGroups: { include: { _count: { select: { pages: true } } } },
      members: { include: { user: true } },
      pages: true,
    },
  });

  if (!group) notFound();

  const membership = group.members.find((m) => m.userId === user.id);
  const isAdmin = membership?.role === "admin";

  return (
    <GroupDetailContent
      group={group}
      isAdmin={!!isAdmin}
    />
  );
}
