import { Session } from "neo4j-driver";
import { withSession } from "./neo4j";
import {
  Ingredient,
  PantryMatch,
  RecipeDetail,
  RecipeSummary,
  RelatedRecipe,
  SubstitutionPathResult,
  SubstituteSuggestion,
} from "./types";

function toRecipeSummary(
  node: { properties: Record<string, unknown> },
  cuisine: string,
  dietTags: string[],
  ingredientCount: number
): RecipeSummary {
  const p = node.properties as Record<string, unknown>;
  return {
    id: p.id as string,
    name: p.name as string,
    description: p.description as string,
    cuisine,
    dietTags,
    prepTimeMinutes: Number(p.prepTimeMinutes),
    servings: Number(p.servings),
    emoji: p.emoji as string,
    ingredientCount,
  };
}

function toIngredient(node: { properties: Record<string, unknown> }): Ingredient {
  const p = node.properties;
  return { id: p.id as string, name: p.name as string, category: p.category as string };
}

export async function listCuisines(): Promise<string[]> {
  return withSession(async (session: Session) => {
    const result = await session.executeRead((tx) =>
      tx.run("MATCH (c:Cuisine) RETURN c.name AS name ORDER BY name")
    );
    return result.records.map((r) => r.get("name") as string);
  });
}

export async function listDietTags(): Promise<string[]> {
  return withSession(async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run("MATCH (d:DietTag) RETURN d.name AS name ORDER BY name")
    );
    return result.records.map((r) => r.get("name") as string);
  });
}

export async function searchIngredientNames(prefix: string, limit = 8): Promise<Ingredient[]> {
  return withSession(async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run(
        `MATCH (i:Ingredient)
         WHERE toLower(i.name) CONTAINS toLower($prefix)
         RETURN i ORDER BY i.name LIMIT $limit`,
        { prefix, limit: Math.trunc(limit) }
      )
    );
    return result.records.map((r) => toIngredient(r.get("i")));
  });
}

export async function listRecipes(filters: {
  search?: string;
  cuisine?: string;
  dietTag?: string;
}): Promise<RecipeSummary[]> {
  return withSession(async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run(
        `MATCH (r:Recipe)-[:BELONGS_TO]->(c:Cuisine)
         OPTIONAL MATCH (r)-[:SUITABLE_FOR]->(d:DietTag)
         WITH r, c, collect(DISTINCT d.name) AS dietTags
         WHERE ($search IS NULL OR toLower(r.name) CONTAINS toLower($search))
           AND ($cuisine IS NULL OR c.name = $cuisine)
           AND ($dietTag IS NULL OR $dietTag IN dietTags)
         MATCH (r)-[:USES]->(ing:Ingredient)
         WITH r, c, dietTags, count(DISTINCT ing) AS ingredientCount
         RETURN r, c.name AS cuisine, dietTags, ingredientCount
         ORDER BY r.name`,
        {
          search: filters.search ?? null,
          cuisine: filters.cuisine ?? null,
          dietTag: filters.dietTag ?? null,
        }
      )
    );
    return result.records.map((r) =>
      toRecipeSummary(r.get("r"), r.get("cuisine"), r.get("dietTags"), r.get("ingredientCount").toNumber())
    );
  });
}

export async function getRecipeDetail(id: string): Promise<RecipeDetail | null> {
  return withSession(async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run(
        `MATCH (r:Recipe {id: $id})-[:BELONGS_TO]->(c:Cuisine)
         OPTIONAL MATCH (r)-[:SUITABLE_FOR]->(d:DietTag)
         WITH r, c, collect(DISTINCT d.name) AS dietTags
         MATCH (r)-[u:USES]->(ing:Ingredient)
         RETURN r, c.name AS cuisine, dietTags,
                collect({ingredient: ing, quantity: u.quantity, optional: u.optional}) AS lines
         ORDER BY r.name`,
        { id }
      )
    );
    if (result.records.length === 0) return null;
    const record = result.records[0];
    const p = record.get("r").properties;
    const lines = record.get("lines") as {
      ingredient: { properties: Record<string, unknown> };
      quantity: string;
      optional: boolean;
    }[];

    return {
      ...toRecipeSummary(record.get("r"), record.get("cuisine"), record.get("dietTags"), lines.length),
      instructions: p.instructions as string[],
      ingredients: lines
        .map((l) => ({
          ingredient: toIngredient(l.ingredient),
          quantity: l.quantity,
          optional: l.optional,
        }))
        .sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name)),
    };
  });
}

