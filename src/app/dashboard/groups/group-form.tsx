"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { createGroup, updateGroup, setGroupLogoUrl } from "@/lib/actions/groups";
import { cn } from "@/lib/utils";

type GroupFormProps = {
  group?: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    parentGroupId: string | null;
  };
  parentGroups: Array<{ id: string; name: string }>;
};

export function GroupForm({ group, parentGroups }: GroupFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const isEdit = !!group;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      formData.set("logoUrl", group?.logoUrl ?? "");
      const result = isEdit
        ? await updateGroup(group.id, formData)
        : await createGroup(formData);
      if (result.ok) {
        toast({ title: isEdit ? "Group updated" : "Group created" });
        if (!isEdit) router.push(`/dashboard/groups/${result.id}`);
        else router.refresh();
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
        <h2 className="text-lg font-medium">{isEdit ? "Edit group" : "Create group"}</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {group && (
          <ImageUpload
            prefix="group"
            identifier={group.id}
            currentImageUrl={group.logoUrl}
            onUploadComplete={async (url) => {
              const r = await setGroupLogoUrl(group.id, url);
              if (r.ok) toast({ title: "Logo updated" });
              return r;
            }}
            variant="logo"
          />
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={group?.name ?? ""}
              placeholder="Group name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={group?.description ?? ""}
              placeholder="Optional description"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="parentGroupId">Parent group</Label>
            <select
              id="parentGroupId"
              name="parentGroupId"
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              defaultValue={group?.parentGroupId ?? ""}
            >
              <option value="">None</option>
              {parentGroups
                .filter((p) => p.id !== group?.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
          <input type="hidden" name="logoUrl" value={group?.logoUrl ?? ""} />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create group"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
