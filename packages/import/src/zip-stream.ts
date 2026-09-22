import { Zip, ZipPassThrough } from 'fflate';

/**
 * Streaming ZIP builder (for the "download my whole archive" export, §40). Emits
 * a Web ReadableStream so a serverless route can send a large archive without
 * holding it all in memory: entries are pulled one at a time and stored without
 * recompression (originals like JPEG/MP4/PDF don't benefit from it), keeping the
 * working set to roughly a single file plus fflate's buffers.
 */
export interface ZipEntry {
  /** Path inside the archive, e.g. `originals/photos/001_foo.jpg`. */
  name: string;
  data: Uint8Array;
}

export function streamZip(entries: () => AsyncIterable<ZipEntry>): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const zip = new Zip((err, chunk, final) => {
        if (err) {
          controller.error(err);
          return;
        }
        if (chunk.length) controller.enqueue(chunk);
        if (final) controller.close();
      });
      try {
        for await (const entry of entries()) {
          const file = new ZipPassThrough(entry.name);
          zip.add(file);
          file.push(entry.data, true);
        }
        zip.end();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
