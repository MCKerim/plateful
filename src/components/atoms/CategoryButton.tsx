import { useAppDispatch } from "@/redux/hooks";
import { setCategoryId } from "@/redux/slices/filterAndSortingSlice";

type Props = {
  id: number;
  name: string;
  color: string;
};

export default function CategoryButton({ id, name, color }: Readonly<Props>) {
  const dispatch = useAppDispatch();

  function getColorClass(color: string): string {
    switch (color) {
      case "yellow":
        return "bg-yellow-200";

      case "green":
        return "bg-green-200";

      case "pink":
        return "bg-pink-200";

      case "blue":
        return "bg-blue-200";

      case "purple":
        return "bg-purple-200";

      default:
        return "bg-stone-300";
    }
  }

  return (
    <button
      key={id}
      className="relative z-0 flex flex-col justify-center h-40 px-2 py-4 mx-auto overflow-hidden text-lg font-semibold rounded-lg bg-secondary text-secondary-foreground w-44"
      onClick={() => {
        dispatch(setCategoryId(id));
      }}
    >
      <div className="absolute top-0 left-0 w-[97%] h-full bg-background rounded-lg z-10 "></div>

      <div className="absolute top-0 left-0 w-[94%] h-full bg-secondary rounded-lg z-20"></div>

      <div
        className={
          "absolute top-0 left-0 z-30 w-4 h-full " + getColorClass(color)
        }
      ></div>

      <p className="z-40">{name}</p>
    </button>
  );
}
