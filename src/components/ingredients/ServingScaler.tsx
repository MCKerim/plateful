import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  value: number;
  onChange: (servings: number) => void;
  unit?: string;
  showSetDefault?: boolean;
  onSetDefault?: () => void;
  isSettingDefault?: boolean;
};

export function ServingScaler({
  value,
  onChange,
  unit = "servings",
  showSetDefault = false,
  onSetDefault,
  isSettingDefault = false,
}: Props) {
  const { t } = useTranslation();

  const handleDecrement = () => {
    if (value > 1) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="icon"
        onClick={handleDecrement}
        disabled={value <= 1}
        className="rounded-full h-8 w-8"
      >
        <Minus />
      </Button>

      <span className="min-w-[100px] text-center font-medium">
        {value} {t(`ingredients.units.${unit}`, { defaultValue: unit })}
      </span>

      <Button
        variant="secondary"
        size="icon"
        onClick={handleIncrement}
        className="rounded-full h-8 w-8"
      >
        <Plus />
      </Button>

      {showSetDefault && onSetDefault && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSetDefault}
          disabled={isSettingDefault}
          className="text-xs text-muted-foreground h-auto py-1"
        >
          {t("ingredients.setAsDefault")}
        </Button>
      )}
    </div>
  );
}
