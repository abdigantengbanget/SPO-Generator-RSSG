import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ImageRun,
  ShadingType,
  VerticalAlignTable,
  TableLayoutType,
  HeightRule,
  LineRuleType,
} from 'docx';
import { SpoDocument } from '../types/spo';
import { buildFlowchartSvgMarkup } from './flowchartHelper';
import { formatSpoVersionLabel } from './spoFormatHelper';

const DOC_FONT = 'Calibri';

const COLOR_SLATE_900 = '0F172A';
const COLOR_SLATE_800 = '1E293B';
const COLOR_SLATE_700 = '334155';
const COLOR_SLATE_500 = '64748B';
const COLOR_SLATE_400 = '94A3B8';
const BG_SLATE_100 = 'F1F5F9';
const BG_SLATE_50 = 'F8FAFC';

// A4 Portrait (210mm x 297mm) = 11906 x 16838 twips, 15mm (850 twips) margins => 10206 twips content width
const PAGE_WIDTH_TWIPS = 11906;
const PAGE_HEIGHT_TWIPS = 16838;
const PAGE_MARGIN_TWIPS = 850;

const BORDER_THIN_BLACK = {
  top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
};

const BORDER_THICK_BLACK = {
  top: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
};

const CELL_MARGIN_STANDARD = { top: 100, bottom: 100, left: 120, right: 120 };
const CELL_MARGIN_COMPACT = { top: 80, bottom: 80, left: 100, right: 100 };
const CELL_MARGIN_WIDE = { top: 120, bottom: 120, left: 140, right: 140 };

function makeRun(
  text: string,
  opts: {
    size?: number;
    bold?: boolean;
    italics?: boolean;
    color?: string;
    underline?: boolean;
    characterSpacing?: number;
  } = {}
): TextRun {
  return new TextRun({
    text,
    font: {
      ascii: DOC_FONT,
      hAnsi: DOC_FONT,
      cs: DOC_FONT,
      eastAsia: DOC_FONT,
    },
    size: opts.size ?? 21, // 10.5pt (matches 14px web preview)
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color ?? COLOR_SLATE_800,
    underline: opts.underline ? {} : undefined,
    characterSpacing: opts.characterSpacing,
  });
}

function makeSectionHeading(text: string, spacingBefore = 240): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: spacingBefore, after: 110, line: 280, lineRule: LineRuleType.AUTO },
    children: [
      makeRun(text.toUpperCase(), {
        size: 24, // 12pt (matches text-base)
        bold: true,
        color: COLOR_SLATE_900,
      }),
    ],
  });
}

function makeSubHeading(text: string, spacingBefore = 140, uppercase = false): Paragraph {
  return new Paragraph({
    keepNext: true,
    spacing: { before: spacingBefore, after: 90, line: 280, lineRule: LineRuleType.AUTO },
    children: [
      makeRun(uppercase ? text.toUpperCase() : text, {
        size: 21, // 10.5pt (matches text-sm)
        bold: true,
        color: uppercase ? COLOR_SLATE_900 : COLOR_SLATE_800,
      }),
    ],
  });
}

