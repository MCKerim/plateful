import { AlarmClock } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CommingSoon() {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-900 absolute left-0 top-0 opacity-30 w-full h-full z-10 items-center flex flex-col justify-center">
      <div className="flex gap-2 text-2xl items-center justify-center font-bold">
        <h1>{t("common.commingSoon")}</h1>

        <AlarmClock />
      </div>
    </div>
  );
}
