import { Button } from "../../button";

type Props = {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
};

export default function OnboardingButton({ label, onClick, icon }: Readonly<Props>) {
  return (
    <Button
      className="w-full h-12 rounded-full font-semibold text-base shadow-lg shadow-primary/20"
      onClick={onClick}
    >
      {icon}

      {label}
    </Button>
  );
}
