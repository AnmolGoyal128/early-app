/**
 * Zero-dependency minimal valid PDF 1.4 byte buffer generator
 * Generates conforming binary PDF byte buffers for testing file uploads.
 */

export function createSyntheticPdfBuffer(title = 'Medical Diagnostic Report', content = 'Test Report Content') {
  const safeTitle = String(title).replace(/[\r\n\(\)]/g, ' ');
  const safeLines = String(content)
    .split(/\r?\n/)
    .filter(l => l.trim().length > 0)
    .map(l => l.replace(/[\(\)\\]/g, ' '));

  let streamText = `BT\n/F1 12 Tf\n50 720 Td\n(${safeTitle}) Tj\n/F1 10 Tf\n`;
  for (const line of safeLines) {
    streamText += `0 -16 Td\n(${line}) Tj\n`;
  }
  streamText += `ET\n`;

  const streamBytes = Buffer.from(streamText, 'utf-8');
  const streamLength = streamBytes.length;

  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const obj5Prefix = `5 0 obj\n<< /Length ${streamLength} >>\nstream\n`;
  const obj5Suffix = `\nendstream\nendobj\n`;

  const offset1 = Buffer.byteLength(header, 'binary');
  const offset2 = offset1 + Buffer.byteLength(obj1, 'utf-8');
  const offset3 = offset2 + Buffer.byteLength(obj2, 'utf-8');
  const offset4 = offset3 + Buffer.byteLength(obj3, 'utf-8');
  const offset5 = offset4 + Buffer.byteLength(obj4, 'utf-8');
  const offsetObj5Total = Buffer.byteLength(obj5Prefix, 'utf-8') + streamLength + Buffer.byteLength(obj5Suffix, 'utf-8');
  const offsetStartXref = offset5 + offsetObj5Total;

  function padOffset(num) {
    return String(num).padStart(10, '0') + ' 00000 n \n';
  }

  const xref = 'xref\n0 6\n0000000000 65535 f \n' +
    padOffset(offset1) +
    padOffset(offset2) +
    padOffset(offset3) +
    padOffset(offset4) +
    padOffset(offset5);

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offsetStartXref}\n%%EOF\n`;

  return Buffer.concat([
    Buffer.from(header, 'binary'),
    Buffer.from(obj1, 'utf-8'),
    Buffer.from(obj2, 'utf-8'),
    Buffer.from(obj3, 'utf-8'),
    Buffer.from(obj4, 'utf-8'),
    Buffer.from(obj5Prefix, 'utf-8'),
    streamBytes,
    Buffer.from(obj5Suffix, 'utf-8'),
    Buffer.from(xref, 'utf-8'),
    Buffer.from(trailer, 'utf-8')
  ]);
}
