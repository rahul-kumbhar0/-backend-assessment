// Entry point: load env vars and boot the Express app
import 'dotenv/config';
import app from './app.js';

// Prefer PORT from env (Render sets this), otherwise default to 8080
const PORT = process.env.PORT || 8080;

// Start HTTP server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
