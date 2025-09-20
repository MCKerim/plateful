import { useAppDispatch } from "@/redux/hooks";
import { setCategoryId } from "@/redux/slices/filterAndSortingSlice";

type Props = {
  id: number;
  name: string;
};

export default function CategoryButton({ id, name }: Readonly<Props>) {
  const dispatch = useAppDispatch();

  return (
    <button
      key={id}
      className="h-40 text-lg font-semibold rounded-lg bg-secondary text-secondary-foreground"
      onClick={() => {
        dispatch(setCategoryId(id));
      }}
    >
      {name}
    </button>
  );
}
