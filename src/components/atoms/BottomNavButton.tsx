import { NavLink } from "react-router";
import { ReactElement } from "react";

type Props = {
  label: string;
  icon: ReactElement;
  link: string;
};

export default function BottomNavButton({
  label,
  icon,
  link,
}: Readonly<Props>) {
  return (
    <NavLink to={link} className="w-full">
      {({ isActive }) => (
        <button
          className={
            (isActive ? "text-accent" : "") +
            " w-full align-middle items-center"
          }
        >
          <div className="w-full flex justify-center">{icon}</div>

          {label}
        </button>
      )}
    </NavLink>
  );
}
