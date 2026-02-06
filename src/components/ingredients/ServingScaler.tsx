import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  baseServings: number;
  value: number;
  onChange: (servings: number) => void;
  unit?: string;
};

export function ServingScaler({
  baseServings,
  value,
  onChange,
  unit = "servings",
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

  const handleReset = () => {
    onChange(baseServings);
  };

  const isModified = value !== baseServings;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={value <= 1}
        className="h-8 w-8"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <span className="min-w-[80px] text-center font-medium">
        {value} {t(`ingredients.units.${unit}`, { defaultValue: unit })}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        className="h-8 w-8"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {isModified && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="ml-2"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          {t("ingredients.reset")}
        </Button>
      )}
    </div>
  );
}
