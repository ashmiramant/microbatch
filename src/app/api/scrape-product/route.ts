import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MicroBatch/1.0; +https://microbatch.vercel.app)",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch URL");
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to extract product information
    let name = "";
    let price = "";

    // Try common selectors for product name
    name = 
      $('h1[id*="title"]').first().text().trim() ||
      $('h1[class*="product"]').first().text().trim() ||
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      $('title').text().trim();

    // Try common selectors for price
    const priceText = 
      $('[class*="price"]').first().text() ||
      $('[id*="price"]').first().text() ||
      $('meta[property="og:price:amount"]').attr("content") ||
      "";

    // Extract just the number from price text
    const priceMatch = priceText.match(/[\d,]+\.?\d*/);
    if (priceMatch) {
      price = priceMatch[0].replace(/,/g, "");
    }

    // Clean up the name
    name = name
      .replace(/\s+/g, " ")
      .replace(/[|–-].*$/, "") // Remove text after | or –
      .trim()
      .substring(0, 200); // Limit length

    return NextResponse.json({
      product: {
        name: name || null,
        price: price || null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to scrape product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
