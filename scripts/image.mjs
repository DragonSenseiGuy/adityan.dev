// Loads a card image into a data URI at build time, so the cards stay static
// files with no network dependency at render time.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };

// Enough of each header to get the intrinsic size; the card only needs the
// aspect ratio, to decide between bleeding the image and insetting it.
function dimensions(buffer) {
  if (buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }; // PNG
  }
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2; // JPEG: walk the segments to the frame header
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset++; continue; }
      const marker = buffer[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }
  if (buffer.length > 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    if (buffer.toString('ascii', 12, 16) === 'VP8X') {
      return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
    }
  }
  return null;
}

/**
 * Accepts an absolute URL or a path relative to the repo root, and returns
 * `{ src, aspect }` for the card — or null, with a warning, if it cannot be
 * read. A missing image never fails the build; the card just falls back to the
 * monogram.
 */
export async function loadCardImage(source, { root }) {
  if (!source) return null;
  try {
    const remote = /^https?:\/\//.test(source);
    const buffer = remote
      ? Buffer.from(await (await fetch(source)).arrayBuffer())
      : readFileSync(join(root, source.replace(/^\//, '')));
    const type = MIME[(source.split('?')[0].split('.').pop() || '').toLowerCase()] || 'image/png';
    const size = dimensions(buffer);
    return {
      src: `data:${type};base64,${buffer.toString('base64')}`,
      aspect: size ? size.width / size.height : 1,
    };
  } catch (error) {
    console.warn(`  ! card image skipped (${source}): ${error.message}`);
    return null;
  }
}
