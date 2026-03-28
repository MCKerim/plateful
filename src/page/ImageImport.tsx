import { useState, useRef, useEffect, useCallback } from "react";
import { IMAGE_COMPRESSION_OPTIONS } from "@/lib/constants";
import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useImageSourcePicker } from "@/hooks/general/useImageSourcePicker";
import { Trash2, Camera, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from "@/utils/supabase";
import { useNavigate, useSearchParams } from "react-router";
import { Capacitor } from "@capacitor/core";
import LoadingDots from "@/components/general/LoadingDots";
import RecipeCard from "@/components/general/RecipeCard";
import imageCompression from "browser-image-compression";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useIncrementMission } from "@/hooks/missions/useIncrementMission";

const IMPORTED_FILE_URIS_KEY = "lastAutoImportedFileUris";

function wereFileUrisAlreadyAutoImported(key: string): boolean {
  try {
    return localStorage.getItem(IMPORTED_FILE_URIS_KEY) === key;
  } catch {
    return false;
  }
}

function markFileUrisAsAutoImported(key: string): void {
  try {
    localStorage.setItem(IMPORTED_FILE_URIS_KEY, key);
  } catch {
    // ignore storage errors
  }
}

export default function ImageImport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<{ id: string; name: string } | null>(null);
  const [images, setImages] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [searchParams] = useSearchParams();
  const incrementMission = useIncrementMission();

  // Cleanup on unmount - abort any pending API calls
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
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
    const compressedFile = await imageCompression(file, IMAGE_COMPRESSION_OPTIONS);

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const base64 = reader.result.toString();
        setImages((prev) => [...prev, { file: compressedFile, preview: dataUrl, base64 }]);
        setIsLoadingImage(false);
      }
    };
    reader.readAsDataURL(compressedFile);
  }, []);

  // Load images shared via the Android share intent
  useEffect(() => {
    const fileUris = searchParams.getAll("fileUri");
    const fileUrisKey = fileUris.join(",");
    if (fileUris.length === 0 || wereFileUrisAlreadyAutoImported(fileUrisKey)) return;
    markFileUrisAsAutoImported(fileUrisKey);

    const loadSharedFiles = async () => {
      for (const uri of fileUris) {
        try {
          const webUri = Capacitor.convertFileSrc(uri);
          const response = await fetch(webUri);
          const blob = await response.blob();
          const file = new File([blob], "shared-image", { type: blob.type || "image/jpeg" });
          const dataUrl = URL.createObjectURL(blob);
          await processImage(file, dataUrl);
        } catch (err) {
          console.error("Failed to load shared image:", err);
        }
      }
    };

    loadSharedFiles();
  }, [searchParams, processImage]);

  const handleCameraClick = async () => {
    const result = await selectFromCamera();
    if (result) {
      await processImage(result.file, result.dataUrl);
    }
  };

  const handleGalleryClick = async () => {
    const results = await selectMultipleFromGallery();
    if (results) {
      for (const result of results) {
        await processImage(result.file, result.dataUrl);
      }
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

    // Abort any previous request and create new controller
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsSaving(true);

    // Invalidate cache immediately so Cookbook shows the importing card
    await queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });

    try {
      const { data, error } = await supabase.functions.invoke("recipe-from-image", {
        body: {
          images: images.map((img) => img.base64),
        },
      });

      // Check if component unmounted during the async operation
      if (signal.aborted) return;

      if (error) {
        console.error("Edge function returned error:", error);
        toast.error(t("urlImport.errors.importFailed"));
      } else {
        setData(data[0]);
        incrementMission.mutate({ missionId: "import_recipes" });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.recipes.all,
        });
        navigate("/cookbook", { replace: true });
        toast.success(t("urlImport.success"), {
          action: {
            label: t("urlImport.viewRecipe"),
            onClick: () => {
              navigate(`/recipe/${data[0].id}`);
            },
          },
        });
      }
    } catch (err: unknown) {
      if (signal.aborted) return;
      console.error("Unexpected error calling recipe-from-image:", err);
      toast.error(t("urlImport.errors.importFailed"));

      try {
        const errWithResponse = err as { response?: { text?: () => Promise<string> } };
        if (errWithResponse?.response && typeof errWithResponse.response.text === "function") {
          const text = await errWithResponse.response.text();
          console.error("Edge function returned (raw text):", text);
        }
      } catch (error_) {
        console.debug("Could not retrieve raw response from error.", error_);
      }
    } finally {
      if (!signal.aborted) {
        setIsSaving(false);
      }
    }
  }

  const saveFooter = (
    <>
      <div className="h-[100px]"></div>

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 flex gap-2 border-border border-t-[1px]">
        {isSaving || data !== null ? (
          <Button className="w-full" variant="secondary" onClick={() => navigate("/cookbook")}>
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

  return (
    <Layout showHeader={false} footer={saveFooter}>
      <div className="flex justify-between w-full items-center">
        <h1 className="text-2xl font-bold first-font">{t("imageImport.title")}</h1>
      </div>

      {!isSaving && !data && (
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
              disabled={!isNative || isLoadingImage}
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
              disabled={isLoadingImage}
            >
              <div className="flex flex-col gap-1 items-center">
                <ImageIcon className="!size-8" />
                <p className="second-font font-medium text-lg">{t("common.gallery")}</p>
              </div>
            </Button>
          </div>
        </div>
      )}

      {(isSaving || data) && (
        <div className="flex items-center flex-1">
          {isSaving && (
            <div className="flex flex-col items-center justify-center w-full gap-8">
              <LoadingDots />

              <p className="second-font text-center">
                {t("urlImport.importingMessage")}
                <br />
                {t("urlImport.importingDescription")}
              </p>
            </div>
          )}

          {data && (
            <div className="flex flex-col w-full gap-4">
              <h2 className="text-lg font-bold second-font">{t("urlImport.importedRecipe")}</h2>

              <RecipeCard key={data.id} id={data.id} name={data.name} averageRating={null} />
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
