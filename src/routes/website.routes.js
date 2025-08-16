import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware.js';
import { createWebsite, createWebsiteSchema, listWebsites, getWebsite, updateWebsite, updateWebsiteSchema, deleteWebsite } from '../controllers/website.controller.js';

// Group all website endpoints under /api (mounted in app.js)
const router = Router();

// create: takes a url (and optional useAI) -> scrapes and saves
// validate() ensures request matches zod schema before hitting controller
router.post('/websites', validate(createWebsiteSchema), createWebsite);

// list: quick dump sorted by created_at (sorting is inside controller)
router.get('/websites', listWebsites);

// read one by id
router.get('/websites/:id', getWebsite);

// update: can re-scrape if new url provided
router.put('/websites/:id', validate(updateWebsiteSchema), updateWebsite);

// delete: hard delete by id
router.delete('/websites/:id', deleteWebsite);

export default router;
