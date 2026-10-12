import { useEffect, useRef, useState, type ReactNode } from "react";

type Props<T extends { id: string }> = {
  steps: T[];
  currentStepId: string | null;
  /** The step that landed on the centre line, or was tapped. */
  onCurrentStepChange: (id: string) => void;
  /** The cover above the first step; it scrolls away and is never a snap target. */
  header?: ReactNode;
  renderStep: (step: T, isCurrent: boolean) => ReactNode;
};

/**
 * The vertical step feed: every step in one scroll, each snapping to the
 * centre, and the step that settles there becomes the current one. Half the
 * viewport of padding at both ends lets a one-line first or last step reach
 * the centre. A step made current by other means (Next, a tap, resume) is
 * scrolled there; one the observer reported is left alone, so the feed never
 * fights the finger.
 */
export default function CookingStepFeed<T extends { id: string }>({
  steps,
  currentStepId,
  onCurrentStepChange,
  header,
  renderStep,
}: Readonly<Props<T>>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const onChangeRef = useRef(onCurrentStepChange);
  useEffect(() => {
    onChangeRef.current = onCurrentStepChange;
  }, [onCurrentStepChange]);
  const observedStepId = useRef<string | null>(null);
  const centeredOnce = useRef(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => setHeight(container.clientHeight));
    observer.observe(container);
    setHeight(container.clientHeight);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || height === 0) return;
    // A narrow band around the centre line: the step crossing it is current.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.stepId;
          if (!id) continue;
          observedStepId.current = id;
          onChangeRef.current(id);
        }
      },
      { root: container, rootMargin: "-48% 0px -48% 0px", threshold: 0 }
    );
    for (const element of itemRefs.current.values()) observer.observe(element);
    return () => observer.disconnect();
  }, [steps, height]);

  useEffect(() => {
    const container = containerRef.current;
    const element = currentStepId ? itemRefs.current.get(currentStepId) : undefined;
    if (!container || !element || height === 0) return;
    if (observedStepId.current === currentStepId) return;
    const top = element.offsetTop + element.offsetHeight / 2 - container.clientHeight / 2;
    container.scrollTo({ top, behavior: centeredOnce.current ? "smooth" : "auto" });
    centeredOnce.current = true;
  }, [currentStepId, height]);

  // Absolute inside a relative parent: a percentage height in a flex child
  // resolved against the wrong box and let the feed paint over the bar.
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-y-auto [scroll-snap-type:y_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ paddingTop: height / 2, paddingBottom: height / 2 }}
    >
      <div className="flex flex-col gap-8 px-6">
        {header}
        {steps.map((step) => (
          <div
            key={step.id}
            data-step-id={step.id}
            ref={(element) => {
              if (element) itemRefs.current.set(step.id, element);
              else itemRefs.current.delete(step.id);
            }}
            className="[scroll-snap-align:center] [scroll-snap-stop:always]"
          >
            {renderStep(step, step.id === currentStepId)}
          </div>
        ))}
      </div>
    </div>
  );
}
