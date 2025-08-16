import { z } from 'zod';
import { supabase, TABLE } from '../config/supabase.js';
import { isValidHttpUrl, normalizeUrl } from '../utils/urlValidator.js';
import { scrapeWebsite } from '../services/scraper.service.js';
import { enhanceDescription } from '../services/ai.service.js';

// zod schemas live next to handlers so routes can import them for validate()
const idParamSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

export const createWebsiteSchema = z.object({
  body: z.object({
    url: z.string().refine(isValidHttpUrl, 'Invalid URL'),
    useAI: z.boolean().optional()
  })
});

export async function createWebsite(req, res, next) {
  try {
    const { url, useAI } = req.validated.body; // validate() attaches parsed input here
    const normalized = normalizeUrl(url);

    // scrape first (fast path). If useAI, ask model to rewrite description
    const scraped = await scrapeWebsite(normalized);
    let enhanced = null;
    if (useAI) {
      enhanced = await enhanceDescription(scraped.description || scraped.brandName || '');
    }

    // upsert-like behavior is handled by unique constraint error -> 409 below
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ url: normalized, brand_name: scraped.brandName, description: scraped.description, enhanced_description: enhanced })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (err) {
    // 23505 = Postgres unique violation (same url)
    if (err.code === '23505') {  
      err.status = 409;
      err.message = 'URL already exists';
    }
    next(err);
  }
}

export async function listWebsites(req, res, next) {
  try {
    // return recent first (created_at DESC)
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function getWebsite(req, res, next) {
  try {
    // quick param guard so we fail fast with 400 if id is invalid
    idParamSchema.parse({ params: req.params });
    const { id } = req.params;
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export const updateWebsiteSchema = z.object({
  body: z.object({ url: z.string().refine(isValidHttpUrl, 'Invalid URL') }).optional(),
  params: z.object({ id: z.string().uuid() })
});

export async function updateWebsite(req, res, next) {
  try {
    const { id } = req.params;
    const url = req.body?.url;
    let updates = {};

    if (url) {
      const normalized = normalizeUrl(url);
      // re-scrape on change; we don't re-run AI here to keep it predictable
      const scraped = await scrapeWebsite(normalized);
      updates = {
        url: normalized,
        brand_name: scraped.brandName,
        description: scraped.description
      };
    }

    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function deleteWebsite(req, res, next) {
  try {
    // id guard, then hard delete
    idParamSchema.parse({ params: req.params });
    const { id } = req.params;
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) { next(err); }
}

