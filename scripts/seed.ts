/**
 * Idempotent seed script for the Recipe & Ingredient Substitution graph.
 * Run with: npm run seed
 *
 * Uses MERGE everywhere so re-running it is safe and never creates
 * duplicate nodes/relationships.
 */
import { config } from "dotenv";
import neo4j from "neo4j-driver";

config({ path: ".env.local" });

type IngredientDef = { name: string; category: string };
type SubDef = { from: string; to: string; context: string; notes: string };
type RecipeDef = {
  id: string;
  name: string;
  cuisine: string;
  dietTags: string[];
  prepTimeMinutes: number;
  servings: number;
  emoji: string;
  description: string;
  instructions: string[];
  ingredients: { name: string; quantity: string; optional?: boolean }[];
};

const INGREDIENTS: IngredientDef[] = [
  // dairy & dairy-free alternatives
  { name: "Butter", category: "Dairy" },
  { name: "Vegan Butter", category: "Dairy-Free" },
  { name: "Milk", category: "Dairy" },
  { name: "Almond Milk", category: "Dairy-Free" },
  { name: "Oat Milk", category: "Dairy-Free" },
  { name: "Coconut Milk", category: "Dairy-Free" },
  { name: "Buttermilk", category: "Dairy" },
  { name: "Heavy Cream", category: "Dairy" },
  { name: "Coconut Cream", category: "Dairy-Free" },
  { name: "Sour Cream", category: "Dairy" },
  { name: "Plain Yogurt", category: "Dairy" },
  { name: "Greek Yogurt", category: "Dairy" },
  { name: "Coconut Yogurt", category: "Dairy-Free" },
  { name: "Cream Cheese", category: "Dairy" },
  { name: "Cheddar Cheese", category: "Dairy" },
  { name: "Mozzarella Cheese", category: "Dairy" },
  { name: "Parmesan Cheese", category: "Dairy" },
  { name: "Feta Cheese", category: "Dairy" },
  { name: "Paneer", category: "Dairy" },
  { name: "Nutritional Yeast", category: "Dairy-Free" },
  // eggs & substitutes
  { name: "Egg", category: "Protein" },
  { name: "Flax Egg", category: "Dairy-Free" },
  { name: "Applesauce", category: "Fruit" },
  { name: "Aquafaba", category: "Dairy-Free" },
  // fats & oils
  { name: "Olive Oil", category: "Fat" },
  { name: "Vegetable Oil", category: "Fat" },
  { name: "Coconut Oil", category: "Fat" },
  { name: "Sesame Oil", category: "Fat" },
  { name: "Ghee", category: "Fat" },
  // sweeteners
  { name: "White Sugar", category: "Sweetener" },
  { name: "Brown Sugar", category: "Sweetener" },
  { name: "Honey", category: "Sweetener" },
  { name: "Maple Syrup", category: "Sweetener" },
  { name: "Agave Nectar", category: "Sweetener" },
  // flours & grains
  { name: "All-Purpose Flour", category: "Grain" },
  { name: "Whole Wheat Flour", category: "Grain" },
  { name: "Almond Flour", category: "Grain" },
  { name: "Rice Flour", category: "Grain" },
  { name: "Cornstarch", category: "Grain" },
  { name: "Breadcrumbs", category: "Grain" },
  { name: "Panko", category: "Grain" },
  { name: "Rice", category: "Grain" },
  { name: "Quinoa", category: "Grain" },
  { name: "Pasta", category: "Grain" },
  { name: "Couscous", category: "Grain" },
  { name: "Rolled Oats", category: "Grain" },
  { name: "Tortilla", category: "Grain" },
  { name: "Naan", category: "Grain" },
  { name: "Pita Bread", category: "Grain" },
  // proteins
  { name: "Chicken Breast", category: "Protein" },
  { name: "Chicken Thigh", category: "Protein" },
  { name: "Ground Beef", category: "Protein" },
  { name: "Ground Turkey", category: "Protein" },
  { name: "Pork Loin", category: "Protein" },
  { name: "Bacon", category: "Protein" },
  { name: "Tofu", category: "Protein" },
  { name: "Tempeh", category: "Protein" },
  { name: "Shrimp", category: "Protein" },
  { name: "Salmon", category: "Protein" },
  { name: "Cod", category: "Protein" },
  { name: "Chickpeas", category: "Legume" },
  { name: "Black Beans", category: "Legume" },
  { name: "Kidney Beans", category: "Legume" },
  { name: "Lentils", category: "Legume" },
  { name: "Mushroom", category: "Vegetable" },
  // vegetables & aromatics
  { name: "Onion", category: "Vegetable" },
  { name: "Garlic", category: "Vegetable" },
  { name: "Shallot", category: "Vegetable" },
  { name: "Scallion", category: "Vegetable" },
  { name: "Carrot", category: "Vegetable" },
  { name: "Celery", category: "Vegetable" },
  { name: "Bell Pepper", category: "Vegetable" },
  { name: "Tomato", category: "Vegetable" },
  { name: "Canned Tomato", category: "Vegetable" },
  { name: "Potato", category: "Vegetable" },
  { name: "Sweet Potato", category: "Vegetable" },
  { name: "Zucchini", category: "Vegetable" },
  { name: "Eggplant", category: "Vegetable" },
  { name: "Spinach", category: "Vegetable" },
  { name: "Kale", category: "Vegetable" },
  { name: "Broccoli", category: "Vegetable" },
  { name: "Cauliflower", category: "Vegetable" },
  { name: "Cucumber", category: "Vegetable" },
  { name: "Cabbage", category: "Vegetable" },
  { name: "Corn", category: "Vegetable" },
  { name: "Peas", category: "Vegetable" },
  { name: "Ginger", category: "Vegetable" },
  { name: "Chili Pepper", category: "Vegetable" },
  { name: "Lime", category: "Fruit" },
  { name: "Lemon", category: "Fruit" },
  // herbs & spices
  { name: "Basil", category: "Herb" },
  { name: "Cilantro", category: "Herb" },
  { name: "Parsley", category: "Herb" },
  { name: "Oregano", category: "Herb" },
  { name: "Thyme", category: "Herb" },
  { name: "Mint", category: "Herb" },
  { name: "Cumin", category: "Spice" },
  { name: "Coriander", category: "Spice" },
  { name: "Paprika", category: "Spice" },
  { name: "Chili Powder", category: "Spice" },
  { name: "Turmeric", category: "Spice" },
  { name: "Garam Masala", category: "Spice" },
  { name: "Cinnamon", category: "Spice" },
  { name: "Black Pepper", category: "Spice" },
  { name: "Salt", category: "Spice" },
  // condiments & other
  { name: "Soy Sauce", category: "Condiment" },
  { name: "Tamari", category: "Condiment" },
  { name: "Fish Sauce", category: "Condiment" },
  { name: "Rice Vinegar", category: "Condiment" },
  { name: "White Vinegar", category: "Condiment" },
  { name: "Balsamic Vinegar", category: "Condiment" },
  { name: "Tomato Paste", category: "Condiment" },
  { name: "Tahini", category: "Condiment" },
  { name: "Peanut Butter", category: "Condiment" },
  { name: "Vegetable Stock", category: "Condiment" },
  { name: "Chicken Stock", category: "Condiment" },
  { name: "Mustard", category: "Condiment" },
  { name: "Mayonnaise", category: "Condiment" },
  { name: "Hot Sauce", category: "Condiment" },
  { name: "Curry Paste", category: "Condiment" },
  { name: "Miso Paste", category: "Condiment" },
  { name: "Walnuts", category: "Nuts" },
  { name: "Cashews", category: "Nuts" },
  { name: "Peanuts", category: "Nuts" },
];

