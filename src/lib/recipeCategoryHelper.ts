export const categories = [
  { id: 1, name: "Frühstück" },
  { id: 2, name: "Hauptspeise" },
  { id: 3, name: "Dessert" },
  { id: 4, name: "Getränke" },
  { id: 5, name: "Sonstige" },
];

export function getTranslatedCategory(id: number): string {
  return categories.filter((category) => category.id === id)[0].name;
}
