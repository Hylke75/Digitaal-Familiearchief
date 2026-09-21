import { metaImporter } from '@/lib/meta-eyi/importer';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** POST /api/meta/import/photos — Meta pushes one item per request. */
export const POST = metaImporter('photos');
