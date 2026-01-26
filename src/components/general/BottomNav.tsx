import { useAppDispatch } from "@/redux/hooks";
import BottomNavButton from "./BottomNavButton";
import { useTranslation } from "react-i18next";
import { resetFilter } from "@/redux/slices/filterAndSortingSlice";
import { motion } from "motion/react";
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
    return 0;
  };

  const activeIndex = getActiveIndex();

  return (
    <>
      <div style={{ height: "100px" }}></div>

      <div className="fixed bottom-0 z-20 w-full max-w-lg py-3 bg-secondary rounded-t-2xl">
        <div className="flex justify-between w-full gap-1 px-2 relative">
          {/* Sliding indicator */}
          <motion.div
            className="absolute top-0 h-10 w-1/3 flex justify-center pointer-events-none"
            animate={{ x: `${activeIndex * 100}%` }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="w-14 h-8 bg-primary/15 rounded-full" />
          </motion.div>

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
