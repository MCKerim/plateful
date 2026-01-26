export const categories = [
  { id: 1, name: "category1", color: "yellow", engTranslation: "Breakfast" },
  { id: 2, name: "category2", color: "green", engTranslation: "Main Course" },
  { id: 3, name: "category3", color: "pink", engTranslation: "Dessert" },
  { id: 4, name: "category4", color: "blue", engTranslation: "Drinks" },
  { id: 5, name: "category5", color: "purple", engTranslation: "Other" },
];

export function getTranslatedCategory(t: any, id: number): string {
  return t(`categorys.${categories.find((category) => category.id === id)?.name}`);
}

export function getCategoryIdByTranslatedEnglishName(name: string): number | null {
  for (const category of categories) {
    if (category.engTranslation === name) {
      return category.id;
    }
  }
  return null;
}

export function getEnglishCategoryNameById(id: number | null): string {
  if (id === null) return "Other";
  const category = categories.find((c) => c.id === id);
  return category?.engTranslation ?? "Other";
}
