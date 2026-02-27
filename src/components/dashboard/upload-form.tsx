"use client";

import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";
import { confirmUpload } from "@/lib/actions/files";
import { validateFile } from "@/lib/r2";

const MAX_SIZE_MB = 10;

export function UploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = inputRef.current;
    const file = input?.files?.[0] ?? null;
    if (!file || file.size === 0) {
      toast({ title: "Error", description: "Please select a file.", variant: "destructive" });
      return;
    }

    const validation = validateFile(file);
    if (!validation.ok) {
      toast({ title: "Error", description: validation.error, variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Step 1: get presigned URL
      const params = new URLSearchParams({
        filename: file.name,
        type: file.type,
        size: String(file.size),
      });
      const presignRes = await fetch(`/api/upload/presign?${params}`);
      if (!presignRes.ok) {
        const { error } = await presignRes.json();
        throw new Error(error ?? "Failed to get upload URL");
      }
      const { uploadUrl, key } = await presignRes.json() as { uploadUrl: string; key: string };

      // Step 2: PUT directly to R2 with real progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.statusText}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setProgress(100);

      // Step 3: confirm upload in DB
      const result = await confirmUpload(key, file.name, file.size, file.type);
      if (result.ok) {
        toast({ title: "Success", description: `${file.name} uploaded.` });
        e.currentTarget.reset();
        if (inputRef.current) inputRef.current.value = "";
      } else {
        toast({ title: "Upload failed", description: result.error, variant: "destructive" });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Upload failed",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }

  return (
    <Card className="border-0 bg-muted/30 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium">Upload file</CardTitle>
        <CardDescription className="text-sm">
          Max {MAX_SIZE_MB}MB. Supported: images, PDF, text, JSON.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                name="file"
                type="file"
                disabled={isUploading}
                className="h-10 cursor-pointer border-dashed file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:cursor-pointer"
                accept="image/*,.pdf,.txt,.json"
              />
            </div>
            <Button
              type="submit"
              disabled={isUploading}
              className="h-10 shrink-0 sm:w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
          {isUploading && (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary/80 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progress > 0 ? `${progress}%` : "Preparing…"}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
