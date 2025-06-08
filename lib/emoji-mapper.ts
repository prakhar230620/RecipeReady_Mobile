export const ingredientEmojis: Record<string, string> = {
  // Grains & Rice
  rice: "🍚",
  "basmati rice": "🍚",
  "jasmine rice": "🍚",
  "brown rice": "🍚",
  poha: "🍚",
  "flattened rice": "🍚",
  quinoa: "🌾",
  wheat: "🌾",
  flour: "🌾",
  "wheat flour": "🌾",
  "all-purpose flour": "🌾",
  oats: "🌾",
  barley: "🌾",

  // Vegetables
  potato: "🥔",
  potatoes: "🥔",
  aloo: "🥔",
  onion: "🧅",
  onions: "🧅",
  garlic: "🧄",
  ginger: "🫚",
  tomato: "🍅",
  tomatoes: "🍅",
  carrot: "🥕",
  carrots: "🥕",
  pepper: "🌶️",
  "bell pepper": "🫑",
  "green pepper": "🫑",
  "red pepper": "🫑",
  broccoli: "🥦",
  corn: "🌽",
  eggplant: "🍆",
  cucumber: "🥒",
  lettuce: "🥬",
  spinach: "🥬",
  mushroom: "🍄",
  mushrooms: "🍄",
  cabbage: "🥬",
  cauliflower: "🥦",
  peas: "🟢",
  "green peas": "🟢",

  // Fruits
  apple: "🍎",
  apples: "🍎",
  banana: "🍌",
  bananas: "🍌",
  orange: "🍊",
  oranges: "🍊",
  lemon: "🍋",
  lemons: "🍋",
  lime: "🍋",
  limes: "🍋",
  strawberry: "🍓",
  strawberries: "🍓",
  grape: "🍇",
  grapes: "🍇",
  pineapple: "🍍",
  mango: "🥭",
  mangoes: "🥭",
  avocado: "🥑",
  avocados: "🥑",
  coconut: "🥥",

  // Proteins
  chicken: "🐔",
  beef: "🥩",
  pork: "🐷",
  fish: "🐟",
  salmon: "🐟",
  tuna: "🐟",
  shrimp: "🦐",
  prawns: "🦐",
  egg: "🥚",
  eggs: "🥚",
  tofu: "🧈",
  paneer: "🧀",
  cheese: "🧀",
  milk: "🥛",
  yogurt: "🥛",
  "greek yogurt": "🥛",
  butter: "🧈",
  ghee: "🧈",

  // Spices & Seasonings
  salt: "🧂",
  pepper: "🌶️",
  "black pepper": "🌶️",
  basil: "🌿",
  parsley: "🌿",
  cilantro: "🌿",
  coriander: "🌿",
  "fresh cilantro": "🌿",
  mint: "🌿",
  cumin: "🌿",
  "ground cumin": "🌿",
  turmeric: "🌿",
  "red chili powder": "🌶️",
  "chili powder": "🌶️",
  paprika: "🌶️",
  oregano: "🌿",
  thyme: "🌿",
  rosemary: "🌿",
  "garam masala": "🌿",
  cinnamon: "🌿",
  cardamom: "🌿",

  // Oils & Liquids
  oil: "🫒",
  "olive oil": "🫒",
  "vegetable oil": "🫒",
  "coconut oil": "🫒",
  water: "💧",
  broth: "🍲",
  "chicken broth": "🍲",
  "vegetable broth": "🍲",
  "coconut milk": "🥥",
  cream: "🥛",
  "heavy cream": "🥛",

  // Grains & Carbs
  bread: "🍞",
  pasta: "🍝",
  noodles: "🍜",
  "rice noodles": "🍜",
  tortilla: "🌮",
  "pita bread": "🫓",

  // Nuts & Seeds
  almonds: "🌰",
  walnuts: "🌰",
  cashews: "🌰",
  peanuts: "🥜",
  "sesame seeds": "🌰",
  "sunflower seeds": "🌰",

  // Cooking actions
  cook: "🔥",
  bake: "🔥",
  fry: "🔥",
  boil: "💧",
  steam: "💨",
  grill: "🔥",
  roast: "🔥",
  sauté: "🔥",
  simmer: "🔥",
  mix: "🥄",
  stir: "🥄",
  chop: "🔪",
  slice: "🔪",
  dice: "🔪",
  season: "🧂",
  serve: "🍽️",
  garnish: "🌿",
  heat: "🔥",
  add: "➕",
}

export function addEmojisToText(text: string): string {
  let result = text

  // Sort by length (longest first) to avoid partial matches
  const sortedEntries = Object.entries(ingredientEmojis).sort((a, b) => b[0].length - a[0].length)

  sortedEntries.forEach(([ingredient, emoji]) => {
    // Create regex that matches the ingredient as a whole word or at the beginning of a phrase
    const regex = new RegExp(`\\b${ingredient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")

    // Only add emoji if it's not already there
    result = result.replace(regex, (match) => {
      // Check if emoji is already present after this ingredient
      const nextChar = result[result.indexOf(match) + match.length]
      if (nextChar && /[\u{1F300}-\u{1F9FF}]/u.test(nextChar)) {
        return match // Don't add emoji if one is already there
      }
      return `${match} ${emoji}`
    })
  })

  return result
}

export function addEmojisToIngredients(ingredients: string[]): string[] {
  return ingredients.map((ingredient) => addEmojisToText(ingredient))
}

export function addEmojisToInstructions(instructions: string[]): string[] {
  return instructions.map((instruction) => addEmojisToText(instruction))
}
