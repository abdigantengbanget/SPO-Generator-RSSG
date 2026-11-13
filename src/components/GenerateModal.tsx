import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { SpoDocument } from '../types/spo';
import { generateSmartSpoDocument } from '../utils/spoGeneratorEngine';

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
  const [judul, setJudul] = useState('');
  const institusi =
    currentSpo?.metadata?.institusi?.trim() || 'RUMAH SAKIT SEMEN GRESIK / PT CIPTA NIRMALA';
  const [noDokumen, setNoDokumen] = useState('');
  const [noRevisi, setNoRevisi] = useState('0');
  const [tanggalTerbit, setTanggalTerbit] = useState('');
  const [kepalaRumahSakit, setKepalaRumahSakit] = useState('');

  // Lembar Pengesahan
  const [drafterNama, setDrafterNama] = useState('');
  const [drafterJabatan, setDrafterJabatan] = useState('');
  const [creatorNama, setCreatorNama] = useState('');
  const [creatorJabatan, setCreatorJabatan] = useState('');
  const [reviewerNama, setReviewerNama] = useState('');
  const [reviewerJabatan, setReviewerJabatan] = useState('');

  const [konteksTambahan, setKonteksTambahan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Track which fields were manually edited so auto-fill does not overwrite user input
  const manualEditsRef = useRef<Record<string, boolean>>({});

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIsLoading(false);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const setFieldAuto = (
    key: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    val: string
  ) => {
    if (!manualEditsRef.current[key]) {
      setter(val);
    }
  };

  const handleJudulChange = (newJudul: string) => {
    setJudul(newJudul);
    const lower = newJudul.toLowerCase();
    const year = new Date().getFullYear();

    if (
      lower.includes('igd') ||
      lower.includes('triase') ||
      lower.includes('darurat') ||
      lower.includes('esi')
    ) {
      setFieldAuto('noDokumen', setNoDokumen, `MED/IGD/${year}/012`);
      setFieldAuto('drafterNama', setDrafterNama, 'Ns. Hendra Prasetyo, S.Kep');
      setFieldAuto('drafterJabatan', setDrafterJabatan, 'Kepala Ruangan IGD');
      setFieldAuto('creatorNama', setCreatorNama, 'dr. Budi Setiawan, Sp.EM');
      setFieldAuto('creatorJabatan', setCreatorJabatan, 'Ka. Instalasi Gawat Darurat');
      setFieldAuto('reviewerNama', setReviewerNama, 'dr. Ratna Juwita, MARS');
      setFieldAuto('reviewerJabatan', setReviewerJabatan, 'Manajer Pelayanan Medis');
    } else if (
      lower.includes('farmasi') ||
      lower.includes('obat') ||
      lower.includes('high alert') ||
      lower.includes('lasa')
    ) {
      setFieldAuto('noDokumen', setNoDokumen, `FAR/SPO/${year}/118`);
      setFieldAuto('drafterNama', setDrafterNama, 'Apt. Dwi Lestari, S.Farm');
      setFieldAuto('drafterJabatan', setDrafterJabatan, 'Koordinator Farmasi Klinis');
      setFieldAuto('creatorNama', setCreatorNama, 'Apt. Agus Purwanto, M.Farm');
      setFieldAuto('creatorJabatan', setCreatorJabatan, 'Ka. Instalasi Farmasi');
      setFieldAuto('reviewerNama', setReviewerNama, 'Nanang Judianto, SE');
      setFieldAuto('reviewerJabatan', setReviewerJabatan, 'Pgs. Manajer SMI');
    } else if (
      lower.includes('code blue') ||
      lower.includes('henti jantung') ||
      lower.includes('resusitasi') ||
      lower.includes('rjp')
    ) {
      setFieldAuto('noDokumen', setNoDokumen, `MED/CBL/${year}/005`);
      setFieldAuto('drafterNama', setDrafterNama, 'dr. Alamsyah Pratama');
      setFieldAuto('drafterJabatan', setDrafterJabatan, 'Ketua Tim Code Blue');
      setFieldAuto('creatorNama', setCreatorNama, 'dr. Syaiful Anwar, Sp.An-TI');
      setFieldAuto('creatorJabatan', setCreatorJabatan, 'Ka. Instalasi Anestesi & ICU');
      setFieldAuto('reviewerNama', setReviewerNama, 'Nanang Judianto, SE');
      setFieldAuto('reviewerJabatan', setReviewerJabatan, 'Pgs. Manajer SMI');
    } else if (
      lower.includes('admisi') ||
      lower.includes('rawat inap') ||
      lower.includes('sep') ||
      lower.includes('tpprj')
    ) {
      setFieldAuto('noDokumen', setNoDokumen, `ADM/SPO/${year}/089`);
      setFieldAuto('drafterNama', setDrafterNama, 'Dewi Kartika, A.Md.PK');
      setFieldAuto('drafterJabatan', setDrafterJabatan, 'Supervisor Admisi & TPPRJ');
      setFieldAuto('creatorNama', setCreatorNama, 'Yulianto, SE');
      setFieldAuto('creatorJabatan', setCreatorJabatan, 'Ka. Instalasi Rekam Medis & Admisi');
      setFieldAuto('reviewerNama', setReviewerNama, 'Nanang Judianto, SE');
      setFieldAuto('reviewerJabatan', setReviewerJabatan, 'Pgs. Manajer SMI');
    } else if (
      lower.includes('bedah') ||
      lower.includes('operasi') ||
      lower.includes('ibs')
    ) {
      setFieldAuto('noDokumen', setNoDokumen, `BDH/SPO/${year}/045`);
      setFieldAuto('drafterNama', setDrafterNama, 'Ns. Bambang Irawan, S.Kep');
      setFieldAuto('drafterJabatan', setDrafterJabatan, 'Karu Kamar Operasi (IBS)');
      setFieldAuto('creatorNama', setCreatorNama, 'dr. Hendro Wicaksono, Sp.B');
      setFieldAuto('creatorJabatan', setCreatorJabatan, 'Ka. Instalasi Bedah Sentral');
      setFieldAuto('reviewerNama', setReviewerNama, 'dr. Ratna Juwita, MARS');
      setFieldAuto('reviewerJabatan', setReviewerJabatan, 'Manajer Pelayanan Medis');
    } else if (
      lower.includes('ppi') ||
      lower.includes('infeksi') ||
      lower.includes('sterilisasi') ||
      lower.includes('cuci tangan')
    ) {
      setFieldAuto('noDokumen', setNoDokumen, `PPI/SPO/${year}/021`);
      setFieldAuto('drafterNama', setDrafterNama, 'Ns. Siti Rahayu, S.Kep');
      setFieldAuto('drafterJabatan', setDrafterJabatan, 'Infection Prevention & Control Nurse (IPCN)');
      setFieldAuto('creatorNama', setCreatorNama, 'dr. Ratna Juwita, MARS');
      setFieldAuto('creatorJabatan', setCreatorJabatan, 'Ketua Komite PPI RS');
      setFieldAuto('reviewerNama', setReviewerNama, 'Nanang Judianto, SE');
      setFieldAuto('reviewerJabatan', setReviewerJabatan, 'Pgs. Manajer SMI');
    } else if (
      lower.includes('rehabilitasi') ||
      lower.includes('fisioterapi') ||
      lower.includes('tlb')
    ) {
      setFieldAuto('noDokumen', setNoDokumen, `QAP/${year}/770`);
      setFieldAuto('drafterNama', setDrafterNama, 'Hana Thriesminarsih, S.Kes');
      setFieldAuto('drafterJabatan', setDrafterJabatan, 'Karu Rehabilitasi Medik');
      setFieldAuto('creatorNama', setCreatorNama, 'dr. Achmad Farid, Sp.KFR');
      setFieldAuto('creatorJabatan', setCreatorJabatan, 'Ka. Instalasi Rehabilitasi Medik');
      setFieldAuto('reviewerNama', setReviewerNama, 'Nanang Judianto, SE');
      setFieldAuto('reviewerJabatan', setReviewerJabatan, 'Pgs. Manajer SMI');
    }
  };

  const stepsList = [
    'Menganalisis konteks operasional & regulasi kesehatan nasional...',
    'Menyusun definisi istilah teknis & batasan ruang lingkup...',
    'Merumuskan sasaran operasional terukur & ketentuan kebijakan...',
    'Memetakan Risk Register (identifikasi risiko & mitigasi preventif)...',
    'Menyusun tabel alur prosedur teknis, lead time & pelaksana fungsi...',
    'Menghubungkan tanggung jawab unit kerja & diagram alur layanan...',
  ];

  if (!isOpen) return null;

  const setLoadingState = (val: boolean) => {
    setIsLoading(val);
    onGeneratingChange?.(val);
  };

  const handleGenerate = async () => {
    if (!judul.trim()) {
      setErrorMsg('Judul SPO wajib diisi.');
      return;
    }

    setLoadingState(true);
    setErrorMsg(null);
    setCurrentStep(0);

    const payloadInstitusi = institusi;
    const payloadNoDokumen = noDokumen.trim();
    const payloadNoRevisi = noRevisi.trim() || '0';
    const payloadTanggalTerbit =
      tanggalTerbit.trim() ||
      new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    const payloadKepalaRS = kepalaRumahSakit.trim() || 'dr. Tolib Bahasuan';
    const payloadDrafterNama = drafterNama.trim();
    const payloadDrafterJabatan = drafterJabatan.trim();
    const payloadCreatorNama = creatorNama.trim();
    const payloadCreatorJabatan = creatorJabatan.trim();
    const payloadReviewerNama = reviewerNama.trim();
    const payloadReviewerJabatan = reviewerJabatan.trim();

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < stepsList.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const response = await fetch('/api/generate-spo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: judul.trim(),
          institusi: payloadInstitusi,
          noDokumen: payloadNoDokumen,
          noRevisi: payloadNoRevisi,
          tanggalTerbit: payloadTanggalTerbit,
          kepalaRumahSakit: payloadKepalaRS,
          drafterNama: payloadDrafterNama,
          drafterJabatan: payloadDrafterJabatan,
          creatorNama: payloadCreatorNama,
          creatorJabatan: payloadCreatorJabatan,
          reviewerNama: payloadReviewerNama,
          reviewerJabatan: payloadReviewerJabatan,
          konteksTambahan: konteksTambahan.trim(),
          mode: 'gemini',
        }),
      });

      clearInterval(stepInterval);
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        const fallback = generateSmartSpoDocument({
          judul: judul.trim(),
          institusi: payloadInstitusi,
          noDokumen: payloadNoDokumen || undefined,
          noRevisi: payloadNoRevisi,
          tanggalTerbit: payloadTanggalTerbit,
          kepalaRumahSakit: payloadKepalaRS,
          drafterNama: payloadDrafterNama || undefined,
          drafterJabatan: payloadDrafterJabatan || undefined,
          creatorNama: payloadCreatorNama || undefined,
          creatorJabatan: payloadCreatorJabatan || undefined,
          reviewerNama: payloadReviewerNama || undefined,
          reviewerJabatan: payloadReviewerJabatan || undefined,
          konteksTambahan: konteksTambahan.trim(),
        });
        onGenerated(
          fallback,
          'Dokumen SPO berhasil disusun menggunakan Standar Akreditasi Rumah Sakit (Otomatis dialihkan).'
        );
        onClose();
        return;
      }

      onGenerated(resData.data, resData.notice);
      onClose();
    } catch (err: any) {
      clearInterval(stepInterval);
      console.warn('Network issue, falling back to smart hospital engine:', err);
      try {
        const fallback = generateSmartSpoDocument({
          judul: judul.trim(),
          institusi: payloadInstitusi,
          noDokumen: payloadNoDokumen || undefined,
          noRevisi: payloadNoRevisi,
          tanggalTerbit: payloadTanggalTerbit,
          kepalaRumahSakit: payloadKepalaRS,
          drafterNama: payloadDrafterNama || undefined,
          drafterJabatan: payloadDrafterJabatan || undefined,
          creatorNama: payloadCreatorNama || undefined,
          creatorJabatan: payloadCreatorJabatan || undefined,
          reviewerNama: payloadReviewerNama || undefined,
          reviewerJabatan: payloadReviewerJabatan || undefined,
          konteksTambahan: konteksTambahan.trim(),
        });
        onGenerated(
          fallback,
          'Dokumen SPO berhasil disusun menggunakan Standar Akreditasi Rumah Sakit (Otomatis dialihkan).'
        );
        onClose();
      } catch (_innerErr: any) {
        setErrorMsg('Gagal menyusun dokumen. Silakan periksa isian formulir dan coba kembali.');
      }
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
                src="/assets/aistudio/rs-semen-gresik_d7d14617.png"
                alt="Logo Rumah Sakit Semen Gresik"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Formulir Generator Dokumen SPO
              </h3>
              <p className="text-xs text-slate-500">
                Rumah Sakit Semen Gresik
              </p>
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
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2.5">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-rose-900 mb-0.5">Penjelasan Kendala Pemrosesan:</div>
                  <div className="text-xs leading-relaxed text-rose-700">{errorMsg}</div>
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
              <label className="block font-bold text-slate-800 mb-1">
                Judul SPO <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={judul}
                onChange={(e) => handleJudulChange(e.target.value)}
                rows={2}
                placeholder="Contoh: TRIASE DAN PENETAPAN PRIORITAS PASIEN GAWAT DARURAT DI INSTALASI GAWAT DARURAT (IGD)"
                className="w-full text-xs font-semibold rounded-lg border-slate-300 bg-white p-2.5 border uppercase focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. Dokumen</label>
                <input
                  type="text"
                  value={noDokumen}
                  onChange={(e) => {
                    manualEditsRef.current.noDokumen = true;
                    setNoDokumen(e.target.value);
                  }}
                  placeholder="Contoh: MED/IGD/2026/012 (Otomatis jika kosong)"
                  className="w-full rounded-lg border-slate-300 bg-white p-2 border font-mono font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. Revisi</label>
                <input
                  type="text"
                  value={noRevisi}
                  onChange={(e) => setNoRevisi(e.target.value)}
                  placeholder="Contoh: 0"
                  className="w-full rounded-lg border-slate-300 bg-white p-2 border font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Terbit</label>
                <input
                  type="text"
                  value={tanggalTerbit}
                  onChange={(e) => setTanggalTerbit(e.target.value)}
                  placeholder="Contoh: 04 November 2026 (Otomatis jika kosong)"
                  className="w-full rounded-lg border-slate-300 bg-white p-2 border font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Kepala Rumah Sakit
                </label>
                <input
                  type="text"
                  value={kepalaRumahSakit}
                  onChange={(e) => setKepalaRumahSakit(e.target.value)}
                  placeholder="Contoh: dr. Tolib Bahasuan (Otomatis jika kosong)"
                  className="w-full rounded-lg border-slate-300 bg-white p-2 border font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Institusi / Korporasi
                </label>
                <div className="w-full rounded-lg border border-slate-200 bg-slate-100 p-2 text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span className="truncate">{institusi}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded shrink-0 ml-2">
                    Ditetapkan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Lembar Pengesahan */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5">
            <div className="flex items-center space-x-2 font-bold text-slate-900 border-b border-slate-200 pb-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Bagian Lembar Pengesahan (Drafter, Creator, Reviewer)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Drafter */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">
                  Drafter
                </span>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Nama & Gelar</label>
                  <input
                    type="text"
                    value={drafterNama}
                    onChange={(e) => {
                      manualEditsRef.current.drafterNama = true;
                      setDrafterNama(e.target.value);
                    }}
                    placeholder="Otomatis menyesuaikan topik"
                    className="w-full rounded border-slate-300 p-1.5 border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Jabatan</label>
                  <input
                    type="text"
                    value={drafterJabatan}
                    onChange={(e) => {
                      manualEditsRef.current.drafterJabatan = true;
                      setDrafterJabatan(e.target.value);
                    }}
                    placeholder="Otomatis menyesuaikan topik"
                    className="w-full rounded border-slate-300 p-1.5 border text-xs"
                  />
                </div>
              </div>

              {/* Creator */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">
                  Creator
                </span>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Nama & Gelar</label>
                  <input
                    type="text"
                    value={creatorNama}
                    onChange={(e) => {
                      manualEditsRef.current.creatorNama = true;
                      setCreatorNama(e.target.value);
                    }}
                    placeholder="Otomatis menyesuaikan topik"
                    className="w-full rounded border-slate-300 p-1.5 border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Jabatan</label>
                  <input
                    type="text"
                    value={creatorJabatan}
                    onChange={(e) => {
                      manualEditsRef.current.creatorJabatan = true;
                      setCreatorJabatan(e.target.value);
                    }}
                    placeholder="Otomatis menyesuaikan topik"
                    className="w-full rounded border-slate-300 p-1.5 border text-xs"
                  />
                </div>
              </div>

              {/* Reviewer */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">
                  Reviewer
                </span>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Nama & Gelar</label>
                  <input
                    type="text"
                    value={reviewerNama}
                    onChange={(e) => {
                      manualEditsRef.current.reviewerNama = true;
                      setReviewerNama(e.target.value);
                    }}
                    placeholder="Otomatis menyesuaikan topik"
                    className="w-full rounded border-slate-300 p-1.5 border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Jabatan</label>
                  <input
                    type="text"
                    value={reviewerJabatan}
                    onChange={(e) => {
                      manualEditsRef.current.reviewerJabatan = true;
                      setReviewerJabatan(e.target.value);
                    }}
                    placeholder="Otomatis menyesuaikan topik"
                    className="w-full rounded border-slate-300 p-1.5 border text-xs"
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
                  Sedang menyusun dokumen SPO standar rumah sakit secara otomatis...
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
            disabled={isLoading || !judul.trim()}
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
