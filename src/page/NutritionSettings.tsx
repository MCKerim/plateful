import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { FileText, Leaf } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CARB_COUNTING_OPTIONS,
  CarbCounting,
  currentCarbCounting,
  saveCarbCounting,
} from "@/lib/carbCounting";

const SOURCE_LINKS = [
  { icon: Leaf, labelKey: "nutrition.bls", url: "https://www.blsdb.de" },
  {
    icon: FileText,
    labelKey: "nutrition.license",
    url: "https://creativecommons.org/licenses/by/4.0/",
  },
];

/**
 * How nutrition is shown and where its numbers come from: the carb counting
 * choice and the BLS attribution its CC BY 4.0 license requires. Linked from
 * Settings > General, like the iOS `NutritionSettingsView`.
 */
export default function NutritionSettings() {
  const { t } = useTranslation();
  const [carbCounting, setCarbCounting] = useState(currentCarbCounting);

  function handleChange(value: string) {
    const counting = value as CarbCounting;
    saveCarbCounting(counting);
    setCarbCounting(counting);
  }

  return (
    <Layout>
      <h1 className="text-2xl">{t("nutrition.title")}</h1>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 p-4 border rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="carb-counting" className="font-medium">
              {t("nutrition.carbs")}
            </label>
            <Select value={carbCounting} onValueChange={handleChange}>
              <SelectTrigger id="carb-counting" className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARB_COUNTING_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`nutrition.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">{t("nutrition.carbCountingNote")}</p>
        </div>

        <div className="flex flex-col gap-3 p-4 border rounded-lg">
          <h2 className="font-medium border-b pb-2">{t("nutrition.source")}</h2>
          <p className="text-sm text-muted-foreground">{t("nutrition.sourceNote")}</p>
          {SOURCE_LINKS.map(({ icon: Icon, labelKey, url }) => (
            <NavLink key={url} to={url} target="_blank">
              <Button variant="secondary" className="w-full">
                <Icon />
                {t(labelKey)}
              </Button>
            </NavLink>
          ))}
        </div>
      </div>
    </Layout>
  );
}
