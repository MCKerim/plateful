import React, { useRef } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import DeleteIcon from "@mui/icons-material/Delete";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleButtonClick = () => {
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
          Choose Image
        </Button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {uploading && <div className="text-xs text-muted-foreground">Uploading...</div>}
    </Card>
  );
};
