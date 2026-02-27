"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { updateProfile, setProfilePictureUrl } from "@/lib/actions/users";
import type { DbUser } from "@/lib/auth";

export function ProfileForm({ user }: { user: DbUser }) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const result = await updateProfile(formData);
      if (result.ok) {
        toast({ title: "Profile updated" });
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
        <h2 className="text-lg font-medium">Details</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        <ImageUpload
          prefix="profile"
          identifier={user.id}
          currentImageUrl={null}
          onUploadComplete={async (url) => {
            const r = await setProfilePictureUrl(url);
            if (r.ok) toast({ title: "Photo updated" });
            return r;
          }}
          variant="avatar"
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email ?? ""}
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
