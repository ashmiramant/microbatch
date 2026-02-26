import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Recipes ────────────────────────────────────────────────────────────────────

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  sourceUrl: text("source_url"),
  sourceType: text("source_type", {
    enum: ["ld_json", "manual_paste", "manual_entry"],
  }),
  description: text("description"),
  imageUrl: text("image_url"),
  price: numeric("price", { precision: 10, scale: 2 }),
  yieldQuantity: numeric("yield_quantity"),
  yieldUnit: text("yield_unit"),
  yieldWeightGrams: numeric("yield_weight_grams"),
  prepTimeMinutes: integer("prep_time_minutes"),
  cookTimeMinutes: integer("cook_time_minutes"),
  totalTimeMinutes: integer("total_time_minutes"),
  category: text("category"),
  isSourdough: boolean("is_sourdough").default(false),
  availableForOrder: boolean("available_for_order").default(false),
  availableForMainOrder: boolean("available_for_main_order").default(false),
  availableForRootedOrder: boolean("available_for_rooted_order").default(false),
  orderFlavorOptions: jsonb("order_flavor_options"),
  defaultPanId: integer("default_pan_id").references(() => pans.id),
  notes: text("notes"),
  rawLdJson: jsonb("raw_ld_json"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  defaultPan: one(pans, {
    fields: [recipes.defaultPanId],
    references: [pans.id],
  }),
  ingredients: many(recipeIngredients),
  instructions: many(recipeInstructions),
  packaging: many(recipePackaging),
  orderItems: many(orderItems),
  productionBatches: many(productionBatches),
}));

// ─── Recipe Ingredients ─────────────────────────────────────────────────────────

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  sortOrder: integer("sort_order").notNull(),
  ingredientId: integer("ingredient_id").references(() => ingredients.id),
  rawText: text("raw_text").notNull(),
  quantity: numeric("quantity"),
  unit: text("unit"),
  unitGrams: numeric("unit_grams"),
  ingredientName: text("ingredient_name"),
  prepNotes: text("prep_notes"),
  isFlour: boolean("is_flour").default(false),
  bakersPercentage: numeric("bakers_percentage"),
  sectionLabel: text("section_label"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipeIngredientsRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredients.recipeId],
      references: [recipes.id],
    }),
    ingredient: one(ingredients, {
      fields: [recipeIngredients.ingredientId],
      references: [ingredients.id],
    }),
  })
);

// ─── Recipe Instructions ────────────────────────────────────────────────────────

export const recipeInstructions = pgTable("recipe_instructions", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  sortOrder: integer("sort_order").notNull(),
  stepType: text("step_type", {
    enum: [
      "levain_build",
      "autolyse",
      "mix",
      "bulk_ferment",
      "fold",
      "shape",
      "cold_proof",
      "warm_proof",
      "preheat",
      "score",
      "bake",
      "cool",
      "other",
    ],
  }),
  name: text("name"),
  text: text("text").notNull(),
  durationMinutes: integer("duration_minutes"),
  temperatureF: integer("temperature_f"),
  sectionLabel: text("section_label"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipeInstructionsRelations = relations(
  recipeInstructions,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeInstructions.recipeId],
      references: [recipes.id],
    }),
  })
);

// ─── Ingredients ────────────────────────────────────────────────────────────────

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  aliases: jsonb("aliases"),
  subingredients: jsonb("subingredients"),
  category: text("category", {
    enum: [
      "flour",
      "sugar_sweetener",
      "dairy",
      "fat",
      "leavening",
      "salt_seasoning",
      "fruit_veg",
      "nut_seed",
      "liquid",
      "other",
    ],
  }),
  defaultUnit: text("default_unit"),
  densityGPerMl: numeric("density_g_per_ml"),
  costPerGram: numeric("cost_per_gram"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recipeIngredients: many(recipeIngredients),
  shoppingListItems: many(shoppingListItems),
}));

// ─── Pans ───────────────────────────────────────────────────────────────────────

export const pans = pgTable("pans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shape: text("shape", {
    enum: ["rectangular", "round", "square", "bundt", "custom"],
  }),
  lengthCm: numeric("length_cm"),
  widthCm: numeric("width_cm"),
  diameterCm: numeric("diameter_cm"),
  heightCm: numeric("height_cm"),
  volumeMl: numeric("volume_ml"),
  material: text("material"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pansRelations = relations(pans, ({ many }) => ({
  recipes: many(recipes),
  productionBatches: many(productionBatches),
}));

// ─── Packaging Types ────────────────────────────────────────────────────────────

export const packagingTypes = pgTable("packaging_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", {
    enum: ["bag", "box", "wrapper", "sticker", "label", "tie", "other"],
  }),
  costPerUnit: numeric("cost_per_unit"),
  currentStock: integer("current_stock").default(0),
  reorderThreshold: integer("reorder_threshold").default(0),
  supplierUrl: text("supplier_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const packagingTypesRelations = relations(
  packagingTypes,
  ({ many }) => ({
    recipePackaging: many(recipePackaging),
  })
);

// ─── Recipe Packaging ───────────────────────────────────────────────────────────

export const recipePackaging = pgTable("recipe_packaging", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id")
    .references(() => recipes.id)
    .notNull(),
  packagingTypeId: integer("packaging_type_id")
    .references(() => packagingTypes.id)
    .notNull(),
  quantityPerYield: integer("quantity_per_yield").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipePackagingRelations = relations(
  recipePackaging,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipePackaging.recipeId],
      references: [recipes.id],
    }),
    packagingType: one(packagingTypes, {
      fields: [recipePackaging.packagingTypeId],
      references: [packagingTypes.id],
    }),
  })
);

