/**
 * Rendert het door de gebruiker gekozen bijsnijgebied (met rotatie) naar een
 * schone JPEG-blob, volledig in de browser (canvas). react-easy-crop geeft ons
 * het bijsnijkader in pixels; wij tekenen dat rechtgezet op een canvas. Zo gaat
 * er nooit een ruwe camerafoto naar de server — alleen de nette uitsnede.
 */

export interface CropPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', () => reject(new Error('image_load_failed')));
    img.src = src;
  });
}

/** Bijgesneden + geroteerde uitsnede als JPEG-blob (rotation is 0/90/180/270). */
export async function croppedJpegBlob(
  imageSrc: string,
  crop: CropPixels,
  rotation: number,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const rot = ((rotation % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');

  // Teken de hele (geroteerde) bron op een tussencanvas, snijd dan het kader uit.
  const work = document.createElement('canvas');
  work.width = swap ? image.height : image.width;
  work.height = swap ? image.width : image.height;
  const wctx = work.getContext('2d');
  if (!wctx) throw new Error('canvas_unavailable');
  wctx.translate(work.width / 2, work.height / 2);
  wctx.rotate((rot * Math.PI) / 180);
  wctx.drawImage(image, -image.width / 2, -image.height / 2);

  ctx.drawImage(work, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode_failed'))),
      'image/jpeg',
      0.92,
    );
  });
}
