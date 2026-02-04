import { useState, useRef, useCallback } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import ImageSourceDrawer from "@/components/general/ImageSourceDrawer";

const CAMERA_QUALITY = 80;

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
  pickMultipleImages: () => Promise<ImageResult<T>[] | null>;
  selectFromCamera: () => Promise<ImageResult<T> | null>;
  selectFromGallery: () => Promise<ImageResult<T> | null>;
  selectMultipleFromGallery: () => Promise<ImageResult<T>[] | null>;
  isNative: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  multipleFileInputRef: React.RefObject<HTMLInputElement>;
  handleMultipleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  ImageSourceDrawerComponent: React.ReactNode;
}

export function useImageSourcePicker<T extends "dataUrl" | "base64" = "dataUrl">(
  options?: UseImageSourcePickerOptions<T>
): UseImageSourcePickerResult<T> {
  const resultType = options?.resultType ?? ("dataUrl" as T);
  const [isOpen, setIsOpen] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

  const resolveRef = useRef<((result: ImageResult<T> | null) => void) | null>(null);
  const resolveMultipleRef = useRef<((result: ImageResult<T>[] | null) => void) | null>(null);

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
        quality: CAMERA_QUALITY,
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

  const handleMultipleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      resolveMultipleRef.current?.(null);
      return;
    }

    // Convert to array immediately since e.target.files is a live FileList
    // that gets cleared when we reset the input value
    const fileArray = Array.from(files);
    const totalFiles = fileArray.length;

    // Reset input value now so the same files can be selected again
    e.target.value = "";

    const results: ImageResult<T>[] = [];
    let processed = 0;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;

        if (resultType === "base64") {
          const base64String = dataUrl.split(",")[1];
          results.push({ base64String } as ImageResult<T>);
        } else {
          results.push({ file, dataUrl } as ImageResult<T>);
        }

        processed++;
        if (processed === totalFiles) {
          resolveMultipleRef.current?.(results);
        }
      };
      reader.onerror = () => {
        processed++;
        if (processed === totalFiles) {
          resolveMultipleRef.current?.(results.length > 0 ? results : null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCameraSelect = useCallback(async () => {
    setIsOpen(false);
    const multiSelect = isMultiSelectMode;
    setIsMultiSelectMode(false);
    const result = await takePhotoWithSource(CameraSource.Camera);
    if (multiSelect) {
      // In multi-select mode, wrap single camera result in array
      resolveMultipleRef.current?.(result ? [result] : null);
    } else {
      resolveRef.current?.(result);
    }
  }, [resultType, isMultiSelectMode]);

  const handleGallerySelect = useCallback(async () => {
    setIsOpen(false);
    const multiSelect = isMultiSelectMode;
    setIsMultiSelectMode(false);

    if (multiSelect) {
      // Multi-select mode: use pickImages on native, multiple file input on web
      if (isNative) {
        try {
          await ensurePermissions();
          const result = await Camera.pickImages({
            quality: CAMERA_QUALITY,
            limit: 0,
          });

          if (!result.photos || result.photos.length === 0) {
            resolveMultipleRef.current?.(null);
            return;
          }

          const results: ImageResult<T>[] = [];
          for (const photo of result.photos) {
            if (resultType === "base64") {
              if (photo.webPath) {
                const response = await fetch(photo.webPath);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    resolve(dataUrl.split(",")[1]);
                  };
                  reader.readAsDataURL(blob);
                });
                results.push({ base64String: base64 } as ImageResult<T>);
              }
            } else {
              if (photo.webPath) {
                const response = await fetch(photo.webPath);
                const blob = await response.blob();
                const ext = photo.format || "jpeg";
                const file = new File([blob], `image.${ext}`, { type: `image/${ext}` });
                const dataUrl = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
                results.push({ file, dataUrl } as ImageResult<T>);
              }
            }
          }
          resolveMultipleRef.current?.(results.length > 0 ? results : null);
        } catch (error) {
          console.debug("Camera pickImages failed:", error);
          resolveMultipleRef.current?.(null);
        }
      } else {
        // Web: use multiple file input
        multipleFileInputRef.current?.click();
      }
    } else {
      // Single-select mode (original behavior)
      if (isNative) {
        const result = await takePhotoWithSource(CameraSource.Photos);
        resolveRef.current?.(result);
      } else {
        fileInputRef.current?.click();
      }
    }
  }, [isNative, resultType, isMultiSelectMode]);

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

  const selectMultipleFromGallery = useCallback(async (): Promise<ImageResult<T>[] | null> => {
    if (isNative) {
      try {
        await ensurePermissions();

        const result = await Camera.pickImages({
          quality: CAMERA_QUALITY,
          limit: 0, // no limit
        });

        if (!result.photos || result.photos.length === 0) {
          return null;
        }

        const results: ImageResult<T>[] = [];

        for (const photo of result.photos) {
          if (resultType === "base64") {
            // pickImages returns webPath, need to fetch and convert to base64
            if (photo.webPath) {
              const response = await fetch(photo.webPath);
              const blob = await response.blob();
              const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const dataUrl = reader.result as string;
                  resolve(dataUrl.split(",")[1]);
                };
                reader.readAsDataURL(blob);
              });
              results.push({ base64String: base64 } as ImageResult<T>);
            }
          } else {
            if (photo.webPath) {
              const response = await fetch(photo.webPath);
              const blob = await response.blob();
              const ext = photo.format || "jpeg";
              const file = new File([blob], `image.${ext}`, { type: `image/${ext}` });
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              results.push({ file, dataUrl } as ImageResult<T>);
            }
          }
        }

        return results.length > 0 ? results : null;
      } catch (error) {
        console.debug("Camera pickImages failed:", error);
        return null;
      }
    } else {
      // On web, use file input with multiple attribute
      return new Promise((resolve) => {
        resolveMultipleRef.current = resolve;
        multipleFileInputRef.current?.click();
      });
    }
  }, [isNative, resultType]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        // User closed drawer without selecting
        if (isMultiSelectMode) {
          resolveMultipleRef.current?.(null);
        } else {
          resolveRef.current?.(null);
        }
        setIsMultiSelectMode(false);
      }
    },
    [isMultiSelectMode]
  );

  const pickImage = useCallback((): Promise<ImageResult<T> | null> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setIsMultiSelectMode(false);
      setIsOpen(true);
    });
  }, []);

  // For multi-select: camera returns single image in array, gallery returns multiple
  const pickMultipleImages = useCallback((): Promise<ImageResult<T>[] | null> => {
    return new Promise((resolve) => {
      resolveMultipleRef.current = resolve;
      setIsMultiSelectMode(true);
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
      <input
        ref={multipleFileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleMultipleFileInputChange}
      />
    </>
  );

  return {
    pickImage,
    pickMultipleImages,
    selectFromCamera,
    selectFromGallery,
    selectMultipleFromGallery,
    isNative,
    fileInputRef,
    handleFileInputChange,
    multipleFileInputRef,
    handleMultipleFileInputChange,
    ImageSourceDrawerComponent,
  };
}