const CUISINES = [
  "Italian",
  "Indian",
  "Mexican",
  "Thai",
  "Mediterranean",
  "American",
  "Japanese",
  "Middle Eastern",
];

const DIET_TAGS = ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Pescatarian", "Nut-Free"];

// Directed: `from` can be used in place of `to`.
const SUBSTITUTIONS: SubDef[] = [
  { from: "Vegan Butter", to: "Butter", context: "baking & cooking", notes: "1:1, slightly less rich" },
  { from: "Coconut Oil", to: "Butter", context: "baking", notes: "1:1 when solid" },
  { from: "Applesauce", to: "Butter", context: "baking", notes: "halves the fat, adds sweetness" },
  { from: "Olive Oil", to: "Butter", context: "sauteing", notes: "use 3/4 the amount" },
  { from: "Almond Milk", to: "Milk", context: "baking & drinking", notes: "1:1, slightly nutty" },
  { from: "Oat Milk", to: "Milk", context: "baking & drinking", notes: "1:1, creamier body" },
  { from: "Coconut Milk", to: "Milk", context: "curries & baking", notes: "1:1, adds coconut flavor" },
  { from: "Milk", to: "Buttermilk", context: "baking", notes: "add 1 tbsp lemon juice per cup" },
  { from: "Plain Yogurt", to: "Buttermilk", context: "baking", notes: "thin with a splash of milk" },
  { from: "Coconut Cream", to: "Heavy Cream", context: "sauces & desserts", notes: "1:1, chill before whipping" },
  { from: "Greek Yogurt", to: "Sour Cream", context: "toppings & baking", notes: "1:1, tangier" },
  { from: "Coconut Yogurt", to: "Greek Yogurt", context: "toppings", notes: "1:1, dairy-free" },
  { from: "Cashews", to: "Cream Cheese", context: "spreads", notes: "soak & blend for a vegan spread" },
  { from: "Nutritional Yeast", to: "Parmesan Cheese", context: "finishing", notes: "adds umami, no dairy" },
  { from: "Flax Egg", to: "Egg", context: "baking", notes: "1 tbsp ground flax + 3 tbsp water per egg" },
  { from: "Applesauce", to: "Egg", context: "baking", notes: "1/4 cup per egg" },
  { from: "Aquafaba", to: "Egg", context: "baking & meringue", notes: "3 tbsp per egg" },
  { from: "Honey", to: "White Sugar", context: "baking & sweetening", notes: "use 3/4 amount, reduce liquid" },
  { from: "Maple Syrup", to: "White Sugar", context: "baking & sweetening", notes: "use 3/4 amount, reduce liquid" },
  { from: "Agave Nectar", to: "Honey", context: "sweetening", notes: "1:1, milder flavor" },
  { from: "Brown Sugar", to: "White Sugar", context: "baking", notes: "1:1, adds moisture & caramel note" },
  { from: "Almond Flour", to: "All-Purpose Flour", context: "baking", notes: "not 1:1, denser result" },
  { from: "Whole Wheat Flour", to: "All-Purpose Flour", context: "baking", notes: "1:1, denser & nuttier" },
  { from: "Rice Flour", to: "All-Purpose Flour", context: "thickening & gluten-free baking", notes: "use 2/3 amount" },
  { from: "Cornstarch", to: "All-Purpose Flour", context: "thickening sauces", notes: "use half the amount" },
  { from: "Panko", to: "Breadcrumbs", context: "coating & topping", notes: "1:1, lighter crunch" },
  { from: "Quinoa", to: "Rice", context: "side dishes", notes: "1:1, higher protein" },
  { from: "Couscous", to: "Rice", context: "side dishes", notes: "1:1, faster cooking" },
  { from: "Tofu", to: "Chicken Breast", context: "stir-fries & curries", notes: "press first, absorbs sauce well" },
  { from: "Tempeh", to: "Chicken Breast", context: "stir-fries", notes: "firmer, nuttier bite" },
  { from: "Chickpeas", to: "Chicken Breast", context: "curries & salads", notes: "different texture, similar heartiness" },
  { from: "Mushroom", to: "Ground Beef", context: "sauces & fillings", notes: "finely chop, adds umami" },
  { from: "Lentils", to: "Ground Beef", context: "sauces & fillings", notes: "cook down until soft" },
  { from: "Ground Turkey", to: "Ground Beef", context: "any recipe", notes: "leaner, season a bit more" },
  { from: "Cod", to: "Shrimp", context: "curries & stir-fries", notes: "flakier texture" },
  { from: "Tamari", to: "Soy Sauce", context: "any recipe", notes: "1:1, gluten-free" },
  { from: "Fish Sauce", to: "Soy Sauce", context: "Southeast Asian dishes", notes: "use less, much stronger" },
  { from: "Rice Vinegar", to: "White Vinegar", context: "dressings & pickling", notes: "milder acidity" },
  { from: "Balsamic Vinegar", to: "Rice Vinegar", context: "dressings", notes: "sweeter & darker" },
  { from: "Vegetable Stock", to: "Chicken Stock", context: "soups & braises", notes: "1:1, vegetarian" },
  { from: "Shallot", to: "Onion", context: "any recipe", notes: "milder & sweeter, use a bit more" },
  { from: "Scallion", to: "Onion", context: "garnish & light cooking", notes: "milder, use more" },
  { from: "Ghee", to: "Butter", context: "Indian cooking", notes: "1:1, higher smoke point" },
  { from: "Canned Tomato", to: "Tomato", context: "sauces & stews", notes: "1:1, already cooked down" },
  { from: "Peanut Butter", to: "Tahini", context: "sauces & dressings", notes: "sweeter, nuttier" },
  { from: "Cashews", to: "Peanuts", context: "garnish & sauces", notes: "milder, creamier" },
];

