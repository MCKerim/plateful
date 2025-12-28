import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectSorting,
  setSorting,
} from "@/redux/slices/filterAndSortingSlice";
import { useTranslation } from "react-i18next";

const sortOptions = [
  { label: "Neueste", value: "newest" },
  { label: "Älteste", value: "oldest" },
  { label: "Am besten bewertet", value: "rating" },
  { label: "A bis Z", value: "aToZ" },
];

export default function SortingModal() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const sorting = useAppSelector(selectSorting);

  const [open, setOpen] = useState(false);

  const handleValueChange = (value: string) => {
    dispatch(setSorting(value));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full w-14 h-9">
          <SwapVertRoundedIcon />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sortingModal.sortBy")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col py-4">
          <div>
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={sorting === option.value ? "accent" : "secondary"}
                onClick={() => handleValueChange(option.value)}
                className="w-full mb-2"
              >
                {t(`sortingModal.${option.value}`)}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