/**
 * The core multi-hop query. Given ingredients the user already has, finds
 * every ingredient reachable within 2 SUBSTITUTES_FOR hops (0 hops = the
 * pantry item itself), then scores every recipe by how much of its
 * ingredient list is covered directly or via a substitution chain.
 */
export async function pantryMatch(pantryNames: string[]): Promise<PantryMatch[]> {
  return withSession(async (session) => {
    const reachableResult = await session.executeRead((tx) =>
      tx.run(
        `MATCH path = (start:Ingredient)-[:SUBSTITUTES_FOR*0..2]->(avail:Ingredient)
         WHERE toLower(start.name) IN [n IN $pantry | toLower(n)]
         RETURN avail.name AS ingredient, start.name AS pantryItem, min(length(path)) AS hops`,
        { pantry: pantryNames }
      )
    );

    const availability = new Map<string, { hops: number; from: string }>();
    for (const rec of reachableResult.records) {
      const ingredient = rec.get("ingredient") as string;
      const hops = rec.get("hops").toNumber();
      const from = rec.get("pantryItem") as string;
      const existing = availability.get(ingredient);
      if (!existing || hops < existing.hops) {
        availability.set(ingredient, { hops, from });
      }
    }

    const recipeResult = await session.executeRead((tx) =>
      tx.run(
        `MATCH (r:Recipe)-[:BELONGS_TO]->(c:Cuisine)
         OPTIONAL MATCH (r)-[:SUITABLE_FOR]->(d:DietTag)
         WITH r, c, collect(DISTINCT d.name) AS dietTags
         MATCH (r)-[u:USES]->(ing:Ingredient)
         WITH r, c, dietTags, collect({name: ing.name, optional: u.optional}) AS ingredients
         RETURN r, c.name AS cuisine, dietTags, ingredients`
      )
    );

    const matches: PantryMatch[] = [];
    for (const rec of recipeResult.records) {
      const ingredients = rec.get("ingredients") as { name: string; optional: boolean }[];
      const required = ingredients.filter((i) => !i.optional);

      const haveDirectly: string[] = [];
      const needsSubstitution: PantryMatch["needsSubstitution"] = [];
      const missing: string[] = [];

      for (const req of required) {
        const info = availability.get(req.name);
        if (info && info.hops === 0) {
          haveDirectly.push(req.name);
        } else if (info) {
          needsSubstitution.push({
            required: req.name,
            substituteFrom: info.from,
            hops: info.hops,
            path: [info.from, req.name],
          });
        } else {
          missing.push(req.name);
        }
      }

      if (haveDirectly.length + needsSubstitution.length === 0) continue;

      const matchScore = required.length === 0 ? 0 : (haveDirectly.length + needsSubstitution.length) / required.length;

      matches.push({
        recipe: toRecipeSummary(rec.get("r"), rec.get("cuisine"), rec.get("dietTags"), ingredients.length),
        haveDirectly,
        needsSubstitution,
        missing,
        matchScore,
      });
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore || a.missing.length - b.missing.length);
  });
}

/**
 * shortestPath() over an unbounded-depth variable-length relationship —
 * the canonical query a relational schema handles poorly (it needs a
 * recursive CTE with manual cycle-guarding) but a graph database expresses
 * natively.
 */
export async function substitutionPath(from: string, to: string): Promise<SubstitutionPathResult> {
  return withSession(async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run(
        `MATCH (a:Ingredient {name: $from}), (b:Ingredient {name: $to})
         MATCH path = shortestPath((a)-[:SUBSTITUTES_FOR*..6]-(b))
         RETURN [n IN nodes(path) | n.name] AS names,
                [rel IN relationships(path) | type(rel)] AS rels,
                length(path) AS hops`,
        { from, to }
      )
    );

    if (result.records.length === 0) {
      return { found: false, hops: -1, path: [] };
    }

    const record = result.records[0];
    const names = record.get("names") as string[];
    const hops = record.get("hops").toNumber();

    return {
      found: true,
      hops,
      path: names.map((name) => ({ name, relation: "SUBSTITUTES_FOR" })),
    };
  });
}

