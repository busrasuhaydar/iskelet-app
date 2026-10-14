import fs from 'fs';
import path from 'path';

export function extractDriveFileId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Match /file/d/<id>
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch) return fileDMatch[1];
  // Match /d/<id>
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch) return dMatch[1];
  // Match ?id=<id> or &id=<id>
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  // Direct file ID (typically 20 to 50 alphanumeric characters)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export async function downloadGoogleDriveFile(fileId: string): Promise<Buffer> {
  // Strategy 1: Direct user content endpoint with confirm=t
  const directUrls = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://docs.google.com/uc?export=download&id=${fileId}`,
  ];

  for (const targetUrl of directUrls) {
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      // If it returned HTML, Google Drive gave a confirmation or interstitial page
      if (contentType.includes('text/html')) {
        const html = await response.text();
        const confirmMatch =
          html.match(/confirm=([0-9A-Za-z_-]+)/) ||
          html.match(/name="confirm"\s+value="([^"]+)"/) ||
          html.match(/id="confirm"[^>]*value="([^"]+)"/);

        if (confirmMatch) {
          const confirmToken = confirmMatch[1];
          const confirmUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`;
          const confirmRes = await fetch(confirmUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            redirect: 'follow',
          });
          if (confirmRes.ok && !confirmRes.headers.get('content-type')?.includes('text/html')) {
            const arr = await confirmRes.arrayBuffer();
            return Buffer.from(arr);
          }
        }
        continue;
      }

      // Valid binary response (GLTF/GLB or octet-stream)
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > 1000) {
        return Buffer.from(arrayBuffer);
      }
    } catch (err) {
      console.warn(`Attempt with ${targetUrl} failed:`, err);
    }
  }

  throw new Error(
    `Google Drive'dan dosya indirilemedi (ID: ${fileId}). Lütfen dosyanın 'Bağlantıya sahip olan herkes görüntüleyebilir' şeklinde paylaşıldığından emin olun.`
  );
}
