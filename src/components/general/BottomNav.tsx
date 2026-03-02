import { useAppDispatch } from "@/redux/hooks";
import BottomNavButton from "./BottomNavButton";
import { useTranslation } from "react-i18next";
import { resetFilter } from "@/redux/slices/filterAndSortingSlice";
import { useLocation } from "react-router";

export default function BottomNav() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const getActiveIndex = () => {
    if (location.pathname.startsWith("/home")) return 0;
    if (location.pathname.startsWith("/chatbot")) return 1;
    if (location.pathname.startsWith("/cookbook") || location.pathname.startsWith("/recipe"))
      return 2;
    if (location.pathname.startsWith("/planner")) return 3;
    return null;
  };

  const activeIndex = getActiveIndex();

  return (
    <>
      <div style={{ height: "calc(100px + var(--safe-area-bottom, 0px))" }}></div>

      <div
        className="fixed bottom-0 z-40 w-full max-w-lg pt-3 bg-secondary rounded-t-2xl"
        style={{ paddingBottom: "calc(0.75rem + var(--safe-area-bottom, 0px))" }}
      >
        <div className="flex justify-between w-full gap-1 px-2 relative">
          <BottomNavButton
            label={t("bottomNav.home")}
            icon="home"
            link="/home"
            active={activeIndex === 0}
          />

          <BottomNavButton
            label={t("bottomNav.chatbot")}
            icon="chatbot"
            link="/chatbot"
            active={activeIndex === 1}
          />

          <BottomNavButton
            label={t("bottomNav.cookbook")}
            icon="cookbook"
            link="/cookbook"
            active={activeIndex === 2}
            onClick={() => {
              if (location.pathname.startsWith("/cookbook")) {
                dispatch(resetFilter());
              }
            }}
          />

          <BottomNavButton
            label={t("bottomNav.planner")}
            icon="planner"
            link="/planner"
            active={activeIndex === 3}
          />
        </div>
      </div>
    </>
  );
}
