import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
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

function isOpenRouterApiKeyConfigured(): boolean {
  const currentKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!currentKey) return false;
  const placeholders = new Set([
    "MY_OPENROUTER_API_KEY",
    "MASUKKAN_API_KEY_OPENROUTER_ANDA",
    "YOUR_OPENROUTER_API_KEY",
    "YOUR_API_KEY",
  ]);
  return !placeholders.has(currentKey);
}

function getOpenRouterModelCandidates(): string[] {
  const customModel = (process.env.OPENROUTER_MODEL || "").trim();
  const list = customModel
    ? [customModel, "openrouter/free"]
    : ["openrouter/free"];
  return Array.from(new Set(list));
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
      notice: "GEMINI_API_KEY belum terpasang atau masih berisi teks contoh.",
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
        "GEMINI_API_KEY tidak valid, diblokir, atau sudah dicabut (400/403).",
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
      notice: "Kuota atau batas kecepatan API Gemini sedang penuh (429).",
      detail,
    };
  }
  if (lower.includes("not_found") || lower.includes("404")) {
    return {
      category: "model_not_found",
      needsNewKey: false,
      notice: "Model Gemini tidak tersedia untuk kunci/proyek API ini (404).",
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
      notice: "Server Gemini sedang mengalami lonjakan beban sementara (503).",
      detail,
    };
  }
  return {
    category: "unknown",
    needsNewKey: false,
    notice: "Koneksi ke API Gemini gagal atau timeout.",
    detail,
  };
}

