import { Button } from "../../button";

type Props = {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  isStart?: boolean;
  variant?:
    | "default"
    | "accent"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
};

export default function OnboardingButton({
  label,
  onClick,
  icon,
  isStart,
  variant = "default",
}: Readonly<Props>) {
  return (
    <Button
      className={
        "second-font w-full h-12 rounded-full font-semibold text-base " +
        // makes button always black on start screen
        (isStart && " bg-primary dark:bg-primary-foreground dark:text-primary")
      }
      onClick={onClick}
      variant={variant}
    >
      {icon}

      {label}
    </Button>
  );
}
