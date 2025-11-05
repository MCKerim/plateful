import { useAppDispatch } from "@/redux/hooks";
import { setCategoryId } from "@/redux/slices/filterAndSortingSlice";

type Props = {
  id: number;
  name: string;
  color?: string;
};

function getBackgroundColorCode(color: string): string {
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

function getFrontColorCode(color: string): string {
  switch (color) {
    case "yellow":
      return "#FFBB00";
    case "green":
      return "#53C946";
    case "pink":
      return "#FF88FB";
    case "blue":
      return "#47BCF2";
    case "purple":
      return "#F25C5F";
    default:
      return "#868686";
  }
}

// Apple folder like design button
export default function CategoryButton({
  id,
  name,
  color = "",
}: Readonly<Props>) {
  const dispatch = useAppDispatch();
  const frontColor = getFrontColorCode(color);

  return (
    <button
      key={id}
      type="button"
      className="relative h-36 w-full"
      onClick={() => {
        dispatch(setCategoryId(id));
      }}
    >
      {/* Back part of the folder */}
      <div className="absolute inset-0">
        <svg
          viewBox="0 0 169 132"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <path
            d="M0 8C0 3.58172 3.58172 0 8 0H46.4866C48.8931 0 51.1718 1.0833 52.691 2.94964L60.099 12.0504C61.6182 13.9167 63.8968 15 66.3033 15H161C165.418 15 169 18.5817 169 23V124C169 128.418 165.418 132 161 132H8C3.58172 132 0 128.418 0 124V8Z"
            fill={getBackgroundColorCode(color)}
          />
        </svg>
      </div>

      {/* Front part of the folder with label */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[106px] flex items-center justify-center rounded-lg"
        style={{ backgroundColor: frontColor }}
      >
        <p className="first-font text-background z-40 break-words text-center text-xl px-2">
          {name}
        </p>
      </div>
    </button>
  );
}
