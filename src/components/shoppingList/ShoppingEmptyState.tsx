import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import mascotShopping from "@/assets/mascot-shopping.webp";

/** The list before the household ever used it: one picture, one sentence, one action. */
export default function ShoppingEmptyState({ onAdd }: Readonly<{ onAdd: () => void }>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center px-6 pt-12 text-center">
      <img src={mascotShopping} alt="" className="w-[216px]" />
      <h2 className="mt-4 max-w-80 text-2xl font-bold">{t("shoppingList.empty.title")}</h2>
      <Button variant="accent" className="mt-6" onClick={onAdd}>
        {t("shoppingList.empty.add")}
      </Button>
    </div>
  );
}
