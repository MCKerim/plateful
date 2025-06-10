import React, { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface ImagePickerProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  label?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageSelected,
  label,
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
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera not supported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      stream.getTracks().forEach((track) => track.stop());
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "photo.jpg", { type: blob.type });
          const previewUrl = URL.createObjectURL(blob);
          setPreview(previewUrl);
          onImageSelected(file, previewUrl);
        }
      }, "image/jpeg");
    } catch (err) {
      alert("Could not access camera");
    }
  };

  return (
    <Card className="flex flex-col items-center gap-4 p-4">
      {label && <span className="font-medium mb-2">{label}</span>}
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
