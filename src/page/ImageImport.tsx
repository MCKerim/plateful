import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useImageSourcePicker } from "@/hooks/general/useImageSourcePicker";
import { Trash2, Camera, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from "@/utils/supabase";
import { useNavigate } from "react-router";
import LoadingDots from "@/components/general/LoadingDots";
import RecipeCard from "@/components/general/RecipeCard";
import imageCompression from "browser-image-compression";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export default function ImageImport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [images, setImages] = useState<
    { file: File; preview: string; base64: string }[]
  >([]);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  const {
    selectFromCamera,
    selectFromGallery,
    isNative,
    fileInputRef,
    handleFileInputChange,
  } = useImageSourcePicker();

  const processImage = async (file: File, dataUrl: string) => {
    setIsLoadingImage(true);
    const compressedFile = await imageCompression(file, {
      maxWidthOrHeight: 900,
      maxSizeMB: 0.5,
      useWebWorker: true,
      initialQuality: 0.85,
    });

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const base64 = reader.result.toString();
        setImages((prev) => [
          ...prev,
          { file: compressedFile, preview: dataUrl, base64 },
        ]);
        setIsLoadingImage(false);
      }
    };
    reader.readAsDataURL(compressedFile);
  };

  const handleCameraClick = async () => {
    const result = await selectFromCamera();
    if (result) {
      await processImage(result.file, result.dataUrl);
    }
  };

  const handleGalleryClick = async () => {
    const result = await selectFromGallery();
    if (result) {
      await processImage(result.file, result.dataUrl);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleStartImport() {
    if (images.length === 0) {
      toast.error(t("imageImport.errors.noImages"), {
        position: "top-right",
        richColors: true,
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "recipe-from-image",
        {
          body: {
            images: images.map((img) => img.base64),
          },
        },
      );

      if (error) {
        console.error("Edge function returned error:", error);
        toast.error(t("urlImport.errors.importFailed"), {
          position: "top-right",
          richColors: true,
        });
      } else {
        console.log("recipe-from-image response:", data);
        setData(data[0]);
        await queryClient.invalidateQueries({
          queryKey: queryKeys.recipes.all,
        });
        toast.success(t("urlImport.success"), {
          position: "top-right",
          richColors: true,
          action: {
            label: t("urlImport.viewRecipe"),
            onClick: () => {
              navigate(`/recipe/${data[0].id}`);
            },
          },
        });
      }
    } catch (err: unknown) {
      console.error("Unexpected error calling recipe-from-image:", err);
      toast.error(t("urlImport.errors.importFailed"), {
        position: "top-right",
        richColors: true,
      });

      try {
        const anyErr = err as any;
        if (anyErr?.response && typeof anyErr.response.text === "function") {
          const text = await anyErr.response.text();
          console.error("Edge function returned (raw text):", text);
        }
      } catch (error_) {
        console.debug("Could not retrieve raw response from error.", error_);
      }
    } finally {
      setIsSaving(false);
    }
  }

  const saveFooter = (
    <>
      <div className="h-[100px]"></div>

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 flex gap-2 border-border border-t-[1px]">
        <Button
          className="w-full"
          variant="accent"
          onClick={() => handleStartImport()}
          disabled={isSaving || data !== null || images.length === 0}
        >
          {t("imageImport.importButton")}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
    </>
  );

  return (
    <Layout showHeader={false} footer={saveFooter}>
      <div className="flex justify-between w-full items-center">
        <h1 className="text-2xl font-bold first-font">
          {t("imageImport.title")}
        </h1>
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
                <p className="second-font font-medium text-lg">
                  {t("common.camera")}
                </p>
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
                <p className="second-font font-medium text-lg">
                  {t("common.gallery")}
                </p>
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
              <h2 className="text-lg font-bold second-font">
                {t("urlImport.importedRecipe")}
              </h2>

              <RecipeCard
                key={data.id}
                id={data.id}
                name={data.name}
                averageRating={null}
              />
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
