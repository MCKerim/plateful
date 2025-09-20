export const categories = [
  { id: 1, name: "Frühstück", color: "yellow" },
  { id: 2, name: "Hauptspeise", color: "green" },
  { id: 3, name: "Dessert", color: "pink" },
  { id: 4, name: "Getränke", color: "blue" },
  { id: 5, name: "Sonstige", color: "purple" },
];

export function getTranslatedCategory(id: number): string {
  return categories.filter((category) => category.id === id)[0].name;
}
