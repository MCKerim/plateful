import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useTranslation } from "react-i18next";

interface UseNativeCameraResult {
  takePhoto: () => Promise<{ file: File; dataUrl: string } | null>;
  ensurePermissions: () => Promise<boolean>;
}

export const useNativeCamera = (): UseNativeCameraResult => {
  const { t } = useTranslation();

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
      return (
        req.camera === "granted" &&
        (req.photos === "granted" || req.photos === "limited")
      );
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

  const takePhoto = async (): Promise<{
    file: File;
    dataUrl: string;
  } | null> => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        source: CameraSource.Prompt,
        resultType: CameraResultType.DataUrl,
        promptLabelHeader: t("common.cameraPrompt.header"),
        promptLabelCancel: t("common.cameraPrompt.cancel"),
        promptLabelPhoto: t("common.cameraPrompt.photo"),
        promptLabelPicture: t("common.cameraPrompt.picture"),
      });

      if (!photo?.dataUrl) return null;

      const ext = photo.format || "jpeg";
      const file = dataURLtoFile(photo.dataUrl, `image.${ext}`);
      return { file, dataUrl: photo.dataUrl };
    } catch (error) {
      console.debug("Camera getPhoto failed:", error);
      return null;
    }
  };

  return {
    takePhoto,
    ensurePermissions,
  };
};
