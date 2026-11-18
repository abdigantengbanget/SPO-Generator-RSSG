import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { generateSmartSpoDocument } from "../utils/spoGeneratorEngine.js";
import { buildFlowchartModelFromSpo } from "../utils/flowchartHelper.js";
import { normalizeRiwayatPerubahan } from "../utils/spoFormatHelper.js";

dotenv.config();

const apiApp = express();

apiApp.use(express.json({ limit: "10mb" }));

function isGeminiApiKeyConfigured(): boolean {
  const currentKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!currentKey) return false;
  const placeholders = new Set([
    "MY_GEMINI_API_KEY",
    "MASUKKAN_API_KEY_GEMINI_ANDA",
    "YOUR_GEMINI_API_KEY",
    "YOUR_API_KEY",
  ]);
  return !placeholders.has(currentKey);
}

function classifyGeminiError(err: any): {
  category:
    | "missing_key"
    | "invalid_or_revoked_key"
    | "quota_exceeded"
    | "model_not_found"
    | "service_overloaded"
    | "unknown";
  needsNewKey: boolean;
  notice: string;
  detail: string;
} {
  const detail = String(err?.message || err || "");
  const lower = detail.toLowerCase();

  if (lower.includes("api_key_not_configured") || !isGeminiApiKeyConfigured()) {
    return {
      category: "missing_key",
      needsNewKey: true,
      notice:
        "GEMINI_API_KEY belum terpasang atau masih berisi teks contoh. Dokumen sementara disusun dengan Generator Standar Lokal.",
      detail,
    };
  }
  if (
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("leaked") ||
    lower.includes("revoked") ||
    lower.includes("permission_denied") ||
    lower.includes("403") ||
    (lower.includes("400") && lower.includes("key"))
  ) {
    return {
      category: "invalid_or_revoked_key",
      needsNewKey: true,
      notice:
        "GEMINI_API_KEY tidak valid, diblokir, atau sudah dicabut (400/403). Silakan buat API Key Gemini baru dan perbarui di .env / Vercel. Sementara menggunakan Generator Lokal.",
      detail,
    };
  }
  if (
    lower.includes("resource_exhausted") ||
    lower.includes("429") ||
    lower.includes("quota")
  ) {
    return {
      category: "quota_exceeded",
      needsNewKey: false,
      notice:
        "Kuota atau batas kecepatan API Gemini sedang penuh (429). Sementara menggunakan Generator Standar Lokal.",
      detail,
    };
  }
  if (lower.includes("not_found") || lower.includes("404")) {
    return {
      category: "model_not_found",
      needsNewKey: false,
      notice:
        "Model Gemini tidak tersedia untuk kunci/proyek API ini (404). Pastikan API Key berasal dari Google AI Studio yang aktif. Sementara menggunakan Generator Lokal.",
      detail,
    };
  }
  if (
    lower.includes("503") ||
    lower.includes("high demand") ||
    lower.includes("unavailable")
  ) {
    return {
      category: "service_overloaded",
      needsNewKey: false,
      notice:
        "Server Gemini sedang mengalami lonjakan beban sementara (503 High Demand). Dokumen disusun dengan Generator Standar Lokal.",
      detail,
    };
  }
  return {
    category: "unknown",
    needsNewKey: false,
    notice:
      "Koneksi ke API Gemini gagal atau timeout. Dokumen disusun menggunakan Generator Standar Lokal.",
    detail,
  };
}

