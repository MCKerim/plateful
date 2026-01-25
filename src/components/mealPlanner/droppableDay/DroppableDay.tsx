import { useDroppable } from "@dnd-kit/core";

type Props = {
  id: string;
  children: React.ReactNode;
};

export function DroppableDay({ id, children }: Readonly<Props>) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors rounded-lg p-1 ${
        isOver ? "bg-accent ring-2 ring-primary" : ""
      }`}
    >
      {children}
    </div>
  );
}
