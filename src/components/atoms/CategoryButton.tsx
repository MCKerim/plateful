import { useAppDispatch } from "@/redux/hooks";
import { setCategoryId } from "@/redux/slices/filterAndSortingSlice";

type Props = {
  id: number;
  name: string;
  color: string;
};

function getColorCode(color: string): string {
  switch (color) {
    case "yellow":
      return "#FFD151";

    case "green":
      return "#6DD961";

    case "pink":
      return "#FFA7FC";

    case "blue":
      return "#63CEFF";

    case "purple":
      return "#FF7274";

    default:
      return "#9D9D9D";
  }
}

function getColorClass(color: string): string {
  switch (color) {
    case "yellow":
      return "bg-[#FFBB00] dark:bg-yellow-600";

    case "green":
      return "bg-[#53C946] dark:bg-green-800";

    case "pink":
      return "bg-[#FF88FB] dark:bg-pink-800";

    case "blue":
      return "bg-[#47BCF2] dark:bg-blue-800";

    case "purple":
      return "bg-[#F25C5F] dark:bg-purple-800";

    default:
      return "bg-[#868686] dark:bg-stone-800";
  }
}

export default function CategoryButton({ id, name, color }: Readonly<Props>) {
  const dispatch = useAppDispatch();

  return (
    <button
      key={id}
      className="relative h-36 overflow-hidden w-full"
      onClick={() => {
        dispatch(setCategoryId(id));
      }}
    >
      <div className="w-full h-full absolute top-0 left-0 z-0">
        <svg
          viewBox="0 0 169 132"
          xmlns="http://www.w3.org/2000/svg"
          fill="inherit"
          className="w-full h-full"
        >
          <path
            d="M0 8C0 3.58172 3.58172 0 8 0H46.4866C48.8931 0 51.1718 1.0833 52.691 2.94964L60.099 12.0504C61.6182 13.9167 63.8968 15 66.3033 15H161C165.418 15 169 18.5817 169 23V124C169 128.418 165.418 132 161 132H8C3.58172 132 0 128.418 0 124V8Z"
            fill={getColorCode(color)}
          />
        </svg>
      </div>

      <div
        className={
          "absolute top-0 bottom-0 flex flex-col justify-center h-[106px] rounded-lg w-full z-10 " +
          getColorClass(color)
        }
      >
        <p className="first-font text-background z-40 break-words text-center text-xl w-full">
          {name}
        </p>
      </div>
    </button>
  );
}
