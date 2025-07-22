import BottomNavButton from "./BottomNavButton";
import { useTranslation } from "react-i18next";

export default function BottomNav() {
  const { t } = useTranslation();

  return (
    <>
      <div style={{ height: "100px" }}></div>

      <div className="fixed bottom-0 z-20 w-full max-w-lg py-3 bg-secondary rounded-t-2xl">
        <div className="flex justify-between w-full gap-1 px-2">
          <BottomNavButton
            label={t("bottomNav.home")}
            icon="home"
            link="/home"
            active={window.location.pathname.startsWith("/home")}
          />

          <BottomNavButton
            label={t("bottomNav.chatbot")}
            icon="chatbot"
            link="/chatbot"
            active={window.location.pathname.startsWith("/chatbot")}
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
