import { useAppDispatch } from "@/redux/hooks";
import BottomNavButton from "./BottomNavButton";
import { useTranslation } from "react-i18next";
import { resetFilter } from "@/redux/slices/filterAndSortingSlice";

export default function BottomNav() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  return (
    <>
      <div style={{ height: "100px" }}></div>

      <div className="fixed bottom-0 z-20 w-full max-w-lg py-3 bg-secondary rounded-t-2xl">
        <div className="flex justify-between w-full gap-1 px-2">
          {/*
            <BottomNavButton
              label={t("bottomNav.home")}
              icon="home"
              link="/home"
              active={globalThis.location.pathname.startsWith("/home")}
            />
          */}

          <BottomNavButton
            label={t("bottomNav.chatbot")}
            icon="chatbot"
            link="/chatbot"
            active={globalThis.location.pathname.startsWith("/chatbot")}
          />

          <BottomNavButton
            label={t("bottomNav.cookbook")}
            icon="cookbook"
            link="/cookbook"
            active={
              globalThis.location.pathname.startsWith("/cookbook") ||
              globalThis.location.pathname.startsWith("/recipe")
            }
            onClick={() => {
              if (globalThis.location.pathname.startsWith("/cookbook")) {
                dispatch(resetFilter());
              }
            }}
          />

          <BottomNavButton
            label={t("bottomNav.planner")}
            icon="planner"
            link="/planner"
            active={globalThis.location.pathname.startsWith("/planner")}
          />

          {/*
            <BottomNavButton
              label={t("bottomNav.list")}
              icon="lists"
              link="/lists"
              active={globalThis.location.pathname.startsWith("/lists")}
            />
          */}
        </div>
      </div>
    </>
  );
}