const RECIPES: RecipeDef[] = [
  {
    id: "classic-margherita-pizza",
    name: "Classic Margherita Pizza",
    cuisine: "Italian",
    dietTags: ["Vegetarian"],
    prepTimeMinutes: 40,
    servings: 4,
    emoji: "🍕",
    description: "A simple, ingredient-driven pizza built around fresh mozzarella and basil.",
    instructions: [
      "Stretch the dough into a 12-inch round on a floured surface.",
      "Spread a thin layer of crushed canned tomato, leaving a border for the crust.",
      "Tear mozzarella over the top and drizzle with olive oil.",
      "Bake at the highest oven setting on a hot stone or tray for 8-10 minutes.",
      "Finish with fresh basil and a pinch of salt.",
    ],
    ingredients: [
      { name: "All-Purpose Flour", quantity: "2 cups" },
      { name: "Canned Tomato", quantity: "1 cup" },
      { name: "Mozzarella Cheese", quantity: "200g" },
      { name: "Basil", quantity: "a handful" },
      { name: "Olive Oil", quantity: "2 tbsp" },
      { name: "Salt", quantity: "1 tsp" },
    ],
  },
  {
    id: "creamy-mushroom-risotto",
    name: "Creamy Mushroom Risotto",
    cuisine: "Italian",
    dietTags: ["Vegetarian", "Gluten-Free"],
    prepTimeMinutes: 45,
    servings: 4,
    emoji: "🍚",
    description: "Slow-stirred rice that turns silky as it soaks up mushroom stock.",
    instructions: [
      "Saute onion and garlic in butter until soft.",
      "Add rice and toast for 2 minutes.",
      "Add mushrooms, then ladle in warm vegetable stock a cup at a time, stirring until absorbed.",
      "Finish with parmesan and a knob of butter off the heat.",
    ],
    ingredients: [
      { name: "Rice", quantity: "1.5 cups" },
      { name: "Mushroom", quantity: "250g" },
      { name: "Onion", quantity: "1" },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Vegetable Stock", quantity: "4 cups" },
      { name: "Butter", quantity: "3 tbsp" },
      { name: "Parmesan Cheese", quantity: "1/2 cup" },
    ],
  },
  {
    id: "spaghetti-bolognese",
    name: "Spaghetti Bolognese",
    cuisine: "Italian",
    dietTags: [],
    prepTimeMinutes: 50,
    servings: 4,
    emoji: "🍝",
    description: "A weeknight red sauce built on slow-cooked ground beef and aromatics.",
    instructions: [
      "Saute onion, carrot and celery until softened.",
      "Brown the ground beef, breaking it up as it cooks.",
      "Stir in tomato paste and canned tomato, then simmer 30 minutes.",
      "Season and toss with cooked pasta.",
    ],
    ingredients: [
      { name: "Ground Beef", quantity: "400g" },
      { name: "Onion", quantity: "1" },
      { name: "Carrot", quantity: "1" },
      { name: "Celery", quantity: "1 stalk" },
      { name: "Canned Tomato", quantity: "2 cups" },
      { name: "Tomato Paste", quantity: "2 tbsp" },
      { name: "Pasta", quantity: "400g" },
      { name: "Parmesan Cheese", quantity: "to serve", optional: true },
    ],
  },
  {
    id: "basil-pesto-pasta",
    name: "Basil Pesto Pasta",
    cuisine: "Italian",
    dietTags: ["Vegetarian"],
    prepTimeMinutes: 20,
    servings: 4,
    emoji: "🌿",
    description: "A five-minute blender sauce that turns dried pasta into something bright.",
    instructions: [
      "Blend basil, garlic, walnuts and parmesan with olive oil until smooth.",
      "Cook pasta until al dente, reserving a splash of pasta water.",
      "Toss the pasta with pesto, loosening with pasta water as needed.",
    ],
    ingredients: [
      { name: "Pasta", quantity: "400g" },
      { name: "Basil", quantity: "2 cups" },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Walnuts", quantity: "1/2 cup" },
      { name: "Parmesan Cheese", quantity: "1/2 cup" },
      { name: "Olive Oil", quantity: "1/2 cup" },
    ],
  },
  {
    id: "butter-chicken",
    name: "Butter Chicken",
    cuisine: "Indian",
    dietTags: ["Gluten-Free"],
    prepTimeMinutes: 55,
    servings: 4,
    emoji: "🍛",
    description: "Marinated chicken simmered in a spiced tomato-cream sauce.",
    instructions: [
      "Marinate chicken in yogurt, garam masala and turmeric for at least 1 hour.",
      "Sear the chicken, then set aside.",
      "Build the sauce from onion, garlic, ginger, canned tomato and cream, then simmer.",
      "Return chicken to the sauce and finish with butter.",
      "Serve with rice or naan.",
    ],
    ingredients: [
      { name: "Chicken Thigh", quantity: "600g" },
      { name: "Plain Yogurt", quantity: "1/2 cup" },
      { name: "Garam Masala", quantity: "2 tbsp" },
      { name: "Turmeric", quantity: "1 tsp" },
      { name: "Onion", quantity: "1" },
      { name: "Garlic", quantity: "3 cloves" },
      { name: "Ginger", quantity: "1 tbsp" },
      { name: "Canned Tomato", quantity: "2 cups" },
      { name: "Heavy Cream", quantity: "1/2 cup" },
      { name: "Butter", quantity: "3 tbsp" },
      { name: "Rice", quantity: "to serve", optional: true },
    ],
  },
  {
    id: "chana-masala",
    name: "Chana Masala",
    cuisine: "Indian",
    dietTags: ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"],
    prepTimeMinutes: 35,
    servings: 4,
    emoji: "🫘",
    description: "A pantry-friendly chickpea curry built on onion, tomato and warm spices.",
    instructions: [
      "Saute onion, garlic and ginger until golden.",
      "Add cumin, coriander, turmeric and chili powder, then bloom for 30 seconds.",
      "Stir in canned tomato and chickpeas, simmer 20 minutes.",
      "Finish with cilantro and a squeeze of lime.",
    ],
    ingredients: [
      { name: "Chickpeas", quantity: "2 cans" },
      { name: "Onion", quantity: "1" },
      { name: "Garlic", quantity: "3 cloves" },
      { name: "Ginger", quantity: "1 tbsp" },
      { name: "Canned Tomato", quantity: "1.5 cups" },
      { name: "Cumin", quantity: "1 tsp" },
      { name: "Coriander", quantity: "1 tsp" },
      { name: "Turmeric", quantity: "1 tsp" },
      { name: "Chili Powder", quantity: "1/2 tsp" },
      { name: "Cilantro", quantity: "a handful" },
      { name: "Lime", quantity: "1" },
    ],
  },
  {
    id: "saag-paneer",
    name: "Saag Paneer",
    cuisine: "Indian",
    dietTags: ["Vegetarian", "Gluten-Free"],
    prepTimeMinutes: 40,
    servings: 4,
    emoji: "🥬",
    description: "Pan-seared paneer folded into a garlicky pureed spinach sauce.",
    instructions: [
      "Blanch spinach and kale, then blend into a puree.",
      "Sear cubed paneer until golden, set aside.",
      "Saute onion, garlic and ginger, add spices, then stir in the puree.",
      "Fold the paneer back in and finish with a splash of cream.",
    ],
    ingredients: [
      { name: "Paneer", quantity: "300g" },
      { name: "Spinach", quantity: "4 cups" },
      { name: "Kale", quantity: "2 cups" },
      { name: "Onion", quantity: "1" },
      { name: "Garlic", quantity: "3 cloves" },
      { name: "Ginger", quantity: "1 tbsp" },
      { name: "Garam Masala", quantity: "1 tsp" },
      { name: "Heavy Cream", quantity: "1/4 cup" },
      { name: "Ghee", quantity: "2 tbsp" },
    ],
  },
  {
    id: "lentil-dal",
    name: "Coconut Lentil Dal",
    cuisine: "Indian",
    dietTags: ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"],
    prepTimeMinutes: 35,
    servings: 4,
    emoji: "🍲",
    description: "Red lentils simmered soft with coconut milk and toasted spices.",
    instructions: [
      "Rinse lentils and simmer with turmeric until soft.",
      "Saute onion, garlic and ginger with cumin and mustard seed.",
      "Stir the tempered spices and coconut milk into the lentils.",
      "Finish with cilantro and lime.",
    ],
    ingredients: [
      { name: "Lentils", quantity: "1.5 cups" },
      { name: "Coconut Milk", quantity: "1 can" },
      { name: "Onion", quantity: "1" },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Ginger", quantity: "1 tbsp" },
      { name: "Cumin", quantity: "1 tsp" },
      { name: "Turmeric", quantity: "1 tsp" },
      { name: "Cilantro", quantity: "a handful" },
      { name: "Lime", quantity: "1" },
    ],
  },
  {
    id: "chicken-tacos",
    name: "Chicken Tacos",
    cuisine: "Mexican",
    dietTags: [],
    prepTimeMinutes: 30,
    servings: 4,
    emoji: "🌮",
    description: "Seared, spiced chicken piled onto warm tortillas with quick toppings.",
    instructions: [
      "Season chicken with cumin, paprika and chili powder, then sear until cooked through.",
      "Slice thinly and warm the tortillas.",
      "Assemble with onion, cilantro and a squeeze of lime.",
    ],
    ingredients: [
      { name: "Chicken Breast", quantity: "500g" },
      { name: "Cumin", quantity: "1 tsp" },
      { name: "Paprika", quantity: "1 tsp" },
      { name: "Chili Powder", quantity: "1 tsp" },
      { name: "Tortilla", quantity: "8" },
      { name: "Onion", quantity: "1/2" },
      { name: "Cilantro", quantity: "a handful" },
      { name: "Lime", quantity: "1" },
    ],
  },
  {
    id: "black-bean-tacos",
    name: "Black Bean & Corn Tacos",
    cuisine: "Mexican",
    dietTags: ["Vegan", "Vegetarian", "Dairy-Free"],
    prepTimeMinutes: 20,
    servings: 4,
    emoji: "🫓",
    description: "A fast, pantry-driven vegetarian taco built on black beans and corn.",
    instructions: [
      "Warm black beans and corn with cumin and chili powder.",
      "Warm the tortillas.",
      "Assemble with onion, cilantro, lime and hot sauce.",
    ],
    ingredients: [
      { name: "Black Beans", quantity: "2 cans" },
      { name: "Corn", quantity: "1 cup" },
      { name: "Cumin", quantity: "1 tsp" },
      { name: "Chili Powder", quantity: "1 tsp" },
      { name: "Tortilla", quantity: "8" },
      { name: "Onion", quantity: "1/2" },
      { name: "Cilantro", quantity: "a handful" },
      { name: "Lime", quantity: "1" },
      { name: "Hot Sauce", quantity: "to taste", optional: true },
    ],
  },
  {
    id: "beef-chili",
    name: "Smoky Beef Chili",
    cuisine: "Mexican",
    dietTags: ["Gluten-Free"],
    prepTimeMinutes: 60,
    servings: 6,
    emoji: "🌶️",
    description: "A long-simmered chili built on ground beef, beans and smoked spices.",
    instructions: [
      "Brown ground beef with onion and garlic.",
      "Stir in chili powder, cumin and paprika, then bloom briefly.",
      "Add canned tomato, kidney beans and stock, simmer 40 minutes.",
    ],
    ingredients: [
      { name: "Ground Beef", quantity: "500g" },
      { name: "Onion", quantity: "1" },
      { name: "Garlic", quantity: "3 cloves" },
      { name: "Chili Powder", quantity: "2 tbsp" },
      { name: "Cumin", quantity: "1 tbsp" },
      { name: "Paprika", quantity: "1 tsp" },
      { name: "Canned Tomato", quantity: "2 cups" },
      { name: "Kidney Beans", quantity: "2 cans" },
      { name: "Chicken Stock", quantity: "1 cup" },
    ],
  },
  {
    id: "guacamole",
    name: "Classic Guacamole",
    cuisine: "Mexican",
    dietTags: ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Nut-Free"],
    prepTimeMinutes: 10,
    servings: 4,
    emoji: "🥑",
    description: "A five-ingredient dip that leans entirely on ripe avocado and lime.",
    instructions: [
      "Mash avocado to your preferred texture.",
      "Fold in onion, cilantro, lime juice and salt.",
      "Taste and adjust salt and lime before serving.",
    ],
    ingredients: [
      { name: "Onion", quantity: "1/4" },
      { name: "Cilantro", quantity: "a handful" },
      { name: "Lime", quantity: "1" },
      { name: "Salt", quantity: "1/2 tsp" },
      { name: "Chili Pepper", quantity: "1", optional: true },
    ],
  },
  {
    id: "pad-thai",
    name: "Shrimp Pad Thai",
    cuisine: "Thai",
    dietTags: ["Pescatarian"],
    prepTimeMinutes: 30,
    servings: 4,
    emoji: "🍤",
    description: "Stir-fried rice noodles balanced across sweet, sour, salty and savory.",
    instructions: [
      "Soak rice noodles until pliable.",
      "Stir-fry shrimp and garlic in a hot wok, then push to the side.",
      "Scramble in egg, then toss with noodles, fish sauce, lime and peanuts.",
    ],
    ingredients: [
      { name: "Shrimp", quantity: "400g" },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Egg", quantity: "2" },
      { name: "Fish Sauce", quantity: "2 tbsp" },
      { name: "Lime", quantity: "1" },
      { name: "Peanuts", quantity: "1/4 cup" },
      { name: "Scallion", quantity: "2" },
    ],
  },
  {
    id: "green-curry",
    name: "Thai Green Curry",
    cuisine: "Thai",
    dietTags: ["Gluten-Free", "Dairy-Free"],
    prepTimeMinutes: 35,
    servings: 4,
    emoji: "🍛",
    description: "A fast coconut curry that leans on store-bought curry paste for depth.",
    instructions: [
      "Fry curry paste in a splash of coconut milk until fragrant.",
      "Add chicken and cook until nearly done.",
      "Pour in the rest of the coconut milk and vegetables, simmer until tender.",
      "Finish with basil and fish sauce.",
    ],
    ingredients: [
      { name: "Chicken Breast", quantity: "500g" },
      { name: "Curry Paste", quantity: "3 tbsp" },
      { name: "Coconut Milk", quantity: "2 cans" },
      { name: "Bell Pepper", quantity: "1" },
      { name: "Zucchini", quantity: "1" },
      { name: "Basil", quantity: "a handful" },
      { name: "Fish Sauce", quantity: "1 tbsp" },
    ],
  },
  {
    id: "tom-yum-soup",
    name: "Tom Yum Soup",
    cuisine: "Thai",
    dietTags: ["Pescatarian", "Gluten-Free", "Dairy-Free"],
    prepTimeMinutes: 25,
    servings: 4,
    emoji: "🍜",
    description: "A hot and sour broth built on lemongrass, lime and chili.",
    instructions: [
      "Simmer stock with ginger, chili pepper and lime leaves.",
      "Add shrimp and mushroom, cook until shrimp is pink.",
      "Season with fish sauce and lime juice off the heat.",
    ],
    ingredients: [
      { name: "Shrimp", quantity: "300g" },
      { name: "Mushroom", quantity: "150g" },
      { name: "Chicken Stock", quantity: "4 cups" },
      { name: "Ginger", quantity: "1 tbsp" },
      { name: "Chili Pepper", quantity: "2" },
      { name: "Fish Sauce", quantity: "2 tbsp" },
      { name: "Lime", quantity: "2" },
      { name: "Cilantro", quantity: "a handful" },
    ],
  },
  {
    id: "vegetable-fried-rice",
    name: "Vegetable Fried Rice",
    cuisine: "Thai",
    dietTags: ["Vegan", "Vegetarian", "Dairy-Free"],
    prepTimeMinutes: 20,
    servings: 4,
    emoji: "🍛",
    description: "A next-day-rice fried rice built to use up whatever vegetables are on hand.",
    instructions: [
      "Scramble egg in a hot wok and set aside (skip for vegan).",
      "Stir-fry garlic, carrot, peas and corn.",
      "Add cold cooked rice, breaking up clumps, then season with soy sauce.",
      "Fold the egg back in and finish with scallion.",
    ],
    ingredients: [
      { name: "Rice", quantity: "3 cups" },
      { name: "Egg", quantity: "2", optional: true },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Carrot", quantity: "1" },
      { name: "Peas", quantity: "1/2 cup" },
      { name: "Corn", quantity: "1/2 cup" },
      { name: "Soy Sauce", quantity: "2 tbsp" },
      { name: "Scallion", quantity: "2" },
    ],
  },
  {
    id: "greek-salad",
    name: "Greek Salad",
    cuisine: "Mediterranean",
    dietTags: ["Vegetarian", "Gluten-Free", "Nut-Free"],
    prepTimeMinutes: 15,
    servings: 4,
    emoji: "🥗",
    description: "A crisp, no-cook salad built on tomato, cucumber and feta.",
    instructions: [
      "Chop tomato, cucumber and onion into large pieces.",
      "Toss with olive oil and a splash of vinegar.",
      "Top with crumbled feta and oregano.",
    ],
    ingredients: [
      { name: "Tomato", quantity: "3" },
      { name: "Cucumber", quantity: "1" },
      { name: "Onion", quantity: "1/2" },
      { name: "Feta Cheese", quantity: "150g" },
      { name: "Olive Oil", quantity: "3 tbsp" },
      { name: "Balsamic Vinegar", quantity: "1 tbsp" },
      { name: "Oregano", quantity: "1 tsp" },
    ],
  },
  {
    id: "hummus",
    name: "Classic Hummus",
    cuisine: "Middle Eastern",
    dietTags: ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"],
    prepTimeMinutes: 10,
    servings: 6,
    emoji: "🧆",
    description: "A creamy chickpea dip built almost entirely on pantry staples.",
    instructions: [
      "Blend chickpeas, tahini, garlic and lemon juice until smooth.",
      "Thin with olive oil and a splash of water to the right consistency.",
      "Season with salt and cumin, finish with a drizzle of olive oil.",
    ],
    ingredients: [
      { name: "Chickpeas", quantity: "2 cans" },
      { name: "Tahini", quantity: "1/3 cup" },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Lemon", quantity: "1" },
      { name: "Olive Oil", quantity: "1/4 cup" },
      { name: "Cumin", quantity: "1/2 tsp" },
      { name: "Salt", quantity: "1/2 tsp" },
    ],
  },
  {
    id: "falafel",
    name: "Baked Falafel",
    cuisine: "Middle Eastern",
    dietTags: ["Vegan", "Vegetarian", "Dairy-Free"],
    prepTimeMinutes: 40,
    servings: 4,
    emoji: "🧅",
    description: "Herb-packed chickpea patties baked instead of fried.",
    instructions: [
      "Pulse chickpeas, onion, garlic, parsley, cilantro and spices in a food processor.",
      "Shape into patties and chill 20 minutes.",
      "Bake at high heat until golden, flipping once.",
    ],
    ingredients: [
      { name: "Chickpeas", quantity: "2 cans" },
      { name: "Onion", quantity: "1/2" },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Parsley", quantity: "1 cup" },
      { name: "Cilantro", quantity: "1 cup" },
      { name: "Cumin", quantity: "1 tsp" },
      { name: "Coriander", quantity: "1 tsp" },
      { name: "All-Purpose Flour", quantity: "2 tbsp" },
    ],
  },
  {
    id: "shakshuka",
    name: "Shakshuka",
    cuisine: "Middle Eastern",
    dietTags: ["Vegetarian", "Gluten-Free", "Nut-Free"],
    prepTimeMinutes: 30,
    servings: 4,
    emoji: "🍳",
    description: "Eggs poached directly in a spiced tomato and pepper sauce.",
    instructions: [
      "Saute onion and bell pepper until soft.",
      "Add garlic, cumin and paprika, then canned tomato, and simmer to thicken.",
      "Crack eggs into wells in the sauce and cover until set.",
      "Finish with parsley.",
    ],
    ingredients: [
      { name: "Egg", quantity: "4" },
      { name: "Onion", quantity: "1" },
      { name: "Bell Pepper", quantity: "1" },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Canned Tomato", quantity: "2 cups" },
      { name: "Cumin", quantity: "1 tsp" },
      { name: "Paprika", quantity: "1 tsp" },
      { name: "Parsley", quantity: "a handful" },
    ],
  },
  {
    id: "baba-ganoush",
    name: "Baba Ganoush",
    cuisine: "Middle Eastern",
    dietTags: ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"],
    prepTimeMinutes: 40,
    servings: 4,
    emoji: "🍆",
    description: "A smoky eggplant dip finished with tahini and lemon.",
    instructions: [
      "Char eggplant until the skin blackens and the flesh softens.",
      "Scoop out the flesh and mash with tahini, garlic and lemon juice.",
      "Season with salt and finish with olive oil and parsley.",
    ],
    ingredients: [
      { name: "Eggplant", quantity: "2" },
      { name: "Tahini", quantity: "3 tbsp" },
      { name: "Garlic", quantity: "1 clove" },
      { name: "Lemon", quantity: "1" },
      { name: "Olive Oil", quantity: "2 tbsp" },
      { name: "Parsley", quantity: "a handful" },
    ],
  },
  {
    id: "classic-burger",
    name: "Classic Beef Burger",
    cuisine: "American",
    dietTags: [],
    prepTimeMinutes: 25,
    servings: 4,
    emoji: "🍔",
    description: "A simply seasoned patty built for a griddle or grill.",
    instructions: [
      "Season ground beef with salt and pepper, shape into patties.",
      "Sear on a hot pan or grill, adding cheese in the final minute.",
      "Build the burger with lettuce, tomato and your condiments of choice.",
    ],
    ingredients: [
      { name: "Ground Beef", quantity: "600g" },
      { name: "Cheddar Cheese", quantity: "4 slices" },
      { name: "Tomato", quantity: "1" },
      { name: "Onion", quantity: "1/2" },
      { name: "Mustard", quantity: "to taste", optional: true },
      { name: "Mayonnaise", quantity: "to taste", optional: true },
    ],
  },
  {
    id: "mac-and-cheese",
    name: "Baked Mac and Cheese",
    cuisine: "American",
    dietTags: ["Vegetarian"],
    prepTimeMinutes: 45,
    servings: 6,
    emoji: "🧀",
    description: "A stovetop cheese sauce baked with breadcrumbs for a crisp top.",
    instructions: [
      "Make a roux with butter and flour, whisk in milk until thickened.",
      "Stir in cheddar cheese until melted, then toss with cooked pasta.",
      "Top with breadcrumbs and bake until golden.",
    ],
    ingredients: [
      { name: "Pasta", quantity: "400g" },
      { name: "Butter", quantity: "3 tbsp" },
      { name: "All-Purpose Flour", quantity: "3 tbsp" },
      { name: "Milk", quantity: "3 cups" },
      { name: "Cheddar Cheese", quantity: "2 cups" },
      { name: "Breadcrumbs", quantity: "1/2 cup" },
    ],
  },
  {
    id: "clam-chowder",
    name: "Corn Chowder",
    cuisine: "American",
    dietTags: ["Vegetarian", "Gluten-Free"],
    prepTimeMinutes: 40,
    servings: 4,
    emoji: "🥣",
    description: "A creamy potato and corn soup finished with fresh herbs.",
    instructions: [
      "Saute onion and celery in butter until soft.",
      "Add potato and stock, simmer until the potato is tender.",
      "Stir in corn and cream, simmer 10 more minutes.",
      "Finish with parsley and black pepper.",
    ],
    ingredients: [
      { name: "Potato", quantity: "3" },
      { name: "Corn", quantity: "2 cups" },
      { name: "Onion", quantity: "1" },
      { name: "Celery", quantity: "1 stalk" },
      { name: "Vegetable Stock", quantity: "3 cups" },
      { name: "Heavy Cream", quantity: "1/2 cup" },
      { name: "Butter", quantity: "2 tbsp" },
      { name: "Parsley", quantity: "a handful" },
    ],
  },
  {
    id: "buttermilk-pancakes",
    name: "Buttermilk Pancakes",
    cuisine: "American",
    dietTags: ["Vegetarian"],
    prepTimeMinutes: 20,
    servings: 4,
    emoji: "🥞",
    description: "Fluffy stovetop pancakes leaning on buttermilk for tang and lift.",
    instructions: [
      "Whisk flour, sugar, baking powder and salt together.",
      "Whisk in buttermilk, egg and melted butter until just combined.",
      "Cook spoonfuls on a hot griddle until bubbles form, then flip.",
      "Serve with maple syrup.",
    ],
    ingredients: [
      { name: "All-Purpose Flour", quantity: "2 cups" },
      { name: "Buttermilk", quantity: "2 cups" },
      { name: "Egg", quantity: "2" },
      { name: "Butter", quantity: "3 tbsp" },
      { name: "White Sugar", quantity: "2 tbsp" },
      { name: "Maple Syrup", quantity: "to serve" },
    ],
  },
  {
    id: "chocolate-chip-cookies",
    name: "Chocolate Chip Cookies",
    cuisine: "American",
    dietTags: ["Vegetarian"],
    prepTimeMinutes: 30,
    servings: 12,
    emoji: "🍪",
    description: "A classic chewy-centered, crisp-edged cookie.",
    instructions: [
      "Cream butter with brown sugar and white sugar until fluffy.",
      "Beat in egg, then fold in flour and a pinch of salt.",
      "Fold in chocolate chips and walnuts, then chill the dough.",
      "Bake in scoops until the edges are golden.",
    ],
    ingredients: [
      { name: "Butter", quantity: "1 cup" },
      { name: "Brown Sugar", quantity: "3/4 cup" },
      { name: "White Sugar", quantity: "1/4 cup" },
      { name: "Egg", quantity: "1" },
      { name: "All-Purpose Flour", quantity: "2.25 cups" },
      { name: "Walnuts", quantity: "1/2 cup", optional: true },
      { name: "Salt", quantity: "1/2 tsp" },
    ],
  },
  {
    id: "banana-oat-muffins",
    name: "Banana Oat Muffins",
    cuisine: "American",
    dietTags: ["Vegetarian"],
    prepTimeMinutes: 35,
    servings: 12,
    emoji: "🧁",
    description: "A use-up-the-bananas muffin that leans on oats for texture.",
    instructions: [
      "Mash bananas and mix with egg, honey and melted butter.",
      "Fold in flour, oats, cinnamon and a pinch of salt.",
      "Divide into a muffin tin and bake until a toothpick comes out clean.",
    ],
    ingredients: [
      { name: "All-Purpose Flour", quantity: "1.5 cups" },
      { name: "Rolled Oats", quantity: "1 cup" },
      { name: "Egg", quantity: "1" },
      { name: "Honey", quantity: "1/3 cup" },
      { name: "Butter", quantity: "1/4 cup" },
      { name: "Cinnamon", quantity: "1 tsp" },
      { name: "Salt", quantity: "1/4 tsp" },
    ],
  },
  {
    id: "teriyaki-salmon",
    name: "Teriyaki Salmon",
    cuisine: "Japanese",
    dietTags: ["Pescatarian", "Dairy-Free"],
    prepTimeMinutes: 25,
    servings: 4,
    emoji: "🍣",
    description: "Pan-seared salmon glazed in a quick soy-based sauce.",
    instructions: [
      "Whisk soy sauce, honey, garlic and ginger for the glaze.",
      "Sear salmon skin-side down until crisp, then flip.",
      "Add the glaze and baste until the salmon is glossy and just cooked.",
      "Serve over rice with scallion.",
    ],
    ingredients: [
      { name: "Salmon", quantity: "600g" },
      { name: "Soy Sauce", quantity: "1/3 cup" },
      { name: "Honey", quantity: "2 tbsp" },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Ginger", quantity: "1 tbsp" },
      { name: "Rice", quantity: "to serve" },
      { name: "Scallion", quantity: "2" },
    ],
  },
  {
    id: "miso-soup",
    name: "Miso Soup",
    cuisine: "Japanese",
    dietTags: ["Vegan", "Vegetarian", "Dairy-Free", "Gluten-Free"],
    prepTimeMinutes: 15,
    servings: 4,
    emoji: "🥣",
    description: "A light, savory broth built on miso paste and tofu.",
    instructions: [
      "Warm stock without boiling.",
      "Whisk miso paste into a ladle of warm stock, then stir back into the pot.",
      "Add cubed tofu and scallion, warm through gently.",
    ],
    ingredients: [
      { name: "Miso Paste", quantity: "3 tbsp" },
      { name: "Tofu", quantity: "200g" },
      { name: "Vegetable Stock", quantity: "4 cups" },
      { name: "Scallion", quantity: "2" },
    ],
  },
  {
    id: "chicken-katsu",
    name: "Chicken Katsu",
    cuisine: "Japanese",
    dietTags: [],
    prepTimeMinutes: 30,
    servings: 4,
    emoji: "🍗",
    description: "Panko-crusted chicken cutlets fried until deeply crisp.",
    instructions: [
      "Pound chicken breast to an even thickness.",
      "Dredge through flour, egg and panko in that order.",
      "Shallow-fry until golden and cooked through, then slice.",
    ],
    ingredients: [
      { name: "Chicken Breast", quantity: "500g" },
      { name: "All-Purpose Flour", quantity: "1/2 cup" },
      { name: "Egg", quantity: "2" },
      { name: "Panko", quantity: "1.5 cups" },
      { name: "Vegetable Oil", quantity: "for frying" },
    ],
  },
  {
    id: "vegetable-stir-fry",
    name: "Garlic Vegetable Stir-Fry",
    cuisine: "Thai",
    dietTags: ["Vegan", "Vegetarian", "Dairy-Free", "Gluten-Free"],
    prepTimeMinutes: 20,
    servings: 4,
    emoji: "🥦",
    description: "A fast wok toss built to move whatever vegetables need using up.",
    instructions: [
      "Heat oil in a wok until shimmering.",
      "Stir-fry garlic and ginger for 30 seconds.",
      "Add broccoli, carrot and bell pepper, tossing over high heat.",
      "Finish with tamari and sesame oil.",
    ],
    ingredients: [
      { name: "Broccoli", quantity: "2 cups" },
      { name: "Carrot", quantity: "1" },
      { name: "Bell Pepper", quantity: "1" },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Ginger", quantity: "1 tsp" },
      { name: "Tamari", quantity: "2 tbsp" },
      { name: "Sesame Oil", quantity: "1 tsp" },
      { name: "Vegetable Oil", quantity: "1 tbsp" },
    ],
  },
  {
    id: "stuffed-bell-peppers",
    name: "Quinoa Stuffed Peppers",
    cuisine: "Mediterranean",
    dietTags: ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"],
    prepTimeMinutes: 50,
    servings: 4,
    emoji: "🫑",
    description: "Halved bell peppers filled with a herby quinoa and black bean mix.",
    instructions: [
      "Cook quinoa and mix with black beans, corn, onion and herbs.",
      "Halve and seed bell peppers, then fill with the quinoa mixture.",
      "Bake covered until the peppers soften.",
    ],
    ingredients: [
      { name: "Bell Pepper", quantity: "4" },
      { name: "Quinoa", quantity: "1 cup" },
      { name: "Black Beans", quantity: "1 can" },
      { name: "Corn", quantity: "1 cup" },
      { name: "Onion", quantity: "1/2" },
      { name: "Cumin", quantity: "1 tsp" },
      { name: "Cilantro", quantity: "a handful" },
    ],
  },
  {
    id: "lemon-garlic-cod",
    name: "Lemon Garlic Cod",
    cuisine: "Mediterranean",
    dietTags: ["Pescatarian", "Gluten-Free", "Dairy-Free", "Nut-Free"],
    prepTimeMinutes: 20,
    servings: 4,
    emoji: "🐟",
    description: "A light, oven-baked fish dinner built on lemon, garlic and olive oil.",
    instructions: [
      "Lay cod fillets in a baking dish and season with salt and pepper.",
      "Whisk olive oil, garlic and lemon juice, pour over the fish.",
      "Bake until the fish flakes easily, then finish with parsley.",
    ],
    ingredients: [
      { name: "Cod", quantity: "600g" },
      { name: "Garlic", quantity: "2 cloves" },
      { name: "Lemon", quantity: "1" },
      { name: "Olive Oil", quantity: "3 tbsp" },
      { name: "Parsley", quantity: "a handful" },
    ],
  },
];

