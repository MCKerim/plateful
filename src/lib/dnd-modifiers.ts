import { Modifier } from "@dnd-kit/core";

export const restrictToVerticalAxisAndWindow: Modifier = ({
  transform,
  draggingNodeRect,
  windowRect,
}) => {
  if (!draggingNodeRect || !windowRect) {
    return transform;
  }

  return {
    ...transform,
    x: 0,
    y: Math.max(
      Math.min(transform.y, windowRect.height - draggingNodeRect.top - draggingNodeRect.height),
      -draggingNodeRect.top
    ),
  };
};
