import React, { useRef } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

interface ImagePickerProps {
  onImageSelected: (file: File | undefined, previewUrl: string) => void;
  onDeleteImage?: () => void;
  previewUrl?: string;
  uploading?: boolean;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageSelected,
  onDeleteImage,
  previewUrl,
  uploading,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNative = Capacitor.isNativePlatform();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelected(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert a data URL to a File
  const dataURLtoFile = (dataUrl: string, filename: string) => {
    const [header, data] = dataUrl.split(",");
    const match = /data:(.*?);base64/.exec(header || "");
    const mime = match?.[1] || "image/jpeg";
    const binary = atob(data || "");
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  };

  // Ensure runtime permissions on native apps so Camera option appears in the prompt
  const ensureNativeCameraPermissions = async () => {
    try {
      const perms = await Camera.checkPermissions();
      const hasCamera = (perms as any).camera === "granted";
      const photos = (perms as any).photos;
      const hasPhotos = photos === "granted" || photos === "limited"; // iOS can be "limited"
      if (hasCamera && hasPhotos) return true;
      const req = await Camera.requestPermissions({ permissions: ["camera", "photos"] });
      const cameraOk = (req as any).camera === "granted";
      const photosOk = (req as any).photos === "granted" || (req as any).photos === "limited";
      return cameraOk && photosOk;
    } catch {
      return false;
    }
  };

  const handleButtonClick = async () => {
    if (isNative) {
      const permsOk = await ensureNativeCameraPermissions();
      try {
        const photo = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          // Show prompt to choose between Camera or Photos
          source: CameraSource.Prompt,
          resultType: CameraResultType.DataUrl,
          promptLabelHeader: t("common.selectImage"),
          promptLabelPhoto: t("common.gallery") || "Gallery",
          promptLabelPicture: t("common.camera") || "Camera",
        });

        if (photo?.dataUrl) {
          const ext = photo.format || "jpeg";
          const file = dataURLtoFile(photo.dataUrl, `image.${ext}`);
          onImageSelected(file, photo.dataUrl);
          return;
        }
      } catch (err) {
        // Fall back to file input if user cancels or camera flow fails
        console.debug("Camera getPhoto failed, falling back to file input:", err);
      }
      if (!permsOk) {
        // If permissions not granted, try gallery-only as a fallback
        try {
          const photo = await Camera.getPhoto({
            quality: 80,
            allowEditing: false,
            source: CameraSource.Photos,
            resultType: CameraResultType.DataUrl,
          });
          if (photo?.dataUrl) {
            const ext = photo.format || "jpeg";
            const file = dataURLtoFile(photo.dataUrl, `image.${ext}`);
            onImageSelected(file, photo.dataUrl);
            return;
          }
        } catch (err) {
          console.debug("Photos fallback failed, falling back to file input:", err);
        }
      }
      // Final fallback to web file picker
      fileInputRef.current?.click();
      return;
    }

    fileInputRef.current?.click();
  };

  const handleDeleteImage = () => {
    if (onDeleteImage) onDeleteImage();
    onImageSelected(undefined, "");
  };

  return (
    <Card className="flex flex-col items-center gap-2 p-2">
      {previewUrl ? (
        <div className="relative mb-2">
          <img
            src={previewUrl}
            alt="Preview"
            className="object-cover w-full rounded-md max-h-48"
          />
          {onDeleteImage && (
            <Button
              type="button"
              onClick={handleDeleteImage}
              variant="destructive"
              size="icon"
              className="absolute flex items-center justify-center p-0 transition-transform rounded-full shadow-md -top-1 -right-1 w-7 h-7 hover:scale-110"
              aria-label="Delete image"
              disabled={uploading}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          )}
        </div>
      ) : (
        <Button
          type="button"
          onClick={handleButtonClick}
          variant="outline"
          className="w-full"
          disabled={uploading}
        >
          {t("common.selectImage")}
        </Button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        // On mobile web, hint to use the back camera; ignored on desktop and native path uses Capacitor
        capture={!isNative ? "environment" : undefined}
        className="hidden"
        onChange={handleFileChange}
      />
      {uploading && (
        <div className="text-xs text-muted-foreground">
          {t("common.uploading")}
        </div>
      )}
    </Card>
  );
};
