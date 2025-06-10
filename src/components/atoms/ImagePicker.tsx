import React, { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import DeleteIcon from "@mui/icons-material/Delete";

interface ImagePickerProps {
  onImageSelected: (file: File, previewUrl: string) => void;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        onImageSelected(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteImage = () => {
    setPreview(null);
    // Optionally, notify parent that image is removed
    onImageSelected(undefined as any, "");
  };

  return (
    <Card className="flex flex-col items-center gap-2 p-2">
      {preview && (
        <div className="relative mb-2">
          <img
            src={preview}
            alt="Preview"
            className="rounded-md object-cover w-full max-h-48"
          />

          <Button
            type="button"
            onClick={handleDeleteImage}
            variant="destructive"
            size="icon"
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full p-0 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
            aria-label="Delete image"
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </div>
      )}

      {!preview && (
        <Button
          type="button"
          onClick={handleButtonClick}
          variant="outline"
          className="w-full"
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
    </Card>
  );
};
