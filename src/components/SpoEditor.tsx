import React, { useState } from 'react';
import {
  SpoDocument,
  DefinisiItem,
  TujuanItem,
  RiskRegisterItem,
  ProsedurItem,
  TanggungJawabUnitItem,
} from '../types/spo';
import {
  Plus,
  Trash2,
  FileCheck,
  ShieldAlert,
  Clock,
  Building2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatSpoVersionLabel } from '../utils/spoFormatHelper';
import { buildFlowchartModelFromSpo } from '../utils/flowchartHelper';

export type EditorTab =
  | 'metadata'
  | 'pengertian'
  | 'tujuan_kebijakan'
  | 'risiko'
  | 'prosedur'
  | 'unit_dokumen';

interface SpoEditorProps {
  spo: SpoDocument;
  onChange: (updated: SpoDocument) => void;
  onRefineSection: (sectionId: string, currentContent: any) => void;
  activeTab?: EditorTab;
  onTabChange?: (tab: EditorTab) => void;
}

export const SpoEditor: React.FC<SpoEditorProps> = ({
  spo,
  onChange,
  onRefineSection,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<EditorTab>('metadata');
  const activeTab = controlledTab || internalTab;
  const setActiveTab = (tab: EditorTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // Metadata update helper (automatically syncs F.2 Riwayat Perubahan with noRevisi & tanggalTerbit)
  const updateMetadata = (field: string, value: any) => {
    const nextMetadata = {
      ...spo.metadata,
      [field]: value,
    };

    let nextFormulirPendukung = spo.formulirPendukung;
    if (
      (field === 'noRevisi' || field === 'tanggalTerbit') &&
      spo.formulirPendukung?.riwayatPerubahan?.length > 0
    ) {
      const updatedRiwayat = [...spo.formulirPendukung.riwayatPerubahan];
      const lastIdx = updatedRiwayat.length - 1;
      updatedRiwayat[lastIdx] = {
        ...updatedRiwayat[lastIdx],
        ...(field === 'tanggalTerbit' ? { tanggal: String(value || '').trim() || '-' } : {}),
        ...(field === 'noRevisi' ? { versi: formatSpoVersionLabel(String(value || '')) } : {}),
      };
      nextFormulirPendukung = {
        ...spo.formulirPendukung,
        riwayatPerubahan: updatedRiwayat,
      };
    }

    onChange({
      ...spo,
      metadata: nextMetadata,
      formulirPendukung: nextFormulirPendukung,
    });
  };

  const updateApproval = (role: 'drafter' | 'creator' | 'reviewer', key: 'nama' | 'jabatan', val: string) => {
    onChange({
      ...spo,
      metadata: {
        ...spo.metadata,
        [role]: {
          ...spo.metadata[role],
          [key]: val,
        },
      },
    });
  };

  // Definisi helpers
  const handleDefinisiChange = (index: number, key: keyof DefinisiItem, value: string) => {
    const updated = [...spo.pengertian.definisi];
    updated[index] = { ...updated[index], [key]: value };
    onChange({
      ...spo,
      pengertian: {
        ...spo.pengertian,
        definisi: updated,
      },
    });
  };

  const addDefinisi = () => {
    onChange({
      ...spo,
      pengertian: {
        ...spo.pengertian,
        definisi: [
          ...spo.pengertian.definisi,
          { istilah: 'Istilah Baru', penjelasan: 'Penjelasan definisi operasional.' },
        ],
      },
    });
  };

  const removeDefinisi = (index: number) => {
    onChange({
      ...spo,
      pengertian: {
        ...spo.pengertian,
        definisi: spo.pengertian.definisi.filter((_, i) => i !== index),
      },
    });
  };

  // Ruang Lingkup helpers
  const updateRuangLingkupPengantar = (val: string) => {
    onChange({
      ...spo,
      pengertian: {
        ...spo.pengertian,
        ruangLingkup: {
          ...spo.pengertian.ruangLingkup,
          pengantar: val,
        },
      },
    });
  };

  const updateRuangLingkupUnit = (index: number, val: string) => {
    const updated = [...spo.pengertian.ruangLingkup.unitList];
    updated[index] = val;
    onChange({
      ...spo,
      pengertian: {
        ...spo.pengertian,
        ruangLingkup: {
          ...spo.pengertian.ruangLingkup,
          unitList: updated,
        },
      },
    });
  };

  const addRuangLingkupUnit = () => {
    onChange({
      ...spo,
      pengertian: {
        ...spo.pengertian,
        ruangLingkup: {
          ...spo.pengertian.ruangLingkup,
          unitList: [...spo.pengertian.ruangLingkup.unitList, 'Unit / Instalasi Baru'],
        },
      },
    });
  };

  const removeRuangLingkupUnit = (index: number) => {
    onChange({
      ...spo,
      pengertian: {
        ...spo.pengertian,
        ruangLingkup: {
          ...spo.pengertian.ruangLingkup,
          unitList: spo.pengertian.ruangLingkup.unitList.filter((_, i) => i !== index),
        },
      },
    });
  };

  // Tujuan helpers
  const handleTujuanChange = (index: number, key: keyof TujuanItem, val: string) => {
    const updated = [...spo.tujuan];
    updated[index] = { ...updated[index], [key]: val };
    onChange({ ...spo, tujuan: updated });
  };

  const addTujuan = () => {
    onChange({
      ...spo,
      tujuan: [
        ...spo.tujuan,
        { judulTujuan: 'Sasaran Baru', deskripsi: 'Deskripsi target pencapaian operasional.' },
      ],
    });
  };

  const removeTujuan = (index: number) => {
    onChange({
      ...spo,
      tujuan: spo.tujuan.filter((_, i) => i !== index),
    });
  };

  // Kebijakan Ketentuan helpers
  const handleKetentuanChange = (index: number, val: string) => {
    const updated = [...spo.kebijakan.ketentuan];
    updated[index] = val;
    onChange({
      ...spo,
      kebijakan: { ...spo.kebijakan, ketentuan: updated },
    });
  };

  const addKetentuan = () => {
    onChange({
      ...spo,
      kebijakan: {
        ...spo.kebijakan,
        ketentuan: [
          ...spo.kebijakan.ketentuan,
          'Klausul kebijakan baru yang mengatur kepatuhan operasional.',
        ],
      },
    });
  };

  const removeKetentuan = (index: number) => {
    onChange({
      ...spo,
      kebijakan: {
        ...spo.kebijakan,
        ketentuan: spo.kebijakan.ketentuan.filter((_, i) => i !== index),
      },
    });
  };

  // Risk Register helpers
  const handleRiskChange = (index: number, key: keyof RiskRegisterItem, val: any) => {
    const updated = [...spo.kebijakan.riskRegister];
    updated[index] = { ...updated[index], [key]: val };
    onChange({
      ...spo,
      kebijakan: { ...spo.kebijakan, riskRegister: updated },
    });
  };

  const addRiskItem = () => {
    const newCode = `R${spo.kebijakan.riskRegister.length + 1}`;
    onChange({
      ...spo,
      kebijakan: {
        ...spo.kebijakan,
        riskRegister: [
          ...spo.kebijakan.riskRegister,
          {
            kode: newCode,
            proses: 'Tahap Pelayanan Baru',
            namaRisiko: 'Risiko Ketidaksesuaian Prosedur',
            deskripsiRisiko: 'Deskripsi potensi kegagalan atau insiden.',
            mitigasi: ['Langkah pencegahan dan kontrol kepatuhan.'],
          },
        ],
      },
    });
  };

  const removeRiskItem = (index: number) => {
    onChange({
      ...spo,
      kebijakan: {
        ...spo.kebijakan,
        riskRegister: spo.kebijakan.riskRegister.filter((_, i) => i !== index),
      },
    });
  };

  // Prosedur helpers — keep D.2 Flowchart automatically aligned 1-to-1 with D.1 Prosedur
  const syncProsedurAndFlowchart = (nextProsedur: ProsedurItem[]) => {
    const nextDoc: SpoDocument = {
      ...spo,
      prosedur: nextProsedur,
      alurFlowchart: undefined,
    };
    nextDoc.flowchartModel = buildFlowchartModelFromSpo({
      ...nextDoc,
      flowchartModel: spo.flowchartModel
        ? {
            ...spo.flowchartModel,
            nodes: [],
            connections: undefined,
          }
        : undefined,
    });
    onChange(nextDoc);
  };

  const handleProsedurChange = (index: number, key: keyof ProsedurItem, val: any) => {
    const updated = [...spo.prosedur];
    updated[index] = { ...updated[index], [key]: val };
    syncProsedurAndFlowchart(updated);
  };

  const addProsedurStep = () => {
    const newNo = `5.${spo.prosedur.length + 1}`;
    syncProsedurAndFlowchart([
      ...spo.prosedur,
      {
        noProses: newNo,
        judulTahapan: 'TAHAPAN PROSEDUR BARU',
        langkah: ['Petugas melakukan instruksi verifikasi awal.'],
        leadTime: '5 Menit',
        pelaksana: 'Petugas Terkait',
      },
    ]);
  };

  const removeProsedurStep = (index: number) => {
    syncProsedurAndFlowchart(spo.prosedur.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Editor Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 mb-6 p-1.5 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('metadata')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'metadata'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Kop & Pengesahan</span>
        </button>

        <button
          onClick={() => setActiveTab('pengertian')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'pengertian'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>A. Pengertian & Ruang Lingkup</span>
        </button>

        <button
          onClick={() => setActiveTab('tujuan_kebijakan')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'tujuan_kebijakan'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>B & C. Tujuan & Kebijakan</span>
        </button>

        <button
          onClick={() => setActiveTab('risiko')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'risiko'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>C.2 Risk Register ({spo.kebijakan.riskRegister.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prosedur')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'prosedur'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>D. Prosedur ({spo.prosedur.length} Tahap)</span>
        </button>

        <button
          onClick={() => setActiveTab('unit_dokumen')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'unit_dokumen'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>E & F. Unit & Dokumen</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* TAB 1: METADATA, KOP, DAN PENGESAHAN */}
      {activeTab === 'metadata' && (
        <div className="space-y-6">
          {/* Card: Header Dokumen (KOP) */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bagian Kop Header SPO</h3>
                <p className="text-xs text-slate-500">
                  Data judul, penomoran dokumen, tanggal terbit, dan pengesahan penetapan kepala RS
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                Wajib Sesuai Standar
              </span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 mb-5">
              <div className="w-14 h-14 bg-white rounded-lg border border-emerald-300 p-1 flex items-center justify-center shrink-0">
                <img
                  src="/assets/aistudio/rs-semen-gresik_d7d14617.png"
                  alt="Logo RS Semen Gresik"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-xs">
                <div className="font-bold text-emerald-950 flex items-center space-x-1.5">
                  <span>Logo Resmi Rumah Sakit Semen Gresik</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-semibold">Aktif</span>
                </div>
                <div className="text-emerald-800 text-[11px] mt-0.5">
                  Logo resmi otomatis terpasang pada Kop Dokumen (kolom kiri baris 1 & 2) di preview dokumen & ekspor Word.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul SPO (Huruf Besar / Standar Resmi)
                </label>
                <textarea
                  value={spo.judulSpo}
                  onChange={(e) => onChange({ ...spo, judulSpo: e.target.value })}
                  rows={2}
                  className="w-full text-sm font-semibold rounded-lg border-slate-300 shadow-xs focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Institusi / Korporasi
                </label>
                <input
                  type="text"
                  value={spo.metadata.institusi}
                  onChange={(e) => updateMetadata('institusi', e.target.value)}
                  placeholder="RUMAH SAKIT SEMEN GRESIK / PT CIPTA NIRMALA"
                  className="w-full text-xs font-semibold rounded-lg border-slate-300 shadow-xs focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Dokumen
                </label>
                <input
                  type="text"
                  value={spo.metadata.noDokumen}
                  onChange={(e) => updateMetadata('noDokumen', e.target.value)}
                  placeholder="contoh: QAP/102341/770"
                  className="w-full text-xs font-mono rounded-lg border-slate-300 shadow-xs focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Revisi
                </label>
                <input
                  type="text"
                  value={spo.metadata.noRevisi}
                  onChange={(e) => updateMetadata('noRevisi', e.target.value)}
                  placeholder="0"
                  className="w-full text-xs rounded-lg border-slate-300 shadow-xs focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Terbit
                </label>
                <input
                  type="text"
                  value={spo.metadata.tanggalTerbit}
                  onChange={(e) => updateMetadata('tanggalTerbit', e.target.value)}
                  placeholder="contoh: 23 Oktober 2026"
                  className="w-full text-xs rounded-lg border-slate-300 shadow-xs focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kepala Rumah Sakit (Ditetapkan Oleh)
                </label>
                <input
                  type="text"
                  value={spo.metadata.kepalaRumahSakit}
                  onChange={(e) => updateMetadata('kepalaRumahSakit', e.target.value)}
                  placeholder="contoh: dr. Tolib Bahasuan"
                  className="w-full text-xs font-semibold rounded-lg border-slate-300 shadow-xs focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                />
              </div>
            </div>
          </div>

          {/* Card: Lembar Pengesahan Dokumen */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <div className="pb-4 border-b border-slate-200 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Lembar Pengesahan Dokumen (Drafter, Creator, Reviewer)
              </h3>
              <p className="text-xs text-slate-500">
                Sesuai dengan template PT Cipta Nirmala, tentukan nama pejabat dan jabatannya.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Drafter */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center justify-between">
                  <span>1. Drafter</span>
                  <span className="text-[10px] text-slate-500 font-normal">Penyusun Awal</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Lengkap & Gelar
                    </label>
                    <input
                      type="text"
                      value={spo.metadata.drafter.nama}
                      onChange={(e) => updateApproval('drafter', 'nama', e.target.value)}
                      placeholder="Hana Thriesminarsih, S.Kes"
                      className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={spo.metadata.drafter.jabatan}
                      onChange={(e) => updateApproval('drafter', 'jabatan', e.target.value)}
                      placeholder="Karu Rehabilitasi Medik"
                      className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                    />
                  </div>
                </div>
              </div>

              {/* Creator */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center justify-between">
                  <span>2. Creator</span>
                  <span className="text-[10px] text-slate-500 font-normal">Penanggung Jawab Unit</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Lengkap & Gelar
                    </label>
                    <input
                      type="text"
                      value={spo.metadata.creator.nama}
                      onChange={(e) => updateApproval('creator', 'nama', e.target.value)}
                      placeholder="dr. Achmad Farid, Sp.KFR"
                      className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={spo.metadata.creator.jabatan}
                      onChange={(e) => updateApproval('creator', 'jabatan', e.target.value)}
                      placeholder="Ka. Instalasi Rehabilitasi medik"
                      className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                    />
                  </div>
                </div>
              </div>

              {/* Reviewer */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center justify-between">
                  <span>3. Reviewer</span>
                  <span className="text-[10px] text-slate-500 font-normal">Manajemen Mutu</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Lengkap & Gelar
                    </label>
                    <input
                      type="text"
                      value={spo.metadata.reviewer.nama}
                      onChange={(e) => updateApproval('reviewer', 'nama', e.target.value)}
                      placeholder="Nanang Judianto, SE"
                      className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={spo.metadata.reviewer.jabatan}
                      onChange={(e) => updateApproval('reviewer', 'jabatan', e.target.value)}
                      placeholder="Pgs. Manajer SMI"
                      className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENGERTIAN & RUANG LINGKUP */}
      {activeTab === 'pengertian' && (
        <div className="space-y-6">
          {/* Definisi */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">A.1 Batasan Istilah & Definisi</h3>
                <p className="text-xs text-slate-500">
                  Definisi operasional istilah teknis untuk menyamakan persepsi di seluruh unit
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onRefineSection('pengertian', spo.pengertian)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sempurnakan dengan AI</span>
                </button>
                <button
                  onClick={addDefinisi}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Definisi</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {spo.pengertian.definisi.map((def, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Istilah #{idx + 1}</span>
                    <button
                      onClick={() => removeDefinisi(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={def.istilah}
                      onChange={(e) => handleDefinisiChange(idx, 'istilah', e.target.value)}
                      placeholder="Nama Istilah (e.g. Tidak Layak Bayar (TLB))"
                      className="w-full text-xs font-semibold rounded-lg border-slate-300 bg-white p-2 border"
                    />
                    <textarea
                      value={def.penjelasan}
                      onChange={(e) => handleDefinisiChange(idx, 'penjelasan', e.target.value)}
                      rows={2}
                      placeholder="Penjelasan definisi teknis..."
                      className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ruang Lingkup */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">A.2 Ruang Lingkup Prosedur</h3>
                <p className="text-xs text-slate-500">
                  Daftar instalasi, unit pelayanan, dan petugas yang terikat prosedur ini
                </p>
              </div>
              <button
                onClick={addRuangLingkupUnit}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Unit Terikat</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kalimat Pengantar Ruang Lingkup
                </label>
                <textarea
                  value={spo.pengertian.ruangLingkup.pengantar}
                  onChange={(e) => updateRuangLingkupPengantar(e.target.value)}
                  rows={2}
                  className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Daftar Unit Pelayanan Terkait:
                </label>
                <div className="space-y-2">
                  {spo.pengertian.ruangLingkup.unitList.map((unit, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-500 w-5 shrink-0">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => updateRuangLingkupUnit(idx, e.target.value)}
                        className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                      />
                      <button
                        onClick={() => removeRuangLingkupUnit(idx)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TUJUAN & KEBIJAKAN */}
      {activeTab === 'tujuan_kebijakan' && (
        <div className="space-y-6">
          {/* B. TUJUAN */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">B. Sasaran & Tujuan SPO</h3>
                <p className="text-xs text-slate-500">
                  Target terukur yang ingin dicapai melalui penerapan prosedur ini
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onRefineSection('tujuan', spo.tujuan)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Refine AI</span>
                </button>
                <button
                  onClick={addTujuan}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Sasaran</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {spo.tujuan.map((tuj, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Sasaran #{idx + 1}</span>
                    <button
                      onClick={() => removeTujuan(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={tuj.judulTujuan}
                      onChange={(e) => handleTujuanChange(idx, 'judulTujuan', e.target.value)}
                      placeholder="Judul Sasaran (e.g. Mencegah Penolakan Klaim (Zero TLB))"
                      className="w-full text-xs font-bold rounded-lg border-slate-300 bg-white p-2 border"
                    />
                    <textarea
                      value={tuj.deskripsi}
                      onChange={(e) => handleTujuanChange(idx, 'deskripsi', e.target.value)}
                      rows={2}
                      placeholder="Deskripsi target operasional..."
                      className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* C.1 KETENTUAN KEBIJAKAN */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">C.1 Ketentuan Kebijakan</h3>
                <p className="text-xs text-slate-500">
                  Prinsip dan klausul hukum/operasional resmi yang mengikat prosedur
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onRefineSection('kebijakan', spo.kebijakan)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Refine AI</span>
                </button>
                <button
                  type="button"
                  onClick={addKetentuan}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Klausul</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {spo.kebijakan.ketentuan.map((ket, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-xs font-bold text-slate-600 mt-2 shrink-0">{idx + 1}.</span>
                  <textarea
                    value={ket}
                    onChange={(e) => handleKetentuanChange(idx, e.target.value)}
                    rows={2}
                    className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                  />
                  <button
                    onClick={() => removeKetentuan(idx)}
                    className="text-red-500 hover:text-red-700 p-2 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RISK REGISTER TABLE */}
      {activeTab === 'risiko' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                C.2 Analisis Risiko & Mitigasi (Risk Register Operasional)
              </h3>
              <p className="text-xs text-slate-500">
                Identifikasi potensi kegagalan, kode risiko, deskripsi, dan langkah mitigasi konkret
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onRefineSection('kebijakan', spo.kebijakan)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Refine AI</span>
              </button>
              <button
                onClick={addRiskItem}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Risiko</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {spo.kebijakan.riskRegister.map((risk, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {risk.kode || `R${idx + 1}`}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {risk.namaRisiko || 'Risiko Operasional'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeRiskItem(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Hapus Risiko"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">Kode Risiko</label>
                    <input
                      type="text"
                      value={risk.kode}
                      onChange={(e) => handleRiskChange(idx, 'kode', e.target.value)}
                      className="w-full rounded border-slate-300 bg-white p-2 border font-mono font-bold"
                    />
                  </div>

                  <div className="md:col-span-5">
                    <label className="block font-semibold text-slate-600 mb-1">
                      Proses / Aktivitas
                    </label>
                    <input
                      type="text"
                      value={risk.proses}
                      onChange={(e) => handleRiskChange(idx, 'proses', e.target.value)}
                      className="w-full rounded border-slate-300 bg-white p-2 border font-medium"
                    />
                  </div>

                  <div className="md:col-span-5">
                    <label className="block font-semibold text-slate-600 mb-1">Nama Risiko</label>
                    <input
                      type="text"
                      value={risk.namaRisiko}
                      onChange={(e) => handleRiskChange(idx, 'namaRisiko', e.target.value)}
                      className="w-full rounded border-slate-300 bg-white p-2 border font-semibold text-rose-800"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <label className="block font-semibold text-slate-600 mb-1">
                      Deskripsi Risiko
                    </label>
                    <textarea
                      value={risk.deskripsiRisiko}
                      onChange={(e) => handleRiskChange(idx, 'deskripsiRisiko', e.target.value)}
                      rows={3}
                      className="w-full rounded border-slate-300 bg-white p-2 border"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-600">
                        Pengendalian Risiko / Mitigasi
                      </label>
                      <button
                        onClick={() => {
                          const updatedMitigasi = [...risk.mitigasi, 'Langkah mitigasi tambahan'];
                          handleRiskChange(idx, 'mitigasi', updatedMitigasi);
                        }}
                        className="text-[10px] text-emerald-700 hover:underline font-semibold"
                      >
                        + Tambah Poin Mitigasi
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {risk.mitigasi.map((m, mIdx) => (
                        <div key={mIdx} className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-slate-400">{mIdx + 1}.</span>
                          <input
                            type="text"
                            value={m}
                            onChange={(e) => {
                              const updatedMitigasi = [...risk.mitigasi];
                              updatedMitigasi[mIdx] = e.target.value;
                              handleRiskChange(idx, 'mitigasi', updatedMitigasi);
                            }}
                            className="w-full rounded border-slate-300 bg-white p-1.5 border text-xs"
                          />
                          <button
                            onClick={() => {
                              const updatedMitigasi = risk.mitigasi.filter((_, i) => i !== mIdx);
                              handleRiskChange(idx, 'mitigasi', updatedMitigasi);
                            }}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PROSEDUR PELAKSANAAN TABLE */}
      {activeTab === 'prosedur' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                D.1 Uraian Alur Prosedur Operasional
              </h3>
              <p className="text-xs text-slate-500">
                Langkah-langkah terperinci dengan nomor proses, uraian teknis, lead time, dan pelaksana
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onRefineSection('prosedur', spo.prosedur)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Refine AI</span>
              </button>
              <button
                onClick={addProsedurStep}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tahapan Prosedur</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {spo.prosedur.map((proc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      No. {proc.noProses}
                    </span>
                    <span className="text-xs font-bold text-slate-800 uppercase">
                      {proc.judulTahapan}
                    </span>
                  </div>
                  <button
                    onClick={() => removeProsedurStep(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Hapus Tahapan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">No. Proses</label>
                    <input
                      type="text"
                      value={proc.noProses}
                      onChange={(e) => handleProsedurChange(idx, 'noProses', e.target.value)}
                      placeholder="5.1"
                      className="w-full rounded border-slate-300 bg-white p-2 border font-mono font-bold"
                    />
                  </div>

                  <div className="md:col-span-5">
                    <label className="block font-semibold text-slate-600 mb-1">
                      Judul Tahapan Kegiatan
                    </label>
                    <input
                      type="text"
                      value={proc.judulTahapan}
                      onChange={(e) => handleProsedurChange(idx, 'judulTahapan', e.target.value)}
                      placeholder="SKRINING AWAL DI LOKET PENDAFTARAN"
                      className="w-full rounded border-slate-300 bg-white p-2 border font-bold uppercase"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">Lead Time</label>
                    <input
                      type="text"
                      value={proc.leadTime}
                      onChange={(e) => handleProsedurChange(idx, 'leadTime', e.target.value)}
                      placeholder="3 Menit"
                      className="w-full rounded border-slate-300 bg-white p-2 border text-center font-medium"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-semibold text-slate-600 mb-1">
                      Pelaksana / Fungsi
                    </label>
                    <input
                      type="text"
                      value={proc.pelaksana}
                      onChange={(e) => handleProsedurChange(idx, 'pelaksana', e.target.value)}
                      placeholder="Petugas Loket / Operator APM"
                      className="w-full rounded border-slate-300 bg-white p-2 border font-medium text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-12">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-semibold text-slate-700">
                        Deskripsi Langkah-langkah Tindakan (Sub-steps):
                      </label>
                      <button
                        onClick={() => {
                          const updatedLangkah = [...proc.langkah, 'Langkah operasional selanjutnya.'];
                          handleProsedurChange(idx, 'langkah', updatedLangkah);
                        }}
                        className="text-[11px] text-emerald-700 font-bold hover:underline"
                      >
                        + Tambah Langkah
                      </button>
                    </div>

                    <div className="space-y-2">
                      {proc.langkah.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start space-x-2">
                          <span className="text-xs font-bold text-slate-500 mt-2 shrink-0">
                            {sIdx + 1}.
                          </span>
                          <textarea
                            value={step}
                            onChange={(e) => {
                              const updatedLangkah = [...proc.langkah];
                              updatedLangkah[sIdx] = e.target.value;
                              handleProsedurChange(idx, 'langkah', updatedLangkah);
                            }}
                            rows={2}
                            className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                          />
                          <button
                            onClick={() => {
                              const updatedLangkah = proc.langkah.filter((_, i) => i !== sIdx);
                              handleProsedurChange(idx, 'langkah', updatedLangkah);
                            }}
                            className="text-red-400 hover:text-red-600 p-2 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: UNIT TERKAIT & DOKUMEN PENDUKUNG */}
      {activeTab === 'unit_dokumen' && (
        <div className="space-y-6">
          {/* E. Tanggung Jawab Unit */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  E. Tanggung Jawab Unit Terkait
                </h3>
                <p className="text-xs text-slate-500">
                  Rincian tugas spesifik per instalasi / departemen dalam penerapan SPO
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onRefineSection('tanggungJawabUnit', spo.tanggungJawabUnit)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Refine AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      ...spo,
                      tanggungJawabUnit: [
                        ...spo.tanggungJawabUnit,
                        { unit: 'Unit Baru', tugas: ['Tanggung jawab operasional unit.'] },
                      ],
                    });
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Unit</span>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {spo.tanggungJawabUnit.map((unitItem, uIdx) => (
                <div key={uIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Unit #{uIdx + 1}</span>
                    <button
                      onClick={() => {
                        onChange({
                          ...spo,
                          tanggungJawabUnit: spo.tanggungJawabUnit.filter((_, i) => i !== uIdx),
                        });
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={unitItem.unit}
                      onChange={(e) => {
                        const updated = [...spo.tanggungJawabUnit];
                        updated[uIdx] = { ...updated[uIdx], unit: e.target.value };
                        onChange({ ...spo, tanggungJawabUnit: updated });
                      }}
                      placeholder="Nama Unit / Instalasi"
                      className="w-full text-xs font-bold rounded-lg border-slate-300 bg-white p-2 border"
                    />

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Daftar Butir Tugas:
                        </label>
                        <button
                          onClick={() => {
                            const updated = [...spo.tanggungJawabUnit];
                            updated[uIdx] = {
                              ...updated[uIdx],
                              tugas: [...updated[uIdx].tugas, 'Tugas operasional baru.'],
                            };
                            onChange({ ...spo, tanggungJawabUnit: updated });
                          }}
                          className="text-[10px] text-emerald-700 font-semibold hover:underline"
                        >
                          + Tambah Butir Tugas
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {unitItem.tugas.map((t, tIdx) => (
                          <div key={tIdx} className="flex items-start space-x-1.5">
                            <span className="text-[10px] text-slate-400 mt-2">○</span>
                            <textarea
                              value={t}
                              onChange={(e) => {
                                const updated = [...spo.tanggungJawabUnit];
                                const updatedTugas = [...updated[uIdx].tugas];
                                updatedTugas[tIdx] = e.target.value;
                                updated[uIdx] = { ...updated[uIdx], tugas: updatedTugas };
                                onChange({ ...spo, tanggungJawabUnit: updated });
                              }}
                              rows={2}
                              className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                            />
                            <button
                              onClick={() => {
                                const updated = [...spo.tanggungJawabUnit];
                                updated[uIdx] = {
                                  ...updated[uIdx],
                                  tugas: updated[uIdx].tugas.filter((_, i) => i !== tIdx),
                                };
                                onChange({ ...spo, tanggungJawabUnit: updated });
                              }}
                              className="text-red-400 hover:text-red-600 p-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* F. Dokumen Terkait */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  F.1 Formulir & Dokumen Terkait
                </h3>
                <p className="text-xs text-slate-500">
                  Berkas fisik, formulir resmi, atau modul sistem elektronik yang diacu
                </p>
              </div>
              <button
                onClick={() => {
                  onChange({
                    ...spo,
                    formulirPendukung: {
                      ...spo.formulirPendukung,
                      dokumenTerkait: [
                        ...spo.formulirPendukung.dokumenTerkait,
                        'Dokumen / Formulir Resmi Baru',
                      ],
                    },
                  });
                }}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Dokumen</span>
              </button>
            </div>

            <div className="space-y-2">
              {spo.formulirPendukung.dokumenTerkait.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center text-xs text-slate-500">
                  Belum ada dokumen terkait. Klik <strong>"+ Tambah Dokumen"</strong> untuk menambahkan.
                </div>
              ) : (
                spo.formulirPendukung.dokumenTerkait.map((dok, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-500 w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={dok}
                      onChange={(e) => {
                        const updated = [...spo.formulirPendukung.dokumenTerkait];
                        updated[idx] = e.target.value;
                        onChange({
                          ...spo,
                          formulirPendukung: { ...spo.formulirPendukung, dokumenTerkait: updated },
                        });
                      }}
                      className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border"
                    />
                    <button
                      onClick={() => {
                        onChange({
                          ...spo,
                          formulirPendukung: {
                            ...spo.formulirPendukung,
                            dokumenTerkait: spo.formulirPendukung.dokumenTerkait.filter((_, i) => i !== idx),
                          },
                        });
                      }}
                      className="text-red-500 hover:text-red-700 p-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* F.2 Riwayat Perubahan Dokumen */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  F.2 Riwayat Perubahan Dokumen
                </h3>
                <p className="text-xs text-slate-500">
                  Catatan kronologis tanggal terbit, nomor versi/revisi, dan uraian pembaruan SPO
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });
                  const nextVer = `Rev. ${spo.formulirPendukung.riwayatPerubahan.length}`;
                  onChange({
                    ...spo,
                    formulirPendukung: {
                      ...spo.formulirPendukung,
                      riwayatPerubahan: [
                        ...spo.formulirPendukung.riwayatPerubahan,
                        {
                          tanggal: spo.metadata.tanggalTerbit || today,
                          versi: nextVer,
                          deskripsi: 'Pembaruan / penyusunan dokumen Standar Prosedur Operasional.',
                        },
                      ],
                    },
                  });
                }}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Riwayat</span>
              </button>
            </div>

            <div className="space-y-3">
              {spo.formulirPendukung.riwayatPerubahan.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center text-xs text-slate-500">
                  Belum ada catatan riwayat perubahan. Klik <strong>"+ Tambah Riwayat"</strong> untuk menambahkan baris revisi.
                </div>
              ) : (
                spo.formulirPendukung.riwayatPerubahan.map((rev, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Riwayat #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onChange({
                            ...spo,
                            formulirPendukung: {
                              ...spo.formulirPendukung,
                              riwayatPerubahan: spo.formulirPendukung.riwayatPerubahan.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          });
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Hapus Riwayat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Tanggal</label>
                        <input
                          type="text"
                          value={rev.tanggal}
                          onChange={(e) => {
                            const updated = [...spo.formulirPendukung.riwayatPerubahan];
                            updated[idx] = { ...updated[idx], tanggal: e.target.value };
                            onChange({
                              ...spo,
                              formulirPendukung: {
                                ...spo.formulirPendukung,
                                riwayatPerubahan: updated,
                              },
                            });
                          }}
                          placeholder="Contoh: 23 Oktober 2026"
                          className="w-full rounded-lg border-slate-300 bg-white p-2 border"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Versi Dokumen</label>
                        <input
                          type="text"
                          value={rev.versi}
                          onChange={(e) => {
                            const updated = [...spo.formulirPendukung.riwayatPerubahan];
                            updated[idx] = { ...updated[idx], versi: e.target.value };
                            onChange({
                              ...spo,
                              formulirPendukung: {
                                ...spo.formulirPendukung,
                                riwayatPerubahan: updated,
                              },
                            });
                          }}
                          placeholder="Contoh: Versi 1.0 / Rev. 0"
                          className="w-full rounded-lg border-slate-300 bg-white p-2 border"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-600 mb-1">
                          Deskripsi Revisi
                        </label>
                        <textarea
                          value={rev.deskripsi}
                          onChange={(e) => {
                            const updated = [...spo.formulirPendukung.riwayatPerubahan];
                            updated[idx] = { ...updated[idx], deskripsi: e.target.value };
                            onChange({
                              ...spo,
                              formulirPendukung: {
                                ...spo.formulirPendukung,
                                riwayatPerubahan: updated,
                              },
                            });
                          }}
                          rows={2}
                          placeholder="Uraian latar belakang atau ringkasan perubahan dokumen..."
                          className="w-full rounded-lg border-slate-300 bg-white p-2 border"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
