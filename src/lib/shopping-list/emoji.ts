import { aisleInfo, type ShoppingAisle } from "@/lib/shopping-list/aisle";
import { normalize } from "@/lib/shopping-list/fuzzy";

// Generated from the native app's `ShoppingEmoji.swift`; keep the two in step.
// prettier-ignore
const BY_SLUG: Record<string, string> = {
  "apple": "🍎", "apricot": "🍑", "avocado": "🥑", "banana": "🍌", "basil": "🌿", "bell-pepper": "🫑",
  "berry": "🫐", "blueberry": "🫐", "broccoli": "🥦", "cabbage": "🥬", "carrot": "🥕",
  "cauliflower": "🥦", "celery": "🥬", "cherry": "🍒", "cherry-tomato": "🍅", "chili": "🌶️",
  "chive": "🌿", "cilantro": "🌿", "corn": "🌽", "cress": "🌿", "cucumber": "🥒", "dill": "🌿",
  "eggplant": "🍆", "garlic": "🧄", "ginger": "🫚", "grape": "🍇", "green-bean": "🫛",
  "jalapeno": "🌶️", "kale": "🥬", "kiwi": "🥝", "leek": "🧅", "lemon": "🍋", "lemongrass": "🌿",
  "lettuce": "🥬", "lime": "🍋", "mandarin-orange": "🍊", "mango": "🥭", "mint": "🌿",
  "mushroom": "🍄", "olive": "🫒", "onion": "🧅", "orange": "🍊", "parsley": "🌿", "pea": "🫛",
  "peach": "🍑", "pear": "🍐", "pickle": "🥒", "pickles": "🥒", "pineapple": "🍍", "potato": "🥔",
  "pumpkin": "🎃", "red-onion": "🧅", "shallot": "🧅", "spinach": "🥬", "spring-onion": "🧅",
  "strawberry": "🍓", "raspberry": "🍓", "sweet-potato": "🍠", "tomato": "🍅", "watermelon": "🍉",
  "zucchini": "🥒", "coconut": "🥥", "lemon-juice": "🍋", "walnut": "🌰", "hazelnut": "🌰",
  "almond": "🌰", "peanut": "🥜", "cashew": "🥜", "pine-nut": "🌰", "nut": "🥜", "bread": "🍞",
  "baguette": "🥖", "bagel": "🥯", "burger-bun": "🍔", "crescent-roll-dough": "🥐",
  "puff-pastry": "🥐", "flatbread": "🫓", "tortilla": "🫓", "pretzel-stick": "🥨", "cookie": "🍪",
  "ladyfinger": "🍪", "milk": "🥛", "egg": "🥚", "cheese": "🧀", "cheddar": "🧀", "gouda": "🧀",
  "parmesan": "🧀", "mozzarella": "🧀", "feta": "🧀", "burrata": "🧀", "ricotta": "🧀",
  "halloumi": "🧀", "cream-cheese": "🧀", "cottage-cheese": "🧀", "butter": "🧈", "ghee": "🧈",
  "cream": "🥛", "sour-cream": "🥛", "creme-fraiche": "🥛", "quark": "🥛", "yogurt": "🥛",
  "greek-yogurt": "🥛", "skyr": "🥛", "kefir": "🥛", "buttermilk": "🥛", "evaporated-milk": "🥛",
  "protein-pudding": "🍮", "chicken": "🍗", "chicken-breast": "🍗", "chicken-thigh": "🍗",
  "ground-chicken": "🍗", "turkey": "🍗", "beef": "🥩", "ground-beef": "🥩", "pork": "🥩",
  "pork-belly": "🥓", "bacon": "🥓", "ham": "🍖", "pancetta": "🥓", "sausage": "🌭", "pepperoni": "🍕",
  "salmon": "🐟", "tuna": "🐟", "shrimp": "🍤", "crab-meat": "🦀", "fish-finger": "🐟", "pasta": "🍝",
  "spaghetti": "🍝", "orzo": "🍝", "tortellini": "🥟", "gnocchi": "🥟", "rice": "🍚",
  "basmati-rice": "🍚", "brown-rice": "🍚", "rice-noodle": "🍜", "udon-noodle": "🍜",
  "egg-noodle": "🍜", "whole-wheat-ramen-noodle": "🍜", "flour": "🌾", "whole-wheat-flour": "🌾",
  "spelt-flour": "🌾", "oat": "🥣", "oat-flour": "🌾", "granola": "🥣", "cornflakes": "🥣",
  "couscous": "🍚", "bulgur": "🍚", "quinoa": "🍚", "breadcrumbs": "🍞", "cornmeal": "🌽",
  "puffed-spelt": "🥣", "salt": "🧂", "pepper": "🧂", "black-pepper": "🧂", "seasoning-salt": "🧂",
  "sugar": "🍬", "brown-sugar": "🍬", "powdered-sugar": "🍬", "vanilla-sugar": "🍬", "honey": "🍯",
  "maple-syrup": "🍁", "oil": "🫒", "olive-oil": "🫒", "sunflower-oil": "🌻", "vegetable-oil": "🫒",
  "coconut-oil": "🥥", "sesame-oil": "🫒", "chili-oil": "🌶️", "ketchup": "🍅", "mustard": "🌭",
  "mayonnaise": "🥚", "soy-sauce": "🍶", "dark-soy-sauce": "🍶", "peanut-butter": "🥜",
  "almond-butter": "🌰", "nut-butter": "🥜", "strawberry-jam": "🍓", "cocoa-powder": "🍫",
  "chili-flakes": "🌶️", "chili-powder": "🌶️", "chili-sauce": "🌶️", "hot-sauce": "🌶️",
  "sriracha": "🌶️", "curry-powder": "🍛", "curry-paste": "🍛", "garam-masala": "🍛",
  "garlic-powder": "🧄", "onion-powder": "🧅", "paprika": "🫑", "paprika-powder": "🫑",
  "smoked-paprika": "🫑", "cinnamon": "🟤", "vanilla": "🌼", "vanilla-extract": "🌼",
  "coconut-milk": "🥥", "coconut-cream": "🥥", "tomato-paste": "🍅", "tomato-passata": "🍅",
  "tomato-sauce": "🍅", "canned-tomato": "🥫", "sun-dried-tomato": "🍅", "kidney-bean": "🫘",
  "chickpea": "🫘", "lentil": "🫘", "hummus": "🫘", "tahini": "🫘", "vegetable-broth": "🍲",
  "chicken-broth": "🍲", "chicken-bouillon": "🍲", "beef-broth": "🍲", "pesto": "🌿",
  "italian-herbs": "🌿", "oregano": "🌿", "thyme": "🌿", "rosemary": "🌿", "bay-leaf": "🍃",
  "nori": "🍙", "miso-paste": "🍜", "gochujang": "🌶️", "teriyaki-sauce": "🍶", "oyster-sauce": "🍶",
  "rice-vinegar": "🍶", "vinegar": "🍾", "balsamic-vinegar": "🍾", "apple-cider-vinegar": "🍎",
  "baking-powder": "🧁", "baking-soda": "🧁", "yeast": "🍞", "gelatin": "🍮", "pudding-powder": "🍮",
  "vanilla-pudding-powder": "🍮", "protein-powder": "💪", "chia-seed": "🌱", "hemp-seed": "🌱",
  "sunflower-seed": "🌻", "pumpkin-seed": "🎃", "sesame": "🌱", "applesauce": "🍎", "ice": "🧊",
  "vanilla-ice-cream": "🍦", "dumpling": "🥟", "edamame": "🫛", "falafel": "🧆",
  "vegan-burger-patty": "🍔", "tteok": "🍡", "water": "💧", "coffee": "☕", "orange-juice": "🧃",
  "cranberry-juice": "🧃", "lemonade": "🍋", "white-wine": "🍷", "red-wine": "🍷", "rum": "🥃",
  "vodka": "🍸", "tequila": "🍹", "cointreau": "🍸", "sake": "🍶", "alcohol-free-beer": "🍺",
  "oat-milk": "🥛", "almond-milk": "🥛", "soy-milk": "🥛", "plant-milk": "🥛", "ayran": "🥛",
  "lime-juice": "🍋", "matcha": "🍵", "gyokuro-green-tea": "🍵", "chocolate": "🍫",
  "dark-chocolate": "🍫", "milk-chocolate": "🍫", "white-chocolate": "🍫", "chocolate-nibs": "🍫",
  "nachos": "🌮",
};
// prettier-ignore
const BY_WORD: [string, string][] = [
  ["klopapier", "🧻"], ["toilettenpapier", "🧻"], ["toilet", "🧻"], ["kuchenrolle", "🧻"],
  ["spulmittel", "🧽"], ["schwamm", "🧽"], ["dish", "🧽"], ["sponge", "🧽"], ["waschmittel", "🧺"],
  ["detergent", "🧺"], ["weichspuler", "🧺"], ["zahnpasta", "🪥"], ["zahnburste", "🪥"],
  ["toothpaste", "🪥"], ["toothbrush", "🪥"], ["shampoo", "🧴"], ["duschgel", "🧴"], ["seife", "🧼"],
  ["soap", "🧼"], ["deo", "🧴"], ["creme", "🧴"], ["mullbeutel", "🗑️"], ["mulltute", "🗑️"],
  ["trash", "🗑️"], ["batterie", "🔋"], ["battery", "🔋"], ["kerze", "🕯️"], ["candle", "🕯️"],
  ["blume", "💐"], ["flower", "💐"], ["erde", "🪴"], ["soil", "🪴"], ["katze", "🐱"], ["hund", "🐶"],
  ["windel", "🍼"], ["diaper", "🍼"], ["taschentuch", "🤧"], ["tissue", "🤧"], ["bier", "🍺"],
  ["beer", "🍺"], ["wein", "🍷"], ["wine", "🍷"], ["sekt", "🍾"], ["kaffee", "☕"], ["tee", "🍵"],
  ["cola", "🥤"], ["limo", "🥤"], ["saft", "🧃"], ["juice", "🧃"], ["wasser", "💧"], ["schoko", "🍫"],
  ["chocolate", "🍫"], ["eis", "🍦"], ["brotchen", "🥐"], ["brot", "🍞"], ["toast", "🍞"],
  ["kase", "🧀"], ["eier", "🥚"], ["apfel", "🍎"], ["banane", "🍌"], ["tomate", "🍅"], ["milch", "🥛"],
  ["butter", "🧈"], ["wurst", "🌭"], ["salami", "🍕"], ["schinken", "🍖"], ["hahnchen", "🍗"],
  ["huhn", "🍗"], ["hack", "🥩"], ["fleisch", "🥩"], ["fisch", "🐟"], ["lachs", "🐟"],
  ["garnele", "🍤"], ["reis", "🍚"], ["nudel", "🍝"], ["pasta", "🍝"], ["pizza", "🍕"],
  ["schokolade", "🍫"], ["chips", "🥔"], ["keks", "🍪"], ["gummib", "🍬"], ["zwiebel", "🧅"],
  ["knoblauch", "🧄"], ["kartoffel", "🥔"], ["salat", "🥬"], ["gurke", "🥒"], ["paprika", "🫑"],
  ["karotte", "🥕"], ["mohre", "🥕"], ["zitrone", "🍋"], ["orange", "🍊"], ["erdbeer", "🍓"],
  ["mehl", "🌾"], ["zucker", "🍬"], ["salz", "🧂"], ["ol", "🫒"], ["honig", "🍯"], ["joghurt", "🥛"],
  ["sahne", "🥛"], ["quark", "🥛"],
];

/**
 * The picture on a shopping tile until the dictionary carries images: an emoji
 * from the dictionary slug, else from the start of a word in the name (the
 * specific before the general, "eis" before "eier"), else the aisle's.
 */
export function shoppingEmoji(slug: string | null, name: string, aisle: ShoppingAisle): string {
  const bySlug = slug ? BY_SLUG[slug] : undefined;
  if (bySlug) return bySlug;
  // Word starts only: "chocolate" must not light up "cola".
  const words = normalize(name)
    .split(/[^\p{L}]+/u)
    .filter(Boolean);
  const byWord = BY_WORD.find(([prefix]) => words.some((word) => word.startsWith(prefix)));
  return byWord?.[1] ?? aisleInfo(aisle).emoji;
}
