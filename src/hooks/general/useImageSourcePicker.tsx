import { useState, useRef, useCallback } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import ImageSourceDrawer from "@/components/general/ImageSourceDrawer";

export interface ImageResultDataUrl {
  file: File;
  dataUrl: string;
}

export interface ImageResultBase64 {
  base64String: string;
}

type ImageResult<T extends "dataUrl" | "base64"> = T extends "dataUrl"
  ? ImageResultDataUrl
  : ImageResultBase64;

interface UseImageSourcePickerOptions<T extends "dataUrl" | "base64"> {
  resultType?: T;
}

interface UseImageSourcePickerResult<T extends "dataUrl" | "base64"> {
  pickImage: () => Promise<ImageResult<T> | null>;
  selectFromCamera: () => Promise<ImageResult<T> | null>;
  selectFromGallery: () => Promise<ImageResult<T> | null>;
  isNative: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  ImageSourceDrawerComponent: React.ReactNode;
}

export function useImageSourcePicker<T extends "dataUrl" | "base64" = "dataUrl">(
  options?: UseImageSourcePickerOptions<T>
): UseImageSourcePickerResult<T> {
  const resultType = options?.resultType ?? ("dataUrl" as T);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resolveRef = useRef<((result: ImageResult<T> | null) => void) | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const ensurePermissions = async (): Promise<boolean> => {
    try {
      const perms = await Camera.checkPermissions();
      const hasCamera = perms.camera === "granted";
      const photos = perms.photos;
      const hasPhotos = photos === "granted" || photos === "limited";

      if (hasCamera && hasPhotos) return true;

      const req = await Camera.requestPermissions({
        permissions: ["camera", "photos"],
      });
      return req.camera === "granted" && (req.photos === "granted" || req.photos === "limited");
    } catch {
      return false;
    }
  };

  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const [header, data] = dataUrl.split(",");
    const match = /data:(.*?);base64/.exec(header || "");
    const mime = match?.[1] || "image/jpeg";
    const binary = atob(data || "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
  };

  const takePhotoWithSource = async (source: CameraSource): Promise<ImageResult<T> | null> => {
    try {
      if (isNative) {
        await ensurePermissions();
      }

      const cameraResultType =
        resultType === "base64" ? CameraResultType.Base64 : CameraResultType.DataUrl;

      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        source,
        resultType: cameraResultType,
        saveToGallery: false,
      });

      if (resultType === "base64") {
        if (!photo?.base64String) return null;
        return { base64String: photo.base64String } as ImageResult<T>;
      } else {
        if (!photo?.dataUrl) return null;
        const ext = photo.format || "jpeg";
        const file = dataURLtoFile(photo.dataUrl, `image.${ext}`);
        return { file, dataUrl: photo.dataUrl } as ImageResult<T>;
      }
    } catch (error) {
      console.debug("Camera getPhoto failed:", error);
      return null;
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      resolveRef.current?.(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;

      if (resultType === "base64") {
        const base64String = dataUrl.split(",")[1];
        resolveRef.current?.({ base64String } as ImageResult<T>);
      } else {
        resolveRef.current?.({ file, dataUrl } as ImageResult<T>);
      }
    };
    reader.onerror = () => {
      resolveRef.current?.(null);
    };
    reader.readAsDataURL(file);

    // Reset input value so the same file can be selected again
    e.target.value = "";
  };

  const handleCameraSelect = useCallback(async () => {
    setIsOpen(false);
    const result = await takePhotoWithSource(CameraSource.Camera);
    resolveRef.current?.(result);
  }, [resultType]);

  const handleGallerySelect = useCallback(async () => {
    setIsOpen(false);

    if (isNative) {
      const result = await takePhotoWithSource(CameraSource.Photos);
      resolveRef.current?.(result);
    } else {
      // On web, use file input
      fileInputRef.current?.click();
    }
  }, [isNative, resultType]);

  // Direct selection methods (without drawer)
  const selectFromCamera = useCallback(async (): Promise<ImageResult<T> | null> => {
    return takePhotoWithSource(CameraSource.Camera);
  }, [resultType]);

  const selectFromGallery = useCallback(async (): Promise<ImageResult<T> | null> => {
    if (isNative) {
      return takePhotoWithSource(CameraSource.Photos);
    } else {
      // On web, use file input - caller must handle the result via handleFileInputChange
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        fileInputRef.current?.click();
      });
    }
  }, [isNative, resultType]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // User closed drawer without selecting
      resolveRef.current?.(null);
    }
  }, []);

  const pickImage = useCallback((): Promise<ImageResult<T> | null> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const ImageSourceDrawerComponent = (
    <>
      <ImageSourceDrawer
        open={isOpen}
        onOpenChange={handleOpenChange}
        onCameraSelect={handleCameraSelect}
        onGallerySelect={handleGallerySelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
    </>
  );

  return {
    pickImage,
    selectFromCamera,
    selectFromGallery,
    isNative,
    fileInputRef,
    handleFileInputChange,
    ImageSourceDrawerComponent,
  };
}
