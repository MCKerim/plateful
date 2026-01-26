import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import { useNativeCamera } from "../../hooks/general/useNativeCamera";
import { AlertCircle } from "lucide-react";

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
  const { takePhoto, ImageSourceDrawerComponent } = useNativeCamera();
  const [error, setError] = useState<string | null>(null);

  const handleButtonClick = async () => {
    setError(null);

    try {
      const result = await takePhoto();
      if (result) {
        onImageSelected(result.file, result.dataUrl);
      }
    } catch (err) {
      console.error("Error taking photo:", err);
      setError(t("common.errorTakingPhoto"));
    }
  };

  const handleDeleteImage = () => {
    setError(null);
    if (onDeleteImage) onDeleteImage();
    onImageSelected(undefined, "");
  };

  return (
    <Card className="flex flex-col items-center gap-2 p-2">
      {previewUrl ? (
        <div className="relative mb-2">
          <img
            src={previewUrl}
            alt={t("common.imagePreview")}
            className="object-cover w-full rounded-md max-h-48"
          />

          {onDeleteImage && (
            <Button
              type="button"
              onClick={handleDeleteImage}
              variant="destructive"
              size="icon"
              className="absolute flex items-center justify-center p-0 transition-transform rounded-full shadow-md -top-1 -right-1 w-7 h-7 hover:scale-110"
              aria-label={t("common.deleteImage")}
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

      {ImageSourceDrawerComponent}

      {uploading && <div className="text-xs text-muted-foreground">{t("common.uploading")}</div>}

      {error && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </Card>
  );
};
