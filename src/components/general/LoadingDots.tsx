export default function LoadingDots() {
  return (
    <div className="flex space-x-2">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.4s]"></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.2s]"></div>
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce-high"></div>
    </div>
  );
}
