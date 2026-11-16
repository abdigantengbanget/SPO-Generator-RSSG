import React, { useState, useEffect } from 'react';
import { Sparkles, X, AlertCircle } from 'lucide-react';

interface RefineSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionType: string;
  currentContent: any;
  judulSpo: string;
  onApplied: (refinedContent: any, notice?: string) => void;
}

export const RefineSectionModal: React.FC<RefineSectionModalProps> = ({
  isOpen,
  onClose,
  sectionType,
  currentContent,
  judulSpo,
  onApplied,
}) => {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInstruction('');
      setErrorMsg(null);
      setIsLoading(false);
    }
  }, [isOpen, sectionType]);

  if (!isOpen) return null;

  const sectionLabels: Record<string, string> = {
    pengertian: 'A. Pengertian & Ruang Lingkup',
    tujuan: 'B. Tujuan',
    kebijakan: 'C. Kebijakan & Risk Register',
    prosedur: 'D. Prosedur Pelaksanaan',
    tanggungJawabUnit: 'E. Tanggung Jawab Unit Terkait',
  };

  const quickPrompts: Record<string, string[]> = {
    pengertian: [
      'Tambahkan 3 definisi istilah medis teknis yang relevan dengan regulasi terkini',
      'Perjelas batasan ruang lingkup agar mengikat seluruh instalasi penunjang',
      'Format definisi agar lebih padat dan sesuai standar akreditasi KARS',
    ],
    tujuan: [
      'Tambahkan sasaran kepatuhan regulasi BPJS dan pencegahan fraud klaim',
      'Buat sasaran lebih terukur dengan indikator angka dan zero-defect',
      'Tambahkan target mitigasi kepuasan pasien dan waktu tunggu',
    ],
    kebijakan: [
      'Perketat klausul kebijakan dengan aturan sanksi dan larangan registrasi ganda',
      'Tambahkan 2 baris risiko baru pada tabel Risk Register dengan mitigasi operasional',
      'Sertakan ketentuan hukum rujukan dan Rekam Medis Elektronik (RME)',
    ],
    prosedur: [
      'Perjelas rincian langkah teknis pada tahapan skrining dan validasi berkas',
      'Perpendek lead time untuk mengoptimalkan efisiensi alur pelayanan',
      'Sertakan penanganan kondisi darurat atau anomali sistem jaringan SIMRS',
    ],
    tanggungJawabUnit: [
      'Tambahkan rincian pengawasan Komite Mutu dan audit kepatuhan unit',
      'Pertegas pembagian wewenang antar instalasi klinis dan penunjang medis',
      'Lengkapi kewajiban pelaporan insiden dan evaluasi berkala',
    ],
  };

  const currentOptions = quickPrompts[sectionType] || [
    'Tingkatkan ketajaman operasional dan kepatuhan standar rumah sakit',
    'Lengkapi dengan langkah teknis pencegahan insiden keselamatan pasien',
  ];

  const handleRefine = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/refine-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType,
          currentContent,
          judulSpo,
          promptInstruction:
            instruction.trim() || 'Sempurnakan sesuai standar baku akreditasi rumah sakit.',
        }),
      });

      const rawText = await response.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || `Server mengembalikan status ${response.status}`);
      }

      onApplied(data.refinedContent, data.notice);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal menyempurnakan bagian dengan AI');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Sempurnakan:{' '}
              <span className="text-emerald-700">
                {sectionLabels[sectionType] || sectionType}
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Instruksi Khusus untuk AI:
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
              placeholder="Contoh: Tambahkan klausul verifikasi ganda dan perketat tanggung jawab koder casemix..."
              className="w-full text-xs rounded-lg border-slate-300 p-2.5 border"
            />
          </div>

          <div>
            <span className="font-semibold text-slate-500 block mb-1">
              Atau klik rekomendasi instruksi cepat:
            </span>
            <div className="space-y-1.5">
              {currentOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInstruction(opt)}
                  className="w-full text-left p-2 rounded-lg text-[11px] bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 transition-colors cursor-pointer"
                >
                  💡 {opt}
                </button>
              ))}
            </div>
          </div>

          {isLoading && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-800 font-medium">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>AI sedang memproses pembaruan bagian ini...</span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleRefine}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Sedang Memproses...' : 'Terapkan Penyempurnaan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