function getGeminiClient(): GoogleGenAI {
  const currentKey = process.env.GEMINI_API_KEY;
  if (!isGeminiApiKeyConfigured() || !currentKey) {
    throw new Error("API_KEY_NOT_CONFIGURED: GEMINI_API_KEY belum disetel");
  }
  return new GoogleGenAI({
    apiKey: currentKey.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint for verifying backend API & environment readiness.
// Add ?verify=1 to perform a live lightweight check against Gemini API.
apiApp.get("/api/health", async (req, res) => {
  const geminiConfigured = isGeminiApiKeyConfigured();
  const basePayload = {
    ok: true,
    service: "spo-generator-api",
    geminiConfigured,
    runtime: process.env.VERCEL ? "vercel" : "node",
    timestamp: new Date().toISOString(),
  };

  const shouldVerify = req.query.verify === "1" || req.query.verify === "true";
  if (!shouldVerify) {
    return res.json(basePayload);
  }

  if (!geminiConfigured) {
    return res.json({
      ...basePayload,
      geminiValid: false,
      needsNewKey: true,
      errorCategory: "missing_key",
      diagnosis:
        "GEMINI_API_KEY belum dipasang atau masih berisi nilai contoh di .env / Environment Variables Vercel.",
    });
  }

  try {
    const ai = getGeminiClient();
    const modelCandidates = ["gemini-4-hydrogen", "gemini-3.1-flash-lite"];
    let workingModel = "";
    let lastErr: any = null;

    for (const modelName of modelCandidates) {
      try {
        const config: any =
          modelName === "gemini-4-hydrogen"
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : undefined;
        const r = await ai.models.generateContent({
          model: modelName,
          contents: "Balas OK.",
          ...(config ? { config } : {}),
        });
        if (r && r.text) {
          workingModel = modelName;
          break;
        }
      } catch (err: any) {
        lastErr = err;
      }
    }

    if (!workingModel) {
      throw lastErr || new Error("Tidak ada model Gemini yang merespons");
    }

    return res.json({
      ...basePayload,
      geminiValid: true,
      needsNewKey: false,
      workingModel,
      diagnosis: "Koneksi API Gemini aktif dan siap digunakan.",
    });
  } catch (err: any) {
    const classified = classifyGeminiError(err);
    return res.json({
      ...basePayload,
      geminiValid: false,
      needsNewKey: classified.needsNewKey,
      errorCategory: classified.category,
      diagnosis: classified.notice,
      errorDetail: classified.detail,
    });
  }
});

const SPO_SYSTEM_INSTRUCTION = `Anda adalah Konsultan Tata Kelola Rumah Sakit & Akreditasi Senior (KARS / JCI / SNARS / ISO 9001:2015) serta Pakar Manajemen Operasional Layanan Kesehatan dan Korporat.
Tugas Anda adalah menghasilkan dokumen Standar Prosedur Operasional (SPO / SOP) yang SANGAT DETAIL, FORMAL, AKURAT, PROFESIONAL, dan TIDAK NGAWUR, persis dengan standar dokumen RS Semen Gresik / PT Cipta Nirmala.

Pedoman Penulisan SPO Berkualitas Tinggi:
1. Nomenklatur & Bahasa:
   - Gunakan Bahasa Indonesia baku medis/hukum/operasional resmi (contoh: "Penanggung Jawab Pelayanan (DPJP)", "Rekam Medis Elektronik (RME)", "Kendali Mutu dan Kendali Biaya", "Disposisi", "Lead Time", "Traceability").
   - Jangan gunakan bahasa umum yang dangkal atau generic. Tuliskan istilah teknis yang spesifik untuk topik terkait.
2. Struktur Dokumen Harus Lengkap:
   - A. PENGERTIAN:
     - A.1 Definisi: Minimal 5-8 istilah teknis kunci yang didefinisikan secara komprehensif, mencakup aspek klinis/operasional/regulasi.
     - A.2 Ruang Lingkup: Deskripsi lengkap unit kerja, instalasi, dan petugas yang terikat prosedur ini (minimal 5 unit kerja).
   - B. TUJUAN:
     - Minimal 4 butir tujuan strategis dan terukur (contoh: Zero TLB/Zero Defect, Kepatuhan Regulasi, Kepastian Pelayanan, Ketertelusuran Data).
   - C. KEBIJAKAN:
     - C.1 Ketentuan Kebijakan: Minimal 5-6 klausul kebijakan tegas yang mengikat, merujuk regulasi nasional/direktur, hak dan batasan kewenangan.
     - C.2 Analisis Risiko & Mitigasi (Risk Register Operasional): Minimal 4-5 risiko nyata dengan kode (R1, R2, dll), Proses/Aktivitas, Nama Risiko, Deskripsi Risiko mendalam, dan Pengendalian Risiko / Mitigasi konkret.
   - D. PROSEDUR PELAKSANAAN:
     - D.1 Uraian Alur Prosedur Operasional: Minimal 5-7 tahapan berurutan (misal 5.1, 5.2, dst). Setiap tahapan memiliki:
       * Judul tahapan yang jelas
       * Deskripsi butir-butir langkah teknis rinci (1, 2, 3...)
       * Lead time yang realistis (contoh: "3 Menit", "5 Menit", "15 Menit", "H+1 s.d. H+2")
       * Pelaksana / Fungsi yang bertanggung jawab spesifik
   - E. TANGGUNG JAWAB UNIT TERKAIT:
     - Minimal 4-6 unit kerja dengan rincian poin tanggung jawab yang jelas.
   - F. FORMULIR & DOKUMEN PENDUKUNG:
     - F.1 Dokumen Terkait: 4-6 formulir resmi, sistem IT (contoh SIMRS, V-Claim), lembar verifikasi, atau kartu kendali.
     - F.2 Riwayat Perubahan Dokumen: Tanggal, Versi, Deskripsi ringkas latar belakang revisi/penyusunan.
   - DIAGRAM ALUR (FLOWCHART NODES):
     - HARUS 100% SELARAS, IDENTIK URUTANNYA, DAN SESUAI NOMOR TAHAPAN dengan tabel D.1 (prosedur). Setiap tahapan pada prosedur (5.1, 5.2, 5.3, dst) wajib muncul berurutan di diagram alur dengan label yang sama persis, disisipkan simbol keputusan (decision Ya/Tidak) tepat setelah tahapan yang memuat verifikasi/skrining/kelayakan.
`;

// API endpoint to generate full SPO
apiApp.post("/api/generate-spo", async (req, res) => {
  const {
    judul,
    institusi,
    konteksTambahan,
    unitTerkait,
    noDokumen,
    noRevisi,
    tanggalTerbit,
    kepalaRumahSakit,
    drafterNama,
    drafterJabatan,
    creatorNama,
    creatorJabatan,
    reviewerNama,
    reviewerJabatan,
    mode, // 'gemini' | 'smart_template'
  } = req.body;

  if (!judul || !judul.trim()) {
    return res.status(400).json({ error: "Judul SPO wajib diisi" });
  }

  if (
    !String(kepalaRumahSakit || "").trim() ||
    !String(drafterNama || "").trim() ||
    !String(drafterJabatan || "").trim() ||
    !String(creatorNama || "").trim() ||
    !String(creatorJabatan || "").trim() ||
    !String(reviewerNama || "").trim() ||
    !String(reviewerJabatan || "").trim()
  ) {
    return res.status(400).json({
      error:
        "Nama Kepala Rumah Sakit serta Nama & Jabatan Drafter, Creator, dan Reviewer wajib diisi.",
    });
  }

  // If user selected instant smart template generation, execute directly
  if (mode === "smart_template") {
    try {
      const generatedDoc = generateSmartSpoDocument({
        judul,
        institusi,
        konteksTambahan,
        unitTerkait,
        noDokumen,
        noRevisi,
        tanggalTerbit,
        kepalaRumahSakit,
        drafterNama,
        drafterJabatan,
        creatorNama,
        creatorJabatan,
        reviewerNama,
        reviewerJabatan,
      });
      return res.json({
        success: true,
        data: generatedDoc,
        source: "smart_engine",
        notice:
          "Dokumen SPO berhasil disusun menggunakan Generator Standar Akreditasi Rumah Sakit (Mode Cepat).",
      });
    } catch (e: any) {
      return res
        .status(500)
        .json({ error: "Gagal membuat dokumen SPO", details: e.message });
    }
  }

  // Try Gemini AI generation first
  try {
    const ai = getGeminiClient();

    const todayFormattedPrompt = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const effectiveRevisi = (noRevisi || "").trim() || "0";
    const effectiveTanggal =
      (tanggalTerbit || "").trim() || todayFormattedPrompt;

    const prompt = `Buatlah draf dokumen Standar Prosedur Operasional (SPO) resmi yang lengkap, mendalam, dan akurat untuk:
Judul SPO: "${judul}"
Institusi: "${institusi || "RUMAH SAKIT SEMEN GRESIK / PT CIPTA NIRMALA"}"
No. Revisi Dokumen: "${effectiveRevisi}"
Tanggal Terbit Dokumen: "${effectiveTanggal}"
Konteks / Arahan Khusus Operasional: "${konteksTambahan || "Sesuai standar pelayanan rumah sakit, kendali mutu & kendali biaya, mitigasi risiko operasional, dan kepatuhan regulasi kesehatan nasional."}"
Unit Kerja Utama: "${unitTerkait || "Unit terkait di rumah sakit"}"

KETENTUAN WAJIB SINKRONISASI:
1. F.2 Riwayat Perubahan Dokumen HARUS mengikuti persis No. Revisi ("${effectiveRevisi}") dan Tanggal Terbit ("${effectiveTanggal}"). DILARANG mengarang nomor versi/revisi atau tahun masa lalu yang tidak sesuai dengan No. Revisi "${effectiveRevisi}".
2. aktorFlowchart (3 kolom swimlane: admin, system, customer) HARUS spesifik sesuai unit & pelaksana nyata pada SPO "${judul}" (contoh: "Dokter & Perawat Poliklinik", "Sistem Antrean & RME SIMRS", "Pasien Rawat Jalan"). JANGAN gunakan istilah generik seperti "Petugas Pelaksana Tindakan Medis".
3. D.2 alurFlowchart WAJIB 100% SELARAS & SAMA URUTANNYA dengan D.1 prosedur (setiap noProses 5.1, 5.2, 5.3... pada tabel prosedur harus hadir berurutan pada alurFlowchart dengan judul yang sama, serta sertakan noProsesTerkait pada node decision jika ada percabangan Ya/Tidak).
Pastikan data teknis, klausul kebijakan, tabel risk register, dan uraian alur prosedur operasional sangat tajam, terperinci, dan siap diimplementasikan.`;

    const modelConfig = {
      systemInstruction: SPO_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          judulSpo: { type: Type.STRING },
          pengertian: {
            type: Type.OBJECT,
            properties: {
              definisi: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    istilah: { type: Type.STRING },
                    penjelasan: { type: Type.STRING },
                  },
                  required: ["istilah", "penjelasan"],
                },
              },
              ruangLingkup: {
                type: Type.OBJECT,
                properties: {
                  pengantar: { type: Type.STRING },
                  unitList: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["pengantar", "unitList"],
              },
            },
            required: ["definisi", "ruangLingkup"],
          },
          tujuan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                judulTujuan: { type: Type.STRING },
                deskripsi: { type: Type.STRING },
              },
              required: ["judulTujuan", "deskripsi"],
            },
          },
          kebijakan: {
            type: Type.OBJECT,
            properties: {
              ketentuan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              riskRegister: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    kode: { type: Type.STRING },
                    proses: { type: Type.STRING },
                    namaRisiko: { type: Type.STRING },
                    deskripsiRisiko: { type: Type.STRING },
                    mitigasi: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: [
                    "kode",
                    "proses",
                    "namaRisiko",
                    "deskripsiRisiko",
                    "mitigasi",
                  ],
                },
              },
            },
            required: ["ketentuan", "riskRegister"],
          },
          prosedur: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                noProses: { type: Type.STRING },
                judulTahapan: { type: Type.STRING },
                langkah: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                leadTime: { type: Type.STRING },
                pelaksana: { type: Type.STRING },
              },
              required: [
                "noProses",
                "judulTahapan",
                "langkah",
                "leadTime",
                "pelaksana",
              ],
            },
          },
          tanggungJawabUnit: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                unit: { type: Type.STRING },
                tugas: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["unit", "tugas"],
            },
          },
          formulirPendukung: {
            type: Type.OBJECT,
            properties: {
              dokumenTerkait: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              riwayatPerubahan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tanggal: { type: Type.STRING },
                    versi: { type: Type.STRING },
                    deskripsi: { type: Type.STRING },
                  },
                  required: ["tanggal", "versi", "deskripsi"],
                },
              },
            },
            required: ["dokumenTerkait", "riwayatPerubahan"],
          },
          alurFlowchart: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                noProsesTerkait: {
                  type: Type.STRING,
                  description:
                    "Nomor proses D.1 terkait (misal 5.1, 5.2) agar sinkron 1-to-1 dengan tabel prosedur",
                },
                tipe: {
                  type: Type.STRING,
                  description: "'start' | 'process' | 'decision' | 'end'",
                },
                label: {
                  type: Type.STRING,
                  description:
                    "Label singkat jelas sesuai judulTahapan D.1 atau pertanyaan keputusan (untuk decision) tanpa sub-teks",
                },
                kondisiYa: { type: Type.STRING },
                kondisiTidak: { type: Type.STRING },
              },
              required: ["id", "tipe", "label"],
            },
          },
          aktorFlowchart: {
            type: Type.OBJECT,
            description:
              "Nama 3 kolom aktor swimlane diagram alur yang spesifik dengan topik SPO ini",
            properties: {
              admin: {
                type: Type.STRING,
                description:
                  "Nama petugas/pelaksana klinis/operasional utama (tanpa garis miring)",
              },
              system: {
                type: Type.STRING,
                description:
                  "Nama sistem informasi SIMRS/unit penunjang khusus topik ini",
              },
              customer: {
                type: Type.STRING,
                description:
                  "Nama pihak pemohon/pasien/unit pengirim pada topik ini",
              },
            },
            required: ["admin", "system", "customer"],
          },
        },
        required: [
          "judulSpo",
          "pengertian",
          "tujuan",
          "kebijakan",
          "prosedur",
          "tanggungJawabUnit",
          "formulirPendukung",
        ],
      },
    };

    let response;
    let modelUsed = "";
    const modelCandidates = ["gemini-4-hydrogen", "gemini-3.1-flash-lite"];
    let lastGenError: any = null;

    for (const modelName of modelCandidates) {
      try {
        const perModelConfig =
          modelName === "gemini-4-hydrogen"
            ? {
                ...modelConfig,
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              }
            : modelConfig;
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: perModelConfig,
        });
        if (response && response.text) {
          modelUsed = modelName;
          break;
        }
      } catch (err: any) {
        lastGenError = err;
        console.warn(
          `Model ${modelName} encountered issue: ${err.message}. Trying next candidate...`,
        );
      }
    }

    if (!response || !response.text) {
      throw lastGenError || new Error("Tidak ada model Gemini yang merespons");
    }

    const parsedJson = JSON.parse(response.text || "{}");

    // Defensive array normalization so downstream builders & UI never fail on malformed shapes
    const rawProsedur = Array.isArray(parsedJson.prosedur)
      ? parsedJson.prosedur
      : [];
    const normalizedProsedur = rawProsedur
      .filter((p: any) => p && typeof p === "object")
      .map((p: any, idx: number) => ({
        noProses: String(p.noProses || `5.${idx + 1}`),
        judulTahapan: String(p.judulTahapan || `TAHAPAN ${idx + 1}`),
        langkah: Array.isArray(p.langkah)
          ? p.langkah.map((s: any) => String(s))
          : p.langkah
            ? [String(p.langkah)]
            : ["Laksanakan tahapan sesuai standar operasional."],
        leadTime: String(p.leadTime || "5 Menit"),
        pelaksana: String(p.pelaksana || "Petugas Terkait"),
      }));

    if (normalizedProsedur.length === 0) {
      throw new Error(
        "Model Gemini tidak menghasilkan daftar prosedur (D.1) yang valid",
      );
    }

    const normalizedUnitList = Array.isArray(
      parsedJson.pengertian?.ruangLingkup?.unitList,
    )
      ? parsedJson.pengertian.ruangLingkup.unitList.map((u: any) => String(u))
      : [];
    const normalizedDefinisi = Array.isArray(parsedJson.pengertian?.definisi)
      ? parsedJson.pengertian.definisi
      : [];
    const normalizedTujuan = Array.isArray(parsedJson.tujuan)
      ? parsedJson.tujuan
      : [];
    const normalizedKetentuan = Array.isArray(parsedJson.kebijakan?.ketentuan)
      ? parsedJson.kebijakan.ketentuan.map((k: any) => String(k))
      : [];
    const normalizedRiskRegister = Array.isArray(
      parsedJson.kebijakan?.riskRegister,
    )
      ? parsedJson.kebijakan.riskRegister.map((r: any, idx: number) => ({
          kode: String(r?.kode || `R${idx + 1}`),
          proses: String(r?.proses || ""),
          namaRisiko: String(r?.namaRisiko || ""),
          deskripsiRisiko: String(r?.deskripsiRisiko || ""),
          mitigasi: Array.isArray(r?.mitigasi)
            ? r.mitigasi.map((m: any) => String(m))
            : r?.mitigasi
              ? [String(r.mitigasi)]
              : [],
        }))
      : [];
    const normalizedTanggungJawab = Array.isArray(parsedJson.tanggungJawabUnit)
      ? parsedJson.tanggungJawabUnit.map((tj: any) => ({
          unit: String(tj?.unit || "Unit Terkait"),
          tugas: Array.isArray(tj?.tugas)
            ? tj.tugas.map((t: any) => String(t))
            : tj?.tugas
              ? [String(tj.tugas)]
              : [],
        }))
      : [];

    const cleanDrafterNama = (drafterNama || "").trim();
    const cleanDrafterJab = (drafterJabatan || "").trim();
    const cleanCreatorNama = (creatorNama || "").trim();
    const cleanCreatorJab = (creatorJabatan || "").trim();
    const cleanReviewerNama = (reviewerNama || "").trim();
    const cleanReviewerJab = (reviewerJabatan || "").trim();
    const cleanDocNo = (noDokumen || "").trim();
    const cleanTanggal = (tanggalTerbit || "").trim();
    const cleanKepalaRS = (kepalaRumahSakit || "").trim();

    const todayFormatted = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const isRehab =
      (judul || "").toLowerCase().includes("rehabilitasi") ||
      (judul || "").toLowerCase().includes("fisioterapi") ||
      (judul || "").toLowerCase().includes("tlb");
    const isOldDefaultDocNo = noDokumen === "QAP/102341/770";
    const chosenDocNo =
      (!isRehab && isOldDefaultDocNo) || !cleanDocNo
        ? `SPO/MED/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`
        : cleanDocNo;

    const fullSPO: any = {
      ...parsedJson,
      pengertian: {
        definisi: normalizedDefinisi,
        ruangLingkup: {
          pengantar: String(
            parsedJson.pengertian?.ruangLingkup?.pengantar || "",
          ),
          unitList: normalizedUnitList,
        },
      },
      tujuan: normalizedTujuan,
      kebijakan: {
        ketentuan: normalizedKetentuan,
        riskRegister: normalizedRiskRegister,
      },
      prosedur: normalizedProsedur,
      tanggungJawabUnit: normalizedTanggungJawab,
      judulSpo: (parsedJson.judulSpo || judul).toUpperCase(),
      metadata: {
        institusi:
          (institusi || "").trim() ||
          "RUMAH SAKIT SEMEN GRESIK / PT CIPTA NIRMALA",
        noDokumen: chosenDocNo,
        noRevisi: (noRevisi || "").trim() || "0",
        tanggalTerbit: cleanTanggal || todayFormatted,
        kepalaRumahSakit: cleanKepalaRS,
        drafter: {
          nama: cleanDrafterNama,
          jabatan: cleanDrafterJab,
        },
        creator: {
          nama: cleanCreatorNama,
          jabatan: cleanCreatorJab,
        },
        reviewer: {
          nama: cleanReviewerNama,
          jabatan: cleanReviewerJab,
        },
      },
    };

    fullSPO.formulirPendukung = {
      dokumenTerkait: Array.isArray(
        parsedJson.formulirPendukung?.dokumenTerkait,
      )
        ? parsedJson.formulirPendukung.dokumenTerkait.map((d: any) => String(d))
        : [],
      riwayatPerubahan: normalizeRiwayatPerubahan(
        parsedJson.formulirPendukung?.riwayatPerubahan,
        fullSPO.metadata,
        fullSPO.judulSpo,
      ),
    };

    if (Array.isArray(fullSPO.alurFlowchart)) {
      fullSPO.alurFlowchart = fullSPO.alurFlowchart.map(
        (n: any, idx: number) => ({
          id: String(n?.id || `alur-${idx + 1}`),
          noProsesTerkait: n?.noProsesTerkait
            ? String(n.noProsesTerkait)
            : undefined,
          tipe: n?.tipe || "process",
          label: String(n?.label || `Langkah ${idx + 1}`),
          kondisiYa: n?.kondisiYa ? String(n.kondisiYa) : undefined,
          kondisiTidak: n?.kondisiTidak ? String(n.kondisiTidak) : undefined,
        }),
      );
    }
    fullSPO.flowchartModel = buildFlowchartModelFromSpo(fullSPO);
    fullSPO.alurFlowchart = fullSPO.flowchartModel.nodes.map(
      (node: any, idx: number) => ({
        id: node.id || `step-${idx + 1}`,
        tipe:
          node.type === "terminator" || node.type === "start"
            ? "start"
            : node.type === "end"
              ? "end"
              : node.type === "decision" || node.type === "gateway"
                ? "decision"
                : "process",
        label: node.label,
        ...(node.type === "decision"
          ? { kondisiYa: "Ya", kondisiTidak: "Tidak" }
          : {}),
      }),
    );
    delete fullSPO.aktorFlowchart;

    return res.json({
      success: true,
      data: fullSPO,
      source: "gemini",
      modelUsed,
    });
  } catch (error: any) {
    console.warn(
      "Gemini AI call failed or unavailable. Falling back to Smart Hospital SPO Engine:",
      error.message || error,
    );

    const fallbackSPO = generateSmartSpoDocument({
      judul,
      institusi,
      konteksTambahan,
      unitTerkait,
      noDokumen,
      noRevisi,
      tanggalTerbit,
      kepalaRumahSakit,
      drafterNama,
      drafterJabatan,
      creatorNama,
      creatorJabatan,
      reviewerNama,
      reviewerJabatan,
    });

    const classified = classifyGeminiError(error);

    return res.json({
      success: true,
      data: fallbackSPO,
      source: "smart_engine",
      fallbackUsed: true,
      needsNewKey: classified.needsNewKey,
      errorCategory: classified.category,
      notice: classified.notice,
      errorDetail: classified.detail,
    });
  }
});

