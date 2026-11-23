import { SpoDocument } from "../types/spo";

export const BLANK_SPO_TEMPLATE: SpoDocument = {
  judulSpo: "",
  metadata: {
    institusi: "RUMAH SAKIT SEMEN GRESIK",
    noDokumen: "",
    noRevisi: "",
    tanggalTerbit: "",
    kepalaRumahSakit: "",
    kepalaRumahSakitJabatan: "",
    drafter: {
      nama: "",
      jabatan: "",
    },
    creator: {
      nama: "",
      jabatan: "",
    },
    reviewer: {
      nama: "",
      jabatan: "",
    },
  },
  pengertian: {
    definisi: [],
    ruangLingkup: {
      pengantar: "",
      unitList: [],
    },
  },
  tujuan: [],
  kebijakan: {
    ketentuan: [],
    riskRegister: [],
  },
  prosedur: [],
  tanggungJawabUnit: [],
  formulirPendukung: {
    dokumenTerkait: [],
    riwayatPerubahan: [],
  },
};

export const TEMPLATE_RS_SEMEN_GRESIK: SpoDocument = {
  judulSpo:
    "PENCEGAHAN TIDAK LAYAK BAYAR (TLB) KLAIM LAYANAN DI ANTARA TINDAKAN REHABILITASI MEDIK PADA PASIEN TANGGUNGAN BPJS KESEHATAN",
  metadata: {
    institusi: "RUMAH SAKIT SEMEN GRESIK",
    noDokumen: "QAP/102341/770",
    noRevisi: "0",
    tanggalTerbit: "23 Oktober 2026",
    kepalaRumahSakit: "dr. Tolib Bahasuan",
    kepalaRumahSakitJabatan: "Kepala Rumah Sakit",
    drafter: {
      nama: "Hana Thriesminarsih, S.Kes",
      jabatan: "Karu Rehabilitasi Medik",
    },
    creator: {
      nama: "dr. Achmad Farid, Sp.KFR",
      jabatan: "Ka. Instalasi Rehabilitasi medik",
    },
    reviewer: {
      nama: "Nanang Judianto, SE",
      jabatan: "Pgs. Manajer SMI",
    },
  },
  pengertian: {
    definisi: [
      {
        istilah: "Tidak Layak Bayar (TLB)",
        penjelasan:
          "Status penolakan atau diskualifikasi pembayaran klaim secara permanen oleh BPJS Kesehatan akibat ketidaksesuaian administrasi, fragmentasi pelayanan, indikasi medis, atau pelanggaran regulasi penjaminan yang berujung pada potensi pengembalian dana pasca-audit.",
      },
      {
        istilah: "Poli di Antara Tindakan Rehabilitasi Medik",
        penjelasan:
          "Kunjungan rawat jalan pasien ke Poliklinik Induk/Spesialis (seperti Spesialis Bedah Ortopedi, Saraf, Anak, atau Spesialis lainnya) yang dilakukan di sela-sela atau di tengah rangkaian sesi siklus pelayanan Rehabilitasi Medik/Fisioterapi yang belum tuntas, yang berpotensi dianggap pemecahan episode rawat jalan (fragmentasi klaim) oleh BPJS Kesehatan.",
      },
      {
        istilah: "Rangkaian Paket Pelayanan Rehabilitasi Medik",
        penjelasan:
          "Rangkaian sesi terapi terencana (umumnya terdiri dari siklus berkala, misalnya 6 kali tindakan terapi fisioterapi/terapi okupasi/wicara) yang diresepkan dan dievaluasi oleh Dokter Spesialis Kedokteran Fisik dan Rehabilitasi (Sp.KFR) dalam kurun waktu siklus penjaminan.",
      },
      {
        istilah: "Kartu Kendali Terapi (Kartu Kuning/Riwayat Terapi)",
        penjelasan:
          "Dokumen fisik atau penanda elektronik yang mencatat riwayat pelaksanaan sesi terapi pasien secara berurutan sebagai bukti jumlah tindakan yang telah dijalani dan sisa terapi yang belum diselesaikan.",
      },
      {
        istilah: "Penanda Khusus Rujukan Terapi",
        penjelasan:
          "Tanda fisik (berupa stiker, cap, atau paraf validasi) pada surat pengantar rujukan/berkas pasien yang menandakan bahwa pasien sedang aktif dalam rangkaian tindakan Rehabilitasi Medik.",
      },
      {
        istilah: "Surat Rencana Kontrol (Surat Pemesanan Kontrol)",
        penjelasan:
          "Dokumen legalitas kelayakan penjaminan kontrol ulang pasien ke dokter spesialis yang telah terbit pada sistem, yang tanggal kunjungannya dapat dijadwalkan ulang/dimundurkan secara sah apabila program terapi belum terselesaikan.",
      },
      {
        istilah: "SIMRS NUHA V3",
        penjelasan:
          "Sistem Informasi Manajemen Rumah Sakit yang terintegrasi secara bridging dengan sistem BPJS Kesehatan untuk proses admisi, rekam medis elektronik, jadwal kontrol, pencatatan tindakan, serta verifikasi kelayakan klaim.",
      },
      {
        istilah: "Kasus Khusus Obat Rutin",
        penjelasan:
          "Kondisi klinis tertentu (seperti pasien pediatrik/anak dengan hipotiroid kongenital, penyakit kronis tertentu, atau kebutuhan obat rutin) yang memerlukan evaluasi dokter penanggung jawab pelayanan (DPJP) tanpa boleh terputus regimen obatnya, meskipun rangkaian terapinya belum genap mencapai target siklus.",
      },
    ],
    ruangLingkup: {
      pengantar:
        "Prosedur ini berlaku di lingkungan Rumah Sakit Semen Gresik. Prosedur ini mengikat seluruh unit pelayanan yang terlibat dalam rantai alur pasien Rehabilitasi Medik, meliputi:",
      unitList: [
        "Tempat Pendaftaran Pasien Rawat Jalan (TPPRJ) & Operator Anjungan Pendaftaran Mandiri (APM).",
        "Instalasi Rehabilitasi Medik (Fisioterapi, Terapi Okupasi, Terapi Wicara).",
        "Poliklinik Spesialis (Ortopedi, Bedah, Saraf, Anak, Penyakit Dalam, dll.).",
        "Instalasi Rekam Medis & Tim Koder Casemix.",
        "Tim Pengelolaan JKN / Verifikator Internal.",
        "Unit Manajemen Risiko.",
      ],
    },
  },
  tujuan: [
    {
      judulTujuan: "Mencegah Penolakan Klaim (Zero TLB)",
      deskripsi:
        "Menghilangkan risiko timbulnya status klaim Tidak Layak Bayar (TLB) akibat kunjungan rawat jalan poli spesialis yang bertabrakan dengan siklus paket tindakan Rehabilitasi Medik.",
    },
    {
      judulTujuan: "Menghilangkan Potensi Pengembalian Dana Pasca-Audit",
      deskripsi:
        "Menjaga kepatuhan regulasi BPJS guna mengeliminasi temuan Verifikasi Pasca Klaim (VPK) dan audit yang berujung pada sanksi pemotongan arus kas (cashflow).",
    },
    {
      judulTujuan: "Menjamin Kepastian dan Keteraturan Pelayanan Pasien",
      deskripsi:
        "Memastikan pasien menyelesaikan program terapi fisik secara teratur dan tuntas tanpa mengalami pembatalan berkas atau penolakan penjaminan saat kontrol dokter spesialis.",
    },
    {
      judulTujuan: "Mengoptimalkan Sinkronisasi Data Hulu",
      deskripsi:
        "Mengintegrasikan rekam jejak terapi pada kartu kendali, berkas rujukan fisik, dan sistem SIMRS NUHA V3 sehingga proses verifikasi dapat ditelusuri (traceable) secara transparan.",
    },
  ],
  kebijakan: {
    ketentuan: [
      "Prinsip Pencegahan di Hulu: Pengendalian risiko penjaminan BPJS wajib diselesaikan di titik pendaftaran dan ruang pelayanan, bukan diselesaikan saat berkas sudah terkirim ke BPJS Kesehatan.",
      "Kewajiban Identifikasi Penanda Pasien Terapi: Setiap pasien yang sedang menjalani program tindakan di Instalasi Rehabilitasi Medik wajib memiliki penanda fisik berupa stempel/label khusus pada surat rujukan/pengantar serta membawa Kartu Kendali Terapi (Kartu Kuning).",
      "Penyelesaian Rangkaian Sesi Terapi: Pasien yang teridentifikasi masih memiliki sisa kuota sesi terapi (belum genap 6 kali atau belum tuntas masa siklusnya) diwajibkan menyelesaikan seluruh sisa tindakan terapinya terlebih dahulu sebelum mendaftar kontrol ke Poliklinik Spesialis asal rujukan.",
      "Legalisasi Pergeseran Jadwal Kontrol Dokter: Petugas Loket/Admisi diperbolehkan dan berwenang memundurkan tanggal jadwal kontrol pada Surat Rencana Kontrol yang telah terbit di sistem SIMRS/V-Claim agar sisa sesi terapi pasien dapat diselesaikan terlebih dahulu, tanpa membatalkan surat rujukan utama.",
      "Protokol Khusus Pasien Terapi Obat Rutin: Pengecualian jadwal kontrol di tengah terapi diperbolehkan khusus untuk kasus klinis tertentu (misal: anak dengan hipotiroid, gangguan neurologi, atau penyakit kronis yang membutuhkan kelanjutan obat rutin) dengan catatan wajib disertai catatan asesmen klinis tertulis oleh DPJP pada SIMRS NUHA.",
      "Larangan Registrasi Ganda Non-SOP: Petugas loket pendaftaran dan operator APM dilarang menerbitkan nomor antrean pendaftaran ke Poli Spesialis bagi pasien terapi aktif tanpa memeriksa status penyelesaian riwayat terapi.",
    ],
    riskRegister: [
      {
        kode: "R1",
        proses: "Pendaftaran Rawat Jalan di Loket / APM",
        namaRisiko: "Pendaftaran Lolos Tanpa Skrining Terapi",
        deskripsiRisiko:
          "Pasien yang sedang aktif fisioterapi mendaftar ke Poli Spesialis tanpa diketahui petugas loket.",
        mitigasi: [
          "Tempelkan stiker/stempel penanda terapi pada surat rujukan.",
          "Wajibkan verifikasi fisik Kartu Kuning terapi.",
          "Konfigurasi notifikasi riwayat terapi pada modul APM/SIMRS NUHA.",
        ],
      },
      {
        kode: "R2",
        proses: "Penjadwalan Kontrol Dokter Spesialis",
        namaRisiko: "Tumpang Tindih Jadwal (Overlap) Pelayanan",
        deskripsiRisiko:
          "Tanggal kontrol ke DPJP mendahului penyelesaian sesi ke-6 fisioterapi.",
        mitigasi: [
          "Berdayakan wewenang petugas loket untuk menggeser (mundur) tanggal rencana kontrol.",
          "Edukasi pasien mengenai keabsahan surat kontrol yang dapat disesuaikan.",
        ],
      },
      {
        kode: "R3",
        proses: "Pelayanan Pasien Khusus (Pediatrik / Obat Rutin)",
        namaRisiko: "Pasien Terputus Obat Akibat Terhambat Skrining",
        deskripsiRisiko:
          "Pasien anak/hipotiroid tidak diloloskan kontrol sehingga obat rutin habis.",
        mitigasi: [
          "Tetapkan protokol jalur khusus (fast-track exception) bagi diagnosa obat rutin.",
          "DPJP wajib mencantumkan alasan klinis kebutuhan obat pada resume SIMRS.",
        ],
      },
      {
        kode: "R4",
        proses: "Sinkronisasi Berkas Rekam Medis Elektronik",
        namaRisiko: "Berkas Asesmen & Penunjang Tidak Sinkron",
        deskripsiRisiko:
          "Catatan terapi di Rehab Medik tidak terhubung dengan asesmen poliklinik asal.",
        mitigasi: [
          "Pemeriksaan silang (cross-check) harian data RME oleh Petugas RM dan Coder.",
          "Koordinasi langsung antar-petugas jika data belum lengkap.",
        ],
      },
      {
        kode: "R5",
        proses: "Pengajuan Klaim ke BPJS Kesehatan",
        namaRisiko: "Terbit Status TLB / Temuan Pasca-Audit",
        deskripsiRisiko:
          "Berkas klaim rawat jalan ditolak verifikator BPJS karena dinilai fragmentasi kunjungan.",
        mitigasi: [
          "Skrining Pra-Klaim (Pre-Claim Screening) oleh Tim Casemix.",
          "Audit sampling berkala kepatuhan SPO bersama SPI.",
        ],
      },
    ],
  },
  prosedur: [
    {
      noProses: "5.1",
      judulTahapan: "PEMBERIAN PENANDA DI INSTALASI REHABILITASI MEDIK",
      langkah: [
        "Terapis/Petugas Administrasi Rehab Medik memeriksa program terapi yang diresepkan oleh Dokter Sp.KFR.",
        'Petugas menempelkan stiker khusus atau cap bertuliskan "PASIEN FISIOTERAPI" pada lembar surat rujukan/pengantar pasien.',
        "Petugas menyerahkan Kartu Kendali Terapi (Kartu Kuning) kepada pasien dan mengedukasi jadwal 6 kali sesi terapi yang wajib diselesaikan.",
      ],
      leadTime: "5 Menit",
      pelaksana: "Petugas Administrasi / Terapis Rehab Medik",
    },
    {
      noProses: "5.2",
      judulTahapan: "SKRINING AWAL DI LOKET PENDAFTARAN RAWAT JALAN / APM",
      langkah: [
        "Pasien datang ke Loket Pendaftaran / APM untuk mengambil antrean periksa ke Poliklinik Spesialis.",
        "Petugas loket melakukan identifikasi berkas: memeriksa adanya penanda cap/stiker terapi pada surat rujukan pasien.",
        "Petugas meminta pasien menunjukkan fisik Kartu Kendali Terapi (Kartu Kuning) dan mencocokkan riwayat kehadiran terapi di SIMRS NUHA V3.",
      ],
      leadTime: "3 Menit",
      pelaksana: "Petugas Loket Pendaftaran / Operator APM",
    },
    {
      noProses: "5.3",
      judulTahapan: "VALIDASI KELAYAKAN KUNJUNGAN KONTROL",
      langkah: [
        "Jika Rangkaian Terapi Belum Tuntas (< 6 Sesi): Petugas menolak pendaftaran kunjungan poli spesialis untuk hari tersebut secara persuasif. Petugas mengarahkan pasien untuk menyelesaikan sisa sesi terapi terlebih dahulu.",
        'Jika Pasien Masuk Kategori Khusus (Obat Rutin/Pediatrik): Petugas mengonfirmasi status resep obat kronis yang akan habis. Pendaftaran poli spesialis diizinkan dengan menyertakan kode/catatan khusus "Pengecualian Klinis Kebutuhan Obat Rutin" pada sistem.',
        "Jika Terapi Sudah Lengkap Selesai (6 Sesi): Pasien diproses pendaftarannya menuju Poliklinik Spesialis sesuai alur normal.",
      ],
      leadTime: "5 Menit",
      pelaksana: "Petugas Loket Pendaftaran",
    },
    {
      noProses: "5.4",
      judulTahapan: "PENJADWALAN ULANG (RESCHEDULE) SURAT RENCANA KONTROL",
      langkah: [
        "Apabila tanggal rencana kontrol dokter yang tertera pada sistem bertepatan saat sesi terapi belum selesai, petugas loket membuka menu Surat Rencana Kontrol pada SIMRS NUHA.",
        "Petugas menggeser (memundurkan) tanggal kunjungan kontrol dokter spesialis disesuaikan dengan perkiraan selesainya sisa sesi terapi pasien.",
        "Petugas mencetak bukti pembaruan jadwal kontrol dan menginformasikan tanggal baru kepada pasien/keluarga.",
      ],
      leadTime: "3 Menit",
      pelaksana: "Petugas Loket Pendaftaran",
    },
    {
      noProses: "5.5",
      judulTahapan: "VERIFIKASI & DOKUMENTASI KLINIS OLEH DPJP",
      langkah: [
        "Dokter Spesialis di Poliklinik memeriksa kesesuaian riwayat terapi pasien pada resume medik elektronik SIMRS NUHA V3.",
        "Untuk kasus khusus obat rutin yang kontrol sebelum terapi tuntas, DPJP wajib mendokumentasikan indikasi medis mendesak terkait kontinuitas obat pada resume medis elektronik.",
      ],
      leadTime: "Saat Pelayanan",
      pelaksana: "DPJP / Perawat Poliklinik",
    },
    {
      noProses: "5.6",
      judulTahapan: "PRE-CLAIM SCREENING OLEH TIM CASEMIX & KODER",
      langkah: [
        "Petugas Rekam Medis dan Coder memeriksa keterkaitan berkas klaim rawat jalan sebelum penggabungan berkas tagihan.",
        "Memastikan tidak ada pengajuan tagihan terpisah yang saling tumpang tindih (overlap) antara pelayanan poli spesialis dan tindakan fisioterapi pada tanggal yang dilarang regulasi.",
        "Berkas yang lolos verifikasi diteruskan ke pengajuan klaim final; berkas anomali dikembalikan ke unit untuk diklarifikasi.",
      ],
      leadTime: "H+1 s.d. H+2 Pelayanan",
      pelaksana: "Coder / Verifikator Internal JKN",
    },
  ],
  tanggungJawabUnit: [
    {
      unit: "Instalasi Rehabilitasi Medik & Fisioterapi",
      tugas: [
        "Bertanggung jawab membubuhkan stempel/label penanda rangkaian terapi pada seluruh berkas rujukan pasien yang memulai siklus tindakan.",
        "Bertanggung jawab mencatat setiap sesi kehadiran pasien secara akurat pada Kartu Kendali Terapi (Kartu Kuning) dan menginput tindakan secara real-time ke SIMRS NUHA V3.",
        "Memberikan edukasi kepada pasien/keluarga mengenai kewajiban menyelesaikan kuota terapi sebelum kembali periksa ke dokter spesialis perujuk.",
      ],
    },
    {
      unit: "Loket Pendaftaran Rawat Jalan & Admisi",
      tugas: [
        "Bertindak sebagai gatekeeper hulu utama yang wajib menolak pendaftaran kontrol poli spesialis apabila pasien terbukti masih memiliki tunggakan sesi terapi aktif.",
        "Bertanggung jawab melakukan penyesuaian teknis (pergeseran tanggal mundur) pada Surat Rencana Kontrol di SIMRS/V-Claim sesuai estimasi waktu tuntasnya terapi.",
        "Mengidentifikasi pasien dengan kebutuhan khusus (obat rutin kronis/pediatrik) agar tidak terputus terapi medikamentosa.",
      ],
    },
    {
      unit: "Dokter Penanggung Jawab Pelayanan (DPJP) & Poliklinik Spesialis",
      tugas: [
        "Memeriksa keterpaduan riwayat tindakan rehabilitasi pasien saat pasien tiba di poliklinik.",
        "Untuk kasus khusus obat rutin yang datang di sela-sela terapi, DPJP wajib menuliskan alasan medis kelanjutan obat secara eksplisit pada resume medis elektronik guna pertanggungjawaban audit klaim.",
      ],
    },
    {
      unit: "Instalasi Rekam Medis & Tim Koder Casemix",
      tugas: [
        "Melakukan telaah keterkaitan dokumen (data linkage) antara asesmen dokter dan lembar tindakan fisioterapi pada SIMRS NUHA V3 sebelum finalisasi koding klaim rawat jalan.",
        "Melakukan intersepsi (pre-claim screening) dan segera mengembalikan berkas ke unit jika terdeteksi indikasi klaim poli di antara terapi yang tidak memenuhi syarat.",
      ],
    },
    {
      unit: "Tim Pengelolaan JKN / Verifikator Internal",
      tugas: [
        "Melakukan pemantauan harian terhadap potensi timbulnya berkas status Pending atau TLB rawat jalan dari portal verifikasi BPJS.",
        "Berkoordinasi aktif dengan Kepala Ruangan/Kepala Instalasi apabila ditemukan deviasi operasional di lapangan.",
      ],
    },
    {
      unit: "Unit Manajemen Risiko",
      tugas: [
        "Melakukan audit sampling kepatuhan pelaksanaan SPO secara berkala bersama Satuan Pengawas Internal (SPI).",
        "Menganalisis efektivitas pencegahan TLB dan melaporkan perkembangan indikator kepatuhan unit secara rutin kepada jajaran Direksi.",
      ],
    },
  ],
  formulirPendukung: {
    dokumenTerkait: [
      "Kartu Kendali Pelayanan Fisioterapi / Rehabilitasi Medik (Kartu Kuning).",
      "Surat Rujukan BPJS Kesehatan & Surat Pengantar Tindakan Rehabilitasi Medik.",
      "Surat Rencana Kontrol Rawat Jalan (SIMRS NUHA / V-Claim BPJS).",
      "Resume Medis Rawat Jalan Elektronik (RME SIMRS NUHA V3).",
      "Lembar Audit Sampling Kepatuhan SPO Mitigasi TLB.",
    ],
    riwayatPerubahan: [
      {
        tanggal: "23 Oktober 2026",
        versi: "Versi 1.0",
        deskripsi:
          "Dokumen baru yang disusun bersama oleh Unit Manajemen Risiko, Instalasi Rehabilitasi Medik, dan Unit Pengelolaan JKN berdasarkan hasil evaluasi pencegahan TLB rapat koordinasi 18 September 2026.",
      },
    ],
  },
  alurFlowchart: [
    { id: "1", tipe: "start", label: "Pasien Datang" },
    { id: "2", tipe: "process", label: "Unit Rehab Medik" },
    {
      id: "3",
      tipe: "process",
      label: "Pasien Datang ke Loket Pendaftaran / APM",
    },
    {
      id: "4",
      tipe: "decision",
      label: "Ada Tanda Terapi?",
      kondisiYa: "Periksa Jumlah Sesi",
      kondisiTidak: "Proses Pendaftaran Normal",
    },
    {
      id: "5",
      tipe: "decision",
      label: "Status Sesi Terapi?",
      kondisiYa: "Sudah Tuntas -> Masuk Poli Spesialis",
      kondisiTidak: "Kurang -> Periksa Obat Rutin",
    },
    {
      id: "6",
      tipe: "decision",
      label: "Periksa Kategori Khusus Obat Rutin?",
      kondisiYa: "Jalur Khusus: DPJP Wajib Justifikasi Klinis",
      kondisiTidak:
        "Tolak Daftar Poli -> Geser Tanggal Kontrol -> Selesaikan Terapi",
    },
    { id: "7", tipe: "end", label: "Selesai Terapi & Klaim Layak Bayar" },
  ],
  flowchartModel: {
    actors: {
      admin: "Petugas Loket dan Tim Casemix",
      system: "Sistem Informasi SIMRS NUHA V3",
      customer: "Pasien Rehabilitasi Medik",
    },
    nodes: [
      {
        id: "node-start",
        lane: "admin",
        type: "terminator",
        label: "Penerimaan Pasien & Berkas di Loket",
        nextTargetId: "node-reg-doc",
        arrowLabel: "Verifikasi Berkas",
      },
      {
        id: "node-reg-doc",
        lane: "admin",
        type: "document",
        label: "Pemeriksaan Kartu Kendali & Surat Rujukan",
        nextTargetId: "node-sys-check",
        arrowLabel: "Bridging Data",
      },
      {
        id: "node-sys-check",
        lane: "system",
        type: "data",
        label: "Verifikasi Database Pasien & Riwayat Tindakan SIMRS",
        nextTargetId: "node-dec-terapi",
        arrowLabel: "Skrining Berkas",
      },
      {
        id: "node-dec-terapi",
        lane: "admin",
        type: "decision",
        label: "Apakah Pasien Terdaftar dalam Rangkaian Terapi Aktif?",
        targetYesId: "node-dec-sesi",
        labelYes: "Ya / Terdaftar Terapi",
        targetNoId: "node-adm-normal",
        labelNo: "Tidak / Pasien Umum Non-Terapi",
      },
      {
        id: "node-adm-normal",
        lane: "system",
        type: "process",
        label: "Penerbitan SEP & Antrean Poli Reguler",
        nextTargetId: "node-end",
        arrowLabel: "Selesai Admisi",
      },
      {
        id: "node-dec-sesi",
        lane: "admin",
        type: "decision",
        label: "Apakah Sesi Terapi Sudah Tuntas (6 Sesi)?",
        targetYesId: "node-adm-normal",
        labelYes: "Ya / Tuntas 6 Sesi",
        targetNoId: "node-dec-obat",
        labelNo: "Tidak / Sesi Belum Genap",
      },
      {
        id: "node-dec-obat",
        lane: "admin",
        type: "decision",
        label: "Apakah Masuk Kategori Khusus Obat Rutin / Kronis?",
        targetYesId: "node-dpjp-special",
        labelYes: "Ya / Kasus Khusus Obat",
        targetNoId: "node-reschedule",
        labelNo: "Tidak / Terapi Wajib Selesai Dulu",
      },
      {
        id: "node-reschedule",
        lane: "system",
        type: "document",
        label: "Penundaan Kontrol Poli & Jadwal Ulang Terapi",
        nextTargetId: "node-end",
        arrowLabel: "Penyesuaian Tanggal",
      },
      {
        id: "node-dpjp-special",
        lane: "admin",
        type: "process",
        label: "Jalur Khusus DPJP: Konsultasi & Justifikasi Klinis",
        nextTargetId: "node-end",
        arrowLabel: "Dokumentasi RME",
      },
      {
        id: "node-end",
        lane: "customer",
        type: "terminator",
        label: "Selesai: Klaim Layak Bayar & Bebas TLB",
      },
    ],
  },
};

