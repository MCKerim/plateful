import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export default function ImageImport() {
  const { t } = useTranslation();
  const [images, setImages] = useState<
    { file: File; preview: string; base64: string }[]
  >([]);
  const navigate = useNavigate();

  const handleImageSelected = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const base64 = reader.result.toString();
        const previewUrl = URL.createObjectURL(file);
        setImages((prev) => [...prev, { file, preview: previewUrl, base64 }]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartImport = () => {
    console.log("Starting import with images:", images);
    // Dummy action for now
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
          {t("common.save")}
        </Button>
      </div>
    </>
  );

  return (
    <Layout showHeader={false} footer={saveFooter}>
      <div className="flex justify-between w-full items-center">
        <h1 className="text-2xl font-bold first-font">Fotos Importieren</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative">
            <AspectRatio ratio={16 / 9}>
              <img
                src={image.preview}
                alt={`Uploaded ${index}`}
                className="object-cover w-full h-full rounded-md dark:brightness-75"
              />
            </AspectRatio>

            <button
              onClick={() => handleRemoveImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
            >
              X
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Add Images
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleImageSelected(e.target.files[0]);
            }
          }}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
        />
      </div>
    </Layout>
  );
}
