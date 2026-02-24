"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const ORDER_FORM_KEY = "order_form_open";
const ROOTED_ORDER_FORM_KEY = "rooted_order_form_open";
const DEFAULT_ORDER_FORM_OPEN = process.env.NEXT_PUBLIC_ORDER_FORM_OPEN === "true";
const DEFAULT_ROOTED_ORDER_FORM_OPEN =
  process.env.NEXT_PUBLIC_ROOTED_ORDER_FORM_OPEN === "true";

async function ensureSettingsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key text PRIMARY KEY,
      setting_value text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function getOrderFormAvailability() {
  try {
    await ensureSettingsTable();

    const rows = (await db.execute(sql`
      SELECT setting_value
      FROM app_settings
      WHERE setting_key = ${ORDER_FORM_KEY}
      LIMIT 1
    `)) as unknown as Array<{ setting_value: string }>;

    if (!rows[0]) {
      return { success: true, data: DEFAULT_ORDER_FORM_OPEN };
    }

    return { success: true, data: rows[0].setting_value === "true" };
  } catch (error) {
    console.error("Failed to load order form availability:", error);
    return {
      success: false,
      error: "Failed to load order form setting",
      data: DEFAULT_ORDER_FORM_OPEN,
    };
  }
}

export async function setOrderFormAvailability(isOpen: boolean) {
  await requireAuth();

  try {
    await ensureSettingsTable();

    await db.execute(sql`
      INSERT INTO app_settings (setting_key, setting_value, updated_at)
      VALUES (${ORDER_FORM_KEY}, ${isOpen ? "true" : "false"}, now())
      ON CONFLICT (setting_key)
      DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = now()
    `);

    revalidatePath("/settings");
    revalidatePath("/order-form");

    return { success: true, data: isOpen };
  } catch (error) {
    console.error("Failed to save order form availability:", error);
    return { success: false, error: "Failed to save order form setting" };
  }
}

export async function getRootedOrderFormAvailability() {
  try {
    await ensureSettingsTable();

    const rows = (await db.execute(sql`
      SELECT setting_value
      FROM app_settings
      WHERE setting_key = ${ROOTED_ORDER_FORM_KEY}
      LIMIT 1
    `)) as unknown as Array<{ setting_value: string }>;

    if (!rows[0]) {
      return { success: true, data: DEFAULT_ROOTED_ORDER_FORM_OPEN };
    }

    return { success: true, data: rows[0].setting_value === "true" };
  } catch (error) {
    console.error("Failed to load Rooted order form availability:", error);
    return {
      success: false,
      error: "Failed to load Rooted order form setting",
      data: DEFAULT_ROOTED_ORDER_FORM_OPEN,
    };
  }
}

export async function setRootedOrderFormAvailability(isOpen: boolean) {
  await requireAuth();

  try {
    await ensureSettingsTable();

    await db.execute(sql`
      INSERT INTO app_settings (setting_key, setting_value, updated_at)
      VALUES (${ROOTED_ORDER_FORM_KEY}, ${isOpen ? "true" : "false"}, now())
      ON CONFLICT (setting_key)
      DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = now()
    `);

    revalidatePath("/settings");
    revalidatePath("/rooted-community-order-form");

    return { success: true, data: isOpen };
  } catch (error) {
    console.error("Failed to save Rooted order form availability:", error);
    return { success: false, error: "Failed to save Rooted order form setting" };
  }
}
