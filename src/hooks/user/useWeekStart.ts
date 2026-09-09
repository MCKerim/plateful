import { useAppSelector } from "@/redux/hooks";
import { selectWeekStart } from "@/redux/slices/userSlice";

/**
 * The planner's first weekday (0 = Sunday), the account's own; the device's
 * until the profile has been seeded. Every week this app builds starts here.
 */
export function useWeekStart(): number {
  return useAppSelector(selectWeekStart);
}