export async function ingredientSubstituteNeighborhood(name: string): Promise<{
  canReplace: SubstituteSuggestion[];
  canBeReplacedBy: SubstituteSuggestion[];
}> {
  return withSession(async (session) => {
    // Reachability (up to 2 hops) and the direct (1-hop) notes are fetched as
    // two separate, single-MATCH queries and joined in application code.
    // (A single query that re-matched the direct edge in an OPTIONAL MATCH
    // after the reachability WITH was tried first, but CognoDB's planner did
    // not apply the target node's parameterized property filter in that
    // shape, silently pulling in notes from unrelated edges — reproduced
    // and confirmed against the live instance before working around it here.
    // These also run sequentially: a single session can't handle concurrent work.)
    const outgoingReach = await session.executeRead((tx) =>
      tx.run(
        `MATCH path = (start:Ingredient {name: $name})-[:SUBSTITUTES_FOR*1..2]->(target:Ingredient)
         WITH target, min(length(path)) AS hops
         RETURN target, hops
         ORDER BY hops, target.name`,
        { name }
      )
    );
    const outgoingDirect = await session.executeRead((tx) =>
      tx.run(
        `MATCH (start:Ingredient {name: $name})-[r:SUBSTITUTES_FOR]->(target:Ingredient)
         RETURN target.name AS name, r.notes AS notes`,
        { name }
      )
    );
    const incomingReach = await session.executeRead((tx) =>
      tx.run(
        `MATCH path = (source:Ingredient)-[:SUBSTITUTES_FOR*1..2]->(target:Ingredient {name: $name})
         WITH source, min(length(path)) AS hops
         RETURN source, hops
         ORDER BY hops, source.name`,
        { name }
      )
    );
    const incomingDirect = await session.executeRead((tx) =>
      tx.run(
        `MATCH (source:Ingredient)-[r:SUBSTITUTES_FOR]->(target:Ingredient {name: $name})
         RETURN source.name AS name, r.notes AS notes`,
        { name }
      )
    );

    const notesByName = (result: typeof outgoingDirect) => {
      const map = new Map<string, string | null>();
      for (const r of result.records) map.set(r.get("name") as string, (r.get("notes") as string | null) ?? null);
      return map;
    };

    const buildSuggestions = (
      reach: typeof outgoingReach,
      nodeKey: string,
      directNotes: Map<string, string | null>
    ): SubstituteSuggestion[] =>
      reach.records.map((r) => {
        const ingredient = toIngredient(r.get(nodeKey));
        const hops = r.get("hops").toNumber();
        return {
          ingredient,
          hops,
          via: null,
          notes: hops === 1 ? directNotes.get(ingredient.name) ?? null : null,
        };
      });

    return {
      canReplace: buildSuggestions(outgoingReach, "target", notesByName(outgoingDirect)),
      canBeReplacedBy: buildSuggestions(incomingReach, "source", notesByName(incomingDirect)),
    };
  });
}

/**
 * 2-hop Recipe -> Ingredient -> Recipe traversal: recipes that share at
 * least two ingredients with the given recipe.
 */
export async function relatedRecipes(id: string, minShared = 2, limit = 6): Promise<RelatedRecipe[]> {
  return withSession(async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run(
        `MATCH (r:Recipe {id: $id})-[:USES]->(ing:Ingredient)<-[:USES]-(other:Recipe)
         WHERE other.id <> $id
         WITH other, collect(DISTINCT ing.name) AS shared
         WHERE size(shared) >= $minShared
         MATCH (other)-[:BELONGS_TO]->(c:Cuisine)
         OPTIONAL MATCH (other)-[:SUITABLE_FOR]->(d:DietTag)
         WITH other, c, shared, collect(DISTINCT d.name) AS dietTags
         MATCH (other)-[:USES]->(allIng:Ingredient)
         WITH other, c, shared, dietTags, count(DISTINCT allIng) AS ingredientCount
         RETURN other, c.name AS cuisine, dietTags, shared, ingredientCount
         ORDER BY size(shared) DESC
         LIMIT $limit`,
        { id, minShared, limit: Math.trunc(limit) }
      )
    );

    return result.records.map((r) => ({
      recipe: toRecipeSummary(r.get("other"), r.get("cuisine"), r.get("dietTags"), r.get("ingredientCount").toNumber()),
      sharedIngredients: r.get("shared") as string[],
    }));
  });
}
