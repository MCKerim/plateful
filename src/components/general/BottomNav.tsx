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
    if (location.pathname.startsWith("/chatbot")) return 0;
    if (location.pathname.startsWith("/cookbook") || location.pathname.startsWith("/recipe"))
      return 1;
    if (location.pathname.startsWith("/planner")) return 2;
    return null;
  };

  const activeIndex = getActiveIndex();

  return (
    <>
      <div style={{ height: "100px" }}></div>

      <div className="fixed bottom-0 z-40 w-full max-w-lg py-3 bg-secondary rounded-t-2xl">
        <div className="flex justify-between w-full gap-1 px-2 relative">
          <BottomNavButton
            label={t("bottomNav.chatbot")}
            icon="chatbot"
            link="/chatbot"
            active={activeIndex === 0}
          />

          <BottomNavButton
            label={t("bottomNav.cookbook")}
            icon="cookbook"
            link="/cookbook"
            active={activeIndex === 1}
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
            active={activeIndex === 2}
          />
        </div>
      </div>
    </>
  );
}
