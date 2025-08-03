import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { useSupabase } from "@/utils/supabase";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export default function CreateHousehold() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);

  const [householdName, setHouseholdName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreateHousehold() {
    if (!user) {
      return;
    }

    if (isLoading) {
      alert(t("createHousehold.errors.loading"));
      return;
    }

    const trimmedName = householdName.trim();
    if (!trimmedName) {
      alert(t("createHousehold.errors.nameRequired"));
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("household")
      .insert({ name: trimmedName })
      .select();

    if (error || !data) {
      alert(t("createHousehold.errors.createFailed") + " " + error?.message);
      setIsLoading(false);
      return;
    }

    if (data) {
      // set household id for user
      const { error: updateError } = await supabase
        .from("users")
        .update({ household_id: data[0].id })
        .eq("id", user.id);

      if (updateError) {
        alert(
          t("createHousehold.errors.updateFailed") + " " + updateError.message
        );
        setIsLoading(false);
        return;
      }

      setHouseholdName("");
      setIsLoading(false);
      navigate("/inviteMembers");
    }
  }

  return (
    <OnboardingLayout
      nextButtonLabel={t("createHousehold.nextButton")}
      onNext={handleCreateHousehold}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold">{t("createHousehold.title")}</h1>
      </div>

      <div className="flex flex-col w-full max-w-sm gap-6">
        <div className="mb-6 text-center">
          <p className="font-medium eading-relaxed text-primary">
            {t("createHousehold.description")}
          </p>
        </div>

        <div className="grid items-center w-full gap-2">
          <Label htmlFor="name">{t("createHousehold.nameLabel")}</Label>

          <Input
            type="text"
            id="name"
            placeholder={t("createHousehold.namePlaceholder")}
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
          />
        </div>

        <Separator>
          <p className="italic">{t("createHousehold.alreadyHaveHousehold")}</p>
        </Separator>

        <NavLink to="/joinHousehold" className="w-full">
          <Button className="w-full" variant="secondary">
            {t("createHousehold.joinExisting")}
          </Button>
        </NavLink>
      </div>
    </OnboardingLayout>
  );
}
