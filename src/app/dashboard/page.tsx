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
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Files</h1>
        <p className="text-sm text-muted-foreground">
          Upload and manage your files. Stored securely in Cloudflare R2.
        </p>
      </header>

      <section aria-labelledby="upload-heading">
        <h2 id="upload-heading" className="sr-only">
          Upload file
        </h2>
        <UploadForm />
      </section>

      <section aria-labelledby="files-heading" className="space-y-4">
        <h2 id="files-heading" className="sr-only">
          Your files
        </h2>
        <FileList files={files} />
      </section>
    </div>
  );
}
