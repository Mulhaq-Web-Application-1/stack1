import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GroupForm } from "../group-form";

export default async function NewGroupPage() {
  await getOrCreateUser();
  const parentGroups = await prisma.group.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New group</h1>
      <GroupForm parentGroups={parentGroups} />
    </div>
  );
}
