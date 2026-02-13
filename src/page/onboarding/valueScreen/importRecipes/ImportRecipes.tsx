import { useNavigate } from "react-router";
import "./ImportRecipes.css";
import PhoneMockup from "@/components/onboarding/phoneMockup/PhoneMockup";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import { useTranslation } from "react-i18next";

const appIcons = [
  { url: "/icons/tiktok.svg", name: "TikTok", position: "top-left" },
  { url: "/icons/instagram.svg", name: "Instagram", position: "top-right" },
  { url: "/icons/youtube.svg", name: "YouTube", position: "bottom-left" },
  { url: "/icons/cookbook.svg", name: "Cookbook", position: "bottom-right" },
] as const;

/** Cartoonic squiggly arrow pointing inward toward the phone */
function CartoonArrow({ position }: { position: string }) {
  const strokeProps = {
    stroke: "#9ca3af",
    strokeWidth: 2.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  // Squiggly paths with wobbly curves and a triangular arrowhead
  switch (position) {
    case "top-left":
      return (
        <svg className="cartoon-arrow top-left" width="46" height="56" viewBox="0 0 46 56">
          <path d="M6 4 C10 14, 3 18, 12 24 C21 30, 14 36, 22 40 C28 43, 32 46, 38 50" {...strokeProps} />
          <polygon points="38,50 30,44 32,52" fill="#9ca3af" />
        </svg>
      );
    case "top-right":
      return (
        <svg className="cartoon-arrow top-right" width="46" height="56" viewBox="0 0 46 56">
          <path d="M40 4 C36 14, 43 18, 34 24 C25 30, 32 36, 24 40 C18 43, 14 46, 8 50" {...strokeProps} />
          <polygon points="8,50 16,44 14,52" fill="#9ca3af" />
        </svg>
      );
    case "bottom-left":
      return (
        <svg className="cartoon-arrow bottom-left" width="46" height="56" viewBox="0 0 46 56">
          <path d="M6 52 C10 42, 3 38, 12 32 C21 26, 14 20, 22 16 C28 13, 32 10, 38 6" {...strokeProps} />
          <polygon points="38,6 30,12 32,4" fill="#9ca3af" />
        </svg>
      );
    case "bottom-right":
      return (
        <svg className="cartoon-arrow bottom-right" width="46" height="56" viewBox="0 0 46 56">
          <path d="M40 52 C36 42, 43 38, 34 32 C25 26, 32 20, 24 16 C18 13, 14 10, 8 6" {...strokeProps} />
          <polygon points="8,6 16,12 14,4" fill="#9ca3af" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ImportRecipes() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <OnboardingLayout onNext={() => navigate("/values/2")}>
      <div className="text-center">
        <h1 className="text-4xl font-bold first-font">{t("valueScreens.importRecipes.title")}</h1>
      </div>

      <div className="phone-with-icons">
        {appIcons.map((icon) => (
          <div key={icon.name} className={`app-icon-bubble ${icon.position}`}>
            <img src={icon.url} alt={icon.name} />
          </div>
        ))}

        {appIcons.map((icon) => (
          <CartoonArrow key={`arrow-${icon.name}`} position={icon.position} />
        ))}

        <PhoneMockup mediaUrl="/import-recipes-recording.mp4" />
      </div>

      <p className="max-w-sm text-center text-gray-600">
        {t("valueScreens.importRecipes.description")}
      </p>
    </OnboardingLayout>
  );
}
