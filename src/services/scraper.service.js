import axios from 'axios';
import { load as loadHtml } from 'cheerio';
import puppeteer from 'puppeteer';

// Scraper: try a quick HTML fetch first, then fall back to headless browser
// for JS-heavy sites. Keep things simple and resilient.
const DEFAULT_TIMEOUT_MS = 10000;

async function fetchHTML(url) {
  // Fast path: plain HTTP GET with a desktop UA
  const resp = await axios.get(url, {
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    }
  });
  return resp.data;
}

async function fetchWithPuppeteer(url) {
  // Slower but more reliable for SPAs and dynamic content
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT_MS });
    await page.waitForSelector('body', { timeout: 3000 }).catch(() => {});
    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
}

function extractFromHtml(html) {
  // Pull a reasonable brand name and description using common tags
  const $ = loadHtml(html);

  const ogSiteName = $('meta[property="og:site_name"]').attr('content');
  const appName = $('meta[name="application-name"]').attr('content');
  const title = $('title').first().text();
  const h1 = $('h1').first().text();

  const brandName = ogSiteName || appName || title || h1 || null;

  const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');
  let description = metaDesc || '';
  if (!description) {
    // fallback: first non-empty <p>
    const p = $('p').map((_, el) => $(el).text().trim()).get().filter(Boolean)[0];
    if (p) description = p;
  }

  return { brandName: brandName ? brandName.trim() : null, description: description ? description.trim() : null };
}

export async function scrapeWebsite(url) {
  try {
    // Try cheap fetch first
    let html = await fetchHTML(url);
    let result = extractFromHtml(html);

    if ((!result.brandName && !result.description) || (html.length < 500)) {
      // If content is thin or empty, try headless browser
      html = await fetchWithPuppeteer(url);
      result = extractFromHtml(html);
    }

    return result;
  } catch (e) {
    // Last resort: one more puppeteer attempt before giving up
    try {
      const html = await fetchWithPuppeteer(url);
      const result = extractFromHtml(html);
      return result;
    } catch (err) {
      const error = new Error('Failed to scrape the website');
      error.cause = err;
      error.status = 502;
      throw error;
    }
  }
}

