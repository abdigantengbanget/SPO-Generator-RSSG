import React from "react";
import { SpoDocument } from "../types/spo";
import { Edit2 } from "lucide-react";
import { SpoFlowchartDocumentEmbed } from "./SpoFlowchartDocumentEmbed";
import { formatSpoVersionLabel } from "../utils/spoFormatHelper";
import { getInstitutionBranding } from "../utils/institutionBranding";

interface SpoDocumentViewProps {
  spo: SpoDocument;
  onEditSection?: (sectionId: string) => void;
  onOpenGenerateModal?: () => void;
  onSwitchToFlowchart?: () => void;
}

export const SpoDocumentView: React.FC<SpoDocumentViewProps> = ({
  spo,
  onEditSection,
  onOpenGenerateModal,
  onSwitchToFlowchart,
}) => {
  const institutionBranding = getInstitutionBranding(spo.metadata?.institusi);

  return (
    <div className="w-full flex flex-col items-center py-6 px-2 sm:px-4">
      {/* A4 Paper Container */}
      <div className="spo-print-container bg-white w-full max-w-[850px] shadow-lg border border-slate-200 print:shadow-none print:border-none p-6 sm:p-12 text-slate-900 font-sans leading-relaxed text-[13px] sm:text-[14px]">
        {/* KOP / HEADER TABLE - SESUAI STANDAR RESMI TEMPLATE RS SEMEN GRESIK / PT CIPTA NIRMALA */}
        <div className="relative group">
          {onEditSection && (
            <button
              onClick={() => onEditSection("metadata")}
              className="no-print opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-0 z-10 flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] bg-slate-800 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
              title="Edit Kop & Nomor Dokumen"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Kop</span>
            </button>
          )}
          <table className="w-full border-collapse border-2 border-black mb-6 text-slate-900 bg-white">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[26%]" />
              <col className="w-[26%]" />
              <col className="w-[26%]" />
            </colgroup>
            <tbody>
              {/* ROW 1: Logo RS Semen Gresik (rowSpan=2) & Judul SPO (colSpan=3) */}
              <tr>
                {/* Kolom 1: Logo RS Semen Gresik spanning 2 rows */}
                <td
                  rowSpan={2}
                  className="border-r-2 border-b-2 border-black p-3 text-center align-middle bg-white"
                >
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src={institutionBranding.logoPath}
                      alt={institutionBranding.alt}
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain mx-auto"
                    />
                  </div>
                </td>

                {/* Kolom 2-4: Judul Dokumen SPO */}
                <td
                  colSpan={3}
                  className="border-b-2 border-black p-3 sm:p-5 text-center align-middle"
                >
                  <h1 className="font-bold text-sm sm:text-base md:text-lg tracking-wide uppercase leading-snug">
                    {spo.judulSpo || (
                      <span className="text-slate-400 italic font-medium normal-case">
                        [Judul SPO Belum Diisi - Klik Generate SPO Baru untuk
                        membuat otomatis]
                      </span>
                    )}
                  </h1>
                </td>
              </tr>

              {/* ROW 2: No Dokumen, No Revisi, Halaman */}
              <tr className="text-center text-xs">
                {/* Kolom 2 */}
                <td className="border-r-2 border-b-2 border-black py-1.5 px-2 align-middle">
                  <div className="font-semibold text-[11px] text-slate-700">
                    No. Dokumen
                  </div>
                  <div className="font-medium text-xs sm:text-sm mt-0.5">
                    {spo.metadata.noDokumen || (
                      <span className="text-slate-400 italic">
                        [Contoh: QAP/102341/770]
                      </span>
                    )}
                  </div>
                </td>
                {/* Kolom 3 */}
                <td className="border-r-2 border-b-2 border-black py-1.5 px-2 align-middle">
                  <div className="font-semibold text-[11px] text-slate-700">
                    No. Revisi
                  </div>
                  <div className="font-medium text-xs sm:text-sm mt-0.5">
                    {spo.metadata.noRevisi || (
                      <span className="text-slate-400 italic">[Contoh: 0]</span>
                    )}
                  </div>
                </td>
                {/* Kolom 4 */}
                <td className="border-b-2 border-black py-1.5 px-2 align-middle">
                  <div className="font-semibold text-[11px] text-slate-700">
                    Halaman
                  </div>
                  <div className="font-medium text-xs sm:text-sm mt-0.5">
                    1 dari 1
                  </div>
                </td>
              </tr>

              {/* ROW 3: SPO, Tanggal terbit, Ditetapkan Kepala RS */}
              <tr className="text-xs">
                {/* Kolom 1: SPO */}
                <td className="border-r-2 border-black p-3 text-center align-middle">
                  <span className="font-black text-lg sm:text-xl tracking-widest text-slate-900 block">
                    SPO
                  </span>
                </td>

                {/* Kolom 2: Tanggal Terbit */}
                <td className="border-r-2 border-black p-2.5 text-center align-middle">
                  <div className="font-semibold text-[11px] text-slate-700">
                    Tanggal terbit
                  </div>
                  <div className="font-medium text-xs sm:text-sm mt-0.5">
                    {spo.metadata.tanggalTerbit || (
                      <span className="text-slate-400 italic">
                        [Contoh: 04 November 2026]
                      </span>
                    )}
                  </div>
                </td>

                {/* Kolom 3-4: Ditetapkan Kepala Rumah Sakit */}
                <td
                  colSpan={2}
                  className="p-3 text-center align-bottom min-h-[95px]"
                >
                  <div className="flex flex-col justify-between h-full pt-1 pb-1">
                    <div>
                      <div className="font-semibold text-[11px] text-slate-700">
                        Ditetapkan,
                      </div>
                      <div className="text-[11px] text-slate-800 font-medium">
                        {spo.metadata.kepalaRumahSakitJabatan?.trim() ||
                          "Kepala Rumah Sakit"}
                      </div>
                    </div>
                    <div className="w-full pt-10 sm:pt-12">
                      {spo.metadata.kepalaRumahSakit?.trim() ? (
                        <span className="font-bold underline text-xs sm:text-sm inline-block">
                          {spo.metadata.kepalaRumahSakit}
                        </span>
                      ) : (
                        <span className="inline-block w-44 border-b border-slate-400" />
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION A: PENGERTIAN */}
        <section className="mb-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm sm:text-base uppercase tracking-tight text-slate-900">
              A. PENGERTIAN
            </h2>
            <div className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1.5">
              {onEditSection && (
                <button
                  onClick={() => onEditSection("pengertian")}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                  title="Edit Bagian A"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-xs sm:text-sm mb-1.5 text-slate-800">
              A.1 Definisi
            </h3>
            <p className="mb-2 text-slate-700 text-justify">
              Untuk menyamakan persepsi operasional di seluruh unit, batasan
              istilah dalam prosedur ini ditetapkan sebagai berikut:
            </p>
            {spo.pengertian.definisi.length > 0 ? (
              <ol className="space-y-2 list-none pl-0">
                {spo.pengertian.definisi.map((def, idx) => (
                  <li key={idx} className="flex items-start text-justify">
                    <span className="font-semibold mr-1.5 shrink-0">
                      {idx + 1}.
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900">
                        {def.istilah}:{" "}
                      </span>
                      <span className="text-slate-800">{def.penjelasan}</span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 text-slate-500 text-xs italic">
                Contoh isi: 1. Triase Gawat Darurat: Sistem seleksi dan
                pemilahan tingkat kegawatan pasien secara cepat... (Otomatis
                terisi saat klik Generate SPO Baru)
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-xs sm:text-sm mb-1.5 text-slate-800">
              A.2 Ruang Lingkup
            </h3>
            <p className="mb-2 text-slate-700 text-justify">
              {spo.pengertian.ruangLingkup.pengantar ||
                "Prosedur ini berlaku di lingkungan Rumah Sakit dan mengikat seluruh unit pelayanan terkait:"}
            </p>
            {spo.pengertian.ruangLingkup.unitList.length > 0 ? (
              <ol className="space-y-1 list-none pl-2">
                {spo.pengertian.ruangLingkup.unitList.map((unit, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="font-medium mr-1.5 shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="text-slate-800">{unit}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 text-slate-500 text-xs italic">
                Contoh unit terkait: 1. Instalasi Gawat Darurat (IGD), 2. Rekam
                Medis & Admisi, 3. Casemix JKN...
              </div>
            )}
          </div>
        </section>

        {/* SECTION B: TUJUAN */}
        <section className="mb-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm sm:text-base uppercase tracking-tight text-slate-900">
              B. TUJUAN
            </h2>
            <div className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1.5">
              {onEditSection && (
                <button
                  onClick={() => onEditSection("tujuan_kebijakan")}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
          <p className="mb-2 text-slate-700 text-justify">
            Prosedur ini bertujuan untuk menetapkan standar operasional dalam
            mengelola dan memitigasi risiko operasional dengan sasaran:
          </p>
          {spo.tujuan.length > 0 ? (
            <ul className="space-y-2 pl-2">
              {spo.tujuan.map((tuj, idx) => (
                <li key={idx} className="flex items-start text-justify">
                  <span className="mr-2 text-slate-900 text-xs mt-1">●</span>
                  <div>
                    <span className="font-bold text-slate-900">
                      {tuj.judulTujuan}:{" "}
                    </span>
                    <span className="text-slate-800">{tuj.deskripsi}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 text-slate-500 text-xs italic">
              Contoh sasaran: ● Keselamatan Pasien: Memastikan respon tindakan
              segera &lt; 5 menit untuk kondisi darurat resusitasi...
            </div>
          )}
        </section>

        {/* SECTION C: KEBIJAKAN */}
        <section className="mb-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm sm:text-base uppercase tracking-tight text-slate-900">
              C. KEBIJAKAN
            </h2>
            <div className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1.5">
              {onEditSection && (
                <button
                  onClick={() => onEditSection("tujuan_kebijakan")}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Kebijakan</span>
                </button>
              )}
              {onEditSection && (
                <button
                  onClick={() => onEditSection("risiko")}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Risiko</span>
                </button>
              )}
            </div>
          </div>

          <div className="mb-5">
            <h3 className="font-bold text-xs sm:text-sm mb-1.5 text-slate-800">
              C.1 Ketentuan Kebijakan
            </h3>
            {spo.kebijakan.ketentuan.length > 0 ? (
              <ol className="space-y-2 list-none pl-0">
                {spo.kebijakan.ketentuan.map((ket, idx) => (
                  <li key={idx} className="flex items-start text-justify">
                    <span className="font-semibold mr-1.5 shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="text-slate-800">{ket}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 text-slate-500 text-xs italic">
                Contoh ketentuan: 1. Seluruh staf wajib patuh pada regulasi
                keselamatan pasien, 2. Verifikasi ganda untuk tindakan berisiko
                tinggi...
              </div>
            )}
          </div>

          {/* C.2 Analisis Risiko & Mitigasi Table */}
          <div className="page-break-inside-avoid">
            <h3 className="font-bold text-xs sm:text-sm mb-2 text-slate-800">
              C.2 Analisis Risiko & Mitigasi (Risk Register Operasional)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-slate-100 print:bg-transparent text-center font-bold">
                    <th className="border border-black p-2 w-[8%]">KODE</th>
                    <th className="border border-black p-2 w-[22%]">
                      PROSES / AKTIVITAS
                    </th>
                    <th className="border border-black p-2 w-[20%]">
                      NAMA RISIKO
                    </th>
                    <th className="border border-black p-2 w-[25%]">
                      DESKRIPSI RISIKO
                    </th>
                    <th className="border border-black p-2 w-[25%]">
                      PENGENDALIAN RISIKO / MITIGASI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {spo.kebijakan.riskRegister.length > 0 ? (
                    spo.kebijakan.riskRegister.map((risk, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="border border-black p-2 text-center font-bold">
                          {risk.kode}
                        </td>
                        <td className="border border-black p-2 font-medium">
                          {risk.proses}
                        </td>
                        <td className="border border-black p-2 font-semibold">
                          {risk.namaRisiko}
                        </td>
                        <td className="border border-black p-2 text-justify">
                          {risk.deskripsiRisiko}
                        </td>
                        <td className="border border-black p-2 text-justify">
                          <ol className="list-decimal pl-3 space-y-1">
                            {risk.mitigasi.map((m, mIdx) => (
                              <li key={mIdx}>{m}</li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-3 text-center text-slate-400 italic border border-black bg-slate-50/50"
                      >
                        [Tabel Risk Register akan otomatis tersusun setelah
                        dokumen di-generate]
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION D: PROSEDUR PELAKSANAAN */}
        <section className="mb-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm sm:text-base uppercase tracking-tight text-slate-900">
              D. PROSEDUR PELAKSANAAN
            </h2>
            <div className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1.5">
              {onEditSection && (
                <button
                  onClick={() => onEditSection("prosedur")}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Prosedur</span>
                </button>
              )}
            </div>
          </div>
          <h3 className="font-bold text-xs sm:text-sm mb-2 text-slate-800">
            D.1 Uraian Alur Prosedur Operasional
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-slate-100 print:bg-transparent text-center font-bold">
                  <th className="border border-black p-2 w-[10%]">
                    NO. PROSES
                  </th>
                  <th className="border border-black p-2 w-[52%]">
                    TAHAPAN & DESKRIPSI KEGIATAN
                  </th>
                  <th className="border border-black p-2 w-[14%]">LEAD TIME</th>
                  <th className="border border-black p-2 w-[24%]">
                    PELAKSANA / FUNGSI
                  </th>
                </tr>
              </thead>
              <tbody>
                {spo.prosedur.length > 0 ? (
                  spo.prosedur.map((proc, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="border border-black p-2 text-center font-bold">
                        {proc.noProses}
                      </td>
                      <td className="border border-black p-2 text-justify">
                        <div className="font-bold uppercase tracking-wide mb-1.5 text-slate-900">
                          {proc.judulTahapan}
                        </div>
                        <ol className="list-decimal pl-4 space-y-1 text-slate-800">
                          {proc.langkah.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ol>
                      </td>
                      <td className="border border-black p-2 text-center font-medium">
                        {proc.leadTime}
                      </td>
                      <td className="border border-black p-2">
                        <span className="font-medium text-slate-800">
                          {proc.pelaksana}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-3 text-center text-slate-400 italic border border-black bg-slate-50/50"
                    >
                      [Tabel Alur Prosedur & Lead Time akan otomatis tersusun
                      setelah dokumen di-generate]
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* D.2 DIAGRAM ALUR PELAYANAN (FLOWCHART BPMN) */}
          <SpoFlowchartDocumentEmbed
            spo={spo}
            onSwitchToFlowchart={onSwitchToFlowchart}
          />
        </section>

        {/* SECTION E: TANGGUNG JAWAB UNIT TERKAIT */}
        <section className="mb-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm sm:text-base uppercase tracking-tight text-slate-900">
              E. TANGGUNG JAWAB UNIT TERKAIT
            </h2>
            <div className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1.5">
              {onEditSection && (
                <button
                  onClick={() => onEditSection("unit_dokumen")}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
          {spo.tanggungJawabUnit.length > 0 ? (
            <ol className="space-y-3 list-none pl-0">
              {spo.tanggungJawabUnit.map((unitItem, idx) => (
                <li key={idx} className="text-justify">
                  <div className="font-bold text-slate-900 mb-1">
                    {idx + 1}. {unitItem.unit}:
                  </div>
                  <ul className="pl-4 space-y-1">
                    {unitItem.tugas.map((tugas, tIdx) => (
                      <li
                        key={tIdx}
                        className="flex items-start text-slate-800"
                      >
                        <span className="mr-2 text-slate-500">○</span>
                        <span>{tugas}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : (
            <div className="p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 text-slate-500 text-xs italic">
              Contoh: 1. Unit Pelaksana Medis: Bertanggung jawab melaksanakan
              tindakan teknis sesuai SPO...
            </div>
          )}
        </section>

        {/* SECTION F: FORMULIR & DOKUMEN PENDUKUNG */}
        <section className="mb-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm sm:text-base uppercase tracking-tight text-slate-900">
              F. FORMULIR & DOKUMEN PENDUKUNG
            </h2>
            {onEditSection && (
              <button
                onClick={() => onEditSection("unit_dokumen")}
                className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Dokumen & Riwayat</span>
              </button>
            )}
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-xs sm:text-sm mb-1.5 text-slate-800">
              F.1 Dokumen Terkait
            </h3>
            {spo.formulirPendukung.dokumenTerkait.length > 0 ? (
              <ol className="space-y-1 list-none pl-0">
                {spo.formulirPendukung.dokumenTerkait.map((dok, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="font-medium mr-1.5 shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="text-slate-800">{dok}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 text-slate-500 text-xs italic">
                [Daftar dokumen terkait akan otomatis terisi setelah dokumen
                di-generate atau ditambah lewat menu Edit]
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-xs sm:text-sm mb-2 text-slate-800">
              F.2 Riwayat Perubahan Dokumen
            </h3>
            <table className="w-full border-collapse border-2 border-black text-xs">
              <thead>
                <tr className="bg-slate-50 print:bg-transparent text-center font-bold border-b-2 border-black">
                  <th className="border-2 border-black p-2.5 w-[25%] font-bold text-slate-900">
                    Tanggal
                  </th>
                  <th className="border-2 border-black p-2.5 w-[25%] font-bold text-slate-900">
                    Versi Dokumen
                  </th>
                  <th className="border-2 border-black p-2.5 w-[50%] font-bold text-slate-900">
                    Deskripsi Revisi
                  </th>
                </tr>
              </thead>
              <tbody>
                {spo.formulirPendukung.riwayatPerubahan.length > 0 ? (
                  spo.formulirPendukung.riwayatPerubahan.map((rev, idx) => (
                    <tr
                      key={idx}
                      className="align-top border-b-2 border-black last:border-b-0"
                    >
                      <td className="border-2 border-black p-2.5 text-center font-medium">
                        {rev.tanggal || "-"}
                      </td>
                      <td className="border-2 border-black p-2.5 text-center font-medium">
                        {rev.versi || "-"}
                      </td>
                      <td className="border-2 border-black p-2.5 text-justify">
                        {rev.deskripsi || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="align-top border-b-2 border-black last:border-b-0">
                    <td className="border-2 border-black p-2.5 text-center font-medium">
                      {spo.metadata.tanggalTerbit || "-"}
                    </td>
                    <td className="border-2 border-black p-2.5 text-center font-medium">
                      {formatSpoVersionLabel(spo.metadata.noRevisi)}
                    </td>
                    <td className="border-2 border-black p-2.5 text-justify">
                      Penyusunan perdana dokumen Standar Prosedur Operasional
                      (SPO).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* LEMBAR PENGESAHAN DOKUMEN */}
        <section className="mt-8 page-break-inside-avoid relative group">
          <div className="flex items-center justify-between mb-2">
            <div className="text-center w-full font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900">
              LEMBAR PENGESAHAN DOKUMEN
            </div>
            {onEditSection && (
              <button
                onClick={() => onEditSection("metadata")}
                className="no-print opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                title="Edit Nama & Jabatan Pengesahan"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Pengesahan</span>
              </button>
            )}
          </div>

          <table className="w-full border-collapse border-2 border-black text-xs table-fixed">
            <thead>
              <tr className="bg-slate-50 print:bg-transparent text-center font-bold border-b-2 border-black">
                <th className="border-r-2 border-black p-2.5 w-1/3 text-xs sm:text-sm uppercase tracking-wide">
                  Drafter
                </th>
                <th className="border-r-2 border-black p-2.5 w-1/3 text-xs sm:text-sm uppercase tracking-wide">
                  Creator
                </th>
                <th className="p-2.5 w-1/3 text-xs sm:text-sm uppercase tracking-wide">
                  Reviewer
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {/* Drafter */}
                <td className="border-r-2 border-black p-4 text-center align-bottom h-40">
                  <div className="pt-16 pb-1">
                    {spo.metadata.drafter.nama?.trim() ? (
                      <div className="font-bold underline text-xs sm:text-sm text-slate-900 leading-snug">
                        {spo.metadata.drafter.nama}
                      </div>
                    ) : (
                      <div className="border-b border-slate-400 w-36 mx-auto mb-1" />
                    )}
                    <div className="text-slate-700 text-[11px] mt-1 font-medium leading-tight">
                      ({spo.metadata.drafter.jabatan || "Drafter"})
                    </div>
                  </div>
                </td>

                {/* Creator */}
                <td className="border-r-2 border-black p-4 text-center align-bottom h-40">
                  <div className="pt-16 pb-1">
                    {spo.metadata.creator.nama?.trim() ? (
                      <div className="font-bold underline text-xs sm:text-sm text-slate-900 leading-snug">
                        {spo.metadata.creator.nama}
                      </div>
                    ) : (
                      <div className="border-b border-slate-400 w-36 mx-auto mb-1" />
                    )}
                    <div className="text-slate-700 text-[11px] mt-1 font-medium leading-tight">
                      ({spo.metadata.creator.jabatan || "Creator"})
                    </div>
                  </div>
                </td>

                {/* Reviewer */}
                <td className="p-4 text-center align-bottom h-40">
                  <div className="pt-16 pb-1">
                    {spo.metadata.reviewer.nama?.trim() ? (
                      <div className="font-bold underline text-xs sm:text-sm text-slate-900 leading-snug">
                        {spo.metadata.reviewer.nama}
                      </div>
                    ) : (
                      <div className="border-b border-slate-400 w-36 mx-auto mb-1" />
                    )}
                    <div className="text-slate-700 text-[11px] mt-1 font-medium leading-tight">
                      ({spo.metadata.reviewer.jabatan || "Reviewer"})
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};
