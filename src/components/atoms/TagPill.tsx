type Props = {
  name: string;
  color: "green" | "blue" | "orange" | "purple";
};

export default function TagPill({ name, color }: Readonly<Props>) {
  function getColorClasses(color: string) {
    switch (color) {
      case "green":
        return "bg-green-100 text-green-800";
      case "blue":
        return "bg-blue-100 text-blue-800";
      case "orange":
        return "bg-orange-100 text-orange-800";
      case "purple":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className={`rounded-full px-2 py-0 text-xs font-semibold flex flex-col justify-center ${getColorClasses(color)}`}>
      {name}
    </div>
  );
}
