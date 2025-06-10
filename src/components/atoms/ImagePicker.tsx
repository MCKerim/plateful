import React, { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

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

  const handleTakePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (photo?.dataUrl) {
        // Convert dataUrl to File
        const res = await fetch(photo.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], "photo.jpg", { type: blob.type });
        setPreview(photo.dataUrl);
        onImageSelected(file, photo.dataUrl);
      }
    } catch (err) {
      alert("Could not access camera");
    }
  };

  return (
    <Card className="flex flex-col items-center gap-4 p-4">
      <div className="flex gap-2">
        <Button type="button" onClick={handleButtonClick} variant="outline">
          Choose Image
        </Button>

        <Button type="button" onClick={handleTakePhoto} variant="secondary">
          Take Photo
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="mt-4 rounded-lg object-cover w-32 h-32 border"
        />
      )}
    </Card>
  );
};
