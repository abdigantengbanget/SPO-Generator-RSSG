import { SpoDocument, DefinisiItem, RiskRegisterItem, ProsedurItem, TanggungJawabUnitItem, AlurNode } from '../types/spo';
import { buildFlowchartModelFromSpo } from './flowchartHelper';
import { normalizeRiwayatPerubahan } from './spoFormatHelper';

interface GenerateOptions {
  judul: string;
  institusi?: string;
  noDokumen?: string;
  noRevisi?: string;
  tanggalTerbit?: string;
  kepalaRumahSakit?: string;
  drafterNama?: string;
  drafterJabatan?: string;
  creatorNama?: string;
  creatorJabatan?: string;
  reviewerNama?: string;
  reviewerJabatan?: string;
  konteksTambahan?: string;
  unitTerkait?: string;
}

export function generateSmartSpoDocument(opts: GenerateOptions): SpoDocument {
  const judul = (opts.judul || 'PROSEDUR OPERASIONAL STANDAR').trim().toUpperCase();
  const lowerJudul = judul.toLowerCase();
  const institusi = opts.institusi || 'RUMAH SAKIT SEMEN GRESIK / PT CIPTA NIRMALA';

  // Domain categorization based on keywords
  const isBpjOrKlaim = lowerJudul.includes('bpjs') || lowerJudul.includes('klaim') || lowerJudul.includes('tlb') || lowerJudul.includes('rehabilitasi') || lowerJudul.includes('fisioterapi');
  const isIgdOrTriase = lowerJudul.includes('igd') || lowerJudul.includes('gawat') || lowerJudul.includes('darurat') || lowerJudul.includes('triase') || lowerJudul.includes('esi');
  const isFarmasiOrObat = lowerJudul.includes('farmasi') || lowerJudul.includes('obat') || lowerJudul.includes('high alert') || lowerJudul.includes('lasa') || lowerJudul.includes('resep');
  const isCodeBlue = lowerJudul.includes('code blue') || lowerJudul.includes('henti jantung') || lowerJudul.includes('resusitasi') || lowerJudul.includes('rjp') || lowerJudul.includes('bhd');
  const isAdmisiOrRanap = lowerJudul.includes('admisi') || lowerJudul.includes('rawat inap') || lowerJudul.includes('sep') || lowerJudul.includes('tpprj') || lowerJudul.includes('pendaftaran');
  const isBedahOrOk = lowerJudul.includes('bedah') || lowerJudul.includes('operasi') || lowerJudul.includes('anestesi') || lowerJudul.includes('surgical');
  const isPpiOrInfeksi = lowerJudul.includes('ppi') || lowerJudul.includes('infeksi') || lowerJudul.includes('cuci tangan') || lowerJudul.includes('apd') || lowerJudul.includes('sterilisasi');

  const isDefaultRehabDrafter = opts.drafterNama === 'Hana Thriesminarsih, S.Kes';
  const isDefaultRehabCreator = opts.creatorNama === 'dr. Achmad Farid, Sp.KFR';
  const isDefaultRehabDocNo = opts.noDokumen === 'QAP/102341/770';

  const deptCode = isIgdOrTriase ? 'IGD' : isFarmasiOrObat ? 'FAR' : isCodeBlue ? 'CBL' : isAdmisiOrRanap ? 'ADM' : isBedahOrOk ? 'IBS' : isPpiOrInfeksi ? 'PPI' : isBpjOrKlaim ? 'QAP' : 'MED';
  const noDokumen = (!isBpjOrKlaim && isDefaultRehabDocNo) || !opts.noDokumen
    ? `SPO/${deptCode}/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`
    : opts.noDokumen;

  const noRevisi = opts.noRevisi || '0';
  const tanggalTerbit = opts.tanggalTerbit || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const kepalaRumahSakit = opts.kepalaRumahSakit || 'dr. Tolib Bahasuan';

  // Specific definitions
  let definisi: DefinisiItem[] = [];
  let unitList: string[] = [];
  let riskRegister: RiskRegisterItem[] = [];
  let prosedur: ProsedurItem[] = [];
  let tanggungJawabUnit: TanggungJawabUnitItem[] = [];
  let dokumenTerkait: string[] = [];
  let alurFlowchart: AlurNode[] = [];

  let drafterDefault = {
    nama: (!isBpjOrKlaim && isDefaultRehabDrafter ? '' : opts.drafterNama) || 'Tim Penyusun Standar SPO',
    jabatan: (!isBpjOrKlaim && isDefaultRehabDrafter ? '' : opts.drafterJabatan) || 'Karu Pelayanan & Asuhan'
  };
  let creatorDefault = {
    nama: (!isBpjOrKlaim && isDefaultRehabCreator ? '' : opts.creatorNama) || 'dr. Penanggung Jawab Pelayanan',
    jabatan: (!isBpjOrKlaim && isDefaultRehabCreator ? '' : opts.creatorJabatan) || 'Ka. Instalasi Pelayanan Terkait'
  };
  let reviewerDefault = {
    nama: opts.reviewerNama || 'Nanang Judianto, SE',
    jabatan: opts.reviewerJabatan || 'Pgs. Manajer SMI'
  };

  if (isIgdOrTriase) {
    drafterDefault = {
      nama: (!opts.drafterNama || isDefaultRehabDrafter) ? 'Ns. Hendra Prasetyo, S.Kep' : opts.drafterNama,
      jabatan: (!opts.drafterJabatan || isDefaultRehabDrafter) ? 'Kepala Ruangan IGD' : opts.drafterJabatan,
    };
    creatorDefault = {
      nama: (!opts.creatorNama || isDefaultRehabCreator) ? 'dr. Budi Setiawan, Sp.EM' : opts.creatorNama,
      jabatan: (!opts.creatorJabatan || isDefaultRehabCreator) ? 'Ka. Instalasi Gawat Darurat' : opts.creatorJabatan,
    };
    reviewerDefault = {
      nama: opts.reviewerNama || 'dr. Ratna Juwita, MARS',
      jabatan: opts.reviewerJabatan || 'Manajer Pelayanan Medis',
    };

    definisi = [
      { istilah: 'Triase Gawat Darurat', penjelasan: 'Proses pemilahan dan pengelompokan tingkat kegawatan pasien berdasarkan derajat urgensi klinis dan ancaman jiwa untuk menentukan prioritas kecepatan penanganan medis.' },
      { istilah: 'Emergency Severity Index (ESI)', penjelasan: 'Sistem algoritma triase 5 level yang menilai derajat kegawatan pasien berdasarkan ancaman organ vital serta estimasi kebutuhan sumber daya diagnostik/terapeutik.' },
      { istilah: 'True Emergency vs False Emergency', penjelasan: 'Kategori penilaian kelayakan klinis kegawatdaruratan sesuai kriteria penjaminan kesehatan nasional (Permenkes & BPJS) untuk kepastian penjaminan klaim.' },
      { istilah: 'Response Time Triase', penjelasan: 'Batas toleransi waktu maksimal sejak pasien tiba di pintu IGD (door) hingga dilakukan pemeriksaan triase primer oleh dokter/perawat terlatih (maksimal ≤ 2 menit).' },
      { istilah: 'Ruang Resusitasi (Level 1 ESI)', penjelasan: 'Zona tindakan penanganan prioritas tertinggi dengan fasilitas pemantauan invasif, defibrilator, dan ventilator untuk pasien dengan henti jantung atau ancaman jalan napas.' },
      { istilah: 'Rekam Medis Elektronik (RME) IGD', penjelasan: 'Modul sistem informasi pencatatan asesmen awal gawat darurat, tanda-tanda vital real-time, dan status penjaminan pasien secara terintegrasi.' },
    ];

    unitList = [
      'Instalasi Gawat Darurat (Dokter Jaga & Tim Perawat Triase).',
      'Tempat Pendaftaran Pasien Gawat Darurat (TPPGD).',
      'Instalasi Radiologi & Laboratorium Cito.',
      'Instalasi Farmasi Depo IGD.',
      'Unit Perawatan Intensif (ICU / HCU) & Kamar Operasi Cito.',
      'Tim Casemix & Verifikator Klaim JKN.',
    ];

    riskRegister = [
      {
        kode: 'R1',
        proses: 'Skrining Awal & Asesmen Visual Door-to-Doctor',
        namaRisiko: 'Under-Triage (Penetapan Kategori Kegawatan Lebih Rendah)',
        deskripsiRisiko: 'Pasien dengan kondisi kegawatan terselubung (seperti sindrom koroner akut atipikal) salah diposisikan ke zona non-kritis sehingga terjadi keterlambatan tindakan.',
        mitigasi: [
          'Wajibkan penilaian tanda vital lengkap (GCS, Tekanan Darah, Nadi, SpO2, Pernapasan) dalam < 5 menit.',
          'Sertifikasi pelatihan triase ATS/ESI berkala bagi seluruh perawat IGD.',
          'Konfigurasi alert sistem skor EWS (Early Warning Score) otomatis pada SIMRS.',
        ],
      },
      {
        kode: 'R2',
        proses: 'Pemberian Terapi & Pemeriksaan Penunjang Cito',
        namaRisiko: 'Waktu Tunggu Penunjang Melebihi Standar (Bottleneck Laboratorium/Radiologi)',
        deskripsiRisiko: 'Keterlambatan hasil pemeriksaan penunjang kritis menghambat keputusan rawat inap atau intervensi bedah cito.',
        mitigasi: [
          'Terapkan jalur Fast Track sampel Cito berlabel merah.',
          'Notifikasi otomatis via bridging SIMRS ke dokter penanggung jawab ketika hasil lab keluar.',
          'Audit harian response time laboratorium dan radiologi IGD oleh Komite Mutu.',
        ],
      },
      {
        kode: 'R3',
        proses: 'Administrasi & Verifikasi Penjaminan Pasien',
        namaRisiko: 'Diskualifikasi Penjaminan Klaim Akibat Ketidaklengkapan Asesmen Gawat Darurat',
        deskripsiRisiko: 'Klaim IGD berisiko ditolak (TLB) apabila rekam medis tidak mencantumkan parameter kriteria gawat darurat yang divalidasi BPJS.',
        mitigasi: [
          'Wajibkan pengisian formulir resume IGD terstandar dengan checklist kriteria Permenkes.',
          'Verifikasi real-time oleh petugas administrasi sebelum penerbitan SEP Gawat Darurat.',
        ],
      },
    ];

    prosedur = [
      {
        noProses: '5.1',
        judulTahapan: 'Penerimaan Pasien & Asesmen Triase Primer',
        langkah: [
          'Perawat triase menyambut pasien di pintu masuk IGD dan melakukan asesmen visual cepat (Eye-ball assessment).',
          'Lakukan pemeriksaan Airway, Breathing, Circulation, Disability, dan Exposure dalam kurun waktu < 2 menit.',
          'Tentukan kategori ESI (Level 1 s.d. Level 5) dan arahkan pasien ke zona perawatan yang tepat (Merah, Kuning, atau Hijau).',
        ],
        leadTime: '≤ 2 Menit',
        pelaksana: 'Perawat Triase IGD',
      },
      {
        noProses: '5.2',
        judulTahapan: 'Stabilisasi & Pemeriksaan Dokter Jaga IGD',
        langkah: [
          'Dokter jaga IGD melakukan pemeriksaan fisik terfokus dan stabilisasi hemodinamik seketika.',
          'Untuk pasien Level 1, aktifkan tim resusitasi dan pasang monitor tanda vital kontinu.',
          'Dokter menginput data anamnesis, pemeriksaan fisik, dan diagnosis kerja ke RME IGD.',
        ],
        leadTime: '5 - 15 Menit',
        pelaksana: 'Dokter Jaga IGD & Tim Perawat',
      },
      {
        noProses: '5.3',
        judulTahapan: 'Permintaan Pemeriksaan Penunjang Cito & Terapi Awal',
        langkah: [
          'Dokter meresepkan order pemeriksaan laboratorium (darah rutin, elektrolit, enzim jantung) dan radiologi cito.',
          'Perawat mengambil sampel darah dan mengirimkan dengan penanda status Cito.',
          'Petugas farmasi IGD menyiapkan obat-obatan injeksi dan emergensi sesuai instruksi dokter.',
        ],
        leadTime: '10 - 20 Menit',
        pelaksana: 'Dokter Jaga, Analis Lab, Radiografer, Farmasis',
      },
      {
        noProses: '5.4',
        judulTahapan: 'Penetapan Disposisi Akhir (Rawat Inap / Pulang / Rujuk)',
        langkah: [
          'Dokter mengkaji hasil pemeriksaan penunjang dan melakukan konsultasi dengan DPJP konsulen jika diperlukan.',
          'Tetapkan keputusan klinis: observasi lanjutan, alih rawat inap (transfer ruang intensif/biasa), tindakan bedah cito, atau pemulangan dengan edukasi.',
          'Petugas admisi memproses alokasi tempat tidur rawat inap atau kelengkapan administrasi SEP/klaim penjamin.',
        ],
        leadTime: '30 - 60 Menit',
        pelaksana: 'Dokter Jaga IGD & Petugas Admisi',
      },
    ];

    tanggungJawabUnit = [
      { unit: 'Instalasi Gawat Darurat', tugas: ['Melaksanakan triase akurat sesuai SOP.', 'Menjamin kepatuhan response time pelayanan.', 'Mendokumentasikan seluruh asesmen pada RME.'] },
      { unit: 'Instalasi Laboratorium & Radiologi', tugas: ['Memvalidasi sampel cito dalam waktu kurang dari standar maksimum.', 'Menyampaikan nilai kritis (critical value) via telepon seketika.'] },
      { unit: 'Instalasi Farmasi Depo IGD', tugas: ['Memastikan ketersediaan troli emergensi selalu tersegel dan siap pakai.', 'Melakukan penyerahan obat emergensi tanpa hambatan birokrasi.'] },
      { unit: 'Tim Casemix & Admisi', tugas: ['Memvalidasi keabsahan dokumen penjaminan pasien gawat darurat.', 'Mencegah timbulnya klaim tidak layak bayar dengan monitoring kriteria kegawatan.'] },
    ];

    dokumenTerkait = [
      'Formulir Lembar Triase IGD Terintegrasi',
      'Modul RME Asesmen Medis & Keperawatan Gawat Darurat',
      'Buku Log Registrasi Pasien Emergency & Nilai Kritis',
      'Surat Elegibilitas Peserta (SEP) Gawat Darurat',
      'SOP Transfer Pasien Intra-Rumah Sakit',
    ];
  } else if (isFarmasiOrObat) {
    drafterDefault = { nama: opts.drafterNama || 'Apt. Dwi Lestari, S.Farm', jabatan: opts.drafterJabatan || 'Koordinator Farmasi Klinis' };
    creatorDefault = { nama: opts.creatorNama || 'Apt. Agus Purwanto, M.Farm', jabatan: opts.creatorJabatan || 'Ka. Instalasi Farmasi' };
    reviewerDefault = { nama: opts.reviewerNama || 'Nanang Judianto, SE', jabatan: opts.reviewerJabatan || 'Pgs. Manajer SMI' };

    definisi = [
      { istilah: 'High Alert Medications (HAM)', penjelasan: 'Obat-obatan yang memiliki risiko tinggi menyebabkan cedera serius atau fatal pada pasien apabila terjadi kesalahan dalam proses peresepan, penyiapan, atau pemberian.' },
      { istilah: 'LASA (Look Alike Sound Alike) / NORUM', penjelasan: 'Obat yang memiliki kemiripan nama bunyi pengucapan atau rupa kemasan fisik yang berisiko tertukar jika tidak diberikan penandaan khusus.' },
      { istilah: 'Double-Checking (Verifikasi Ganda)', penjelasan: 'Prosedur pemeriksaan independen oleh dua tenaga kesehatan profesional yang berbeda terhadap kesesuaian 5 Benar pemberian obat sebelum obat diserahkan/diberikan.' },
      { istilah: 'Elektrolit Konsentrat Tinggi', penjelasan: 'Sediaan larutan pekat (seperti KCl 7.46%, NaCl 3%, MgSO4 40%) yang dilarang disimpan di unit perawatan umum kecuali di ruang perawatan intensif dengan akses terkunci.' },
      { istilah: 'Pelabelan Khusus HAM', penjelasan: 'Pemberian stiker neon mencolok berlabel "HIGH ALERT" dan "LASA" pada wadah primer dan sekunder obat.' },
      { istilah: 'E-Prescribing & Clinical Decision Support', penjelasan: 'Sistem peresepan elektronik yang dilengkapi fitur peringatan interaksi obat, dosis maksimal, dan duplikasi terapi secara real-time.' },
    ];

    unitList = [
      'Instalasi Farmasi (Gudang Farmasi, Depo Rawat Jalan, Depo Rawat Inap, Depo IGD/ICU).',
      'Seluruh Ruang Perawatan Rawat Inap & Intensif (ICU/HCU/NICU).',
      'Kamar Operasi & Instalasi Rawat Jalan.',
      'Komite Farmasi dan Terapi (KFT).',
      'Komite Keselamatan Pasien Rumah Sakit (KKPRS).',
    ];

    riskRegister = [
      {
        kode: 'R1',
        proses: 'Penyimpanan & Pengelolaan Stok Obat di Ruang Perawatan',
        namaRisiko: 'Penyimpanan Elektrolit Pekat di Luar Lemari Khusus Terkunci',
        deskripsiRisiko: 'Elektrolit konsentrat tinggi tersimpan bebas di trolley obat biasa yang berpotensi menyebabkan pemberian langsung tanpa pengenceran.',
        mitigasi: [
          'Terapkan kebijakan larangan penyimpanan elektrolit pekat di ruang rawat biasa.',
          'Penyimpanan di ICU wajib dalam lemari terkunci ganda (double-lock) berlabel merah terang.',
          'Inspeksi keselamatan mingguan oleh apoteker pengawas ruang.',
        ],
      },
      {
        kode: 'R2',
        proses: 'Penyiapan & Pelabelan Obat LASA di Depo Farmasi',
        namaRisiko: 'Obat Tertukar Akibat Kemasan Mirip',
        deskripsiRisiko: 'Petugas farmasi keliru mengambil obat LASA karena penataan berdampingan tanpa jeda pembatas visual.',
        mitigasi: [
          'Terapkan metode Tall-Man Lettering pada sistem SIMRS dan rak penyimpanan (contoh: hidrOXYzine vs hydrALAZINE).',
          'Beri jeda minimal 1 baris antar obat LASA pada rak obat.',
          'Wajibkan scan barcode obat sebelum verifikasi akhir.',
        ],
      },
      {
        kode: 'R3',
        proses: 'Pemberian Obat kepada Pasien di Ruang Rawat',
        namaRisiko: 'Kesalahan Dosis / Laju Kecepatan Infus Obat Sitotoksik/Inotropik',
        deskripsiRisiko: 'Kesalahan pengaturan laju syring pump/infusion pump mengakibatkan overdosis zat vasoaktif.',
        mitigasi: [
          'Wajibkan verifikasi ganda independen oleh 2 perawat yang membubuhkan paraf pada formulir pemberian obat.',
          'Penggunaan smart infusion pump dengan batasan dosis (dose error reduction system).',
        ],
      },
    ];

    prosedur = [
      {
        noProses: '5.1',
        judulTahapan: 'Penerimaan Resep & Skrining Farmasi Klinis',
        langkah: [
          'Apoteker menerima resep elektronik atau manual dan melakukan skrining administratif, farmasetik, dan klinis.',
          'Pastikan tidak ada singkatan yang dilarang, cek dosis terapeutik, riwayat alergi, dan interaksi obat.',
          'Jika ditemukan ketidakjelasan dosis, apoteker wajib konfirmasi langsung ke dokter penulis resep sebelum obat diproses.',
        ],
        leadTime: '5 - 10 Menit',
        pelaksana: 'Apoteker Farmasi Klinis',
      },
      {
        noProses: '5.2',
        judulTahapan: 'Penyiapan & Pelabelan Khusus (Label Merah / LASA)',
        langkah: [
          'Tenaga Teknis Kefarmasian mengambil obat dari rak berlabel khusus High Alert atau LASA.',
          'Lakukan pencocokan nama generik, bentuk sediaan, kekuatan dosis, dan tanggal kedaluwarsa.',
          'Tempelkan stiker bertuliskan "HIGH ALERT" merah terang atau label LASA warna kuning pada kemasan obat.',
        ],
        leadTime: '5 - 10 Menit',
        pelaksana: 'Tenaga Teknis Kefarmasian (TTK)',
      },
      {
        noProses: '5.3',
        judulTahapan: 'Verifikasi Ganda (Double-Check) di Instalasi Farmasi',
        langkah: [
          'Apoteker kedua melakukan pemeriksaan ulang secara terpisah terhadap kesesuaian etiket dengan fisik obat.',
          'Bubuhkan tanda tangan/paraf verifikasi ganda pada lembar telaah obat sebelum penyerahan.',
        ],
        leadTime: '3 - 5 Menit',
        pelaksana: 'Apoteker Verifikator',
      },
      {
        noProses: '5.4',
        judulTahapan: 'Penyerahan & Verifikasi Ganda Sebelum Pemberian ke Pasien',
        langkah: [
          'Sebelum obat diinjeksikan atau diberikan, dua perawat melakukan verifikasi ganda di sisi ranjang pasien (bedside double-check).',
          'Pastikan 7 Benar: Benar Pasien (konfirmasi nama & tanggal lahir), Benar Obat, Benar Dosis, Benar Rute, Benar Waktu, Benar Dokumentasi, Benar Informasi.',
          'Dokumentasikan pelaksanaan pemberian obat pada Catatan Pengobatan Pasien Terintegrasi (CPPT) di RME.',
        ],
        leadTime: '5 - 10 Menit',
        pelaksana: 'Perawat Penanggung Jawab Asuhan (PPJA) & Perawat Saksi',
      },
    ];

    tanggungJawabUnit = [
      { unit: 'Instalasi Farmasi', tugas: ['Mengelola pengadaan, pelabelan, dan penyimpanan obat High Alert sesuai regulasi.', 'Melakukan skrining resep dan audit kepatuhan double-checking.'] },
      { unit: 'Instalasi Rawat Inap & ICU', tugas: ['Melakukan bedside double-checking saat administrasi obat.', 'Melaporkan insiden nyaris cedera (near miss) obat ke KKPRS dalam 2x24 jam.'] },
      { unit: 'Komite Farmasi dan Terapi (KFT)', tugas: ['Meninjau dan memperbarui daftar obat High Alert dan LASA rumah sakit setiap tahun.'] },
      { unit: 'Komite Keselamatan Pasien (KKPRS)', tugas: ['Menganalisis laporan Medication Error dan memfasilitasi Root Cause Analysis (RCA).'] },
    ];

    dokumenTerkait = [
      'Daftar Resmi Obat High Alert & LASA Rumah Sakit',
      'Lembar Telaah Resep & Formulir Verifikasi Ganda Farmasi',
      'Catatan Pengobatan Pasien Terintegrasi (CPPT) RME',
      'Formulir Pelaporan Insiden Keselamatan Pasien (IKP)',
      'Panduan Pengenceran Obat Konsentrat Tinggi',
    ];
  } else if (isCodeBlue) {
    drafterDefault = { nama: opts.drafterNama || 'dr. Alamsyah Pratama', jabatan: opts.drafterJabatan || 'Ketua Tim Code Blue' };
    creatorDefault = { nama: opts.creatorNama || 'dr. Syaiful Anwar, Sp.An-TI', jabatan: opts.creatorJabatan || 'Ka. Instalasi Anestesi & ICU' };
    reviewerDefault = { nama: opts.reviewerNama || 'Nanang Judianto, SE', jabatan: opts.reviewerJabatan || 'Pgs. Manajer SMI' };

    definisi = [
      { istilah: 'Code Blue', penjelasan: 'Kode darurat medis rumah sakit yang menandakan adanya kondisi henti jantung (cardiac arrest) atau henti napas (respiratory arrest) yang mengancam nyawa pasien, pengunjung, atau staf di lingkungan rumah sakit.' },
      { istilah: 'Tim Reaksi Cepat (Code Blue Team)', penjelasan: 'Tim multidisiplin terlatih Advanced Cardiac Life Support (ACLS) yang terdiri dari dokter anestesi/jaga, perawat ICU, dan perawat terlatih yang siaga 24 jam dengan response time target ≤ 5 menit.' },
      { istilah: 'Resusitasi Jantung Paru (RJP) Kualitas Tinggi', penjelasan: 'Kompresi dada dengan kedalaman 5-6 cm, kecepatan 100-120x/menit, recoil dada penuh, meminimalkan interupsi (< 10 detik), dan ventilasi adekuat.' },
      { istilah: 'Automated External Defibrillator (AED) / Defibrilator Manual', penjelasan: 'Alat terapi listrik kejut jantung untuk menghentikan aritmia letal (Ventricular Fibrillation / Pulseless Ventricular Tachycardia).' },
      { istilah: 'Emergency Call Center (Paging System)', penjelasan: 'Sistem terpusat sambungan telepon darurat khusus (contoh: ext 118/777) dan pengeras suara publik rumah sakit untuk mengaktifkan kode darurat.' },
      { istilah: 'Post-Cardiac Arrest Care', penjelasan: 'Rangkaian tindakan stabilisasi pasca kembalinya sirkulasi spontan (ROSC) yang dilakukan di ruang perawatan intensif.' },
    ];

    unitList = [
      'Tim Code Blue Rumah Sakit (Dokter Jaga & Tim Perawat Intensif).',
      'Sentral Operator / Paging System RS.',
      'Seluruh Unit Rawat Inap, Rawat Jalan, dan Area Publik RS.',
      'Instalasi Perawatan Intensif (ICU/ICCU).',
      'Komite Medik & Diklat Keperawatan (Pelatihan BHD/ACLS).',
    ];

    riskRegister = [
      {
        kode: 'R1',
        proses: 'Aktivasi Panggilan Darurat Code Blue',
        namaRisiko: 'Keterlambatan Panggilan Akibat Saluran Telepon Sibuk / Informasi Lokasi Tidak Jelas',
        deskripsiRisiko: 'Penemu korban panik dan salah menyebutkan nama lantai atau ruangan sehingga tim code blue salah sasaran.',
        mitigasi: [
          'Gunakan nomor extension tunggal darurat khusus (dedicated line) bebas hambatan.',
          'Format laporan baku: "Code Blue - Lantai - Ruangan - Nomor Bed" diulang 3 kali.',
          'Simulasi drill code blue tanpa pemberitahuan setiap 3 bulan.',
        ],
      },
      {
        kode: 'R2',
        proses: 'Kesiapan Peralatan Trolley Emergensi & Defibrilator',
        namaRisiko: 'Baterai Defibrilator Habis / Obat Emergensi Kedaluwarsa',
        deskripsiRisiko: 'Saat resusitasi berjalan, defibrilator tidak dapat difungsikan atau ampul adrenalin tidak tersedia.',
        mitigasi: [
          'Pemeriksaan fungsi baterai defibrilator dan kelengkapan trolley emergensi setiap pergantian shift dengan checklist berparaf.',
          'Pemasangan segel bernomor pada trolley emergensi untuk menjamin integritas alat.',
        ],
      },
    ];

    prosedur = [
      {
        noProses: '5.1',
        judulTahapan: 'Pengenalan Korban & Bantuan Hidup Dasar Awal',
        langkah: [
          'Petugas yang pertama kali menemukan korban memeriksa kesadaran (tepuk bahu dan panggil nama) serta cek napas dan nadi karotis (5-10 detik).',
          'Bila tidak ada respons dan napas tidak normal/gasping, segera berteriak minta tolong: "Tolong, ada pasien henti jantung, aktifkan Code Blue!".',
          'Mulai lakukan kompresi dada RJP kualitas tinggi 30 kompresi : 2 ventilasi segera tanpa menunda.',
        ],
        leadTime: '≤ 30 Detik',
        pelaksana: 'First Responder / Staf Rumah Sakit Terdekat',
      },
      {
        noProses: '5.2',
        judulTahapan: 'Aktivasi Sistem Panggilan Code Blue Sentral',
        langkah: [
          'Petugas kedua menghubungi extension sentral darurat dan menyampaikan lokasi kejadian dengan format baku.',
          'Operator sentral segera membunyikan alarm dan menyiarkan via Public Address: "Code Blue! Code Blue! [Nama Ruangan/Lantai]" sebanyak 3 kali.',
          'Petugas kedua segera membawa troli emergensi dan defibrilator terdekat ke lokasi pasien.',
        ],
        leadTime: '≤ 1 Menit',
        pelaksana: 'Petugas Pendamping & Operator Sentral',
      },
      {
        noProses: '5.3',
        judulTahapan: 'Tindakan Bantuan Hidup Lanjut (ACLS) oleh Tim Code Blue',
        langkah: [
          'Tim Code Blue tiba di lokasi dalam waktu maksimal ≤ 5 menit dan langsung mengambil alih komando resusitasi.',
          'Pasang monitor/defibrilator, lakukan analisis irama (Shockable vs Non-Shockable).',
          'Lakukan defibrilasi bila VF/pVT, pasang akses intravena, dan berikan injeksi Epinefrin 1 mg setiap 3-5 menit sesuai algoritma ACLS.',
          'Pasang intubasi endotrakeal (ETT) untuk patensi jalan napas definitif.',
        ],
        leadTime: '3 - 5 Menit sejak aktivasi',
        pelaksana: 'Tim Code Blue (Dokter Anestesi/Jaga, Perawat Resusitasi)',
      },
      {
        noProses: '5.4',
        judulTahapan: 'Evaluasi ROSC & Transfer Perawatan Intensif (ICU)',
        langkah: [
          'Evaluasi capaian Return of Spontaneous Circulation (ROSC): teraba pulsasi nadi karotis dan tanda vital stabil.',
          'Lakukan monitoring pasca resusitasi, saturasi target 92-98%, dan evaluasi EKG 12 sandapan.',
          'Lakukan transfer pasien secara aman menggunakan monitor transport ke Intensive Care Unit (ICU).',
          'Dokumentasikan formulir laporan resusitasi Code Blue secara komprehensif.',
        ],
        leadTime: '15 - 30 Menit',
        pelaksana: 'Tim Code Blue & Tim Perawat ICU',
      },
    ];

    tanggungJawabUnit = [
      { unit: 'Tim Code Blue', tugas: ['Siaga merespons aktivasi darurat 24/7 dengan target response time < 5 menit.', 'Melaksanakan protokol resusitasi ACLS terkini.'] },
      { unit: 'Seluruh Unit Kerja RS', tugas: ['Menjaga kompetensi sertifikasi BHD seluruh staf.', 'Menjaga kelayakan dan keutuhan segel trolley emergensi di unit masing-masing.'] },
      { unit: 'Sentral Komunikasi RS', tugas: ['Menyiarkan panggilan darurat secara prioritas tanpa jeda.'] },
      { unit: 'Instalasi ICU', tugas: ['Menyiapkan bed dan ventilator untuk perawatan post-cardiac arrest.'] },
    ];

    dokumenTerkait = [
      'Formulir Lembar Catatan Resusitasi Code Blue',
      'Checklist Harian Pemeliharaan & Uji Fungsi Defibrilator',
      'Checklist Kelengkapan Troli Emergensi Bersegel',
      'SOP Bantuan Hidup Dasar (BHD) dan Bantuan Hidup Jantung Lanjut (ACLS)',
      'Modul RME Asesmen Kritis Terintegrasi',
    ];
  } else {
    // General Hospital / Corporate Operational Procedure based on user title
    const topikKata = judul.replace(/^(PROSEDUR|SPO|SOP|STANDAR OPERASIONAL|PANDUAN|TATA CARA)\s+/i, '');

    definisi = [
      { istilah: topikKata, penjelasan: `Rangkaian proses baku, sistematis, dan terintegrasi untuk melaksanakan ${topikKata.toLowerCase()} di lingkungan institusi demi menjamin mutu, efisiensi, dan kepatuhan standar akreditasi.` },
      { istilah: 'Standar Prosedur Operasional (SPO)', penjelasan: 'Pedoman tertulis yang memuat instruksi langkah demi langkah yang dibakukan mengenai pelaksanaan suatu aktivitas kerja agar konsisten dan meminimalkan variasi kesalahan.' },
      { istilah: 'Penanggung Jawab Pelayanan / Aktivitas', penjelasan: 'Pejabat struktural atau fungsional yang berwenang mengambil keputusan teknis, memverifikasi data, dan menjamin kepatuhan pelaksanaan prosedur di unit kerjanya.' },
      { istilah: 'Kendali Mutu dan Kendali Biaya', penjelasan: 'Prinsip tata kelola operasional yang memastikan bahwa setiap tindakan pelayanan bernilai tambah optimal, efisien, efektif, dan dapat dipertanggungjawabkan.' },
      { istilah: 'Sistem Informasi Manajemen (SIM)', penjelasan: 'Perangkat lunak terintegrasi yang digunakan untuk mencatat, memvalidasi, memonitor, dan merekam jejak audit (audit trail) dari pelaksanaan prosedur ini.' },
      { istilah: 'Kepatuhan Regulasi & Akreditasi', penjelasan: 'Kesesuaian seluruh langkah teknis dengan peraturan perundang-undangan kesehatan nasional, standar SNARS/KARS/ISO, dan kebijakan direksi.' },
    ];

    unitList = [
      'Unit Kerja Pemrakarsa / Pelaksana Utama Prosedur.',
      'Unit Penunjang Terkait & Administrasi.',
      'Instalasi Rekam Medis / Pengelola Data Elektronik.',
      'Unit Pengendalian Mutu & Manajemen Risiko.',
      'Manajemen SMI / Satuan Pemeriksa Internal.',
    ];

    riskRegister = [
      {
        kode: 'R1',
        proses: 'Tahap Awal / Registrasi & Verifikasi Dokumen',
        namaRisiko: 'Ketidaklengkapan Persyaratan / Data Tidak Valid',
        deskripsiRisiko: 'Pengajuan atau berkas masuk tanpa pemenuhan kriteria kelayakan awal yang berakibat pada penundaan proses lanjutan.',
        mitigasi: [
          'Terapkan checklist verifikasi digital wajib (mandatory field) pada sistem SIM.',
          'Penolakan otomatis dan notifikasi balik bila berkas belum memenuhi kriteria kelayakan.',
        ],
      },
      {
        kode: 'R2',
        proses: 'Pelaksanaan Teknis & Pengambilan Keputusan',
        namaRisiko: 'Penyimpangan Prosedur (Procedural Deviation)',
        deskripsiRisiko: 'Pelaksana fungsi melakukan bypass langkah kritis tanpa persetujuan otorisasi yang sah.',
        mitigasi: [
          'Penguncian alur pada sistem (hard-stop control) sebelum verifikasi pejabat berwenang dibubuhkan.',
          'Supervisi berkala dan audit kepatuhan SOP secara sampling bulanan.',
        ],
      },
      {
        kode: 'R3',
        proses: 'Pencatatan, Pelaporan & Serah Terima Hasil',
        namaRisiko: 'Keterlambatan Dokumentasi / Hilangnya Ketertelusuran (Traceability)',
        deskripsiRisiko: 'Hasil kegiatan tidak terdokumentasi dalam waktu 1x24 jam sehingga menyulitkan audit pasca pelaksanaan.',
        mitigasi: [
          'Wajibkan input real-time ke dalam sistem terintegrasi.',
          'Terapkan log audit digital dengan timestamp dan user ID terotentikasi.',
        ],
      },
    ];

    prosedur = [
      {
        noProses: '5.1',
        judulTahapan: 'Penerimaan Berkas / Identifikasi Kebutuhan Prosedur',
        langkah: [
          'Petugas pelaksana menerima permohonan, berkas, atau kondisi pasien/dokumen yang memerlukan tindakan.',
          'Lakukan verifikasi kelengkapan identitas, nomor dokumen/rekam medis, dan validitas prasyarat administratif.',
          'Input status awal registrasi pada sistem manajemen operasional.',
        ],
        leadTime: '3 - 5 Menit',
        pelaksana: 'Petugas Administrasi / Pelaksana Tahap Awal',
      },
      {
        noProses: '5.2',
        judulTahapan: 'Telaah Teknis & Asesmen Kelayakan',
        langkah: [
          'Petugas penanggung jawab teknis memeriksa substansi permohonan sesuai kriteria kebijakan baku.',
          'Bila ditemukan ketidaksesuaian, koordinasikan konfirmasi klarifikasi ke unit asal.',
          'Tetapkan disposisi tindak lanjut dan jadwal pelaksanaan.',
        ],
        leadTime: '5 - 15 Menit',
        pelaksana: 'Penanggung Jawab Teknis / Dokter / Verifikator',
      },
      {
        noProses: '5.3',
        judulTahapan: 'Eksekusi Tindakan / Pelaksanaan Prosedur Utama',
        langkah: [
          'Laksanakan tindakan teknis secara seksama sesuai kaidah pedoman keselamatan kerja dan standar mutu.',
          'Gunakan alat, bahan, atau sistem sesuai spesifikasi yang telah terkalibrasi dan tersertifikasi.',
          'Pantau respon dan catat parameter penting selama proses berlangsung.',
        ],
        leadTime: '15 - 30 Menit',
        pelaksana: 'Tim Pelaksana Teknis Terlatih',
      },
      {
        noProses: '5.4',
        judulTahapan: 'Validasi Akhir & Pencatatan RME SIMRS',
        langkah: [
          'Lakukan re-evaluasi terhadap luaran tindakan untuk memastikan kepatuhan sasaran mutu.',
          'Input catatan tindakan dan paraf otorisasi digital pada Rekam Medis Elektronik (RME) / SIMRS.',
          'Simpan seluruh arsip fisik/digital pada repositori resmi untuk menjamin ketertelusuran dokumen.',
        ],
        leadTime: '5 - 10 Menit',
        pelaksana: 'Sistem SIMRS & Verifikator Akhir',
      },
    ];

    tanggungJawabUnit = [
      { unit: 'Unit Pelaksana Utama', tugas: ['Melaksanakan seluruh rangkaian instruksi kerja secara disiplin.', 'Melakukan pencatatan akurat pada sistem tanpa penundaan.'] },
      { unit: 'Unit Penunjang', tugas: ['Menyediakan sarana, prasarana, logistik, dan dukungan data tepat waktu.'] },
      { unit: 'Unit Mutu & Manajemen Risiko', tugas: ['Melakukan monitoring indikator mutu dan audit kepatuhan secara berkala.', 'Memfasilitasi mitigasi bila terjadi kendala operasional.'] },
      { unit: 'Pimpinan Rumah Sakit / Korporasi', tugas: ['Menetapkan kebijakan, alokasi sumber daya, dan pengesahan dokumen SPO.'] },
    ];

    dokumenTerkait = [
      'Formulir Checklist Verifikasi Operasional Standar',
      'Modul Aplikasi Sistem Informasi Terintegrasi',
      'Buku Log Register / Rekam Jejak Pelaksanaan Tugas',
      'Laporan Evaluasi & Rekomendasi Bulanan Unit',
    ];
  }

  // alurFlowchart will be derived 1-to-1 from flowchartModel (which builds directly from D.1 prosedur)
  alurFlowchart = [];

  const assembledDoc: SpoDocument = {
    judulSpo: judul,
    metadata: {
      institusi,
      noDokumen,
      noRevisi,
      tanggalTerbit,
      kepalaRumahSakit,
      drafter: drafterDefault,
      creator: creatorDefault,
      reviewer: reviewerDefault,
    },
    pengertian: {
      definisi,
      ruangLingkup: {
        pengantar: `Prosedur operasional ini berlaku dan mengikat seluruh jajaran di lingkungan ${institusi}, khususnya pada unit-unit kerja berikut:`,
        unitList,
      },
    },
    tujuan: [
      {
        judulTujuan: 'Menjamin Mutu & Keselamatan Operasional (Zero Defect)',
        deskripsi: `Mencegah terjadinya kesalahan prosedur, insiden keselamatan, atau ketidaksesuaian pelaksanaan ${judul.toLowerCase()} dengan standar akreditasi.`,
      },
      {
        judulTujuan: 'Kepatuhan Regulasi & Ketentuan Hukum Kesehatan',
        deskripsi: 'Memastikan seluruh tahapan kegiatan taat asas terhadap peraturan perundang-undangan nasional, petunjuk teknis Kemenkes, dan kebijakan Direksi.',
      },
      {
        judulTujuan: 'Kepastian Layanan & Efisiensi Lead Time',
        deskripsi: 'Memberikan kepastian alur kerja, kejelasan pembagian wewenang, serta percepatan waktu tanggap pelayanan tanpa mengurangi kecermatan teknis.',
      },
      {
        judulTujuan: 'Ketertelusuran Data & Akuntabilitas Audit (Traceability)',
        deskripsi: 'Menjamin tersedianya rekaman dokumentasi digital dan fisik yang valid, terintegrasi, dan siap diaudit oleh badan akreditasi maupun verifikator penjamin.',
      },
    ],
    kebijakan: {
      ketentuan: [
        `Kepatuhan Mutlak: Seluruh staf dan petugas pelaksana di lingkungan ${institusi} wajib memahami dan menerapkan standar operasional ini secara disiplin.`,
        'Prinsip Pencegahan Risiko di Hulu: Setiap potensi deviasi atau ketidaksesuaian wajib diidentifikasi dan diselesaikan pada tahap awal sebelum melanjutkan ke tahapan berikutnya.',
        'Kewajiban Dokumentasi Real-Time: Seluruh tindakan, verifikasi, dan serah terima wajib dicatat pada sistem informasi terintegrasi pada hari yang sama.',
        'Otorisasi Berlapis (Dual Verification): Tindakan kritis yang berisiko tinggi wajib melalui proses verifikasi ganda independen oleh pejabat/petugas berwenang.',
        'Audit & Evaluasi Berkelanjutan: Komite Mutu dan Manajemen Risiko berhak melakukan audit kepatuhan sewaktu-waktu dan melaporkan rekomendasi perbaikan berkala.',
        'Sanksi dan Pembinaan: Pengabaian terhadap ketentuan operasional ini akan dikenakan tindakan pembinaan disiplin sesuai peraturan kepegawaian yang berlaku.',
      ],
      riskRegister,
    },
    prosedur,
    tanggungJawabUnit,
    formulirPendukung: {
      dokumenTerkait,
      riwayatPerubahan: normalizeRiwayatPerubahan(
        undefined,
        { noRevisi, tanggalTerbit },
        judul
      ),
    },
    alurFlowchart,
  };

  const syncedModel = buildFlowchartModelFromSpo(assembledDoc);
  assembledDoc.flowchartModel = syncedModel;
  assembledDoc.alurFlowchart = syncedModel.nodes.map((node, idx) => ({
    id: node.id || `step-${idx + 1}`,
    tipe:
      node.type === 'terminator' || node.type === 'start'
        ? 'start'
        : node.type === 'end'
        ? 'end'
        : node.type === 'decision' || node.type === 'gateway'
        ? 'decision'
        : 'process',
    label: node.label,
    ...(node.type === 'decision' ? { kondisiYa: 'Ya', kondisiTidak: 'Tidak' } : {}),
  }));
  return assembledDoc;
}
