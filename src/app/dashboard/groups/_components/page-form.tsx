"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { createPage, updatePage, setPageCoverUrl } from "@/lib/actions/pages";

type PageFormProps = {
  groupId: string;
  page: {
    id: string;
    title: string;
    description: string | null;
    coverPhotoUrl: string | null;
    parentGroupLogoUrl: string | null;
    childGroupLogoUrl: string | null;
  } | null;
  defaultParentGroupLogoUrl: string | null;
  defaultChildGroupLogoUrl: string | null;
};

export function PageForm({
  groupId,
  page,
  defaultParentGroupLogoUrl,
  defaultChildGroupLogoUrl,
}: PageFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const isEdit = !!page;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      formData.set(
        "parentGroupLogoUrl",
        formData.get("parentGroupLogoUrl") as string ?? defaultParentGroupLogoUrl ?? ""
      );
      formData.set(
        "childGroupLogoUrl",
        formData.get("childGroupLogoUrl") as string ?? defaultChildGroupLogoUrl ?? ""
      );
      if (isEdit) {
        formData.set("coverPhotoUrl", page.coverPhotoUrl ?? "");
      }
      const result = isEdit
        ? await updatePage(page.id, formData)
        : await createPage(groupId, formData);
      if (result.ok) {
        toast({ title: isEdit ? "Page updated" : "Page created" });
        if (!isEdit) {
          router.push(`/dashboard/groups/${groupId}`);
        } else {
          router.refresh();
        }
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium">{isEdit ? "Edit page" : "Create page"}</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {page && (
          <ImageUpload
            prefix="page"
            identifier={page.id}
            currentImageUrl={page.coverPhotoUrl}
            onUploadComplete={async (url) => {
              const r = await setPageCoverUrl(page.id, url);
              if (r.ok) toast({ title: "Cover updated" });
              return r;
            }}
            variant="cover"
          />
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="hidden"
            name="parentGroupLogoUrl"
            value={defaultParentGroupLogoUrl ?? ""}
          />
          <input
            type="hidden"
            name="childGroupLogoUrl"
            value={defaultChildGroupLogoUrl ?? ""}
          />
          {isEdit && (
            <input type="hidden" name="coverPhotoUrl" value={page.coverPhotoUrl ?? ""} />
          )}
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={page?.title ?? ""}
              placeholder="Page title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={page?.description ?? ""}
              placeholder="Optional description"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create page"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
