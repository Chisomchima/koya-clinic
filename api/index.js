// Vercel entry point: every non-static request is handled by the Express app.
import { createApp } from '../server/dist/app.js';

export default createApp();
