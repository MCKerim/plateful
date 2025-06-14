import { Separator } from "../ui/separator";
import BottomNavButton from "./BottomNavButton";
import { useTranslation } from "react-i18next";

export default function BottomNav() {
  const { t } = useTranslation();

  return (
    <>
      <div style={{ height: "100px" }}></div>

      <div className="w-full max-w-lg fixed bottom-0 pb-2 bg-background z-20">
        <Separator className="mb-2" />

        <div className="flex justify-between w-full gap-1 px-2">
          <BottomNavButton
            label={t("bottomNav.home")}
            icon="house"
            link="/home"
            active={window.location.pathname.startsWith("/home")}
          />

          <BottomNavButton
            label={t("bottomNav.explore")}
            icon="search"
            link="/explore"
            active={
              window.location.pathname.startsWith("/explore") ||
              window.location.pathname.startsWith("/recipe")
            }
          />

          <BottomNavButton
            label={t("bottomNav.cookbook")}
            icon="bookMarked"
            link="/cookbook"
            active={window.location.pathname.startsWith("/cookbook")}
          />

          <BottomNavButton
            label={t("bottomNav.planner")}
            icon="calendarDays"
            link="/planner"
            active={window.location.pathname.startsWith("/planner")}
          />

          <BottomNavButton
            label={t("bottomNav.list")}
            icon="scrollText"
            link="/lists"
            active={window.location.pathname.startsWith("/lists")}
          />
        </div>
      </div>
    </>
  );
}
