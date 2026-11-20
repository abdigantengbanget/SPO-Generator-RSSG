import React, { useState, useRef } from "react";
import { X, FileText, UserCheck, AlertCircle } from "lucide-react";
import { SpoDocument } from "../types/spo";
import { buildFlowchartModelFromSpo } from "../utils/flowchartHelper";
import {
  INSTITUTION_OPTIONS,
  getInstitutionBranding,
} from "../utils/institutionBranding";

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (newSpo: SpoDocument, notice?: string) => void;
  currentSpo: SpoDocument;
  onGeneratingChange?: (loading: boolean) => void;
}

export const GenerateModal: React.FC<GenerateModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
  currentSpo,
  onGeneratingChange,
}) => {
  const [judul, setJudul] = useState("");
  const [institusi, setInstitusi] = useState<string>(
    () => getInstitutionBranding(currentSpo?.metadata?.institusi).fullName,
  );
  const [noDokumen, setNoDokumen] = useState("");
  const [noRevisi, setNoRevisi] = useState("");
  const [tanggalTerbit, setTanggalTerbit] = useState("");
  const [kepalaRumahSakit, setKepalaRumahSakit] = useState("");
  const [kepalaRumahSakitJabatan, setKepalaRumahSakitJabatan] = useState("");

  // Lembar Pengesahan
  const [drafterNama, setDrafterNama] = useState("");
  const [drafterJabatan, setDrafterJabatan] = useState("");
  const [creatorNama, setCreatorNama] = useState("");
  const [creatorJabatan, setCreatorJabatan] = useState("");
  const [reviewerNama, setReviewerNama] = useState("");
  const [reviewerJabatan, setReviewerJabatan] = useState("");

  const [konteksTambahan, setKonteksTambahan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const bodyRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setInstitusi(
        getInstitutionBranding(currentSpo?.metadata?.institusi).fullName,
      );
      setErrorMsg(null);
      setShowValidation(false);
      setIsLoading(false);
      setCurrentStep(0);
    }
  }, [isOpen, currentSpo?.metadata?.institusi]);

  const activeBranding = getInstitutionBranding(institusi);

  const handleJudulChange = (newJudul: string) => {
    setJudul(newJudul);
  };

  const stepsList = [
    "Menganalisis konteks operasional & regulasi kesehatan nasional...",
    "Menyusun definisi istilah teknis & batasan ruang lingkup...",
    "Merumuskan sasaran operasional terukur & ketentuan kebijakan...",
    "Memetakan Risk Register (identifikasi risiko & mitigasi preventif)...",
    "Menyusun tabel alur prosedur teknis, lead time & pelaksana fungsi...",
    "Menghubungkan tanggung jawab unit kerja & diagram alur layanan...",
  ];

  if (!isOpen) return null;

  const setLoadingState = (val: boolean) => {
    setIsLoading(val);
    onGeneratingChange?.(val);
  };

  const isMissingField = (val: string) => showValidation && !val.trim();

  const handleGenerate = async () => {
    const missingFields: string[] = [];
    if (!judul.trim()) missingFields.push("Judul SPO");
    if (!noDokumen.trim()) missingFields.push("No. Dokumen");
    if (!noRevisi.trim()) missingFields.push("No. Revisi");
    if (!tanggalTerbit.trim()) missingFields.push("Tanggal Terbit");
    if (!kepalaRumahSakit.trim())
      missingFields.push("Nama & Gelar Penetap (Ditetapkan Oleh)");
    if (!kepalaRumahSakitJabatan.trim())
      missingFields.push("Jabatan Penetap (Ditetapkan Oleh)");
    if (!drafterNama.trim()) missingFields.push("Nama & Gelar Drafter");
    if (!drafterJabatan.trim()) missingFields.push("Jabatan Drafter");
    if (!creatorNama.trim()) missingFields.push("Nama & Gelar Creator");
    if (!creatorJabatan.trim()) missingFields.push("Jabatan Creator");
    if (!reviewerNama.trim()) missingFields.push("Nama & Gelar Reviewer");
    if (!reviewerJabatan.trim()) missingFields.push("Jabatan Reviewer");

    if (missingFields.length > 0) {
      setShowValidation(true);
      setErrorMsg(
        `Kolom berikut wajib diisi dan tidak dapat dikosongkan: ${missingFields.join(", ")}.`,
      );
      bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setShowValidation(false);
    setLoadingState(true);
    setErrorMsg(null);
    setCurrentStep(0);

    const payloadInstitusi = institusi;
    const payloadNoDokumen = noDokumen.trim();
    const payloadNoRevisi = noRevisi.trim();
    const payloadTanggalTerbit = tanggalTerbit.trim();
    const payloadKepalaRS = kepalaRumahSakit.trim();
    const payloadKepalaRSJabatan = kepalaRumahSakitJabatan.trim();
    const payloadDrafterNama = drafterNama.trim();
    const payloadDrafterJabatan = drafterJabatan.trim();
    const payloadCreatorNama = creatorNama.trim();
    const payloadCreatorJabatan = creatorJabatan.trim();
    const payloadReviewerNama = reviewerNama.trim();
    const payloadReviewerJabatan = reviewerJabatan.trim();

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < stepsList.length - 1 ? prev + 1 : prev));
    }, 1500);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 65000);

    try {
      const response = await fetch("/api/generate-spo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          judul: judul.trim(),
          institusi: payloadInstitusi,
          noDokumen: payloadNoDokumen,
          noRevisi: payloadNoRevisi,
          tanggalTerbit: payloadTanggalTerbit,
          kepalaRumahSakit: payloadKepalaRS,
          kepalaRumahSakitJabatan: payloadKepalaRSJabatan,
          drafterNama: payloadDrafterNama,
          drafterJabatan: payloadDrafterJabatan,
          creatorNama: payloadCreatorNama,
          creatorJabatan: payloadCreatorJabatan,
          reviewerNama: payloadReviewerNama,
          reviewerJabatan: payloadReviewerJabatan,
          konteksTambahan: konteksTambahan.trim(),
          mode: "gemini",
        }),
      });

      clearInterval(stepInterval);
      clearTimeout(timeoutId);

      const rawText = await response.text();
      let resData: any = null;
      try {
        resData = rawText ? JSON.parse(rawText) : null;
      } catch {
        resData = null;
      }

      if (!response.ok || !resData?.success || !resData?.data) {
        const reason =
          resData?.error ||
          resData?.details ||
          `Gagal menghubungi server AI (HTTP ${response.status}${rawText ? "" : " - Respons kosong"}).`;
        setShowValidation(false);
        setErrorMsg(reason);
        bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const generatedDoc: SpoDocument = { ...resData.data };
      if (
        !generatedDoc.flowchartModel ||
        !Array.isArray(generatedDoc.flowchartModel.nodes) ||
        generatedDoc.flowchartModel.nodes.length === 0
      ) {
        generatedDoc.flowchartModel = buildFlowchartModelFromSpo(generatedDoc);
      }

      onGenerated(generatedDoc, resData.notice);
      onClose();
    } catch (err: any) {
      clearInterval(stepInterval);
      clearTimeout(timeoutId);
      console.warn("API request error (Gemini/OpenRouter):", err);
      const isTimeout = err?.name === "AbortError";
      setShowValidation(false);
      setErrorMsg(
        isTimeout
          ? "Waktu tunggu server AI (Gemini & OpenRouter) habis. Silakan coba kembali."
          : "Koneksi ke server AI (Gemini & OpenRouter) terganggu. Silakan periksa jaringan atau konfigurasi API Key lalu coba kembali.",
      );
      bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center px-2 py-1 shadow-xs shrink-0">
              <img
                src={activeBranding.logoPath}
                alt={activeBranding.alt}
                className="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Formulir Generator Dokumen SPO
              </h3>
              <p className="text-xs text-slate-500">{activeBranding.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div
          ref={bodyRef}
          className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700"
        >
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2.5">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-rose-900 mb-0.5">
                    {showValidation
                      ? "Kelengkapan Formulir Wajib Diisi:"
                      : "Gagal Menyusun SPO dengan AI:"}
                  </div>
                  <div className="text-xs leading-relaxed text-rose-700">
                    {errorMsg}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Kop Dokumen */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5">
            <div className="flex items-center space-x-2 font-bold text-slate-900 border-b border-slate-200 pb-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Bagian Kop Dokumen (Wajib Ditetapkan)</span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Pilih Institusi / Korporasi{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {INSTITUTION_OPTIONS.map((opt) => {
                  const isSelected = activeBranding.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setInstitusi(opt.fullName)}
                      className={`flex items-center space-x-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                          : "bg-white border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={opt.logoPath}
                          alt={opt.alt}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {opt.fullName}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Judul SPO <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={judul}
                onChange={(e) => handleJudulChange(e.target.value)}
                rows={2}
                required
                placeholder="Contoh: TRIASE DAN PENETAPAN PRIORITAS PASIEN GAWAT DARURAT DI INSTALASI GAWAT DARURAT (IGD)"
                className={`w-full text-xs font-semibold rounded-lg p-2.5 border uppercase focus:ring-emerald-500 focus:border-emerald-500 ${
                  isMissingField(judul)
                    ? "border-rose-400 bg-rose-50/40"
                    : "border-slate-300 bg-white"
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  No. Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={noDokumen}
                  onChange={(e) => setNoDokumen(e.target.value)}
                  required
                  placeholder="Wajib diisi — contoh: MED/IGD/2026/012"
                  className={`w-full rounded-lg p-2 border font-mono font-medium focus:ring-emerald-500 focus:border-emerald-500 ${
                    isMissingField(noDokumen)
                      ? "border-rose-400 bg-rose-50/40"
                      : "border-slate-300 bg-white"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  No. Revisi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={noRevisi}
                  onChange={(e) => setNoRevisi(e.target.value)}
                  required
                  placeholder="Wajib diisi — contoh: 0"
                  className={`w-full rounded-lg p-2 border font-medium focus:ring-emerald-500 focus:border-emerald-500 ${
                    isMissingField(noRevisi)
                      ? "border-rose-400 bg-rose-50/40"
                      : "border-slate-300 bg-white"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Terbit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tanggalTerbit}
                  onChange={(e) => setTanggalTerbit(e.target.value)}
                  required
                  placeholder="Wajib diisi — contoh: 04 November 2026"
                  className={`w-full rounded-lg p-2 border font-medium focus:ring-emerald-500 focus:border-emerald-500 ${
                    isMissingField(tanggalTerbit)
                      ? "border-rose-400 bg-rose-50/40"
                      : "border-slate-300 bg-white"
                  }`}
                />
              </div>
            </div>

            {/* Sub-card: Ditetapkan Oleh */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">
                  Ditetapkan Oleh (Kop Dokumen){" "}
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] font-medium text-rose-600">
                  Wajib diisi lengkap
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Nama &amp; Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={kepalaRumahSakit}
                    onChange={(e) => setKepalaRumahSakit(e.target.value)}
                    required
                    placeholder="Wajib diisi — contoh: dr. Tolib Bahasuan"
                    className={`w-full rounded p-1.5 border text-xs font-semibold text-slate-900 focus:ring-emerald-500 focus:border-emerald-500 ${
                      isMissingField(kepalaRumahSakit)
                        ? "border-rose-400 bg-rose-50/40"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Jabatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={kepalaRumahSakitJabatan}
                    onChange={(e) => setKepalaRumahSakitJabatan(e.target.value)}
                    required
                    placeholder="Wajib diisi — contoh: Kepala Rumah Sakit"
                    className={`w-full rounded p-1.5 border text-xs font-semibold text-slate-900 focus:ring-emerald-500 focus:border-emerald-500 ${
                      isMissingField(kepalaRumahSakitJabatan)
                        ? "border-rose-400 bg-rose-50/40"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Lembar Pengesahan */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Bagian Lembar Pengesahan (Drafter, Creator, Reviewer){" "}
                  <span className="text-rose-500">*</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-rose-600">
                Wajib diisi lengkap
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Drafter */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">
                  Drafter
                </span>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Nama & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={drafterNama}
                    onChange={(e) => setDrafterNama(e.target.value)}
                    required
                    placeholder="Wajib diisi nama & gelar"
                    className={`w-full rounded p-1.5 border text-xs ${
                      isMissingField(drafterNama)
                        ? "border-rose-400 bg-rose-50/40"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Jabatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={drafterJabatan}
                    onChange={(e) => setDrafterJabatan(e.target.value)}
                    required
                    placeholder="Wajib diisi jabatan"
                    className={`w-full rounded p-1.5 border text-xs ${
                      isMissingField(drafterJabatan)
                        ? "border-rose-400 bg-rose-50/40"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
              </div>

              {/* Creator */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">
                  Creator
                </span>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Nama & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={creatorNama}
                    onChange={(e) => setCreatorNama(e.target.value)}
                    required
                    placeholder="Wajib diisi nama & gelar"
                    className={`w-full rounded p-1.5 border text-xs ${
                      isMissingField(creatorNama)
                        ? "border-rose-400 bg-rose-50/40"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Jabatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={creatorJabatan}
                    onChange={(e) => setCreatorJabatan(e.target.value)}
                    required
                    placeholder="Wajib diisi jabatan"
                    className={`w-full rounded p-1.5 border text-xs ${
                      isMissingField(creatorJabatan)
                        ? "border-rose-400 bg-rose-50/40"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
              </div>

              {/* Reviewer */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">
                  Reviewer
                </span>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Nama & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reviewerNama}
                    onChange={(e) => setReviewerNama(e.target.value)}
                    required
                    placeholder="Wajib diisi nama & gelar"
                    className={`w-full rounded p-1.5 border text-xs ${
                      isMissingField(reviewerNama)
                        ? "border-rose-400 bg-rose-50/40"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Jabatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reviewerJabatan}
                    onChange={(e) => setReviewerJabatan(e.target.value)}
                    required
                    placeholder="Wajib diisi jabatan"
                    className={`w-full rounded p-1.5 border text-xs ${
                      isMissingField(reviewerJabatan)
                        ? "border-rose-400 bg-rose-50/40"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Konteks Khusus / Arahan AI */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Arahan / Catatan Khusus Operasional (Opsional)
            </label>
            <input
              type="text"
              value={konteksTambahan}
              onChange={(e) => setKonteksTambahan(e.target.value)}
              placeholder="Contoh: Fokuskan mitigasi pada kriteria triase ESI, respon time cepat, dan bridging SIMRS..."
              className="w-full rounded-lg border-slate-300 p-2.5 border text-xs"
            />
          </div>

          {/* Loading Animation Card */}
          {isLoading && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 animate-pulse">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-bold text-emerald-900 text-xs">
                  Sedang menyusun dokumen SPO standar rumah sakit secara
                  otomatis...
                </span>
              </div>
              <p className="text-xs text-emerald-700 pl-8 font-medium">
                {stepsList[currentStep]}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sedang Memproses...</span>
              </>
            ) : (
              <span>Generate</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
