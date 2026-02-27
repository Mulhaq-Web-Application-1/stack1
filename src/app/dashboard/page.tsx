import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FileList } from "@/components/dashboard/file-list";
import { UploadForm } from "@/components/dashboard/upload-form";

export default async function DashboardPage() {
  let user;
  try {
    user = await getOrCreateUser();
  } catch (err) {
    // Only redirect when actually unauthenticated; let DB/Clerk errors surface
    if (err instanceof Error && err.message === "Unauthorized") {
      redirect("/sign-in");
    }
    throw err;
  }

  const files = await prisma.file.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

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
