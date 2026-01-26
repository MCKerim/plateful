import { Camera } from "@capacitor/camera";
import { useImageSourcePicker } from "./useImageSourcePicker";

interface UseNativeCameraResult {
  takePhoto: () => Promise<{ file: File; dataUrl: string } | null>;
  ensurePermissions: () => Promise<boolean>;
  ImageSourceDrawerComponent: React.ReactNode;
}

export const useNativeCamera = (): UseNativeCameraResult => {
  const { pickImage, ImageSourceDrawerComponent } = useImageSourcePicker({
    resultType: "dataUrl",
  });

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

  return {
    takePhoto: pickImage,
    ensurePermissions,
    ImageSourceDrawerComponent,
  };
};
