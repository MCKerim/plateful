import { Plus } from "lucide-react";
import { motion, type HTMLMotionProps } from "motion/react";

type Props = HTMLMotionProps<"button"> & { "aria-label": string };

/** The round add button above the tab bar, bottom right. */
export default function Fab(props: Readonly<Props>) {
  return (
    <motion.button
      type="button"
      className="p-2.5 fixed bottom-[5rem] right-[1rem] z-50 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg"
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      <Plus size={34} />
    </motion.button>
  );
}