async function main() {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !user || !password) {
    console.error(
      "Missing NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD. Copy .env.example to .env.local and fill in your CognoDB credentials."
    );
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    await driver.verifyConnectivity();
    console.log("Connected to CognoDB. Seeding...");

    console.log("Constraints...");
    await session.run("CREATE CONSTRAINT recipe_id IF NOT EXISTS FOR (r:Recipe) REQUIRE r.id IS UNIQUE");
    await session.run("CREATE CONSTRAINT ingredient_name IF NOT EXISTS FOR (i:Ingredient) REQUIRE i.name IS UNIQUE");
    await session.run("CREATE CONSTRAINT cuisine_name IF NOT EXISTS FOR (c:Cuisine) REQUIRE c.name IS UNIQUE");
    await session.run("CREATE CONSTRAINT diettag_name IF NOT EXISTS FOR (d:DietTag) REQUIRE d.name IS UNIQUE");

    console.log(`Ingredients (${INGREDIENTS.length})...`);
    for (const ing of INGREDIENTS) {
      await session.run(
        "MERGE (i:Ingredient {name: $name}) SET i.id = toLower(replace($name, ' ', '-')), i.category = $category",
        ing
      );
    }

    console.log(`Cuisines (${CUISINES.length}) & diet tags (${DIET_TAGS.length})...`);
    for (const name of CUISINES) await session.run("MERGE (:Cuisine {name: $name})", { name });
    for (const name of DIET_TAGS) await session.run("MERGE (:DietTag {name: $name})", { name });

    console.log(`Substitution edges (${SUBSTITUTIONS.length})...`);
    for (const sub of SUBSTITUTIONS) {
      await session.run(
        `MATCH (a:Ingredient {name: $from}), (b:Ingredient {name: $to})
         MERGE (a)-[r:SUBSTITUTES_FOR]->(b)
         SET r.context = $context, r.notes = $notes`,
        sub
      );
    }

    console.log(`Recipes (${RECIPES.length})...`);
    for (const recipe of RECIPES) {
      await session.run(
        `MERGE (r:Recipe {id: $id})
         SET r.name = $name, r.description = $description, r.instructions = $instructions,
             r.prepTimeMinutes = $prepTimeMinutes, r.servings = $servings, r.emoji = $emoji
         WITH r
         MATCH (c:Cuisine {name: $cuisine})
         MERGE (r)-[:BELONGS_TO]->(c)`,
        {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          instructions: recipe.instructions,
          prepTimeMinutes: neo4j.int(recipe.prepTimeMinutes),
          servings: neo4j.int(recipe.servings),
          emoji: recipe.emoji,
          cuisine: recipe.cuisine,
        }
      );

      for (const tag of recipe.dietTags) {
        await session.run(
          `MATCH (r:Recipe {id: $id}), (d:DietTag {name: $tag}) MERGE (r)-[:SUITABLE_FOR]->(d)`,
          { id: recipe.id, tag }
        );
      }

      for (const line of recipe.ingredients) {
        await session.run(
          `MATCH (r:Recipe {id: $id}), (i:Ingredient {name: $name})
           MERGE (r)-[u:USES]->(i)
           SET u.quantity = $quantity, u.optional = $optional`,
          { id: recipe.id, name: line.name, quantity: line.quantity, optional: line.optional ?? false }
        );
      }
    }

    const counts = await session.run(
      `MATCH (n) WITH labels(n)[0] AS label, count(n) AS c RETURN label, c ORDER BY label`
    );
    console.log("\nSeed complete. Node counts:");
    for (const rec of counts.records) {
      console.log(`  ${rec.get("label")}: ${rec.get("c").toNumber()}`);
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
