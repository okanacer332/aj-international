// aj-client/src/app/[lng]/(main)/dashboard/account/settings/avatar-form.tsx
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
import { useTranslation } from "@/lib/i18n-client"; 
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton'ı ekleyelim

type AvatarFormProps = {
  user: User;
  onSuccess: () => void;
  lng: string; 
};

export function AvatarForm({ user, onSuccess, lng }: AvatarFormProps) {
  // KRİTİK DÜZELTME: Hook'lar KOŞULSUZ olarak en üstte çağrılmalı
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Hook'lar
  const { t, ready } = useTranslation(lng, 'common'); 
  
  // useState Hook'u
  const [preview, setPreview] = useState<string | null>(user.avatarUrl ? `${API_BASE}${user.avatarUrl}` : null);
  
  // KRİTİK DÜZELTME: Tüm Hook'lar çağrıldı, artık erken çıkış yapabiliriz.

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
      toast.warning(t("toast.selectFileWarning"));
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
      toast.success(t("toast.avatarUpdateSuccess"));
      onSuccess();
    } catch (error: any) {
      toast.error(t("toast.avatarUpdateError"), { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // KRİTİK DÜZELTME: Çeviriler hazır değilse (ready=false) erken çıkış yap.
  if (!ready) {
       return (
          <Card>
              <CardHeader><div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded-md" /></CardHeader>
              <CardContent><div className="h-20 w-full bg-gray-200 animate-pulse rounded-md" /></CardContent>
          </Card>
      );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('account.settings.tab.avatar')}</CardTitle>
        <CardDescription>{t('account.avatar.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center space-x-4">
            <Image
              src={preview || "/avatars/default.png"}
              alt={t('account.avatar.imageAlt')}
              width={80}
              height={80}
              className="rounded-full bg-muted"
            />
            <Input id="picture" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
          </div>
          <Button type="submit" disabled={isLoading || !selectedFile}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('account.form.uploadPhoto')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}