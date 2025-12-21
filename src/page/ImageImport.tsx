import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ImagePicker } from "@/components/atoms/ImagePicker";
import { Trash2 } from "lucide-react";

export default function ImageImport() {
  const { t } = useTranslation();
  const [images, setImages] = useState<
    { file: File; preview: string; base64: string }[]
  >([]);

  const handleImageSelected = (file: File | undefined, previewUrl: string) => {
    if (file && previewUrl) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const base64 = reader.result.toString();
          setImages((prev) => [...prev, { file, preview: previewUrl, base64 }]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartImport = () => {
    console.log("Starting import with images:", images);
    alert("Import started with " + images.length + " images.");
  };

  const saveFooter = (
    <>
      <div className="h-[100px]"></div>

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 flex gap-2 border-border border-t-[1px]">
        <Button
          className="w-full"
          variant="accent"
          onClick={() => handleStartImport()}
        >
          {t("imageImport.importButton")}
        </Button>
      </div>
    </>
  );

  return (
    <Layout showHeader={false} footer={saveFooter}>
      <div className="flex justify-between w-full items-center mb-4">
        <h1 className="text-2xl font-bold first-font">
          {t("imageImport.title")}
        </h1>
      </div>

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
      </div>

      <div className="mt-4">
        <ImagePicker
          onImageSelected={handleImageSelected}
          onDeleteImage={() => {}}
          uploading={false}
        />
      </div>
    </Layout>
  );
}