function classifyOpenRouterError(err: any): {
  category:
    | "missing_key"
    | "invalid_or_revoked_key"
    | "insufficient_credits"
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

  if (
    lower.includes("openrouter_key_not_configured") ||
    !isOpenRouterApiKeyConfigured()
  ) {
    return {
      category: "missing_key",
      needsNewKey: true,
      notice:
        "OPENROUTER_API_KEY belum terpasang atau masih berisi teks contoh.",
      detail,
    };
  }
  if (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid auth") ||
    lower.includes("user not found")
  ) {
    return {
      category: "invalid_or_revoked_key",
      needsNewKey: true,
      notice:
        "OPENROUTER_API_KEY tidak valid atau sudah dinonaktifkan (401/403).",
      detail,
    };
  }
  if (
    lower.includes("402") ||
    lower.includes("insufficient") ||
    lower.includes("credit")
  ) {
    return {
      category: "insufficient_credits",
      needsNewKey: false,
      notice: "Saldo/limit kredit OpenRouter tidak mencukupi (402).",
      detail,
    };
  }
  if (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return {
      category: "quota_exceeded",
      needsNewKey: false,
      notice: "Batas kecepatan/kuota OpenRouter sedang penuh (429).",
      detail,
    };
  }
  if (lower.includes("404") || lower.includes("no endpoints")) {
    return {
      category: "model_not_found",
      needsNewKey: false,
      notice: "Model OpenRouter yang dipilih sementara tidak tersedia (404).",
      detail,
    };
  }
  if (
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    lower.includes("overloaded") ||
    lower.includes("provider returned error")
  ) {
    return {
      category: "service_overloaded",
      needsNewKey: false,
      notice:
        "Provider upstream OpenRouter sedang sibuk atau tidak merespons (502/503).",
      detail,
    };
  }
  return {
    category: "unknown",
    needsNewKey: false,
    notice: "Koneksi ke API OpenRouter gagal atau timeout.",
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
// Add ?verify=1 to perform a live lightweight check against Gemini & OpenRouter APIs.
apiApp.get("/api/health", async (req, res) => {
  const geminiConfigured = isGeminiApiKeyConfigured();
  const openRouterConfigured = isOpenRouterApiKeyConfigured();
  const openRouterModel = getOpenRouterModelCandidates()[0];

  const basePayload = {
    ok: true,
    service: "spo-generator-api",
    geminiConfigured,
    openRouterConfigured,
    openRouterModel,
    hybridPriority: ["gemini", "openrouter"],
    runtime: process.env.VERCEL ? "vercel" : "node",
    timestamp: new Date().toISOString(),
  };

  const shouldVerify = req.query.verify === "1" || req.query.verify === "true";
  if (!shouldVerify) {
    return res.json(basePayload);
  }

  let geminiValid = false;
  let workingModel = "";
  let geminiDiagnosis = geminiConfigured
    ? ""
    : "GEMINI_API_KEY belum dipasang atau masih berisi nilai contoh.";
  let geminiErrorDetail = "";

  if (geminiConfigured) {
    try {
      const ai = getGeminiClient();
      const modelCandidates = ["gemini-4-hydrogen", "gemini-3.1-flash-lite"];
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
            geminiValid = true;
            geminiDiagnosis = "Koneksi API Gemini aktif.";
            break;
          }
        } catch (err: any) {
          lastErr = err;
        }
      }

      if (!geminiValid) {
        throw lastErr || new Error("Tidak ada model Gemini yang merespons");
      }
    } catch (err: any) {
      const classified = classifyGeminiError(err);
      geminiDiagnosis = classified.notice;
      geminiErrorDetail = classified.detail;
    }
  }

  let openRouterValid = false;
  let openRouterDiagnosis = openRouterConfigured
    ? ""
    : "OPENROUTER_API_KEY belum dipasang.";
  let openRouterInfo: Record<string, any> | undefined;
  let openRouterErrorDetail = "";

  if (openRouterConfigured) {
    try {
      const orKey = (process.env.OPENROUTER_API_KEY || "").trim();
      const resp = await fetch("https://openrouter.ai/api/v1/key", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${orKey}`,
        },
        signal: AbortSignal.timeout(10000),
      });
      const bodyText = await resp.text();
      if (!resp.ok) {
        throw new Error(`OpenRouter HTTP ${resp.status}: ${bodyText}`);
      }
      const bodyJson = bodyText ? JSON.parse(bodyText) : {};
      openRouterValid = true;
      openRouterDiagnosis = "Koneksi API OpenRouter aktif.";
      if (bodyJson?.data) {
        openRouterInfo = {
          isFreeTier: Boolean(bodyJson.data.is_free_tier),
          limitRemaining: bodyJson.data.limit_remaining ?? null,
        };
      }
    } catch (err: any) {
      const classified = classifyOpenRouterError(err);
      openRouterDiagnosis = classified.notice;
      openRouterErrorDetail = classified.detail;
    }
  }

  const aiReady = geminiValid || openRouterValid;
  const activePrimary = geminiValid
    ? "gemini"
    : openRouterValid
      ? "openrouter"
      : "none";

  const diagnosisParts: string[] = [];
  if (geminiValid) {
    diagnosisParts.push(`Gemini aktif (${workingModel})`);
  } else if (geminiConfigured) {
    diagnosisParts.push(`Gemini bermasalah (${geminiDiagnosis})`);
  } else {
    diagnosisParts.push("Gemini belum dipasang");
  }

  if (openRouterValid) {
    diagnosisParts.push(`OpenRouter aktif (model: ${openRouterModel})`);
  } else if (openRouterConfigured) {
    diagnosisParts.push(`OpenRouter bermasalah (${openRouterDiagnosis})`);
  } else {
    diagnosisParts.push("OpenRouter belum dipasang");
  }

  return res.json({
    ...basePayload,
    aiReady,
    activePrimary,
    geminiValid,
    workingModel: workingModel || undefined,
    openRouterValid,
    openRouterInfo,
    needsNewKey: !aiReady,
    diagnosis: diagnosisParts.join(" | "),
    ...(geminiErrorDetail ? { geminiErrorDetail } : {}),
    ...(openRouterErrorDetail ? { openRouterErrorDetail } : {}),
  });
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

const SPO_OPENROUTER_JSON_CONTRACT = `
FORMAT OUTPUT WAJIB:
Kembalikan HANYA 1 objek JSON valid (tanpa teks pembuka/penutup, tanpa penjelasan di luar JSON) dengan struktur persis berikut:
{
  "judulSpo": "string (HURUF KAPITAL)",
  "pengertian": {
    "definisi": [{ "istilah": "string", "penjelasan": "string" }],
    "ruangLingkup": { "pengantar": "string", "unitList": ["string"] }
  },
  "tujuan": [{ "judulTujuan": "string", "deskripsi": "string" }],
  "kebijakan": {
    "ketentuan": ["string"],
    "riskRegister": [
      {
        "kode": "R1",
        "proses": "string",
        "namaRisiko": "string",
        "deskripsiRisiko": "string",
        "mitigasi": ["string"]
      }
    ]
  },
  "prosedur": [
    {
      "noProses": "5.1",
      "judulTahapan": "string",
      "langkah": ["string"],
      "leadTime": "string",
      "pelaksana": "string"
    }
  ],
  "tanggungJawabUnit": [{ "unit": "string", "tugas": ["string"] }],
  "formulirPendukung": {
    "dokumenTerkait": ["string"],
    "riwayatPerubahan": [{ "tanggal": "string", "versi": "string", "deskripsi": "string" }]
  },
  "alurFlowchart": [
    {
      "id": "string",
      "noProsesTerkait": "5.1",
      "tipe": "start | process | decision | end",
      "label": "string",
      "kondisiYa": "Ya",
      "kondisiTidak": "Tidak"
    }
  ],
  "aktorFlowchart": {
    "admin": "string",
    "system": "string",
    "customer": "string"
  }
}`;

function extractJsonFromModelText(rawText: string): any {
  const cleaned = String(rawText || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!cleaned) {
    throw new Error("Model mengembalikan respons kosong");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const slice = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(slice);
    }
    throw new Error("Respons AI tidak berbentuk JSON valid");
  }
}

async function requestOpenRouterJson(
  systemInstruction: string,
  userPrompt: string,
): Promise<{
  parsedJson: any;
  modelUsed: string;
}> {
  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!isOpenRouterApiKeyConfigured() || !apiKey) {
    throw new Error(
      "OPENROUTER_KEY_NOT_CONFIGURED: OPENROUTER_API_KEY belum disetel",
    );
  }

  const models = getOpenRouterModelCandidates();
  const appReferer = (
    process.env.APP_URL || "https://spo-generator-rssg.vercel.app"
  ).trim();

  let lastError: any = null;

  for (const modelName of models) {
    for (const useResponseFormat of [true, false]) {
      try {
        const requestBody: Record<string, any> = {
          model: modelName,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 4500,
        };
        if (useResponseFormat) {
          requestBody.response_format = { type: "json_object" };
        }

        const resp = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": appReferer,
              "X-Title": "SPO Generator RS Semen Gresik",
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(25000),
          },
        );

        const rawBody = await resp.text();
        if (!resp.ok) {
          const errMsg = `OpenRouter HTTP ${resp.status}: ${rawBody}`;
          const lower = errMsg.toLowerCase();
          if (
            useResponseFormat &&
            resp.status === 400 &&
            (lower.includes("response_format") ||
              lower.includes("json_object") ||
              lower.includes("structured"))
          ) {
            lastError = new Error(errMsg);
            continue;
          }
          throw new Error(errMsg);
        }

        const data = rawBody ? JSON.parse(rawBody) : null;
        const messageContent = data?.choices?.[0]?.message?.content;
        const textContent = Array.isArray(messageContent)
          ? messageContent.map((part: any) => part?.text || "").join("")
          : String(messageContent || "");

        if (!textContent.trim()) {
          throw new Error(
            `OpenRouter model ${modelName} mengembalikan konten kosong`,
          );
        }

        const parsedJson = extractJsonFromModelText(textContent);
        const resolvedModel = String(data?.model || modelName);
        return { parsedJson, modelUsed: resolvedModel };
      } catch (err: any) {
        lastError = err;
        break;
      }
    }
  }

  throw lastError || new Error("OpenRouter tidak merespons");
}

async function generateSpoWithOpenRouter(prompt: string): Promise<{
  parsedJson: any;
  modelUsed: string;
}> {
  return requestOpenRouterJson(
    SPO_SYSTEM_INSTRUCTION,
    `${prompt}\n\n${SPO_OPENROUTER_JSON_CONTRACT}`,
  );
}

interface AssembleSpoParams {
  judul: string;
  institusi?: string;
  noDokumen?: string;
  noRevisi?: string;
  tanggalTerbit?: string;
  kepalaRumahSakit: string;
  drafterNama: string;
  drafterJabatan: string;
  creatorNama: string;
  creatorJabatan: string;
  reviewerNama: string;
  reviewerJabatan: string;
}

function assembleFullSpoDocument(parsedJson: any, params: AssembleSpoParams) {
  const {
    judul,
    institusi,
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
  } = params;

  const rawProsedur = Array.isArray(parsedJson?.prosedur)
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
      "Model AI tidak menghasilkan daftar prosedur (D.1) yang valid",
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
        pengantar: String(parsedJson.pengertian?.ruangLingkup?.pengantar || ""),
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
    dokumenTerkait: Array.isArray(parsedJson.formulirPendukung?.dokumenTerkait)
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

  return fullSPO;
}

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

  // Hybrid AI Pipeline: 1. Gemini -> 2. OpenRouter
  const todayFormattedPrompt = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const effectiveRevisi = (noRevisi || "").trim() || "0";
  const effectiveTanggal = (tanggalTerbit || "").trim() || todayFormattedPrompt;

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

  const assembleParams: AssembleSpoParams = {
    judul,
    institusi,
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
  };

  let geminiError: any = null;
  const geminiConfigured = isGeminiApiKeyConfigured();

  // 1. Try Gemini AI first if configured
  if (geminiConfigured) {
    try {
      const ai = getGeminiClient();

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
            `Gemini model ${modelName} encountered issue: ${err.message}. Trying next candidate...`,
          );
        }
      }

      if (!response || !response.text) {
        throw (
          lastGenError || new Error("Tidak ada model Gemini yang merespons")
        );
      }

      const parsedJson = extractJsonFromModelText(response.text);
      const fullSPO = assembleFullSpoDocument(parsedJson, assembleParams);

      return res.json({
        success: true,
        data: fullSPO,
        source: "gemini",
        modelUsed,
      });
    } catch (error: any) {
      geminiError = error;
      console.warn(
        "Gemini AI call failed or unavailable. Checking OpenRouter fallback:",
        error?.message || error,
      );
    }
  }

  // 2. Try OpenRouter AI fallback if configured
  let openRouterError: any = null;
  const openRouterConfigured = isOpenRouterApiKeyConfigured();

  if (openRouterConfigured) {
    try {
      const orResult = await generateSpoWithOpenRouter(prompt);
      const fullSPO = assembleFullSpoDocument(
        orResult.parsedJson,
        assembleParams,
      );

      const geminiNote = geminiConfigured
        ? `${classifyGeminiError(geminiError).notice} Dokumen otomatis disusun menggunakan AI OpenRouter (${orResult.modelUsed}).`
        : `Dokumen SPO disusun menggunakan AI OpenRouter (${orResult.modelUsed}).`;

      return res.json({
        success: true,
        data: fullSPO,
        source: "openrouter",
        modelUsed: orResult.modelUsed,
        fallbackUsed: geminiConfigured,
        notice: geminiNote,
      });
    } catch (error: any) {
      openRouterError = error;
      console.warn(
        "OpenRouter AI call failed or unavailable:",
        error?.message || error,
      );
    }
  }

  // Both Gemini and OpenRouter unavailable/failed — return explicit error (no local generator fallback)
  const geminiClass = classifyGeminiError(
    geminiError ||
      new Error("API_KEY_NOT_CONFIGURED: GEMINI_API_KEY belum disetel"),
  );
  const openRouterClass = classifyOpenRouterError(
    openRouterError ||
      new Error(
        "OPENROUTER_KEY_NOT_CONFIGURED: OPENROUTER_API_KEY belum disetel",
      ),
  );

  let combinedError = "";
  if (geminiConfigured && openRouterConfigured) {
    combinedError = `${geminiClass.notice} ${openRouterClass.notice} Silakan periksa API Key / kuota atau coba sesaat lagi.`;
  } else if (geminiConfigured) {
    combinedError = `${geminiClass.notice} OPENROUTER_API_KEY juga belum terpasang sebagai cadangan.`;
  } else if (openRouterConfigured) {
    combinedError = `${openRouterClass.notice} GEMINI_API_KEY juga belum terpasang.`;
  } else {
    combinedError =
      "GEMINI_API_KEY dan OPENROUTER_API_KEY belum terpasang di Environment Variables (.env / Vercel). Minimal salah satu API Key AI wajib dikonfigurasi.";
  }

  const statusCode = !geminiConfigured && !openRouterConfigured ? 500 : 503;

  return res.status(statusCode).json({
    success: false,
    error: combinedError,
    needsNewKey: geminiClass.needsNewKey && openRouterClass.needsNewKey,
    errorCategory: openRouterConfigured
      ? openRouterClass.category
      : geminiClass.category,
    details: openRouterError ? openRouterClass.detail : geminiClass.detail,
  });
});

// API endpoint to refine a specific section (Gemini -> OpenRouter)
apiApp.post("/api/refine-section", async (req, res) => {
  const { sectionType, currentContent, promptInstruction, judulSpo } = req.body;

  if (!sectionType || !currentContent) {
    return res
      .status(400)
      .json({ error: "Informasi bagian dokumen belum lengkap" });
  }

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

  const normalizeRefinedShape = (parsed: any) => {
    if (
      expectArray &&
      !Array.isArray(parsed) &&
      parsed &&
      typeof parsed === "object"
    ) {
      const candidateKey =
        parsed[sectionType] ||
        parsed.items ||
        parsed.data ||
        Object.values(parsed).find((v) => Array.isArray(v));
      if (Array.isArray(candidateKey)) {
        return candidateKey;
      }
      throw new Error(
        "Format JSON hasil penyempurnaan tidak sesuai array yang diharapkan",
      );
    }
    return parsed;
  };

  let geminiError: any = null;
  const geminiConfigured = isGeminiApiKeyConfigured();

  if (geminiConfigured) {
    try {
      const ai = getGeminiClient();
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
          lastRefineError ||
          new Error("Tidak ada model refine Gemini yang merespons")
        );
      }

      const parsedJson = normalizeRefinedShape(
        extractJsonFromModelText(response.text),
      );
      return res.json({
        success: true,
        refinedContent: parsedJson,
        source: "gemini",
      });
    } catch (error: any) {
      geminiError = error;
    }
  }

  let openRouterError: any = null;
  const openRouterConfigured = isOpenRouterApiKeyConfigured();

  if (openRouterConfigured) {
    try {
      const orPrompt = `${prompt}\n\nKembalikan HANYA JSON valid tanpa teks tambahan.`;
      const orRes = await requestOpenRouterJson(
        SPO_SYSTEM_INSTRUCTION,
        orPrompt,
      );
      const parsedJson = normalizeRefinedShape(orRes.parsedJson);
      return res.json({
        success: true,
        refinedContent: parsedJson,
        source: "openrouter",
        modelUsed: orRes.modelUsed,
      });
    } catch (error: any) {
      openRouterError = error;
    }
  }

  const geminiClass = classifyGeminiError(
    geminiError ||
      new Error("API_KEY_NOT_CONFIGURED: GEMINI_API_KEY belum disetel"),
  );
  const openRouterClass = classifyOpenRouterError(
    openRouterError ||
      new Error(
        "OPENROUTER_KEY_NOT_CONFIGURED: OPENROUTER_API_KEY belum disetel",
      ),
  );

  const errorMessage =
    geminiConfigured || openRouterConfigured
      ? `${geminiConfigured ? geminiClass.notice : ""} ${openRouterConfigured ? openRouterClass.notice : ""}`.trim()
      : "GEMINI_API_KEY dan OPENROUTER_API_KEY belum terpasang.";

  return res
    .status(!geminiConfigured && !openRouterConfigured ? 500 : 503)
    .json({
      success: false,
      error: errorMessage,
      details: openRouterError ? openRouterClass.detail : geminiClass.detail,
    });
});

// Catch unmatched /api/* routes with JSON 404 so Vite SPA middleware never returns HTML for API paths
apiApp.use("/api", (_req, res) => {
  res.status(404).json({ error: "Endpoint API tidak ditemukan" });
});

export default apiApp;
