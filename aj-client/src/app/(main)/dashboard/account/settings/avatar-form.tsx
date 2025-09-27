"use client";

import { useState } from "react";
import Image from "next/image";
import { User } from "@/types/user";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

type AvatarFormProps = {
  user: User;
  onSuccess: () => void;
};

export function AvatarForm({ user, onSuccess }: AvatarFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // DEĞİŞİKLİK BURADA: Aradaki fazladan '/' kaldırıldı.
  const [preview, setPreview] = useState<string | null>(user.avatarUrl ? `${API_BASE}${user.avatarUrl}` : null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.warning("Lütfen önce bir dosya seçin.");
      return;
    }
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await apiFetchAuth('/api/account/avatar', {
        method: "POST",
        body: formData,
      });
      toast.success("Profil fotoğrafı başarıyla güncellendi.");
      onSuccess();
    } catch (error: any) {
      toast.error("Fotoğraf yüklenemedi.", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Fotoğrafı</CardTitle>
        <CardDescription>Yeni bir profil fotoğrafı yükleyin.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center space-x-4">
            <Image
              src={preview || "/avatars/default.png"}
              alt="Avatar Preview"
              width={80}
              height={80}
              className="rounded-full bg-muted"
            />
            <Input id="picture" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
          </div>
          <Button type="submit" disabled={isLoading || !selectedFile}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fotoğrafı Yükle
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}