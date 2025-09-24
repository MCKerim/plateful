export const categories = [
  { id: 1, name: "category1", color: "yellow" },
  { id: 2, name: "category2", color: "green" },
  { id: 3, name: "category3", color: "pink" },
  { id: 4, name: "category4", color: "blue" },
  { id: 5, name: "category5", color: "purple" },
];

export function getTranslatedCategory(t: any, id: number): string {
  return t(`categorys.${categories.filter((category) => category.id === id)[0].name}`);
}
