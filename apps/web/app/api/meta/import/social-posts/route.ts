import { metaImporter } from '@/lib/meta-eyi/importer';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** POST /api/meta/import/social-posts — Meta pushes one item per request. */
export const POST = metaImporter('social-posts');