async function svgToPngBytes(
  svgString: string,
  width: number,
  height: number
): Promise<ArrayBuffer | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        try {
          const scale = 2.5; // High-DPI crisp diagram output in Word
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            async (pngBlob) => {
              URL.revokeObjectURL(url);
              if (!pngBlob) {
                resolve(null);
                return;
              }
              const buf = await pngBlob.arrayBuffer();
              resolve(buf);
            },
            'image/png',
            1.0
          );
        } catch {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

export async function exportToDocx(spo: SpoDocument): Promise<void> {
  // Fetch official RS Semen Gresik logo
  let logoParagraphs: Paragraph[] = [];
  try {
    const res = await fetch('/assets/aistudio/rs-semen-gresik_d7d14617.png');
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      logoParagraphs = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              type: 'png',
              data: arrayBuffer,
              transformation: {
                width: 102,
                height: 102,
              },
            }),
          ],
        }),
      ];
    }
  } catch (err) {
    console.warn('Could not load logo for docx, using text fallback', err);
  }

  if (logoParagraphs.length === 0) {
    logoParagraphs = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          makeRun(spo.metadata.institusi || 'RUMAH SAKIT SEMEN GRESIK', {
            bold: true,
            size: 18,
            color: COLOR_SLATE_900,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          makeRun('PT Cipta Nirmala', {
            size: 15,
            italics: true,
            color: COLOR_SLATE_700,
          }),
        ],
      }),
    ];
  }

  // =========================================================================
  // KOP / HEADER TABLE (22% | 26% | 26% | 26% = [2246, 2653, 2653, 2654])
  // =========================================================================
  const headerTable = new Table({
    width: { size: 10206, type: WidthType.DXA },
    columnWidths: [2246, 2653, 2653, 2654],
    layout: TableLayoutType.FIXED,
    borders: BORDER_THICK_BLACK,
    rows: [
      // Row 1: Logo (Col 1, rowSpan 2) & Judul SPO (Col 2-4, columnSpan 3)
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 2246, type: WidthType.DXA },
            rowSpan: 2,
            verticalAlign: VerticalAlignTable.CENTER,
            margins: CELL_MARGIN_STANDARD,
            borders: BORDER_THICK_BLACK,
            children: logoParagraphs,
          }),
          new TableCell({
            width: { size: 7960, type: WidthType.DXA },
            columnSpan: 3,
            verticalAlign: VerticalAlignTable.CENTER,
            margins: { top: 180, bottom: 180, left: 180, right: 180 },
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0, line: 280, lineRule: LineRuleType.AUTO },
                children: [
                  makeRun((spo.judulSpo || 'STANDAR PROSEDUR OPERASIONAL').toUpperCase(), {
                    bold: true,
                    size: 26, // 13pt (matches text-base md:text-lg)
                    color: COLOR_SLATE_900,
                    characterSpacing: 10,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Row 2: No Dokumen | No Revisi | Halaman
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 2653, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.CENTER,
            margins: CELL_MARGIN_COMPACT,
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 30, line: 240 },
                children: [makeRun('No. Dokumen', { bold: true, size: 17, color: COLOR_SLATE_700 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0, line: 240 },
                children: [makeRun(spo.metadata.noDokumen || '-', { size: 20, color: COLOR_SLATE_900 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2653, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.CENTER,
            margins: CELL_MARGIN_COMPACT,
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 30, line: 240 },
                children: [makeRun('No. Revisi', { bold: true, size: 17, color: COLOR_SLATE_700 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0, line: 240 },
                children: [makeRun(spo.metadata.noRevisi || '0', { size: 20, color: COLOR_SLATE_900 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2654, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.CENTER,
            margins: CELL_MARGIN_COMPACT,
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 30, line: 240 },
                children: [makeRun('Halaman', { bold: true, size: 17, color: COLOR_SLATE_700 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0, line: 240 },
                children: [makeRun('1 dari 1', { size: 20, color: COLOR_SLATE_900 })],
              }),
            ],
          }),
        ],
      }),
      // Row 3: SPO | Tanggal terbit | Ditetapkan Kepala RS
      new TableRow({
        cantSplit: true,
        height: { value: 1450, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: { size: 2246, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.CENTER,
            margins: CELL_MARGIN_STANDARD,
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  makeRun('SPO', {
                    bold: true,
                    size: 30, // 15pt (matches text-xl)
                    color: COLOR_SLATE_900,
                    characterSpacing: 50,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2653, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.CENTER,
            margins: CELL_MARGIN_STANDARD,
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 30, line: 240 },
                children: [makeRun('Tanggal terbit', { bold: true, size: 17, color: COLOR_SLATE_700 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0, line: 240 },
                children: [makeRun(spo.metadata.tanggalTerbit || '-', { size: 20, color: COLOR_SLATE_900 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 5307, type: WidthType.DXA },
            columnSpan: 2,
            verticalAlign: VerticalAlignTable.BOTTOM,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 20, line: 240 },
                children: [makeRun('Ditetapkan,', { bold: true, size: 17, color: COLOR_SLATE_700 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 720, line: 240 },
                children: [makeRun('Kepala Rumah Sakit', { size: 17, color: COLOR_SLATE_800 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0, line: 240 },
                children: [
                  makeRun(spo.metadata.kepalaRumahSakit || 'dr. Tolib Bahasuan', {
                    bold: true,
                    underline: true,
                    size: 20,
                    color: COLOR_SLATE_900,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // =========================================================================
  // BODY SECTIONS A, B, C
  // =========================================================================
  const bodyParagraphs: Paragraph[] = [
    new Paragraph({ text: '', spacing: { before: 120, after: 80 } }),

    // A. PENGERTIAN
    makeSectionHeading('A. PENGERTIAN', 120),
    makeSubHeading('A.1 Definisi', 80),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
      children: [
        makeRun(
          'Untuk menyamakan persepsi operasional di seluruh unit, batasan istilah dalam prosedur ini ditetapkan sebagai berikut:',
          { size: 21, color: COLOR_SLATE_700 }
        ),
      ],
    }),
  ];

  // A.1 Definisi items
  if (spo.pengertian.definisi.length > 0) {
    spo.pengertian.definisi.forEach((def, index) => {
      bodyParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 320, hanging: 240 },
          spacing: { after: 90 },
          children: [
            makeRun(`${index + 1}. `, { bold: true, size: 21, color: COLOR_SLATE_900 }),
            makeRun(`${def.istilah}: `, { bold: true, size: 21, color: COLOR_SLATE_900 }),
            makeRun(def.penjelasan, { size: 21, color: COLOR_SLATE_800 }),
          ],
        })
      );
    });
  } else {
    bodyParagraphs.push(
      new Paragraph({
        spacing: { after: 90 },
        children: [
          makeRun('Belum ada definisi istilah yang ditambahkan.', {
            italics: true,
            size: 19,
            color: COLOR_SLATE_500,
          }),
        ],
      })
    );
  }

  // A.2 Ruang Lingkup
  bodyParagraphs.push(
    makeSubHeading('A.2 Ruang Lingkup', 140),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 90 },
      children: [
        makeRun(
          spo.pengertian.ruangLingkup.pengantar ||
            'Prosedur ini berlaku di lingkungan Rumah Sakit dan mengikat seluruh unit pelayanan terkait:',
          { size: 21, color: COLOR_SLATE_700 }
        ),
      ],
    })
  );

  spo.pengertian.ruangLingkup.unitList.forEach((unit, idx) => {
    bodyParagraphs.push(
      new Paragraph({
        indent: { left: 420, hanging: 240 },
        spacing: { after: 60 },
        children: [
          makeRun(`${idx + 1}. `, { bold: true, size: 21, color: COLOR_SLATE_900 }),
          makeRun(unit, { size: 21, color: COLOR_SLATE_800 }),
        ],
      })
    );
  });

  // B. TUJUAN
  bodyParagraphs.push(
    makeSectionHeading('B. TUJUAN', 220),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
      children: [
        makeRun(
          'Prosedur ini bertujuan untuk menetapkan standar operasional dalam mengelola dan memitigasi risiko operasional dengan sasaran:',
          { size: 21, color: COLOR_SLATE_700 }
        ),
      ],
    })
  );

  if (spo.tujuan.length > 0) {
    spo.tujuan.forEach((tuj) => {
      bodyParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 420, hanging: 240 },
          spacing: { after: 90 },
          children: [
            makeRun('● ', { size: 17, color: COLOR_SLATE_900 }),
            makeRun(`${tuj.judulTujuan}: `, { bold: true, size: 21, color: COLOR_SLATE_900 }),
            makeRun(tuj.deskripsi, { size: 21, color: COLOR_SLATE_800 }),
          ],
        })
      );
    });
  } else {
    bodyParagraphs.push(
      new Paragraph({
        spacing: { after: 90 },
        children: [
          makeRun('Belum ada sasaran tujuan yang ditambahkan.', {
            italics: true,
            size: 19,
            color: COLOR_SLATE_500,
          }),
        ],
      })
    );
  }

  // C. KEBIJAKAN
  bodyParagraphs.push(makeSectionHeading('C. KEBIJAKAN', 220), makeSubHeading('C.1 Ketentuan Kebijakan', 80));

  spo.kebijakan.ketentuan.forEach((k, idx) => {
    bodyParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 320, hanging: 240 },
        spacing: { after: 90 },
        children: [
          makeRun(`${idx + 1}. `, { bold: true, size: 21, color: COLOR_SLATE_900 }),
          makeRun(k, { size: 21, color: COLOR_SLATE_800 }),
        ],
      })
    );
  });

  bodyParagraphs.push(makeSubHeading('C.2 Analisis Risiko & Mitigasi (Risk Register Operasional)', 180));

  // =========================================================================
  // C.2 RISK REGISTER TABLE (8% | 22% | 20% | 25% | 25% = [816, 2245, 2041, 2552, 2552])
  // =========================================================================
  const riskHeaderShading = { type: ShadingType.CLEAR, fill: BG_SLATE_100, color: 'auto' };
  const riskTableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 816, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riskHeaderShading,
          margins: CELL_MARGIN_STANDARD,
          borders: BORDER_THIN_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('KODE', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
        new TableCell({
          width: { size: 2245, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riskHeaderShading,
          margins: CELL_MARGIN_STANDARD,
          borders: BORDER_THIN_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('PROSES / AKTIVITAS', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
        new TableCell({
          width: { size: 2041, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riskHeaderShading,
          margins: CELL_MARGIN_STANDARD,
          borders: BORDER_THIN_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('NAMA RISIKO', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
        new TableCell({
          width: { size: 2552, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riskHeaderShading,
          margins: CELL_MARGIN_STANDARD,
          borders: BORDER_THIN_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('DESKRIPSI RISIKO', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
        new TableCell({
          width: { size: 2552, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riskHeaderShading,
          margins: CELL_MARGIN_STANDARD,
          borders: BORDER_THIN_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('PENGENDALIAN RISIKO / MITIGASI', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
      ],
    }),
  ];

  if (spo.kebijakan.riskRegister.length > 0) {
    spo.kebijakan.riskRegister.forEach((r) => {
      riskTableRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 816, type: WidthType.DXA },
              verticalAlign: VerticalAlignTable.TOP,
              margins: CELL_MARGIN_STANDARD,
              borders: BORDER_THIN_BLACK,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun(r.kode, { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
            }),
            new TableCell({
              width: { size: 2245, type: WidthType.DXA },
              verticalAlign: VerticalAlignTable.TOP,
              margins: CELL_MARGIN_STANDARD,
              borders: BORDER_THIN_BLACK,
              children: [new Paragraph({ spacing: { after: 0 }, children: [makeRun(r.proses, { bold: true, size: 18, color: COLOR_SLATE_800 })] })],
            }),
            new TableCell({
              width: { size: 2041, type: WidthType.DXA },
              verticalAlign: VerticalAlignTable.TOP,
              margins: CELL_MARGIN_STANDARD,
              borders: BORDER_THIN_BLACK,
              children: [new Paragraph({ spacing: { after: 0 }, children: [makeRun(r.namaRisiko, { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
            }),
            new TableCell({
              width: { size: 2552, type: WidthType.DXA },
              verticalAlign: VerticalAlignTable.TOP,
              margins: CELL_MARGIN_STANDARD,
              borders: BORDER_THIN_BLACK,
              children: [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 0 }, children: [makeRun(r.deskripsiRisiko, { size: 18, color: COLOR_SLATE_800 })] })],
            }),
            new TableCell({
              width: { size: 2552, type: WidthType.DXA },
              verticalAlign: VerticalAlignTable.TOP,
              margins: CELL_MARGIN_STANDARD,
              borders: BORDER_THIN_BLACK,
              children: r.mitigasi.map(
                (m, mIdx) =>
                  new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    indent: { left: 260, hanging: 200 },
                    spacing: { after: mIdx === r.mitigasi.length - 1 ? 0 : 50 },
                    children: [
                      makeRun(`${mIdx + 1}. `, { size: 18, color: COLOR_SLATE_800 }),
                      makeRun(m, { size: 18, color: COLOR_SLATE_800 }),
                    ],
                  })
              ),
            }),
          ],
        })
      );
    });
  } else {
    riskTableRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: 5,
            shading: { type: ShadingType.CLEAR, fill: BG_SLATE_50, color: 'auto' },
            margins: CELL_MARGIN_STANDARD,
            borders: BORDER_THIN_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [makeRun('Belum ada data identifikasi risiko operasional.', { italics: true, size: 18, color: COLOR_SLATE_400 })],
              }),
            ],
          }),
        ],
      })
    );
  }

  const riskTable = new Table({
    width: { size: 10206, type: WidthType.DXA },
    columnWidths: [816, 2245, 2041, 2552, 2552],
    layout: TableLayoutType.FIXED,
    borders: BORDER_THIN_BLACK,
    rows: riskTableRows,
  });

  // =========================================================================
  // D.1 PROSEDUR PELAKSANAAN TABLE (10% | 52% | 14% | 24% = [1021, 5307, 1429, 2449])
  // =========================================================================
  const prosedurTableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 1021, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riskHeaderShading,
          margins: CELL_MARGIN_STANDARD,
          borders: BORDER_THIN_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('NO. PROSES', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
        new TableCell({
          width: { size: 5307, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riskHeaderShading,
          margins: CELL_MARGIN_STANDARD,
          borders: BORDER_THIN_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('TAHAPAN & DESKRIPSI KEGIATAN', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
        new TableCell({
          width: { size: 1429, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riskHeaderShading,
          margins: CELL_MARGIN_STANDARD,
          borders: BORDER_THIN_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('LEAD TIME', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
        new TableCell({
          width: { size: 2449, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riskHeaderShading,
          margins: CELL_MARGIN_STANDARD,
          borders: BORDER_THIN_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('PELAKSANA / FUNGSI', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
      ],
    }),
  ];

  if (spo.prosedur.length > 0) {
    spo.prosedur.forEach((p) => {
      const stepParagraphs = [
        new Paragraph({
          spacing: { after: 70 },
          children: [
            makeRun((p.judulTahapan || '-').toUpperCase(), {
              bold: true,
              size: 18,
              color: COLOR_SLATE_900,
              characterSpacing: 8,
            }),
          ],
        }),
        ...p.langkah.map(
          (l, lIdx) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              indent: { left: 260, hanging: 200 },
              spacing: { after: lIdx === p.langkah.length - 1 ? 0 : 50 },
              children: [
                makeRun(`${lIdx + 1}. `, { size: 18, color: COLOR_SLATE_800 }),
                makeRun(l, { size: 18, color: COLOR_SLATE_800 }),
              ],
            })
        ),
      ];

      prosedurTableRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 1021, type: WidthType.DXA },
              verticalAlign: VerticalAlignTable.TOP,
              margins: CELL_MARGIN_STANDARD,
              borders: BORDER_THIN_BLACK,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun(p.noProses, { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
            }),
            new TableCell({
              width: { size: 5307, type: WidthType.DXA },
              verticalAlign: VerticalAlignTable.TOP,
              margins: CELL_MARGIN_STANDARD,
              borders: BORDER_THIN_BLACK,
              children: stepParagraphs,
            }),
            new TableCell({
              width: { size: 1429, type: WidthType.DXA },
              verticalAlign: VerticalAlignTable.TOP,
              margins: CELL_MARGIN_STANDARD,
              borders: BORDER_THIN_BLACK,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun(p.leadTime, { size: 18, color: COLOR_SLATE_800 })] })],
            }),
            new TableCell({
              width: { size: 2449, type: WidthType.DXA },
              verticalAlign: VerticalAlignTable.TOP,
              margins: CELL_MARGIN_STANDARD,
              borders: BORDER_THIN_BLACK,
              children: [new Paragraph({ spacing: { after: 0 }, children: [makeRun(p.pelaksana, { size: 18, color: COLOR_SLATE_800 })] })],
            }),
          ],
        })
      );
    });
  } else {
    prosedurTableRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: 4,
            shading: { type: ShadingType.CLEAR, fill: BG_SLATE_50, color: 'auto' },
            margins: CELL_MARGIN_STANDARD,
            borders: BORDER_THIN_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [makeRun('Belum ada tahapan prosedur yang ditambahkan.', { italics: true, size: 18, color: COLOR_SLATE_400 })],
              }),
            ],
          }),
        ],
      })
    );
  }

  const prosedurTable = new Table({
    width: { size: 10206, type: WidthType.DXA },
    columnWidths: [1021, 5307, 1429, 2449],
    layout: TableLayoutType.FIXED,
    borders: BORDER_THIN_BLACK,
    rows: prosedurTableRows,
  });

  // =========================================================================
  // D.2 DIAGRAM ALUR PELAYANAN (FLOWCHART) IMAGE (matches SpoFlowchartDocumentEmbed)
  // =========================================================================
  const flowchartParagraphs: Paragraph[] = [
    makeSubHeading('D.2 DIAGRAM ALUR PELAYANAN (FLOWCHART):', 220, true),
  ];

  const { svg, width: svgW, height: svgH } = buildFlowchartSvgMarkup(spo);
  const flowchartPngBytes = await svgToPngBytes(svg, svgW, svgH);
  if (flowchartPngBytes) {
    // 180mm printable A4 width ~= 680px at 96dpi; cap at 660px for crisp fit
    const maxDocxWidth = 660;
    const maxDocxHeight = 820;
    const scaleRatio = Math.min(1, maxDocxWidth / svgW, maxDocxHeight / svgH);
    const targetW = Math.round(svgW * scaleRatio);
    const targetH = Math.round(svgH * scaleRatio);

    flowchartParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 140 },
        children: [
          new ImageRun({
            type: 'png',
            data: flowchartPngBytes,
            transformation: {
              width: targetW,
              height: targetH,
            },
          }),
        ],
      })
    );
  } else if (spo.flowchartModel && spo.flowchartModel.nodes.length > 0) {
    spo.flowchartModel.nodes.forEach((node, idx) => {
      flowchartParagraphs.push(
        new Paragraph({
          spacing: { after: 50 },
          children: [makeRun(`${idx + 1}. ${node.label}`, { size: 19, color: COLOR_SLATE_800 })],
        })
      );
    });
  }

  // =========================================================================
  // E. TANGGUNG JAWAB UNIT TERKAIT
  // =========================================================================
  const unitParagraphs: Paragraph[] = [makeSectionHeading('E. TANGGUNG JAWAB UNIT TERKAIT', 220)];

  spo.tanggungJawabUnit.forEach((u, idx) => {
    unitParagraphs.push(
      new Paragraph({
        keepNext: true,
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: idx === 0 ? 40 : 120, after: 60 },
        children: [
          makeRun(`${idx + 1}. ${u.unit}:`, { bold: true, size: 21, color: COLOR_SLATE_900 }),
        ],
      })
    );
    u.tugas.forEach((t) => {
      unitParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 480, hanging: 220 },
          spacing: { after: 50 },
          children: [
            makeRun('○ ', { size: 20, color: COLOR_SLATE_500 }),
            makeRun(t, { size: 21, color: COLOR_SLATE_800 }),
          ],
        })
      );
    });
  });

  // =========================================================================
  // F. FORMULIR & DOKUMEN PENDUKUNG
  // =========================================================================
  const formParagraphs: Paragraph[] = [
    makeSectionHeading('F. FORMULIR & DOKUMEN PENDUKUNG', 220),
    makeSubHeading('F.1 Dokumen Terkait', 80),
  ];

  if (spo.formulirPendukung.dokumenTerkait.length > 0) {
    spo.formulirPendukung.dokumenTerkait.forEach((d, idx) => {
      formParagraphs.push(
        new Paragraph({
          indent: { left: 320, hanging: 240 },
          spacing: { after: 60 },
          children: [
            makeRun(`${idx + 1}. `, { bold: true, size: 21, color: COLOR_SLATE_900 }),
            makeRun(d, { size: 21, color: COLOR_SLATE_800 }),
          ],
        })
      );
    });
  } else {
    formParagraphs.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          makeRun('Belum ada dokumen terkait yang ditambahkan.', {
            italics: true,
            size: 19,
            color: COLOR_SLATE_500,
          }),
        ],
      })
    );
  }

  formParagraphs.push(makeSubHeading('F.2 Riwayat Perubahan Dokumen', 160));

  // F.2 Riwayat Perubahan Table (25% | 25% | 50% = [2552, 2552, 5102])
  const riwayatHeaderShading = { type: ShadingType.CLEAR, fill: BG_SLATE_50, color: 'auto' };
  const riwayatRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 2552, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riwayatHeaderShading,
          margins: CELL_MARGIN_WIDE,
          borders: BORDER_THICK_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('Tanggal', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
        new TableCell({
          width: { size: 2552, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riwayatHeaderShading,
          margins: CELL_MARGIN_WIDE,
          borders: BORDER_THICK_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('Versi Dokumen', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
        new TableCell({
          width: { size: 5102, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          shading: riwayatHeaderShading,
          margins: CELL_MARGIN_WIDE,
          borders: BORDER_THICK_BLACK,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun('Deskripsi Revisi', { bold: true, size: 18, color: COLOR_SLATE_900 })] })],
        }),
      ],
    }),
    ...(spo.formulirPendukung.riwayatPerubahan.length > 0
      ? spo.formulirPendukung.riwayatPerubahan.map(
          (r) =>
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 2552, type: WidthType.DXA },
                  verticalAlign: VerticalAlignTable.TOP,
                  margins: CELL_MARGIN_WIDE,
                  borders: BORDER_THICK_BLACK,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun(r.tanggal || '-', { size: 18, color: COLOR_SLATE_900 })] })],
                }),
                new TableCell({
                  width: { size: 2552, type: WidthType.DXA },
                  verticalAlign: VerticalAlignTable.TOP,
                  margins: CELL_MARGIN_WIDE,
                  borders: BORDER_THICK_BLACK,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun(r.versi || '-', { size: 18, color: COLOR_SLATE_900 })] })],
                }),
                new TableCell({
                  width: { size: 5102, type: WidthType.DXA },
                  verticalAlign: VerticalAlignTable.TOP,
                  margins: CELL_MARGIN_WIDE,
                  borders: BORDER_THICK_BLACK,
                  children: [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 0 }, children: [makeRun(r.deskripsi || '-', { size: 18, color: COLOR_SLATE_800 })] })],
                }),
              ],
            })
        )
      : [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: 2552, type: WidthType.DXA },
                verticalAlign: VerticalAlignTable.TOP,
                margins: CELL_MARGIN_WIDE,
                borders: BORDER_THICK_BLACK,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun(spo.metadata.tanggalTerbit || '-', { size: 18, color: COLOR_SLATE_900 })] })],
              }),
              new TableCell({
                width: { size: 2552, type: WidthType.DXA },
                verticalAlign: VerticalAlignTable.TOP,
                margins: CELL_MARGIN_WIDE,
                borders: BORDER_THICK_BLACK,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [makeRun(formatSpoVersionLabel(spo.metadata.noRevisi), { size: 18, color: COLOR_SLATE_900 })] })],
              }),
              new TableCell({
                width: { size: 5102, type: WidthType.DXA },
                verticalAlign: VerticalAlignTable.TOP,
                margins: CELL_MARGIN_WIDE,
                borders: BORDER_THICK_BLACK,
                children: [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 0 }, children: [makeRun('Penyusunan perdana dokumen Standar Prosedur Operasional (SPO).', { size: 18, color: COLOR_SLATE_800 })] })],
              }),
            ],
          }),
        ]),
  ];

  const riwayatTable = new Table({
    width: { size: 10206, type: WidthType.DXA },
    columnWidths: [2552, 2552, 5102],
    layout: TableLayoutType.FIXED,
    borders: BORDER_THICK_BLACK,
    rows: riwayatRows,
  });

  // =========================================================================
  // LEMBAR PENGESAHAN DOKUMEN TABLE (33.3% | 33.3% | 33.4% = [3402, 3402, 3402])
  // =========================================================================
  const pengesahanTable = new Table({
    width: { size: 10206, type: WidthType.DXA },
    columnWidths: [3402, 3402, 3402],
    layout: TableLayoutType.FIXED,
    borders: BORDER_THICK_BLACK,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 3402, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.CENTER,
            shading: riwayatHeaderShading,
            margins: CELL_MARGIN_WIDE,
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [makeRun('DRAFTER', { bold: true, size: 20, color: COLOR_SLATE_900, characterSpacing: 15 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3402, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.CENTER,
            shading: riwayatHeaderShading,
            margins: CELL_MARGIN_WIDE,
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [makeRun('CREATOR', { bold: true, size: 20, color: COLOR_SLATE_900, characterSpacing: 15 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3402, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.CENTER,
            shading: riwayatHeaderShading,
            margins: CELL_MARGIN_WIDE,
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [makeRun('REVIEWER', { bold: true, size: 20, color: COLOR_SLATE_900, characterSpacing: 15 })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        cantSplit: true,
        height: { value: 2200, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: { size: 3402, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.BOTTOM,
            margins: { top: 180, bottom: 160, left: 140, right: 140 },
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [makeRun(spo.metadata.drafter.nama || '-', { bold: true, underline: true, size: 20, color: COLOR_SLATE_900 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0, line: 240 },
                children: [makeRun(`(${spo.metadata.drafter.jabatan || 'Drafter'})`, { size: 17, color: COLOR_SLATE_700 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3402, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.BOTTOM,
            margins: { top: 180, bottom: 160, left: 140, right: 140 },
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [makeRun(spo.metadata.creator.nama || '-', { bold: true, underline: true, size: 20, color: COLOR_SLATE_900 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0, line: 240 },
                children: [makeRun(`(${spo.metadata.creator.jabatan || 'Creator'})`, { size: 17, color: COLOR_SLATE_700 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3402, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.BOTTOM,
            margins: { top: 180, bottom: 160, left: 140, right: 140 },
            borders: BORDER_THICK_BLACK,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [makeRun(spo.metadata.reviewer.nama || '-', { bold: true, underline: true, size: 20, color: COLOR_SLATE_900 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0, line: 240 },
                children: [makeRun(`(${spo.metadata.reviewer.jabatan || 'Reviewer'})`, { size: 17, color: COLOR_SLATE_700 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: {
              ascii: DOC_FONT,
              hAnsi: DOC_FONT,
              cs: DOC_FONT,
              eastAsia: DOC_FONT,
            },
            size: 21,
            color: COLOR_SLATE_800,
          },
          paragraph: {
            spacing: { line: 312, lineRule: LineRuleType.AUTO },
          },
        },
        heading2: {
          run: {
            font: {
              ascii: DOC_FONT,
              hAnsi: DOC_FONT,
              cs: DOC_FONT,
              eastAsia: DOC_FONT,
            },
            size: 24,
            bold: true,
            color: COLOR_SLATE_900,
          },
          paragraph: {
            spacing: { before: 240, after: 110, line: 280, lineRule: LineRuleType.AUTO },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: PAGE_WIDTH_TWIPS,
              height: PAGE_HEIGHT_TWIPS,
            },
            margin: {
              top: PAGE_MARGIN_TWIPS,
              right: PAGE_MARGIN_TWIPS,
              bottom: PAGE_MARGIN_TWIPS,
              left: PAGE_MARGIN_TWIPS,
            },
          },
        },
        children: [
          headerTable,
          ...bodyParagraphs,
          riskTable,
          makeSectionHeading('D. PROSEDUR PELAKSANAAN', 240),
          makeSubHeading('D.1 Uraian Alur Prosedur Operasional', 60),
          prosedurTable,
          ...flowchartParagraphs,
          ...unitParagraphs,
          ...formParagraphs,
          riwayatTable,
          new Paragraph({
            keepNext: true,
            alignment: AlignmentType.CENTER,
            spacing: { before: 320, after: 120 },
            children: [
              makeRun('LEMBAR PENGESAHAN DOKUMEN', {
                bold: true,
                size: 21,
                color: COLOR_SLATE_900,
                characterSpacing: 20,
              }),
            ],
          }),
          pengesahanTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeNo = (spo.metadata.noDokumen || 'DOKUMEN').replace(/[\/\\:*?"<>|]/g, '_');
  const safeTitle = (spo.judulSpo || 'STANDAR_PROSEDUR_OPERASIONAL')
    .substring(0, 35)
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const fileName = `SPO_${safeNo}_${safeTitle || 'RS'}.docx`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
