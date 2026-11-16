import { RiwayatPerubahanItem } from '../types/spo';

/**
 * Formats metadata.noRevisi into a clean consistent version label
 * matching Kop Dokumen and F.2 Riwayat Perubahan Dokumen.
 */
export function formatSpoVersionLabel(noRevisi?: string): string {
  const clean = (noRevisi || '0').trim();
  if (!clean || clean === '0' || clean === '00') {
    return 'Rev. 0 (Terbit Perdana)';
  }
  if (/^(rev|versi)/i.test(clean)) {
    return clean;
  }
  return `Rev. ${clean}`;
}

/**
 * Strips hallucinated / mismatched version tags or dates inside a revision description
 * so F.2 never contradicts Kop Dokumen's No. Revisi and Tanggal Terbit.
 */
function cleanRevisionDescription(rawDesc: string | undefined, judulSpo?: string): string {
  const clean = (rawDesc || '')
    .replace(/\b(versi|rev\.?|revisi)\s*\d+(\.\d+)?\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (clean.length >= 12) {
    return clean;
  }
  const titleText = (judulSpo || 'Standar Prosedur Operasional (SPO)').toLowerCase();
  return `Penyusunan dan penetapan dokumen Standar Prosedur Operasional (SPO) ${titleText}.`;
}

/**
 * Normalizes `riwayatPerubahan` so it strictly follows `metadata.noRevisi` and `metadata.tanggalTerbit`.
 * - For Rev 0 / 00: enforces a single matching entry for Tanggal Terbit & Rev. 0 (Terbit Perdana).
 * - For Rev >= 1: ensures history never exceeds `noRevisi` and the latest entry always matches
 *   `metadata.tanggalTerbit` and `formatSpoVersionLabel(metadata.noRevisi)`.
 */
export function normalizeRiwayatPerubahan(
  existing: RiwayatPerubahanItem[] | undefined,
  metadata: { noRevisi?: string; tanggalTerbit?: string },
  judulSpo?: string
): RiwayatPerubahanItem[] {
  const rawRev = (metadata.noRevisi || '0').trim();
  const targetVersion = formatSpoVersionLabel(rawRev);
  const targetDate =
    (metadata.tanggalTerbit || '').trim() ||
    new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const parsedNum = parseInt(rawRev.replace(/\D/g, ''), 10);
  const isInitialRelease = isNaN(parsedNum) || parsedNum <= 0;

  const validExisting = Array.isArray(existing)
    ? existing.filter((r) => r && (r.tanggal || r.versi || r.deskripsi))
    : [];

  if (isInitialRelease) {
    const firstDesc = cleanRevisionDescription(
      validExisting[validExisting.length - 1]?.deskripsi || validExisting[0]?.deskripsi,
      judulSpo
    );
    return [
      {
        tanggal: targetDate,
        versi: targetVersion,
        deskripsi: firstDesc,
      },
    ];
  }

  // Revision >= 1: Align latest entry with exact Kop version & date
  const latestDesc =
    validExisting[validExisting.length - 1]?.deskripsi?.trim() ||
    `Pembaruan prosedur operasional dan penyesuaian standar mutu (${targetVersion}).`;

  return [
    {
      tanggal: targetDate,
      versi: targetVersion,
      deskripsi: cleanRevisionDescription(latestDesc, judulSpo),
    },
  ];
}
