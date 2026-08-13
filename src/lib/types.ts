export type Ingredient = {
  id: string;
  name: string;
  category: string;
};

export type RecipeSummary = {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  dietTags: string[];
  prepTimeMinutes: number;
  servings: number;
  emoji: string;
  ingredientCount: number;
};

export type RecipeIngredientLine = {
  ingredient: Ingredient;
  quantity: string;
  optional: boolean;
};

export type RecipeDetail = RecipeSummary & {
  instructions: string[];
  ingredients: RecipeIngredientLine[];
};

export type PantryMatch = {
  recipe: RecipeSummary;
  haveDirectly: string[];
  needsSubstitution: {
    required: string;
    substituteFrom: string;
    hops: number;
    path: string[];
  }[];
  missing: string[];
  matchScore: number;
};

export type SubstitutionPathResult = {
  found: boolean;
  hops: number;
  path: { name: string; relation: string }[];
};

export type SubstituteSuggestion = {
  ingredient: Ingredient;
  hops: number;
  via: string | null;
  notes: string | null;
};

export type RelatedRecipe = {
  recipe: RecipeSummary;
  sharedIngredients: string[];
};
