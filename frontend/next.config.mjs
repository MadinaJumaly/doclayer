import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Widens Turbopack/webpack's module-resolution root to the repo root (one level
// up) so DocEditor.jsx can import the shared schema module at ../shared/tiptap-schema
// (shared/tiptap-schema.js), the single source of truth also used by collab-server.
// Without this, Turbopack refuses to resolve any import that escapes its inferred
// project root (the directory with the nearest lockfile, i.e. frontend/).
/** @type {import('next').NextConfig} */
const nextConfig = {
	outputFileTracingRoot: path.join(__dirname, '..'),
};

export default nextConfig;
