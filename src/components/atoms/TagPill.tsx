type Props = {
  name: string;
  color: string;
};

export default function TagPill({ name, color }: Readonly<Props>) {
  return (
    <div className={`rounded-full px-2 py-0 text-xs font-semibold flex flex-col justify-center ${color}`}>
      {name}
    </div>
  );
}
