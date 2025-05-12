type Props = {
  name: string;
  color: "green" | "blue" | "orange" | "purple";
};

export default function TagPill({ name, color }: Readonly<Props>) {
  return (
    <div className={`rounded-full px-2 py-0 text-xs font-semibold flex flex-col justify-center bg-${color}-100 text-${color}-800 `}>
      {name}
    </div>
  );
}
