import { Button } from "../../button";

type Props = {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  isStart?: boolean;
};

export default function OnboardingButton({
  label,
  onClick,
  icon,
  isStart,
}: Readonly<Props>) {
  return (
    <Button
      className={
        "second-font w-full h-12 rounded-full font-semibold text-base shadow-lg shadow-primary/20" +
        (isStart && " bg-primary dark:bg-primary-foreground dark:text-primary")
      }
      onClick={onClick}
    >
      {icon}

      {label}
    </Button>
  );
}
