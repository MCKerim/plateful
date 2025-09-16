export const categories = [
  { id: 0, name: "Keine" },
  { id: 1, name: "Frühstück" },
  { id: 2, name: "Hauptspeise" },
  { id: 3, name: "Dessert" },
  { id: 4, name: "Getränk" },
];

export function getTranslatedCategory(id: number): string {
  return categories.filter((category) => category.id === id)[0].name;
}
