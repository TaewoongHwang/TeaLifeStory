import { normalizeBase } from '../src/config/base.js'

// Match the connected repository's case-sensitive GitHub Pages path.
export const testBase = normalizeBase(process.env.TEST_BASE_PATH || '/TeaLifeStory/')
