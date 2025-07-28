export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      {/* Animated Dots */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.4s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.2s]"></div>
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce-high"></div>
      </div>
    </div>
  );
}