// API endpoint to refine a specific section
apiApp.post("/api/refine-section", async (req, res) => {
  const { sectionType, currentContent, promptInstruction, judulSpo } = req.body;

  if (!sectionType || !currentContent) {
    return res
      .status(400)
      .json({ error: "Informasi bagian dokumen belum lengkap" });
  }

  try {
    const ai = getGeminiClient();

    const expectArray =
      sectionType === "tujuan" ||
      sectionType === "prosedur" ||
      sectionType === "tanggungJawabUnit";

    const prompt = `Anda sedang menyempurnakan bagian dokumen Standar Prosedur Operasional (SPO) rumah sakit berjudul "${judulSpo || "SPO"}".
Bagian yang disempurnakan: ${sectionType}
Instruksi Pengguna: ${promptInstruction || "Tingkatkan akurasi, kedalaman, dan kepatuhan standar akreditasi rumah sakit."}

Konten saat ini (JSON):
${JSON.stringify(currentContent, null, 2)}

Hasilkan perbaikan konten yang lebih komprehensif, terstruktur, dan presisi tinggi dalam format JSON dengan struktur field persis sama dengan input.${
      expectArray
        ? " Kembalikan langsung JSON Array `[...]` yang sesuai struktur elemen di atas."
        : ""
    }`;

    let response;
    const modelCandidates = ["gemini-4-hydrogen", "gemini-3.1-flash-lite"];
    let lastRefineError: any = null;

    for (const modelName of modelCandidates) {
      try {
        const refineConfig: any = {
          systemInstruction: SPO_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        };
        if (modelName === "gemini-4-hydrogen") {
          refineConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: refineConfig,
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastRefineError = err;
        console.warn(
          `Refine model ${modelName} error: ${err.message}. Trying next candidate...`,
        );
      }
    }

    if (!response || !response.text) {
      throw (
        lastRefineError || new Error("Tidak ada model refine yang merespons")
      );
    }

    let parsedJson = JSON.parse(response.text || "{}");

    if (
      expectArray &&
      !Array.isArray(parsedJson) &&
      parsedJson &&
      typeof parsedJson === "object"
    ) {
      const candidateKey =
        parsedJson[sectionType] ||
        parsedJson.items ||
        parsedJson.data ||
        Object.values(parsedJson).find((v) => Array.isArray(v));
      if (Array.isArray(candidateKey)) {
        parsedJson = candidateKey;
      } else {
        throw new Error(
          "Format JSON hasil penyempurnaan tidak sesuai array yang diharapkan",
        );
      }
    }

    return res.json({
      success: true,
      refinedContent: parsedJson,
      source: "gemini",
    });
  } catch (error: any) {
    console.warn(
      "Gemini refine call failed, applying smart heuristic refinement:",
      error.message,
    );

    let refined = JSON.parse(JSON.stringify(currentContent));

    if (sectionType === "pengertian") {
      if (!refined.definisi || !Array.isArray(refined.definisi))
        refined.definisi = [];
      refined.definisi.push({
        istilah: "Kendali Mutu dan Audit Kepatuhan Prosedur",
        penjelasan:
          "Mekanisme pengawasan berkala dan evaluasi sistematis terhadap pelaksanaan prosedur untuk menjamin kepatuhan standar akreditasi KARS/JCI.",
      });
    } else if (sectionType === "tujuan") {
      if (!Array.isArray(refined)) refined = [];
      refined.push({
        judulTujuan: "Pencegahan Insiden & Kepatuhan Audit Akreditasi",
        deskripsi:
          "Menjamin seluruh tindakan terdokumentasi sah pada Rekam Medis Elektronik dan lolos verifikasi standar mutu rumah sakit.",
      });
    } else if (sectionType === "kebijakan") {
      if (!refined.ketentuan || !Array.isArray(refined.ketentuan))
        refined.ketentuan = [];
      refined.ketentuan.push(
        "Klausul Verifikasi Ganda: Seluruh tahapan kritis wajib melalui otorisasi dan pemeriksaan silang oleh petugas berwenang.",
      );
      if (Array.isArray(refined.riskRegister)) {
        refined.riskRegister.push({
          kode: `R${refined.riskRegister.length + 1}`,
          proses: "Pengawasan Mutu & Audit Dokumentasi",
          namaRisiko: "Ketidaklengkapan Dokumentasi Real-Time",
          deskripsiRisiko:
            "Pencatatan tidak dilakukan segera pada sistem setelah tindakan selesai dilaksanakan.",
          mitigasi: [
            "Wajibkan entri rekam medis elektronik sebelum pergantian shift.",
            "Audit sampling kepatuhan berkala oleh Komite Mutu.",
          ],
        });
      }
    } else if (sectionType === "prosedur") {
      if (Array.isArray(refined) && refined.length > 0) {
        refined = refined.map((p: any) => ({
          ...p,
          langkah: [
            ...(p.langkah || []),
            "Lakukan konfirmasi ulang dan pencatatan audit trail pada sistem informasi.",
          ],
        }));
      }
    } else if (sectionType === "tanggungJawabUnit") {
      if (!Array.isArray(refined)) refined = [];
      refined.push({
        unit: "Komite Mutu & Keselamatan Pasien / Manajemen Risiko",
        tugas: [
          "Melakukan pemantauan berkala terhadap indikator mutu dan kepatuhan pelaksanaan SPO.",
          "Mengevaluasi laporan insiden serta merekomendasikan revisi perbaikan prosedur.",
        ],
      });
    }

    const classified = classifyGeminiError(error);

    return res.json({
      success: true,
      refinedContent: refined,
      source: "smart_engine",
      fallbackUsed: true,
      needsNewKey: classified.needsNewKey,
      errorCategory: classified.category,
      notice: classified.notice,
      errorDetail: classified.detail,
    });
  }
});

// Catch unmatched /api/* routes with JSON 404 so Vite SPA middleware never returns HTML for API paths
apiApp.use("/api", (_req, res) => {
  res.status(404).json({ error: "Endpoint API tidak ditemukan" });
});

export default apiApp;