// ─── Orders ─────────────────────────────────────────────────────────────────────

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dueDate: timestamp("due_date"),
  status: text("status", {
    enum: [
      "draft",
      "confirmed",
      "in_production",
      "fulfilled",
      "cancelled",
      "archived",
    ],
  }).default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  productionRuns: many(productionRuns),
}));

// ─── Order Items ────────────────────────────────────────────────────────────────

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  recipeId: integer("recipe_id")
    .references(() => recipes.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  recipe: one(recipes, {
    fields: [orderItems.recipeId],
    references: [recipes.id],
  }),
}));

// ─── Production Runs ────────────────────────────────────────────────────────────

export const productionRuns = pgTable("production_runs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status", {
    enum: ["draft", "scheduled", "in_progress", "completed", "cancelled"],
  }).default("draft"),
  targetCompletionAt: timestamp("target_completion_at"),
  orderId: integer("order_id").references(() => orders.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productionRunsRelations = relations(
  productionRuns,
  ({ one, many }) => ({
    order: one(orders, {
      fields: [productionRuns.orderId],
      references: [orders.id],
    }),
    batches: many(productionBatches),
    shoppingLists: many(shoppingLists),
  })
);

// ─── Production Batches ─────────────────────────────────────────────────────────

export const productionBatches = pgTable("production_batches", {
  id: serial("id").primaryKey(),
  productionRunId: integer("production_run_id")
    .references(() => productionRuns.id, { onDelete: "cascade" })
    .notNull(),
  recipeId: integer("recipe_id")
    .references(() => recipes.id)
    .notNull(),
  scalingMode: text("scaling_mode", {
    enum: ["quantity", "pan", "multiplier"],
  }).default("quantity"),
  scalingFactor: numeric("scaling_factor"),
  targetQuantity: integer("target_quantity"),
  targetPanId: integer("target_pan_id").references(() => pans.id),
  status: text("status", {
    enum: ["pending", "in_progress", "completed"],
  }).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productionBatchesRelations = relations(
  productionBatches,
  ({ one, many }) => ({
    productionRun: one(productionRuns, {
      fields: [productionBatches.productionRunId],
      references: [productionRuns.id],
    }),
    recipe: one(recipes, {
      fields: [productionBatches.recipeId],
      references: [recipes.id],
    }),
    targetPan: one(pans, {
      fields: [productionBatches.targetPanId],
      references: [pans.id],
    }),
    timelineSteps: many(batchTimelineSteps),
  })
);

// ─── Batch Timeline Steps ───────────────────────────────────────────────────────

export const batchTimelineSteps = pgTable("batch_timeline_steps", {
  id: serial("id").primaryKey(),
  productionBatchId: integer("production_batch_id")
    .references(() => productionBatches.id, { onDelete: "cascade" })
    .notNull(),
  stepType: text("step_type"),
  name: text("name"),
  description: text("description"),
  scheduledStartAt: timestamp("scheduled_start_at"),
  scheduledEndAt: timestamp("scheduled_end_at"),
  status: text("status", {
    enum: ["upcoming", "active", "completed", "skipped"],
  }).default("upcoming"),
  calendarEventId: text("calendar_event_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const batchTimelineStepsRelations = relations(
  batchTimelineSteps,
  ({ one }) => ({
    productionBatch: one(productionBatches, {
      fields: [batchTimelineSteps.productionBatchId],
      references: [productionBatches.id],
    }),
  })
);

// ─── Shopping Lists ─────────────────────────────────────────────────────────────

export const shoppingLists = pgTable("shopping_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  productionRunId: integer("production_run_id").references(
    () => productionRuns.id
  ),
  status: text("status", {
    enum: ["draft", "active", "completed"],
  }).default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shoppingListsRelations = relations(
  shoppingLists,
  ({ one, many }) => ({
    productionRun: one(productionRuns, {
      fields: [shoppingLists.productionRunId],
      references: [productionRuns.id],
    }),
    items: many(shoppingListItems),
  })
);

// ─── Shopping List Items ────────────────────────────────────────────────────────

export const shoppingListItems = pgTable("shopping_list_items", {
  id: serial("id").primaryKey(),
  shoppingListId: integer("shopping_list_id")
    .references(() => shoppingLists.id, { onDelete: "cascade" })
    .notNull(),
  ingredientId: integer("ingredient_id").references(() => ingredients.id),
  name: text("name").notNull(),
  quantityNeededGrams: numeric("quantity_needed_grams"),
  quantityDisplay: text("quantity_display"),
  isPurchased: boolean("is_purchased").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shoppingListItemsRelations = relations(
  shoppingListItems,
  ({ one }) => ({
    shoppingList: one(shoppingLists, {
      fields: [shoppingListItems.shoppingListId],
      references: [shoppingLists.id],
    }),
    ingredient: one(ingredients, {
      fields: [shoppingListItems.ingredientId],
      references: [ingredients.id],
    }),
  })
);
