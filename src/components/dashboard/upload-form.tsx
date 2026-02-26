"use client";

import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/actions/files";
import { validateFile } from "@/lib/r2";

const MAX_SIZE_MB = 10;

export function UploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File | null;
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
    setProgress(10);
    try {
      const result = await uploadFile(formData);
      setProgress(100);
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
    <Card>
      <CardHeader>
        <CardTitle>Upload file</CardTitle>
        <CardDescription>
          Max size {MAX_SIZE_MB}MB. Images, PDF, text, JSON allowed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              ref={inputRef}
              name="file"
              type="file"
              disabled={isUploading}
              className="flex-1"
              accept="image/*,.pdf,.txt,.json"
            />
            <Button type="submit" disabled={isUploading} className="sm:w-auto">
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
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
