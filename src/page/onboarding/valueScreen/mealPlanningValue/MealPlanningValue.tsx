import { Button } from "@/components/ui/button";

export default function MealPlanningValue() {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen max-w-screen overflow-hidden gap-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          Planne deine Mahlzeiten
        </h1>

        <p className="italic text-2xl font-semibold">
          auf die einfache Art
        </p>

        <p className="text-gray-600">
          Erstelle deinen Essensplan ohne Stress und spare Zeit beim Einkaufen!
        </p>
      </div>

      {/* Phone Screen Mockup */}
      <div className="bg-gray-900 rounded-[2.2rem] p-2 shadow-2xl">
        <img
          src="/importRecipesScreenshot.jpg"
          alt="Mobile app interface screenshot"
          className="object-cover rounded-[1.8rem] h-[32rem]"
        />
      </div>

      <div className="w-full px-8">
        <Button className="w-full rounded-full text-xl" onClick={() => {}}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
