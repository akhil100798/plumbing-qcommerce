const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal pure-Node PNG generator
function createPNG(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 per line
  const rawRowLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * rawRowLen);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rawRowLen;
    rawData[rowStart] = 0; // filter byte: None
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 4;
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
      rawData[pixelStart + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.slice(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return crc ^ -1;
}

const assetsDir = path.resolve(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Brand Blue: rgb(0, 91, 191) -> #005bbf
const brandBlue = [0, 91, 191];

fs.writeFileSync(path.join(assetsDir, 'icon.png'), createPNG(512, 512, ...brandBlue));
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), createPNG(512, 512, ...brandBlue));
fs.writeFileSync(path.join(assetsDir, 'splash.png'), createPNG(1024, 1024, ...brandBlue));
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), createPNG(48, 48, ...brandBlue));

console.log('Successfully generated Expo icons in /assets/: icon.png, adaptive-icon.png, splash.png, favicon.png');
