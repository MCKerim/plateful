import OnboardingButton from "@/components/ui/onboarding/onboardingButton/OnboardingButton";
import { NavLink } from "react-router";

export default function Welcome() {
  return (
    <div
      className="flex flex-col items-center h-screen px-4 py-10"
      style={{ backgroundColor: "#abff9b" }}
    >
      <div className="text-center mb-8 flex-1 w-full flex flex-col justify-center gap-2">
        <h1 className="text-5xl font-bold">Congratulations,</h1>

        <h2 className="italic text-xl font-semibold">
          smart food planning starts now!
        </h2>
      </div>

      <NavLink to="/signup" className={"w-full max-w-sm"}>
        <OnboardingButton label="Get Started!" />
      </NavLink>
    </div>
  );
}
