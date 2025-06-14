import { Separator } from "../ui/separator";
import BottomNavButton from "./BottomNavButton";
import { useTranslation } from "react-i18next";

export default function BottomNav() {
  const { t } = useTranslation();

  return (
    <>
      <div style={{ height: "100px" }}></div>

      <div className="w-full max-w-lg fixed bottom-0 py-2 bg-secondary z-20 rounded-t-2xl">
        <div className="flex justify-between w-full gap-1 px-2">
          <BottomNavButton
            label={t("bottomNav.home")}
            icon="home"
            link="/home"
            active={window.location.pathname.startsWith("/home")}
          />

          <BottomNavButton
            label={t("bottomNav.explore")}
            icon="explore"
            link="/explore"
            active={window.location.pathname.startsWith("/explore")}
          />

          <BottomNavButton
            label={t("bottomNav.cookbook")}
            icon="cookbook"
            link="/cookbook"
            active={
              window.location.pathname.startsWith("/cookbook") ||
              window.location.pathname.startsWith("/recipe")
            }
          />

          <BottomNavButton
            label={t("bottomNav.planner")}
            icon="planner"
            link="/planner"
            active={window.location.pathname.startsWith("/planner")}
          />

          <BottomNavButton
            label={t("bottomNav.list")}
            icon="lists"
            link="/lists"
            active={window.location.pathname.startsWith("/lists")}
          />
        </div>
      </div>
    </>
  );
}
