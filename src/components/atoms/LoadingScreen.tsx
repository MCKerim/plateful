import LoadingDots from "./LoadingDots";

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <LoadingDots />
    </div>
  );
}
