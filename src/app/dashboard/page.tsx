import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FileList } from "@/components/dashboard/file-list";
import { UploadForm } from "@/components/dashboard/upload-form";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { files: { orderBy: { createdAt: "desc" } } },
  });

  const files = user?.files ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Files</h1>
        <p className="text-muted-foreground">
          Upload and manage your files. Stored in Cloudflare R2.
        </p>
      </div>

      <UploadForm />

      <FileList files={files} />
    </div>
  );
}
