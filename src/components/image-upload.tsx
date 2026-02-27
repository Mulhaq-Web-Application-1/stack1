"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toDisplayUrl } from "@/lib/image-url";

type ImageUploadProps = {
  prefix: "profile" | "group" | "page";
  identifier: string;
  currentImageUrl?: string | null;
  onUploadComplete: (url: string) => Promise<{ ok: boolean; error?: string }>;
  variant?: "avatar" | "logo" | "cover";
  className?: string;
};

export function ImageUpload({
  prefix,
  identifier,
  currentImageUrl,
  onUploadComplete,
  variant = "logo",
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("prefix", prefix);
      formData.set("identifier", identifier);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Upload failed");
        return;
      }
      const url = data?.url;
      if (typeof url !== "string" || !url) {
        setError("Invalid response from server");
        return;
      }
      const result = await onUploadComplete(url);
      if (!result.ok) setError(result.error ?? "Save failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const isAvatar = variant === "avatar";
  const isCover = variant === "cover";
  const displayUrl = toDisplayUrl(currentImageUrl);

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
      {isAvatar && (
        <div className="flex items-center gap-4">
          <Avatar className="h-24 w-24">
            {uploading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : (
              <>
                <AvatarImage src={displayUrl ?? undefined} alt="Profile" />
                <AvatarFallback>
                  {displayUrl ? "" : "?"}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading…" : "Change photo"}
          </Button>
        </div>
      )}
      {variant === "logo" && (
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center relative">
            {uploading ? (
              <Skeleton className="h-full w-full" />
            ) : displayUrl ? (
              <Image
                src={displayUrl}
                alt="Logo"
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <span className="text-muted-foreground text-xs">No logo</span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading…" : "Upload logo"}
          </Button>
        </div>
      )}
      {isCover && (
        <div className="space-y-2">
          <div className="aspect-video max-w-md rounded-lg border border-border bg-muted overflow-hidden relative">
            {uploading ? (
              <Skeleton className="h-full w-full" />
            ) : displayUrl ? (
              <Image
                src={displayUrl}
                alt="Cover"
                fill
                className="object-cover"
                sizes="(max-width: 448px) 100vw, 448px"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No cover
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading…" : "Upload cover"}
          </Button>
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
