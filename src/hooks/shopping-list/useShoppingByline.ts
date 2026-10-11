import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdMembers } from "@/redux/slices/householdSlice";
import { selectUser } from "@/redux/slices/userSlice";
import { contentLanguage } from "@/lib/contentLanguage";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

/** "yesterday", "2 hours ago", "now": the largest unit that fits. */
export function relativeTime(at: number, now: number, locale: string): string {
  const seconds = Math.round((at - now) / 1000);
  const [unit, size] =
    UNITS.find(([, size]) => Math.abs(seconds) >= size) ?? UNITS[UNITS.length - 1];
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    Math.round(seconds / size),
    unit
  );
}

/** Who added something and when, "You · yesterday"; null when neither is known. */
export function useShoppingByline() {
  const { t } = useTranslation();
  const userId = useAppSelector(selectUser)?.id;
  const members = useAppSelector(selectHouseholdMembers);

  return (addedBy: string | null, addedAt: number | null): string | null => {
    const parts: string[] = [];
    if (addedBy) {
      if (addedBy === userId) parts.push(t("shoppingList.detail.you"));
      else {
        const member = members?.find((candidate) => candidate.id === addedBy);
        if (member) parts.push(member.username);
      }
    }
    if (addedAt !== null) parts.push(relativeTime(addedAt, Date.now(), contentLanguage()));
    return parts.length > 0 ? parts.join(" · ") : null;
  };
}
