// Pure TypeScript client-side ZIP generator (Store/No compression)
// Creates standard valid PKZIP archives directly in browser memory without external npm packages.

function crc32(buffer: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export async function createZipBlob(
  files: Array<{ name: string; url: string }>
): Promise<Blob> {
  const fileEntries: Array<{
    nameBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    offset: number;
  }> = [];

  const chunks: Uint8Array[] = [];
  let currentOffset = 0;

  for (const file of files) {
    let dataBytes: Uint8Array;
    if (file.url.startsWith('data:')) {
      const base64 = file.url.split(',')[1];
      const binaryString = atob(base64);
      dataBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        dataBytes[i] = binaryString.charCodeAt(i);
      }
    } else {
      const resp = await fetch(file.url);
      const arrayBuf = await resp.arrayBuffer();
      dataBytes = new Uint8Array(arrayBuf);
    }

    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(file.name);
    const fileCrc = crc32(dataBytes);

    // Local file header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed (2.0)
    view.setUint16(6, 0, true); // General purpose bit flag
    view.setUint16(8, 0, true); // Compression method (0 = stored)
    view.setUint16(10, 0, true); // File last mod time
    view.setUint16(12, 0, true); // File last mod date
    view.setUint32(14, fileCrc, true); // CRC-32
    view.setUint32(18, dataBytes.length, true); // Compressed size
    view.setUint32(22, dataBytes.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader);
    chunks.push(dataBytes);

    fileEntries.push({
      nameBytes,
      dataBytes,
      crc: fileCrc,
      offset: currentOffset,
    });

    currentOffset += localHeader.length + dataBytes.length;
  }

  // Central directory records
  const centralDirStartOffset = currentOffset;
  let centralDirSize = 0;

  for (const entry of fileEntries) {
    const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
    const view = new DataView(cdHeader.buffer);
    view.setUint32(0, 0x02014b50, true); // Central directory header signature
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed to extract
    view.setUint16(8, 0, true); // General purpose bit flag
    view.setUint16(10, 0, true); // Compression method (0)
    view.setUint16(12, 0, true); // File last mod time
    view.setUint16(14, 0, true); // File last mod date
    view.setUint32(16, entry.crc, true); // CRC-32
    view.setUint32(20, entry.dataBytes.length, true); // Compressed size
    view.setUint32(24, entry.dataBytes.length, true); // Uncompressed size
    view.setUint16(28, entry.nameBytes.length, true); // File name length
    view.setUint16(30, 0, true); // Extra field length
    view.setUint16(32, 0, true); // File comment length
    view.setUint16(34, 0, true); // Disk number start
    view.setUint16(36, 0, true); // Internal file attributes
    view.setUint32(38, 0, true); // External file attributes
    view.setUint32(42, entry.offset, true); // Relative offset of local header
    cdHeader.set(entry.nameBytes, 46);

    chunks.push(cdHeader);
    centralDirSize += cdHeader.length;
    currentOffset += cdHeader.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const viewEocd = new DataView(eocd.buffer);
  viewEocd.setUint32(0, 0x06054b50, true); // EOCD signature
  viewEocd.setUint16(4, 0, true); // Number of this disk
  viewEocd.setUint16(6, 0, true); // Disk where central directory starts
  viewEocd.setUint16(8, fileEntries.length, true); // Number of central directory records on this disk
  viewEocd.setUint16(10, fileEntries.length, true); // Total number of central directory records
  viewEocd.setUint32(12, centralDirSize, true); // Size of central directory
  viewEocd.setUint32(16, centralDirStartOffset, true); // Offset of start of central directory
  viewEocd.setUint16(20, 0, true); // Comment length

  chunks.push(eocd);

  return new Blob(chunks as any, { type: 'application/zip' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
