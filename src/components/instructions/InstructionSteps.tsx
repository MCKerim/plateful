import { useTranslation } from "react-i18next";
import type { RecipeInstruction } from "@/types/instruction.types";

/**
 * The recipe's steps grouped by their section heading and numbered
 * continuously across sections, like the native `InstructionsSection`.
 */
export default function InstructionSteps({ steps }: Readonly<{ steps: RecipeInstruction[] }>) {
  const { t } = useTranslation();

  // Consecutive runs of one group name; a name reappearing later starts a new group.
  const groups: { name: string | null; steps: { id: string; number: number; text: string }[] }[] = [];
  steps.forEach((step, index) => {
    const numbered = { id: step.id, number: index + 1, text: step.stepText };
    const last = groups[groups.length - 1];
    if (last && last.name === step.groupName) last.steps.push(numbered);
    else groups.push({ name: step.groupName, steps: [numbered] });
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{t("recipe.instructions")}</h2>

      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-2.5">
          {group.name && <h3 className="pt-1 text-sm font-semibold text-muted-foreground">{group.name}</h3>}

          <ol className="flex flex-col gap-2.5">
            {group.steps.map((step) => (
              <li key={step.id} className="flex gap-2.5 text-base">
                <span className="tabular-nums text-muted-foreground">{step.number}.</span>
                <span className="flex-1 whitespace-pre-wrap">{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}