export const PRESET_LIST = [
  {
    id: "tlb-rehab",
    title: "Pencegahan TLB Klaim BPJS (Rehabilitasi Medik)",
    category: "Klaim & Casemix",
    docNumber: "QAP/102341/770",
    data: TEMPLATE_RS_SEMEN_GRESIK,
  },
  {
    id: "triage-igd",
    title: "Triase dan Penetapan Prioritas Gawat Darurat (ATS/ESI)",
    category: "Pelayanan Medis IGD",
    docNumber: "MED/IGD/2026/042",
    data: {
      judulSpo:
        "TRIASE DAN PENETAPAN PRIORITAS PASIEN GAWAT DARURAT DI INSTALASI GAWAT DARURAT (IGD)",
      metadata: {
        institusi: "RUMAH SAKIT SEMEN GRESIK",
        noDokumen: "MED/IGD/2026/042",
        noRevisi: "0",
        tanggalTerbit: "01 November 2026",
        kepalaRumahSakit: "dr. Tolib Bahasuan",
        kepalaRumahSakitJabatan: "Kepala Rumah Sakit",
        drafter: {
          nama: "Ns. Hendra Prasetyo, S.Kep",
          jabatan: "Kepala Ruangan IGD",
        },
        creator: {
          nama: "dr. Budi Setiawan, Sp.EM",
          jabatan: "Ka. Instalasi Gawat Darurat",
        },
        reviewer: {
          nama: "dr. Ratna Juwita, MARS",
          jabatan: "Manajer Pelayanan Medis",
        },
      },
      pengertian: {
        definisi: [
          {
            istilah: "Triase Gawat Darurat",
            penjelasan:
              "Proses pemilahan dan pengelompokan penderita berdasarkan beratnya cedera atau penyakit, kemungkinan bertahan hidup, serta alokasi sumber daya medis gawat darurat yang tersedia.",
          },
          {
            istilah: "Emergency Severity Index (ESI)",
            penjelasan:
              "Sistem algoritma triase 5 level yang mengkategorikan tingkat kegawatan klinis pasien berdasarkan derajat ancaman nyawa dan estimasi jumlah kebutuhan modalitas sumber daya rumah sakit.",
          },
          {
            istilah: "Kategori Merah (Resusitasi/P1)",
            penjelasan:
              "Kondisi klinis kritis yang mengancam nyawa atau anggota tubuh secara langsung yang memerlukan intervensi medis penyelamatan hidup sesegera mungkin (lead time: 0 menit).",
          },
          {
            istilah: "Kategori Kuning (Urgent/P2)",
            penjelasan:
              "Kondisi pasien tidak stabil atau berisiko mengalami perburukan cepat bila tidak ditangani dalam waktu maksimal 15-30 menit.",
          },
          {
            istilah: "Kategori Hijau (Non-Urgent/P3)",
            penjelasan:
              "Pasien rawat jalan dengan kondisi stabil yang tidak memerlukan intervensi segera dan aman menunggu penanganan hingga 60 menit.",
          },
        ],
        ruangLingkup: {
          pengantar:
            "Prosedur ini berlaku untuk seluruh pasien yang tiba di Instalasi Gawat Darurat Rumah Sakit Semen Gresik dengan melibatkan unit:",
          unitList: [
            "Tim Dokter Jaga dan Perawat Triase IGD",
            "Ruang Resusitasi dan Tindakan Kritis",
            "Loket Pendaftaran dan Admisi Darurat (TPPGD)",
            "Instalasi Laboratorium Patologi Klinik & Radiologi Cito",
            "Farmasi Depo IGD",
          ],
        },
      },
      tujuan: [
        {
          judulTujuan:
            "Mencegah Kematian dan Kecacatan (Zero Preventable Death)",
          deskripsi:
            "Memastikan identifikasi dini pasien dalam ancaman henti napas, henti jantung, atau syok berat ditangani tanpa penundaan.",
        },
        {
          judulTujuan:
            "Menjamin Akurasi Distribusi Alur Pasien (Safe Patient Flow)",
          deskripsi:
            "Mengurai kemacetan alur IGD dengan mengalokasikan pasien ke zona resusitasi, zona observasi, atau poliklinik sesuai derajat kegawatannya.",
        },
        {
          judulTujuan: "Kepatuhan Standar Keselamatan Pasien SNARS",
          deskripsi:
            "Memenuhi standar akreditasi rumah sakit terkait respon triase terukur dan audit kepatuhan klinis terintegrasi.",
        },
      ],
      kebijakan: {
        ketentuan: [
          "Seluruh pasien yang datang ke IGD wajib melalui pemeriksaan skrining triase awal oleh perawat triase bersertifikasi BTCLS/ACLS.",
          "Pemeriksaan triase awal (Visual Triage & Vital Sign) diselesaikan dalam kurun waktu kurang dari 5 menit sejak pasien tiba di pintu IGD.",
          "Pasien kategori ESI 1 (Kategori Merah) langsung diarahkan ke Ruang Resusitasi tanpa menunggu proses penyelesaian berkas administrasi dan pendaftaran.",
          "Dokumentasi triase wajib tercatat dalam Rekam Medis Elektronik (RME) SIMRS NUHA V3 secara real-time.",
        ],
        riskRegister: [
          {
            kode: "R1",
            proses: "Kedatangan Pasien di Drop-Zone IGD",
            namaRisiko:
              "Under-Triage (Salah Menilai Tingkat Kegawatan Lebih Ringan)",
            deskripsiRisiko:
              "Pasien syok tersembunyi atau silent AMI dinilai hijau/kuning sehingga terjadi keterlambatan resusitasi.",
            mitigasi: [
              "Penetapan kualifikasi minimal perawat triase bersertifikasi.",
              "Pemasangan monitoring tanda vital wajib pada skrining awal.",
            ],
          },
          {
            kode: "R2",
            proses: "Pendaftaran Berkas Pasien Kritis",
            namaRisiko: "Penundaan Tindakan Karena Kelengkapan Berkas JKN",
            deskripsiRisiko:
              "Petugas pendaftaran meminta identitas lengkap keluarga saat pasien memerlukan tindakan penyelamatan segera.",
            mitigasi: [
              "Pemberlakuan aturan Emergency First: seluruh administrasi disusulkan setelah stabilisasi klinis.",
            ],
          },
        ],
      },
      prosedur: [
        {
          noProses: "1.1",
          judulTahapan: "PENERIMAAN & VISUAL TRIAGE",
          langkah: [
            "Perawat triase menyambut pasien di zona transfer masuk IGD.",
            "Melakukan penilaian cepat kesadaran, kepatenan jalan napas (Airway), pernapasan (Breathing), dan sirkulasi (Circulation).",
            "Menempatkan pasien pada brankar sesuai estimasi zona prioritas.",
          ],
          leadTime: "< 2 Menit",
          pelaksana: "Perawat Triase IGD",
        },
        {
          noProses: "1.2",
          judulTahapan: "PENGUKURAN TANDA VITAL LENGKAP & ALGORITMA ESI",
          langkah: [
            "Mengukur tekanan darah, laju nadi, frekuensi napas, saturasi oksigen (SpO2), suhu tubuh, dan skala nyeri.",
            "Menentukan skor ESI dan membubuhkan pita triase warna sesuai kategori.",
            "Melakukan aktivasi tim medis dokter jaga IGD.",
          ],
          leadTime: "3 Menit",
          pelaksana: "Perawat Triase & Dokter Jaga IGD",
        },
        {
          noProses: "1.3",
          judulTahapan: "TRANSFER PASIEN KE ZONA TINDAKAN",
          langkah: [
            "Pasien Kategori 1 langsung didorong ke Kamar Resusitasi dengan pendampingan dokter.",
            "Pasien Kategori 2 dimasukkan ke Bed Observasi Prioritas.",
            "Pasien Kategori 3-5 ditempatkan di Ruang Tindakan Minor atau Ruang Tunggu Prioritas.",
          ],
          leadTime: "2 Menit",
          pelaksana: "Perawat Pendamping & Pramuhusada",
        },
      ],
      tanggungJawabUnit: [
        {
          unit: "Instalasi Gawat Darurat",
          tugas: [
            "Menyelenggarakan triase 24 jam dengan petugas yang kompeten.",
            "Memastikan ketersediaan brankar, oksigen portabel, dan defibrilator selalu siap pakai.",
          ],
        },
        {
          unit: "Admisi dan Pendaftaran Gawat Darurat",
          tugas: [
            "Memproses admisi paralel tanpa menghalangi tindakan kedaruratan.",
            "Menerbitkan nomor rekam medis darurat jika identitas pasien belum diketahui (Mr./Mrs. X).",
          ],
        },
      ],
      formulirPendukung: {
        dokumenTerkait: [
          "Lembar Formulir Triase IGD Terintegrasi (RME SIMRS NUHA).",
          "Pita Warna Triase Identifikasi Pasien.",
          "Buku Register Kedaruratan IGD.",
        ],
        riwayatPerubahan: [
          {
            tanggal: "01 November 2026",
            versi: "Versi 1.0",
            deskripsi:
              "Pembaruan prosedur triase berbasis ESI Level 5 sesuai standar akreditasi KARS 2026.",
          },
        ],
      },
    },
  },
  {
    id: "high-alert-med",
    title: "Pengelolaan Obat High Alert & LASA di Instalasi Farmasi",
    category: "Patient Safety & Farmasi",
    docNumber: "FAR/SPO/2026/118",
    data: {
      judulSpo:
        "PENGELOLAAN DAN PEMBERIAN OBAT-OBATAN KONSENTRASI TINGGI (HIGH ALERT MEDICATIONS)",
      metadata: {
        institusi: "RUMAH SAKIT SEMEN GRESIK",
        noDokumen: "FAR/SPO/2026/118",
        noRevisi: "1",
        tanggalTerbit: "15 September 2026",
        kepalaRumahSakit: "dr. Tolib Bahasuan",
        kepalaRumahSakitJabatan: "Kepala Rumah Sakit",
        drafter: {
          nama: "Apt. Dwi Lestari, S.Farm",
          jabatan: "Koordinator Farmasi Klinis",
        },
        creator: {
          nama: "Apt. Agus Purwanto, M.Farm",
          jabatan: "Ka. Instalasi Farmasi",
        },
        reviewer: {
          nama: "Nanang Judianto, SE",
          jabatan: "Pgs. Manajer SMI",
        },
      },
      pengertian: {
        definisi: [
          {
            istilah: "High Alert Medications",
            penjelasan:
              "Obat-obatan yang secara signifikan memiliki risiko tinggi menyebabkan cedera serius atau kematian pasien (sentinel event) apabila terjadi kesalahan dalam proses penyimpanan, peresepan, penyiapan, maupun pemberian.",
          },
          {
            istilah: "Look-Alike Sound-Alike (LASA) / NORUM",
            penjelasan:
              "Nama Obat Rupa dan Ucapan Mirip; obat yang memiliki kemasan, nama generik/paten, atau pelafalan yang serupa sehingga rawan tertukar.",
          },
          {
            istilah: "Elektrolit Konsentrat Tinggi",
            penjelasan:
              "Cairan pekat seperti KCl 7.46%, NaCl 3%, Magnesium Sulfat 20% dan 40% yang tidak boleh disimpan di ruang rawat umum dan memerlukan pembatasan ketat.",
          },
          {
            istilah: "Double-Check Independen",
            penjelasan:
              "Proses verifikasi dua orang tenaga kesehatan berwenang secara terpisah dan mandiri untuk memastikan kebenaran 7 Benar Pemberian Obat.",
          },
        ],
        ruangLingkup: {
          pengantar:
            "Prosedur ini mengikat seluruh instalasi farmasi dan ruang rawat di lingkungan Rumah Sakit Semen Gresik, meliputi:",
          unitList: [
            "Gudang Farmasi dan Depo Farmasi Rawat Inap/ICU/OK",
            "Seluruh Ruang Rawat Inap Medikal dan Bedah",
            "Intensive Care Unit (ICU) & HCU",
            "Komite Farmasi dan Terapi (KFT)",
            "Komite Mutu dan Keselamatan Pasien (KMKP)",
          ],
        },
      },
      tujuan: [
        {
          judulTujuan: "Mencegah Kejadian Tidak Diharapkan (KTD)",
          deskripsi:
            "Mengeliminasi kesalahan pemberian obat berisiko fatal pada pasien rawat inap dan gawat darurat.",
        },
        {
          judulTujuan: "Standarisasi Penyimpanan Khusus",
          deskripsi:
            "Memastikan seluruh obat high alert diberi label merah mencolok dan elektrolit pekat disimpan terkunci.",
        },
      ],
      kebijakan: {
        ketentuan: [
          'Setiap obat yang masuk dalam Daftar Obat High Alert wajib diberi stiker merah neon bertuliskan "HIGH ALERT".',
          "Elektrolit konsentrat tidak boleh disimpan di ruang rawat inap biasa kecuali di ICU dan OK dengan akses terbatas.",
          "Pemberian obat high alert wajib melalui verifikasi double-check oleh dua perawat yang berbeda sebelum disuntikkan/diberikan.",
        ],
        riskRegister: [
          {
            kode: "R1",
            proses: "Pengambilan Obat di Rak Depo Farmasi",
            namaRisiko: "Tertukar Obat LASA Karena Kemasan Mirip",
            deskripsiRisiko:
              "Petugas mengambil sediaan dosis yang salah karena letak botol yang bersebelahan.",
            mitigasi: [
              "Terapkan aturan Tall Man Lettering pada label obat.",
              "Beri sekat dan jarak fisik antar sediaan obat yang mirip.",
            ],
          },
        ],
      },
      prosedur: [
        {
          noProses: "1",
          judulTahapan: "PENANDAAN DAN PENYIMPANAN DI FARMASI",
          langkah: [
            "Apoteker memisahkan obat high alert dari obat reguler.",
            "Menempelkan stiker merah HIGH ALERT pada setiap kemasan ampul/vial/kolf.",
            "Menyimpan elektrolit konsentrat tinggi di lemari bertanda khusus dan terkunci.",
          ],
          leadTime: "15 Menit",
          pelaksana: "Asisten Apoteker & Apoteker Penanggung Jawab",
        },
        {
          noProses: "2",
          judulTahapan: "VERIFIKASI RESEP DAN DISPENSING",
          langkah: [
            "Apoteker memverifikasi dosis, rute pemberian, dan indikasi klinis pada RME.",
            "Menyiapkan obat dan menyertakan lembar verifikasi double check farmasi.",
          ],
          leadTime: "10 Menit",
          pelaksana: "Apoteker Farmasi Rawat Inap",
        },
        {
          noProses: "3",
          judulTahapan: "INDEPENDENT DOUBLE-CHECK SEBELUM PEMBERIAN KE PASIEN",
          langkah: [
            "Perawat 1 membacakan identitas pasien, nama obat, dosis, cara pemberian, dan waktu.",
            "Perawat 2 melakukan konfirmasi ulang secara terpisah pada catatan instruksi medis dokter.",
            "Kedua perawat menandatangani lembar pemberian obat.",
          ],
          leadTime: "5 Menit",
          pelaksana: "Perawat Primer & Perawat Asosiet",
        },
      ],
      tanggungJawabUnit: [
        {
          unit: "Instalasi Farmasi",
          tugas: [
            "Menyusun dan memperbarui daftar obat High Alert berkala setiap tahun bersama KFT.",
            "Melakukan audit penyimpanan obat high alert di seluruh unit setiap bulan.",
          ],
        },
        {
          unit: "Bidang Keperawatan",
          tugas: [
            "Melatih seluruh staf perawat mengenai teknik independent double-check.",
            "Melaporkan insiden nyaris cedera (KNC) ke Komite Keselamatan Pasien dalam kurun waktu 1x24 jam.",
          ],
        },
      ],
      formulirPendukung: {
        dokumenTerkait: [
          "Daftar Resmi Obat High Alert & LASA RS Semen Gresik.",
          "Label Stiker Merah HIGH ALERT dan Stiker Kuning LASA.",
          "Lembar Catatan Pemberian Obat Terintegrasi (CPOT).",
        ],
        riwayatPerubahan: [
          {
            tanggal: "15 September 2026",
            versi: "Versi 2.0",
            deskripsi:
              "Revisi penambahan daftar obat sitotoksik dan anestesi parenteral.",
          },
        ],
      },
    },
  },
];
