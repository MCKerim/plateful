import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/general/theme-provider";
import { useTranslation } from "react-i18next";

export function ModeToggle() {
  const { t } = useTranslation();

  const { theme, setTheme } = useTheme();

  return (
    <div className="flex w-full gap-2">
      <Button
        variant={theme === "light" ? "default" : "secondary"}
        className="w-full"
        onClick={() => setTheme("light")}
      >
        <Sun /> {t("settings.modeToggle.light")}
      </Button>

      <Button
        variant={theme === "dark" ? "default" : "secondary"}
        className="w-full"
        onClick={() => setTheme("dark")}
      >
        <Moon /> {t("settings.modeToggle.dark")}
      </Button>

      <Button
        variant={theme === "system" ? "default" : "secondary"}
        className="w-full"
        onClick={() => setTheme("system")}
      >
        {t("settings.modeToggle.system")}
      </Button>
    </div>
  );
}
