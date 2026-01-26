import { useDroppable } from "@dnd-kit/core";

type Props = {
  children?: React.ReactNode;
};

export function DroppableNoDateZone({ children }: Readonly<Props>) {
  const { isOver, setNodeRef } = useDroppable({ id: "no-date-zone" });

  return (
    <div ref={setNodeRef} className={`transition-colors ${isOver ? "bg-accent" : "bg-background"}`}>
      {children}
    </div>
  );
}
