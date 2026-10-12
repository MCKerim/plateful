import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  name: string;
  imageUrl: string | null;
  /** The cook's name, when the household knows it. */
  cookName: string | null;
  onJoin: () => void;
  onOpen: () => void;
};

/** A passive nudge on Home: a household member cooks a recipe this cook hasn't joined. */
export default function CookingInviteCard({ name, imageUrl, cookName, onJoin, onOpen }: Readonly<Props>) {
  const { t } = useTranslation();
  return (
    <Card className="flex items-center gap-3 p-3">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <img
          src={imageUrl ?? "/no-img.jpg"}
          alt=""
          className="size-14 shrink-0 rounded-xl object-cover dark:brightness-75"
        />
        <span className="min-w-0">
          <span className="block text-xs font-medium text-muted-foreground">
            {cookName ? t("cooking.isCooking", { name: cookName }) : t("cooking.someoneIsCooking")}
          </span>
          <span className="line-clamp-2 font-bold leading-tight">{name}</span>
        </span>
      </button>
      <Button variant="accent" className="shrink-0 rounded-full" onClick={onJoin}>
        {t("cooking.cookAlong")}
      </Button>
    </Card>
  );
}
