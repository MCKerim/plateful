import { useState, useRef, useEffect, useCallback } from "react";
import { IMAGE_COMPRESSION_OPTIONS } from "@/lib/constants";
import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useImageSourcePicker } from "@/hooks/general/useImageSourcePicker";
import { Trash2, Camera, ImageIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from "@/utils/supabase";
import { useNavigate, useSearchParams } from "react-router";
import { Capacitor } from "@capacitor/core";
import LoadingDots from "@/components/general/LoadingDots";
import imageCompression from "browser-image-compression";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useIncrementMission } from "@/hooks/missions/useIncrementMission";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { recipeImportApi } from "@/api/recipeImport.api";

// The backend extractor is unreliable with large photo batches, so cap the
// import at 4 — same limit the iOS app and share extension enforce.
const MAX_IMPORT_IMAGES = 4;

let lastAutoImportedFileUris: string | null = null;

export default function ImageImport() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const householdId = useAppSelector(selectHouseholdId);
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  // The placeholder was created; we show a brief confirmation then leave.
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [searchParams] = useSearchParams();
  const incrementMission = useIncrementMission();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const {
    selectFromCamera,
    selectMultipleFromGallery,
    isNative,
    multipleFileInputRef,
    handleMultipleFileInputChange,
  } = useImageSourcePicker();

  const processImage = useCallback(async (file: File, dataUrl: string) => {
    setIsLoadingImage(true);
    try {
      const compressedFile = await imageCompression(file, IMAGE_COMPRESSION_OPTIONS);
      setImages((prev) =>
        prev.length >= MAX_IMPORT_IMAGES
          ? prev
          : [...prev, { file: compressedFile, preview: dataUrl }]
      );
    } finally {
      setIsLoadingImage(false);
    }
  }, []);

  // Add up to the remaining capacity; warn if the selection was truncated.
  const addImages = useCallback(
    async (items: { file: File; dataUrl: string }[]) => {
      const remaining = MAX_IMPORT_IMAGES - images.length;
      if (remaining <= 0) {
        toast.error(t("imageImport.errors.tooMany", { count: MAX_IMPORT_IMAGES }));
        return;
      }
      if (items.length > remaining) {
        toast.error(t("imageImport.errors.tooMany", { count: MAX_IMPORT_IMAGES }));
      }
      for (const item of items.slice(0, remaining)) {
        await processImage(item.file, item.dataUrl);
      }
    },
    [images.length, processImage, t]
  );

  // Load images shared via the Android share intent
  useEffect(() => {
    const fileUris = searchParams.getAll("fileUri");
    const fileUrisKey = fileUris.join(",");
    if (fileUris.length === 0 || lastAutoImportedFileUris === fileUrisKey) return;
    lastAutoImportedFileUris = fileUrisKey;

    const loadSharedFiles = async () => {
      const loaded: { file: File; dataUrl: string }[] = [];
      for (const uri of fileUris) {
        try {
          const webUri = Capacitor.convertFileSrc(uri);
          const response = await fetch(webUri);
          const blob = await response.blob();
          const file = new File([blob], "shared-image", { type: blob.type || "image/jpeg" });
          const dataUrl = URL.createObjectURL(blob);
          loaded.push({ file, dataUrl });
        } catch (err) {
          console.error("Failed to load shared image:", err);
        }
      }
      await addImages(loaded);
    };

    loadSharedFiles();
    // addImages depends on images.length, but this should only run per share.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCameraClick = async () => {
    const result = await selectFromCamera();
    if (result) {
      await addImages([result]);
    }
  };

  const handleGalleryClick = async () => {
    const results = await selectMultipleFromGallery();
    if (results) {
      await addImages(results);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleStartImport() {
    if (images.length === 0) {
      toast.error(t("imageImport.errors.noImages"));
      return;
    }
    if (!householdId) {
      toast.error(t("urlImport.errors.importFailed"));
      return;
    }

    setIsSaving(true);
    try {
      await recipeImportApi.createImageImport(supabase, {
        files: images.map((img) => img.file),
        householdId,
        language: i18n.language.split("-")[0],
      });

      incrementMission.mutate({ missionId: "import_recipes" });
      await queryClient.invalidateQueries({ queryKey: queryKeys.recipeImports.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });

      setSubmitted(true);
      toast.success(t("urlImport.importStarted"));

      // Fire-and-forget: the worker extracts in the background. Confirm briefly,
      // then land in the cookbook where the placeholder card is waiting.
      redirectTimerRef.current = setTimeout(() => navigate("/cookbook", { replace: true }), 1600);
    } catch (err) {
      console.error("Failed to start image import:", err);
      toast.error(t("urlImport.errors.importFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  const busy = isSaving || submitted;

  const saveFooter = (
    <>
      {/* Keep the image-source actions above the fixed CTA, including on devices
          with a home indicator. The previous h-safe-b utility is not defined
          in this Tailwind configuration. */}
      <div
        aria-hidden="true"
        className="h-[calc(4.625rem+env(safe-area-inset-bottom))] shrink-0"
      />

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 flex gap-2 border-border border-t-[1px] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {busy ? (
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => navigate("/cookbook", { replace: true })}
          >
            {t("urlImport.backToCookbook")}
          </Button>
        ) : (
          <Button
            className="w-full"
            variant="accent"
            onClick={() => handleStartImport()}
            disabled={images.length === 0}
          >
            {t("imageImport.importButton")}
          </Button>
        )}
      </div>

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

  const atCapacity = images.length >= MAX_IMPORT_IMAGES;

  return (
    <Layout showHeader={false} footer={saveFooter}>
      <div className="flex justify-between w-full items-center">
        <h1 className="text-2xl font-bold first-font">{t("imageImport.title")}</h1>
      </div>

      {!busy && (
        <div className="flex flex-col gap-4 flex-1 justify-between">
          <div className="grid grid-cols-2 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <AspectRatio ratio={16 / 9}>
                  <img
                    src={image.preview}
                    alt={`Uploaded ${index}`}
                    className="object-cover w-full h-full rounded-md outline-dashed outline-2 outline-muted-foreground"
                  />
                </AspectRatio>

                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Delete image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {isLoadingImage && (
              <div className="flex items-center justify-center rounded-md outline-dashed outline-2 outline-muted-foreground">
                <AspectRatio ratio={16 / 9}>
                  <div className="flex items-center justify-center w-full h-full">
                    <LoadingDots />
                  </div>
                </AspectRatio>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-4">
            <Button
              variant="secondary"
              className="w-full h-26 rounded-2xl pt-4"
              onClick={handleCameraClick}
              disabled={!isNative || isLoadingImage || atCapacity}
            >
              <div className="flex flex-col gap-1 items-center">
                <Camera className="!size-8" />
                <p className="second-font font-medium text-lg">{t("common.camera")}</p>
              </div>
            </Button>

            <Button
              variant="secondary"
              className="w-full h-26 rounded-2xl pt-4"
              onClick={handleGalleryClick}
              disabled={isLoadingImage || atCapacity}
            >
              <div className="flex flex-col gap-1 items-center">
                <ImageIcon className="!size-8" />
                <p className="second-font font-medium text-lg">{t("common.gallery")}</p>
              </div>
            </Button>
          </div>
        </div>
      )}

      {busy && (
        <div className="flex items-center flex-1">
          <div className="flex flex-col items-center justify-center w-full gap-6 text-center">
            <CheckCircle2 className="text-primary size-16" />

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold second-font">{t("urlImport.startedTitle")}</h2>
              <p className="second-font text-muted-foreground">
                {t("urlImport.startedDescription")}
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
