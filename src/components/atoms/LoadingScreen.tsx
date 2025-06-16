export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      {/* Animated Dots */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.4s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.2s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high"></div>
      </div>
    </div>
  );
}
