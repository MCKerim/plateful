import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";

export default function JoinHousehold() {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col items-center justify-between h-screen px-4 py-6 overflow-hidden">
      <div className="text-center">
        <h1 className="text-4xl font-bold">{t("joinHousehold.title")}</h1>
      </div>

      <div className="flex flex-col w-full max-w-sm gap-4 mx-auto">
        <p className="font-medium leading-relaxed text-center text-primary">
          {t("joinHousehold.description")}
        </p>

        <Separator className="my-4">
          <p className="px-3 text-sm italic text-gray-500 bg-background">
            {t("joinHousehold.dontHaveHousehold")}
          </p>
        </Separator>

        <NavLink to="/createHousehold" className="w-full">
          <Button className="w-full" variant="secondary">
            {t("joinHousehold.createNew")}
          </Button>
        </NavLink>
      </div>

      <div></div>
    </div>
  );
}
