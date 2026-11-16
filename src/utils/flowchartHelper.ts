import {
  FlowchartModel,
  FlowNode,
  FlowNodeType,
  FlowLane,
  FlowConnection,
  FlowPoint,
  SpoDocument,
} from '../types/spo.js';

export interface SymbolDefinition {
  type: FlowNodeType;
  label: string;
  nameIndo: string;
  description: string;
  badgeColor: string;
}

export const SYMBOL_DEFINITIONS: Record<FlowNodeType, SymbolDefinition> = {
  terminator: {
    type: 'terminator',
    label: 'Terminator (Oval)',
    nameIndo: 'Mulai / Selesai (Start / End)',
    description: 'Menandai titik awal (Start) atau akhir (End/Arsip) dari alur prosedur.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  start: {
    type: 'start',
    label: 'Start Event (Lingkaran)',
    nameIndo: 'Titik Awal (Start Event)',
    description: 'Titik awal alur pelayanan pasien atau pemicu proses.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  end: {
    type: 'end',
    label: 'End Event (Lingkaran Tebal)',
    nameIndo: 'Titik Akhir (End Event)',
    description: 'Titik penyelesaian akhir alur prosedur pelayanan.',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  process: {
    type: 'process',
    label: 'Task (Kotak Persegi)',
    nameIndo: 'Aktivitas / Tindakan Medis',
    description: 'Aktivitas kerja fisik, tindakan klinis, atau pemrosesan administrasi.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  decision: {
    type: 'decision',
    label: 'Gateway / Decision (Diamond)',
    nameIndo: 'Keputusan / Evaluasi (Diamond)',
    description: 'Pengecekan syarat, kriteria kelayakan, atau status dengan cabang Ya & Tidak.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  gateway: {
    type: 'gateway',
    label: 'Gateway BPMN (Diamond)',
    nameIndo: 'Percabangan Alur (Gateway)',
    description: 'Percabangan logika keputusan paralel atau eksklusif (XOR).',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  document: {
    type: 'document',
    label: 'Document (Dokumen Berkas)',
    nameIndo: 'Formulir / Dokumen / Resep',
    description: 'Pencetakan formulir, berkas fisik, lembar SEP, atau rekam medis tertulis.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  data: {
    type: 'data',
    label: 'Data I/O (Jajar Genjang)',
    nameIndo: 'Input / Output Data SIMRS',
    description: 'Penginputan data digital, penarikan riwayat, atau bridging sistem.',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  datastore: {
    type: 'datastore',
    label: 'Data Store (Silinder Database)',
    nameIndo: 'Database / SIMRS Server',
    description: 'Penyimpanan terpusat database SIMRS, RME, atau arsip rekam medis.',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  connector: {
    type: 'connector',
    label: 'Connector (Lingkaran Kecil)',
    nameIndo: 'Konektor Alur (Penghubung)',
    description: 'Titik temu alur atau perpindahan halaman tanpa memutus kontinuitas.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  subprocess: {
    type: 'subprocess',
    label: 'Subprocess (Prosedur Teknis)',
    nameIndo: 'Sub-Prosedur / SPO Khusus',
    description: 'Prosedur pendukung atau tindakan terpisah yang memiliki rincian teknis sendiri.',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
};

export const LANE_PALETTES = [
  { bgColor: '#dcfce7', color: '#166534', name: 'Pelaksana / Medis (Hijau)' },
  { bgColor: '#fef9c3', color: '#854d0e', name: 'Sistem / SIMRS (Kuning)' },
  { bgColor: '#dbeafe', color: '#1e40af', name: 'Pasien / Pemohon (Biru)' },
  { bgColor: '#f3e8ff', color: '#6b21a8', name: 'Farmasi / Laboratorium (Ungu)' },
  { bgColor: '#ffedd5', color: '#9a3412', name: 'Dokter DPJP / Medis Khusus (Oranye)' },
  { bgColor: '#ccfbf1', color: '#115e59', name: 'Penunjang Medis / Radiologi (Toska)' },
  { bgColor: '#ffe4e6', color: '#9f1239', name: 'IGD / Casemix / Manajemen (Merah Muda)' },
];

export const GENERIC_ACTOR_DEFAULTS = {
  admin: 'Petugas Pelaksana Tindakan Medis',
  system: 'Sistem Informasi SIMRS Terpadu',
  customer: 'Pasien dan Keluarga Pemohon',
};

function isGenericActorName(name?: string): boolean {
  const n = (name || '').trim();
  return (
    !n ||
    n === GENERIC_ACTOR_DEFAULTS.admin ||
    n === GENERIC_ACTOR_DEFAULTS.system ||
    n === GENERIC_ACTOR_DEFAULTS.customer
  );
}

/**
 * Determine specific actor names without slashes ('/') based on Gemini aktorFlowchart,
 * SPO prosedur.pelaksana, tanggungJawabUnit, and title/domain context.
 */
export function getDefaultActors(spo: Partial<SpoDocument>): {
  admin: string;
  system: string;
  customer: string;
} {
  // 1. Direct AI-generated actors when present and non-generic
  const aiActors = (spo as any).aktorFlowchart || spo.flowchartModel?.actors;
  if (
    aiActors &&
    !isGenericActorName(aiActors.admin) &&
    !isGenericActorName(aiActors.system) &&
    !isGenericActorName(aiActors.customer)
  ) {
    return {
      admin: String(aiActors.admin).trim(),
      system: String(aiActors.system).trim(),
      customer: String(aiActors.customer).trim(),
    };
  }

  const title = (spo.judulSpo || '').toLowerCase();
  const unitText = (Array.isArray(spo.tanggungJawabUnit) ? spo.tanggungJawabUnit : [])
    .map((u) => u?.unit || '')
    .join(' ')
    .toLowerCase();
  const rawUnitList = spo.pengertian?.ruangLingkup?.unitList;
  const scopeText = (Array.isArray(rawUnitList) ? rawUnitList : []).join(' ').toLowerCase();
  const combined = `${title} ${unitText} ${scopeText}`;

  const matchDomainActors = (text: string) => {
    if (text.includes('igd') || text.includes('triase') || text.includes('gawat darurat')) {
      return {
        admin: 'Dokter dan Perawat IGD',
        system: 'Sistem Informasi SIMRS IGD',
        customer: 'Pasien Gawat Darurat dan Keluarga',
      };
    }
    if (text.includes('farmasi') || text.includes('obat') || text.includes('resep') || text.includes('lasa')) {
      return {
        admin: 'Apoteker dan Asisten Farmasi',
        system: 'Sistem E-Prescription SIMRS',
        customer: 'Pasien dan Unit Perawatan',
      };
    }
    if (text.includes('code blue') || text.includes('henti jantung') || text.includes('resusitasi')) {
      return {
        admin: 'Tim Medis Resusitasi Code Blue',
        system: 'Sentral Paging dan Alarm 118',
        customer: 'Saksi dan Penemu Pasien',
      };
    }
    if (text.includes('admisi') || text.includes('sep') || text.includes('tpprj') || text.includes('pendaftaran')) {
      return {
        admin: 'Petugas Loket Pendaftaran dan Admisi',
        system: 'Sistem Bridging V-Claim SIMRS',
        customer: 'Pasien dan Keluarga Pemohon',
      };
    }
    if (text.includes('bedah') || text.includes('operasi') || text.includes('ibs') || text.includes('anestesi')) {
      return {
        admin: 'Dokter Bedah dan Tim Kamar Operasi',
        system: 'Sistem Jadwal Operasi dan RME IBS',
        customer: 'Pasien Pra dan Pasca Operasi',
      };
    }
    if (text.includes('rehabilitasi') || text.includes('fisioterapi') || text.includes('tlb') || text.includes('klaim')) {
      return {
        admin: 'Petugas Loket dan Tim Casemix',
        system: 'Sistem Informasi SIMRS NUHA V3',
        customer: 'Pasien Rehabilitasi Medik',
      };
    }
    if (text.includes('radiologi') || text.includes('rontgen') || text.includes('ct scan') || text.includes('usg') || text.includes('radiografer')) {
      return {
        admin: 'Dokter Radiologi dan Radiografer',
        system: 'Sistem RIS dan PACS Radiologi',
        customer: 'Pasien dan Dokter Pengirim',
      };
    }
    if (text.includes('laboratorium') || text.includes('darah') || text.includes('spesimen') || text.includes('transfusi')) {
      return {
        admin: 'Analis Medis dan Petugas Lab',
        system: 'Sistem LIS Laboratorium SIMRS',
        customer: 'Pasien dan Unit Pengirim Sampel',
      };
    }
    if (text.includes('gizi') || text.includes('nutrisi') || text.includes('diet') || text.includes('makanan')) {
      return {
        admin: 'Ahli Gizi dan Petugas Tata Boga',
        system: 'Modul Asuhan Gizi SIMRS',
        customer: 'Pasien Rawat Inap',
      };
    }
    if (text.includes('rekam medis') || text.includes('koding') || text.includes('arsip rm')) {
      return {
        admin: 'Petugas Perekam Medis dan Koder',
        system: 'Sistem Rekam Medis Elektronik',
        customer: 'Unit Pelayanan dan Pasien',
      };
    }
    if (text.includes('hemodialisa') || text.includes('cuci darah') || /\bhd\b/.test(text)) {
      return {
        admin: 'Dokter dan Perawat Hemodialisa',
        system: 'Mesin Dialisis dan RME Hemodialisa',
        customer: 'Pasien Gagal Ginjal',
      };
    }
    if (text.includes('icu') || text.includes('iccu') || text.includes('nicu') || text.includes('picu') || text.includes('intensif')) {
      return {
        admin: 'Dokter Intensivis dan Perawat ICU',
        system: 'Monitor Pasien dan RME ICU',
        customer: 'Pasien Kritis dan Keluarga',
      };
    }
    if (text.includes('ponek') || text.includes('kebidanan') || text.includes('persalinan') || text.includes('nifas') || /\bvk\b/.test(text)) {
      return {
        admin: 'Dokter Obgin dan Bidan Pelaksana',
        system: 'Sistem RME Kebidanan dan Maternal',
        customer: 'Ibu Hamil atau Bersalin dan Bayi',
      };
    }
    if (text.includes('kasir') || text.includes('pembayaran') || text.includes('billing') || text.includes('keuangan')) {
      return {
        admin: 'Petugas Kasir dan Verifikator Biaya',
        system: 'Sistem Billing Terintegrasi SIMRS',
        customer: 'Pasien dan Penjamin Biaya',
      };
    }
    if (text.includes('ipsrs') || text.includes('kalibrasi') || text.includes('pemeliharaan') || text.includes('sarana') || text.includes('prasarana')) {
      return {
        admin: 'Teknisi IPSRS dan Elektromedik',
        system: 'Sistem Inventaris dan Log Alat RS',
        customer: 'Unit Pengguna Fasilitas Alat',
      };
    }
    if (text.includes('limbah') || text.includes('sanitasi') || text.includes('kesling') || text.includes('b3')) {
      return {
        admin: 'Petugas Sanitasi dan Kesling',
        system: 'Sistem Pencatatan Manifest Limbah B3',
        customer: 'Unit Penghasil Limbah Medis',
      };
    }
    if (text.includes('ppi') || text.includes('infeksi') || text.includes('sterilisasi') || text.includes('cssd') || text.includes('cuci tangan')) {
      return {
        admin: 'Tim PPI dan Petugas Klinis',
        system: 'Sistem Monitoring Mutu PPI',
        customer: 'Pasien dan Seluruh Staf Unit',
      };
    }
    if (text.includes('rawat jalan') || text.includes('poliklinik') || text.includes('poli ')) {
      return {
        admin: 'Dokter DPJP dan Perawat Poliklinik',
        system: 'Sistem Antrean dan RME Poliklinik',
        customer: 'Pasien Rawat Jalan',
      };
    }
    if (text.includes('rawat inap') || text.includes('bangsal') || text.includes('ruang perawatan')) {
      return {
        admin: 'Dokter DPJP dan Perawat PPJA',
        system: 'Sistem RME dan CPPT Rawat Inap',
        customer: 'Pasien Rawat Inap dan Keluarga',
      };
    }
    return null;
  };

  const titleMatch = matchDomainActors(title);
  if (titleMatch) return titleMatch;

  const combinedMatch = matchDomainActors(combined);
  if (combinedMatch) return combinedMatch;

  // 3. Dynamic extraction from spo.prosedur[].pelaksana & tanggungJawabUnit & title
  const rawProsedur = Array.isArray(spo.prosedur) ? spo.prosedur : [];
  const pelaksanaList = rawProsedur
    .flatMap((p) => String(p?.pelaksana || '').split(/[,&/]|\bdan\b/i))
    .map((s) => s.trim())
    .filter((s) => s.length >= 4 && !/^(simrs|sistem|rme|v-claim|vclaim)$/i.test(s));

  const clinicalActors = pelaksanaList.filter(
    (s) => !/(pasien|keluarga|pemohon|sistem|simrs|rme)/i.test(s)
  );
  const customerActors = pelaksanaList.filter((s) =>
    /(pasien|keluarga|pemohon|unit asal|pengirim|pengunjung)/i.test(s)
  );
  const rawTjUnit = Array.isArray(spo.tanggungJawabUnit) ? spo.tanggungJawabUnit : [];
  const firstUnit = rawTjUnit
    .map((u) => u?.unit?.trim())
    .find((u) => u && !/(mutu|pimpinan|manajemen risiko|direksi)/i.test(u));

  const cleanTopic = (spo.judulSpo || '')
    .replace(/^(SPO|SOP|STANDAR PROSEDUR OPERASIONAL|PROSEDUR|TATA CARA)\s+/i, '')
    .trim();
  const shortTopic = cleanTopic
    ? cleanTopic
        .split(/\s+/)
        .slice(0, 4)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    : 'Layanan Operasional';

  const derivedAdmin =
    clinicalActors.length >= 2 && clinicalActors[0] !== clinicalActors[1]
      ? `${clinicalActors[0]} dan ${clinicalActors[1]}`
      : clinicalActors[0] || firstUnit || `Pelaksana ${shortTopic}`;

  const derivedSystem = firstUnit
    ? `Sistem Informasi dan Dokumentasi ${firstUnit}`
    : `Sistem Informasi Operasional ${shortTopic}`;

  const derivedCustomer =
    customerActors[0] ||
    (combined.includes('pasien') ? 'Pasien dan Keluarga' : `Pemohon Layanan ${shortTopic}`);

  return {
    admin: derivedAdmin,
    system: derivedSystem,
    customer: derivedCustomer,
  };
}

const PRESERVED_ACRONYMS = new Set([
  'IGD', 'SIMRS', 'RME', 'DPJP', 'ICU', 'ICCU', 'NICU', 'PICU', 'HCU', 'IBS',
  'SPO', 'SOP', 'SEP', 'BPJS', 'JKN', 'TLB', 'ESI', 'ATS', 'APM', 'KFR',
  'TTK', 'BHD', 'ACLS', 'ROSC', 'LASA', 'HAM', 'NORUM', 'CT', 'USG', 'MRI',
  'ECG', 'EKG', 'B3', 'IPSRS', 'CSSD', 'PPI', 'VK', 'HD', 'TPPRJ', 'TPPGD',
  'SDM', 'OK', 'K3RS', 'CPPT', 'KTD', 'KNC', 'IKP', 'LIS', 'RIS', 'PACS',
  'TLB', 'VPK', 'SPI', 'SMI', 'ETT', 'GCS', 'EWS', 'BTCLS', 'RS',
]);

function formatTahapanTitle(rawTitle: string): string {
  const cleaned = (rawTitle || '').trim();
  if (!cleaned) return '';
  // Check if predominantly uppercase
  const letters = cleaned.replace(/[^a-zA-Z]/g, '');
  const upperCount = (cleaned.match(/[A-Z]/g) || []).length;
  const isAllCaps = letters.length > 3 && upperCount / letters.length > 0.75;
  if (!isAllCaps) return cleaned;

  return cleaned
    .split(/\s+/)
    .map((word, idx) => {
      const bare = word.replace(/^[(["']+|[\])"',.:;!?]+$/g, '');
      const upperBare = bare.toUpperCase();
      if (PRESERVED_ACRONYMS.has(upperBare) || /^SP\.[A-Z]+$/i.test(bare)) {
        return word.toUpperCase();
      }
      const lower = word.toLowerCase();
      if (idx > 0 && ['dan', 'atau', 'di', 'ke', 'dari', 'pada', 'oleh', 'untuk', 'dengan', 'yang', 'serta'].includes(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function buildProsedurNodeLabel(noProses?: string, judulTahapan?: string): string {
  const formattedTitle = formatTahapanTitle(judulTahapan || '');
  const no = (noProses || '').trim();
  if (!no) return formattedTitle || 'Tahapan Prosedur';
  if (formattedTitle.startsWith(no)) return formattedTitle;
  return `${no} ${formattedTitle}`.trim();
}

function detectNodeTypeFromLabel(label: string, defaultType: FlowNodeType = 'process'): FlowNodeType {
  const lower = (label || '').toLowerCase();
  if (lower.includes('apakah') || lower.includes('?')) {
    return 'decision';
  }
  if (
    lower.includes('formulir') ||
    lower.includes('kartu') ||
    lower.includes('surat') ||
    lower.includes('berkas') ||
    lower.includes('resep') ||
    lower.includes('sep') ||
    lower.includes('dokumen') ||
    lower.includes('penanda') ||
    lower.includes('laporan')
  ) {
    return 'document';
  }
  if (
    lower.includes('simrs') ||
    lower.includes('rme') ||
    lower.includes('database') ||
    lower.includes('bridging') ||
    lower.includes('sistem') ||
    lower.includes('registrasi') ||
    lower.includes('input')
  ) {
    return 'datastore';
  }
  return defaultType;
}

function detectLaneFromText(
  pelaksanaText: string,
  judulTahapanText: string = '',
  actors?: { admin: string; system: string; customer: string },
  fallbackLane: 'admin' | 'system' | 'customer' = 'admin',
  langkahText: string = ''
): 'admin' | 'system' | 'customer' {
  const pelaksana = (pelaksanaText || '').toLowerCase();
  const tahapan = (judulTahapanText || '').toLowerCase();
  const combinedStep = `${tahapan} ${(langkahText || '').toLowerCase()}`;

  // 1. Direct match from pelaksana column first (source of truth for WHO performs the row)
  if (
    pelaksana.includes('simrs') ||
    pelaksana.includes('sistem') ||
    pelaksana.includes('operator') ||
    pelaksana.includes('apm') ||
    pelaksana.includes('paging') ||
    pelaksana.includes('sentral') ||
    pelaksana.includes('bridging') ||
    pelaksana.includes('v-claim') ||
    pelaksana.includes('vclaim') ||
    pelaksana.includes('rme') ||
    pelaksana.includes('lis') ||
    pelaksana.includes('ris') ||
    pelaksana.includes('pacs')
  ) {
    return 'system';
  }
  if (
    pelaksana.includes('pasien') ||
    pelaksana.includes('keluarga') ||
    pelaksana.includes('saksi') ||
    pelaksana.includes('penemu') ||
    pelaksana.includes('pemohon') ||
    pelaksana.includes('korban') ||
    pelaksana.includes('ibu hamil') ||
    pelaksana.includes('unit asal') ||
    pelaksana.includes('unit pengirim')
  ) {
    return 'customer';
  }

  // If stage title itself clearly centers on digital SIMRS/RME/bridging system workflow
  if (
    tahapan.includes('simrs') ||
    tahapan.includes('rme') ||
    tahapan.includes('rekam medis elektronik') ||
    tahapan.includes('cppt') ||
    tahapan.includes('bridging') ||
    tahapan.includes('v-claim') ||
    tahapan.includes('e-resep') ||
    tahapan.includes('e-prescription') ||
    tahapan.includes('sistem informasi') ||
    tahapan.includes('aktivasi sistem') ||
    tahapan.includes('input data') ||
    tahapan.includes('entri data') ||
    tahapan.includes('dokumentasi elektronik') ||
    combinedStep.includes('otomatis simrs') ||
    combinedStep.includes('bridging v-claim') ||
    combinedStep.includes('input ke simrs') ||
    combinedStep.includes('entri ke rme')
  ) {
    return 'system';
  }

  if (
    pelaksana.includes('dokter') ||
    pelaksana.includes('dpjp') ||
    pelaksana.includes('perawat') ||
    pelaksana.includes('apoteker') ||
    pelaksana.includes('ttk') ||
    pelaksana.includes('analis') ||
    pelaksana.includes('radiografer') ||
    pelaksana.includes('bidan') ||
    pelaksana.includes('terapis') ||
    pelaksana.includes('petugas') ||
    pelaksana.includes('coder') ||
    pelaksana.includes('verifikator') ||
    pelaksana.includes('teknisi') ||
    pelaksana.includes('ahli gizi') ||
    pelaksana.includes('tim ')
  ) {
    return 'admin';
  }

  // 2. Compare against dynamic actor lane names when pelaksana uses custom phrasing
  if (actors) {
    const scoreOverlap = (laneLabel: string) => {
      const tokens = laneLabel
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !['dan', 'atau', 'unit', 'pelaksana', 'sistem', 'informasi'].includes(w));
      return tokens.reduce((acc, tok) => acc + (pelaksana.includes(tok) ? 1 : 0), 0);
    };
    const sysScore = scoreOverlap(actors.system);
    const custScore = scoreOverlap(actors.customer);
    const adminScore = scoreOverlap(actors.admin);
    if (sysScore > adminScore && sysScore > custScore) return 'system';
    if (custScore > adminScore && custScore > sysScore) return 'customer';
    if (adminScore > 0) return 'admin';
  }

  // 3. Fallback cues from judulTahapan / langkah when pelaksana is empty/generic
  if (
    combinedStep.includes('simrs') ||
    combinedStep.includes('rme') ||
    combinedStep.includes('bridging') ||
    combinedStep.includes('sistem')
  ) {
    return 'system';
  }

  return fallbackLane;
}

function findAlignedDecisionForStage(
  proc: Partial<{ noProses: string; judulTahapan: string; langkah: string[] }>,
  idx: number,
  totalProcs: number,
  alurFlowchart: SpoDocument['alurFlowchart'],
  usedDecisionIndices: Set<number>
): string | null {
  if (idx >= totalProcs - 1) return null;

  const noProses = (proc.noProses || '').trim();
  const procText = `${proc.judulTahapan || ''} ${(proc.langkah || []).join(' ')}`.toLowerCase();

  // Check if Gemini alurFlowchart has a decision matching this stage
  if (Array.isArray(alurFlowchart) && alurFlowchart.length > 0) {
    for (let aIdx = 0; aIdx < alurFlowchart.length; aIdx++) {
      if (usedDecisionIndices.has(aIdx)) continue;
      const item = alurFlowchart[aIdx] as any;
      if (item?.tipe !== 'decision') continue;

      // Exact noProses match if provided by schema
      if (noProses && item.noProsesTerkait && String(item.noProsesTerkait).trim() === noProses) {
        usedDecisionIndices.add(aIdx);
        return item.label;
      }

      // Keyword overlap with this stage's judulTahapan
      const stageWords = (proc.judulTahapan || '')
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 5 && !['tahapan', 'proses', 'pasien', 'petugas', 'dengan', 'secara'].includes(w));
      const decLower = (item.label || '').toLowerCase();
      if (stageWords.some((w) => decLower.includes(w))) {
        usedDecisionIndices.add(aIdx);
        return item.label;
      }
    }
  }

  // Heuristic check directly from D.1 stage title & steps
  const hasBranchCue =
    procText.includes('skrining') ||
    procText.includes('validasi') ||
    procText.includes('kelayakan') ||
    procText.includes('verifikasi') ||
    procText.includes('evaluasi') ||
    procText.includes('analisis irama') ||
    procText.includes('jika ') ||
    procText.includes('bila ') ||
    procText.includes('apabila ');

  if (!hasBranchCue) return null;

  const shortTitle = formatTahapanTitle(proc.judulTahapan || '')
    .split(/\s+/)
    .slice(0, 4)
    .join(' ');
  return shortTitle
    ? `Apakah Hasil ${shortTitle} Sesuai Standar?`
    : 'Apakah Persyaratan & Kondisi Sesuai Standar?';
}

/**
 * Builds a domain-accurate FlowchartModel strictly synchronized 1-to-1 with the SPO document's
 * D.1 prosedur table (same stage numbers, titles, chronological order, and pelaksana swimlanes).
 */
export function buildFlowchartModelFromSpo(spo: Partial<SpoDocument>): FlowchartModel {
  const actors = getDefaultActors(spo);
  const existingLanes = spo.flowchartModel?.lanes;
  const lanes =
    existingLanes && existingLanes.length > 0
      ? existingLanes.map((l) => {
          if (l.id === 'admin' && isGenericActorName(l.name)) return { ...l, name: actors.admin };
          if (l.id === 'system' && isGenericActorName(l.name)) return { ...l, name: actors.system };
          if (l.id === 'customer' && isGenericActorName(l.name)) return { ...l, name: actors.customer };
          return l;
        })
      : getModelLanes({ actors, nodes: [] });

  const firstAdminLane = lanes.find((l) => l.id === 'admin')?.id || lanes[0]?.id || 'admin';
  const firstSysLane = lanes.find((l) => l.id === 'system')?.id || lanes[Math.min(1, lanes.length - 1)]?.id || firstAdminLane;
  const firstCustLane = lanes.find((l) => l.id === 'customer')?.id || lanes[lanes.length - 1]?.id || firstAdminLane;

  const mapLaneKey = (key: 'admin' | 'system' | 'customer') => {
    if (key === 'system') return firstSysLane;
    if (key === 'customer') return firstCustLane;
    return firstAdminLane;
  };

  const nodes: FlowNode[] = [];
  const connections: FlowConnection[] = [];

  // Primary 1-to-1 Sync from D.1 spo.prosedur whenever prosedur stages exist
  if (Array.isArray(spo.prosedur) && spo.prosedur.length > 0) {
    nodes.push({
      id: 'node-start',
      lane: firstCustLane,
      type: 'terminator',
      label: 'Mulai Prosedur',
    });

    const usedDecisionIndices = new Set<number>();
    let decisionCount = 0;

    spo.prosedur.forEach((proc, idx) => {
      const detectedType = detectNodeTypeFromLabel(proc.judulTahapan, idx === 0 ? 'document' : 'process');
      const langkahJoined = Array.isArray(proc.langkah) ? proc.langkah.join(' ') : String(proc.langkah || '');
      const laneKey = detectLaneFromText(
        proc.pelaksana || '',
        proc.judulTahapan || '',
        actors,
        'admin',
        langkahJoined
      );
      const nodeId = `node-proc-${idx + 1}`;
      nodes.push({
        id: nodeId,
        lane: mapLaneKey(laneKey),
        type: detectedType,
        label: buildProsedurNodeLabel(proc.noProses, proc.judulTahapan),
      });

      // Insert aligned decision node right after conditional/verification stages (max 2 for clean readability)
      if (decisionCount < 2) {
        const decisionLabel = findAlignedDecisionForStage(
          proc,
          idx,
          spo.prosedur!.length,
          spo.alurFlowchart,
          usedDecisionIndices
        );
        if (decisionLabel) {
          decisionCount++;
          nodes.push({
            id: `node-dec-${idx + 1}`,
            lane: firstAdminLane,
            type: 'decision',
            label: decisionLabel,
          });
        }
      }
    });

    nodes.push({
      id: 'node-end',
      lane: firstCustLane,
      type: 'end',
      label: 'Selesai Prosedur',
    });

    for (let i = 0; i < nodes.length - 1; i++) {
      const curr = nodes[i];
      const next = nodes[i + 1];
      if (curr.type === 'decision') {
        curr.targetYesId = next.id;
        curr.labelYes = 'Ya';
        connections.push({
          id: `conn-${curr.id}-${next.id}-yes`,
          sourceId: curr.id,
          targetId: next.id,
          label: 'Ya',
          sourceHandle: 'bottom',
          targetHandle: 'top',
        });
        if (i > 1) {
          const prevProc = nodes[i - 1];
          curr.targetNoId = prevProc.id;
          curr.labelNo = 'Tidak';
          connections.push({
            id: `conn-${curr.id}-${prevProc.id}-no`,
            sourceId: curr.id,
            targetId: prevProc.id,
            label: 'Tidak',
            sourceHandle: 'right',
            targetHandle: 'right',
            segmentOffset: 25,
            dashed: true,
          });
        }
      } else {
        curr.nextTargetId = next.id;
        connections.push({
          id: `conn-${curr.id}-${next.id}`,
          sourceId: curr.id,
          targetId: next.id,
          label: i === 0 ? 'Mulai' : 'Lanjut',
          sourceHandle: 'bottom',
          targetHandle: 'top',
        });
      }
    }

    return autoLayoutFlowchart(
      {
        actors,
        lanes,
        nodes,
        connections,
      },
      true
    );
  }

  // Fallback when prosedur is empty but alurFlowchart exists
  if (spo.alurFlowchart && spo.alurFlowchart.length >= 3) {
    const rawAlur = spo.alurFlowchart;
    rawAlur.forEach((item, idx) => {
      const id = item.id ? `node-${item.id}` : `node-alur-${idx + 1}`;
      let type: FlowNodeType = 'process';
      if (item.tipe === 'start') type = 'terminator';
      else if (item.tipe === 'end') type = 'end';
      else if (item.tipe === 'decision') type = 'decision';
      else type = detectNodeTypeFromLabel(item.label, 'process');

      const defaultLaneHint =
        idx === 0 || idx === rawAlur.length - 1
          ? 'customer'
          : type === 'datastore'
          ? 'system'
          : 'admin';

      const laneKey = detectLaneFromText('', item.label, actors, defaultLaneHint);

      nodes.push({
        id,
        lane: mapLaneKey(laneKey),
        type,
        label: item.label,
      });
    });

    for (let i = 0; i < nodes.length - 1; i++) {
      const curr = nodes[i];
      const next = nodes[i + 1];
      const alurMeta = rawAlur[i];

      if (curr.type === 'decision') {
        curr.targetYesId = next.id;
        curr.labelYes = alurMeta?.kondisiYa ? alurMeta.kondisiYa : 'Ya';
        connections.push({
          id: `conn-${curr.id}-${next.id}-yes`,
          sourceId: curr.id,
          targetId: next.id,
          label: 'Ya',
          sourceHandle: 'bottom',
          targetHandle: 'top',
        });

        const loopBackTarget = i > 0 ? nodes[i - 1] : undefined;
        if (loopBackTarget && alurMeta?.kondisiTidak) {
          curr.targetNoId = loopBackTarget.id;
          curr.labelNo = 'Tidak';
          connections.push({
            id: `conn-${curr.id}-${loopBackTarget.id}-no`,
            sourceId: curr.id,
            targetId: loopBackTarget.id,
            label: 'Tidak',
            sourceHandle: 'right',
            targetHandle: 'right',
            segmentOffset: 25,
            dashed: true,
          });
        }
      } else {
        curr.nextTargetId = next.id;
        connections.push({
          id: `conn-${curr.id}-${next.id}`,
          sourceId: curr.id,
          targetId: next.id,
          label: i === 0 ? 'Mulai' : 'Lanjut',
          sourceHandle: 'bottom',
          targetHandle: 'top',
        });
      }
    }

    return autoLayoutFlowchart(
      {
        actors,
        lanes,
        nodes,
        connections,
      },
      true
    );
  }

  // Blank fallback when SPO has not yet been generated
  const defaultNodes: FlowNode[] = [
    {
      id: 'node-start',
      lane: firstCustLane,
      type: 'terminator',
      label: 'Mulai Prosedur',
      nextTargetId: 'node-req',
      arrowLabel: 'Lanjut',
    },
    {
      id: 'node-req',
      lane: firstCustLane,
      type: 'document',
      label: 'Penyerahan Berkas & Permintaan Layanan',
      nextTargetId: 'node-sys-reg',
      arrowLabel: 'Kirim Data',
    },
    {
      id: 'node-sys-reg',
      lane: firstSysLane,
      type: 'datastore',
      label: 'Registrasi & Validasi Otomatis SIMRS',
      nextTargetId: 'node-dec-eligibility',
      arrowLabel: 'Verifikasi',
    },
    {
      id: 'node-dec-eligibility',
      lane: firstAdminLane,
      type: 'decision',
      label: 'Apakah Berkas & Syarat Penjaminan Valid?',
      targetYesId: 'node-action-main',
      labelYes: 'Ya / Sesuai',
      targetNoId: 'node-fix-doc',
      labelNo: 'Tidak / Lengkapi',
    },
    {
      id: 'node-fix-doc',
      lane: firstCustLane,
      type: 'process',
      label: 'Lengkapi Berkas / Klarifikasi Unit Asal',
      nextTargetId: 'node-sys-reg',
      arrowLabel: 'Kirim Ulang',
    },
    {
      id: 'node-action-main',
      lane: firstAdminLane,
      type: 'process',
      label: 'Pelaksanaan Tindakan Utama Medis',
      nextTargetId: 'node-sys-rme',
      arrowLabel: 'Dokumentasi',
    },
    {
      id: 'node-sys-rme',
      lane: firstSysLane,
      type: 'document',
      label: 'Dokumentasi RME & Verifikasi Akhir',
      nextTargetId: 'node-end',
      arrowLabel: 'Selesai',
    },
    {
      id: 'node-end',
      lane: firstCustLane,
      type: 'end',
      label: 'Selesai Prosedur',
    },
  ];

  return autoLayoutFlowchart(
    {
      actors,
      lanes,
      nodes: defaultNodes,
      connections: buildConnectionsFromNodes(defaultNodes),
    },
    true
  );
}

/**
 * Generate an initial neat, structured FlowchartModel from an SPO document
 */
export function generateDefaultFlowchartModel(spo: Partial<SpoDocument>): FlowchartModel {
  if (
    spo.flowchartModel &&
    Array.isArray(spo.flowchartModel.nodes) &&
    spo.flowchartModel.nodes.length > 0
  ) {
    return autoLayoutFlowchart(spo.flowchartModel);
  }
  return buildFlowchartModelFromSpo(spo);
}

/**
 * Returns clean normalized list of lanes from flowchart model
 */
export function getModelLanes(model: Partial<FlowchartModel>): FlowLane[] {
  if (model.lanes && model.lanes.length > 0) {
    return model.lanes;
  }
  const actors = model.actors || {
    admin: 'Petugas Pelaksana Tindakan Medis',
    system: 'Sistem Informasi SIMRS Terpadu',
    customer: 'Pasien dan Keluarga Pemohon',
  };
  return [
    {
      id: 'admin',
      name: actors.admin || 'Petugas Pelaksana Tindakan Medis',
      bgColor: '#dcfce7',
      color: '#166534',
    },
    {
      id: 'system',
      name: actors.system || 'Sistem Informasi SIMRS Terpadu',
      bgColor: '#fef9c3',
      color: '#854d0e',
    },
    {
      id: 'customer',
      name: actors.customer || 'Pasien dan Keluarga Pemohon',
      bgColor: '#dbeafe',
      color: '#1e40af',
    },
  ];
}

/**
 * Automatically computes width & height so long titles NEVER get cut off
 */
export function calculateAutoNodeDimensions(node: FlowNode): { width: number; height: number } {
  const defaultFontSize =
    node.type === 'decision' || node.type === 'document' || node.type === 'datastore' ? 10 : 11;
  const fontSize = node.fontSize || defaultFontSize;
  const labelText = node.label || '';
  const labelLen = labelText.length;

  let baseW = 190;
  let baseH = 64;

  if (node.type === 'start' || node.type === 'end' || node.type === 'terminator') {
    const charsPerLine = Math.max(12, Math.floor(220 / (fontSize * 0.95)));
    const lines = Math.max(1, Math.ceil(labelLen / charsPerLine));
    baseW = Math.max(160, Math.min(340, Math.max(150, Math.ceil(labelLen * 2.3))));
    baseH = Math.max(52, 32 + lines * (fontSize * 1.5));
  } else if (node.type === 'decision' || node.type === 'gateway') {
    const charsPerLine = Math.max(10, Math.floor(180 / (fontSize * 1.05)));
    const lines = Math.max(1, Math.ceil(labelLen / charsPerLine));
    baseW = Math.max(180, Math.min(360, 155 + Math.ceil(labelLen * 2.1)));
    baseH = Math.max(88, 56 + lines * (fontSize * 1.6));
  } else if (node.type === 'document') {
    const charsPerLine = Math.max(14, Math.floor(220 / (fontSize * 0.95)));
    const lines = Math.max(1, Math.ceil(labelLen / charsPerLine));
    baseW = Math.max(180, Math.min(360, 170 + Math.ceil(labelLen * 1.5)));
    baseH = Math.max(66, 42 + lines * (fontSize * 1.4));
  } else if (node.type === 'datastore' || node.type === 'data') {
    const charsPerLine = Math.max(14, Math.floor(220 / (fontSize * 0.95)));
    const lines = Math.max(1, Math.ceil(labelLen / charsPerLine));
    baseW = Math.max(180, Math.min(360, 170 + Math.ceil(labelLen * 1.5)));
    baseH = Math.max(66, 42 + lines * (fontSize * 1.4));
  } else {
    const charsPerLine = Math.max(14, Math.floor(230 / (fontSize * 0.95)));
    const lines = Math.max(1, Math.ceil(labelLen / charsPerLine));
    baseW = Math.max(180, Math.min(380, 170 + Math.ceil(labelLen * 1.35)));
    baseH = Math.max(58, 36 + lines * (fontSize * 1.4));
  }

  return {
    width: Math.max(baseW, node.width || baseW),
    height: Math.max(baseH, node.height || baseH),
  };
}

/**
 * Get standard dimensions for any BPMN symbol type
 */
export function getDefaultNodeDimensions(type: FlowNodeType): { width: number; height: number } {
  switch (type) {
    case 'start':
    case 'end':
    case 'terminator':
      return { width: 165, height: 54 };
    case 'connector':
      return { width: 56, height: 56 };
    case 'decision':
    case 'gateway':
      return { width: 185, height: 96 };
    case 'document':
      return { width: 185, height: 74 };
    case 'data':
    case 'datastore':
      return { width: 185, height: 74 };
    case 'process':
    case 'subprocess':
    default:
      return { width: 195, height: 74 };
  }
}

/**
 * Get center X coordinate for each lane based on dynamic total canvas width
 */
export function getLaneXCenter(
  laneId: string,
  lanes: FlowLane[],
  totalCanvasWidth: number
): number {
  const laneCount = Math.max(1, lanes.length);
  const laneWidth = totalCanvasWidth / laneCount;
  const index = lanes.findIndex((l) => l.id === laneId);
  const activeIndex = index >= 0 ? index : 0;
  return Math.round((activeIndex + 0.5) * laneWidth);
}

/**
 * Extract or build connections array from node links (nextTargetId, targetYesId, targetNoId)
 */
export function buildConnectionsFromNodes(nodes: FlowNode[]): FlowConnection[] {
  const connections: FlowConnection[] = [];
  const existingSet = new Set<string>();

  nodes.forEach((node) => {
    if (node.targetYesId && node.targetYesId !== 'none') {
      const connId = `conn-${node.id}-${node.targetYesId}-yes`;
      if (!existingSet.has(connId)) {
        existingSet.add(connId);
        connections.push({
          id: connId,
          sourceId: node.id,
          targetId: node.targetYesId,
          label: node.labelYes || 'Ya',
          sourceHandle: 'bottom',
          targetHandle: 'top',
        });
      }
    }

    if (node.targetNoId && node.targetNoId !== 'none') {
      const connId = `conn-${node.id}-${node.targetNoId}-no`;
      if (!existingSet.has(connId)) {
        existingSet.add(connId);
        const targetNode = nodes.find((n) => n.id === node.targetNoId);
        const isTargetLeft = targetNode && targetNode.lane === 'admin' && node.lane !== 'admin';
        connections.push({
          id: connId,
          sourceId: node.id,
          targetId: node.targetNoId,
          label: node.labelNo || 'Tidak',
          sourceHandle: isTargetLeft ? 'left' : 'right',
          targetHandle: 'top',
          segmentOffset: 30,
        });
      }
    }

    if (node.nextTargetId && node.nextTargetId !== 'none') {
      const connId = `conn-${node.id}-${node.nextTargetId}`;
      if (!existingSet.has(connId)) {
        existingSet.add(connId);
        connections.push({
          id: connId,
          sourceId: node.id,
          targetId: node.nextTargetId,
          label: node.arrowLabel || '',
          sourceHandle: 'bottom',
          targetHandle: 'top',
        });
      }
    }
  });

  return connections;
}

/**
 * Cleanly organizes all nodes across dynamic swimlanes with calculated coordinates and connections.
 * When forceReposition = true, neatly recalculates lane centers and non-overlapping vertical order.
 */
export function autoLayoutFlowchart(
  model: FlowchartModel,
  forceReposition = false
): FlowchartModel {
  const lanes = getModelLanes(model);
  const laneCount = Math.max(1, lanes.length);
  const canvasWidth = Math.max(960, laneCount * 320);
  const startY = 64;
  const verticalGap = 52;

  let currentY = startY;

  const updatedNodes = model.nodes.map((node) => {
    const dim = calculateAutoNodeDimensions(node);
    const laneCenterX = getLaneXCenter(node.lane, lanes, canvasWidth);
    const calculatedX = Math.round(laneCenterX - dim.width / 2);
    const calculatedY = currentY;
    currentY += dim.height + verticalGap;

    const rawX = forceReposition || node.x === undefined ? calculatedX : node.x;
    const rawY = forceReposition || node.y === undefined ? calculatedY : node.y;

    // Keep safely inside canvas bounds
    const x = Math.max(10, Math.min(canvasWidth - dim.width - 10, rawX));
    const y = Math.max(52, rawY);

    return {
      ...node,
      subLabel: undefined,
      x,
      y,
      width: dim.width,
      height: dim.height,
    };
  });

  // Preserve explicitly emptied connections arrays (`[]`) when user deletes all arrows!
  const rawConnections =
    model.connections !== undefined ? model.connections : buildConnectionsFromNodes(updatedNodes);

  const connections = forceReposition
    ? rawConnections.map((c) => ({ ...c, waypoints: undefined }))
    : rawConnections;

  const maxY = Math.max(...updatedNodes.map((n) => (n.y || 0) + (n.height || 74)), 760);

  return {
    ...model,
    lanes,
    nodes: updatedNodes,
    connections,
    canvasHeight: Math.max(maxY + 90, 820),
    canvasWidth,
  };
}

/**
 * Shared Visio-grade orthogonal / curved / direct connector geometry calculation.
 * Used identically across FlowchartView, SpoFlowchartDocumentEmbed, and SVG Word export.
 */
export function computeConnectionGeometry(
  conn: FlowConnection,
  sourceNode: FlowNode,
  targetNode: FlowNode,
  allConnections: FlowConnection[]
): {
  startPt: FlowPoint;
  endPt: FlowPoint;
  pathD: string;
  midWaypoint: FlowPoint;
  effectiveSourceHandle: 'top' | 'bottom' | 'left' | 'right';
  effectiveTargetHandle: 'top' | 'bottom' | 'left' | 'right';
} {
  const sw = sourceNode.width || 180;
  const sh = sourceNode.height || 72;
  const tw = targetNode.width || 180;
  const th = targetNode.height || 72;

  const sx = sourceNode.x || 0;
  const sy = sourceNode.y || 0;
  const tx = targetNode.x || 0;
  const ty = targetNode.y || 0;

  const scx = sx + sw / 2;
  const scy = sy + sh / 2;
  const tcx = tx + tw / 2;
  const tcy = ty + th / 2;

  let effectiveSourceHandle: 'top' | 'bottom' | 'left' | 'right' = conn.sourceHandle || 'bottom';
  if (!conn.sourceHandle) {
    if (sourceNode.type === 'decision' || sourceNode.type === 'gateway') {
      if (conn.label?.toLowerCase().includes('tidak')) {
        effectiveSourceHandle = tcx >= scx ? 'right' : 'left';
      } else {
        effectiveSourceHandle = 'bottom';
      }
    } else {
      const outConns = allConnections.filter((c) => c.sourceId === conn.sourceId);
      if (outConns.length > 1) {
        const idx = outConns.findIndex((c) => c.id === conn.id);
        effectiveSourceHandle = idx === 0 ? 'bottom' : tcx >= scx ? 'right' : 'left';
      } else {
        if (tcy > scy + 35) effectiveSourceHandle = 'bottom';
        else if (tcy < scy - 35) effectiveSourceHandle = 'top';
        else if (tcx > scx) effectiveSourceHandle = 'right';
        else effectiveSourceHandle = 'left';
      }
    }
  }

  let effectiveTargetHandle: 'top' | 'bottom' | 'left' | 'right' = conn.targetHandle || 'top';
  if (!conn.targetHandle) {
    if (effectiveSourceHandle === 'bottom') {
      effectiveTargetHandle = 'top';
    } else if (effectiveSourceHandle === 'right') {
      effectiveTargetHandle = ty < sy ? 'right' : 'top';
    } else if (effectiveSourceHandle === 'left') {
      effectiveTargetHandle = ty < sy ? 'left' : 'top';
    } else {
      if (tcy > scy + 35) effectiveTargetHandle = 'top';
      else if (tcy < scy - 35) effectiveTargetHandle = 'bottom';
      else if (tcx > scx) effectiveTargetHandle = 'left';
      else effectiveTargetHandle = 'right';
    }
  }

  let startPt: FlowPoint = { x: scx, y: sy + sh };
  if (effectiveSourceHandle === 'top') startPt = { x: scx, y: sy };
  else if (effectiveSourceHandle === 'bottom') startPt = { x: scx, y: sy + sh };
  else if (effectiveSourceHandle === 'left') startPt = { x: sx, y: scy };
  else if (effectiveSourceHandle === 'right') startPt = { x: sx + sw, y: scy };

  let endPt: FlowPoint = { x: tcx, y: ty };
  if (effectiveTargetHandle === 'top') endPt = { x: tcx, y: ty };
  else if (effectiveTargetHandle === 'bottom') endPt = { x: tcx, y: ty + th };
  else if (effectiveTargetHandle === 'left') endPt = { x: tx, y: tcy };
  else if (effectiveTargetHandle === 'right') endPt = { x: tx + tw, y: tcy };

  // Port offset for multiple connections sharing an edge
  const outSameEdge = allConnections.filter(
    (c) => c.sourceId === conn.sourceId && (c.sourceHandle || effectiveSourceHandle) === effectiveSourceHandle
  );
  if (outSameEdge.length > 1) {
    const idx = outSameEdge.findIndex((c) => c.id === conn.id);
    if (idx >= 0) {
      const portOffset = (idx - (outSameEdge.length - 1) / 2) * 26;
      if (effectiveSourceHandle === 'top' || effectiveSourceHandle === 'bottom') {
        startPt.x += portOffset;
      } else {
        startPt.y += portOffset;
      }
    }
  }

  const inSameEdge = allConnections.filter(
    (c) => c.targetId === conn.targetId && (c.targetHandle || effectiveTargetHandle) === effectiveTargetHandle
  );
  if (inSameEdge.length > 1) {
    const idx = inSameEdge.findIndex((c) => c.id === conn.id);
    if (idx >= 0) {
      const portOffset = (idx - (inSameEdge.length - 1) / 2) * 26;
      if (effectiveTargetHandle === 'top' || effectiveTargetHandle === 'bottom') {
        endPt.x += portOffset;
      } else {
        endPt.y += portOffset;
      }
    }
  }

  const routing = conn.routingType || 'orthogonal';
  const segOffset = conn.segmentOffset || 0;
  let pathD = '';
  let midWaypoint: FlowPoint;

  const getDirVec = (h: 'top' | 'bottom' | 'left' | 'right'): FlowPoint => {
    switch (h) {
      case 'top':
        return { x: 0, y: -1 };
      case 'bottom':
        return { x: 0, y: 1 };
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
    }
  };

  const buildOrthoPath = (pts: FlowPoint[]): string => {
    const cleaned: FlowPoint[] = [];
    for (const pt of pts) {
      const rx = Math.round(pt.x);
      const ry = Math.round(pt.y);
      const prev = cleaned[cleaned.length - 1];
      if (prev && prev.x === rx && prev.y === ry) continue;
      if (cleaned.length >= 2) {
        const a = cleaned[cleaned.length - 2];
        const b = cleaned[cleaned.length - 1];
        if ((a.x === b.x && b.x === rx) || (a.y === b.y && b.y === ry)) {
          cleaned[cleaned.length - 1] = { x: rx, y: ry };
          continue;
        }
      }
      cleaned.push({ x: rx, y: ry });
    }
    if (cleaned.length === 0) return `M ${startPt.x} ${startPt.y} L ${endPt.x} ${endPt.y}`;
    return cleaned.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  const sDir = getDirVec(effectiveSourceHandle);
  const tDir = getDirVec(effectiveTargetHandle);
  const sVertical = effectiveSourceHandle === 'top' || effectiveSourceHandle === 'bottom';
  const tVertical = effectiveTargetHandle === 'top' || effectiveTargetHandle === 'bottom';

  if (routing === 'direct') {
    pathD = `M ${startPt.x} ${startPt.y} L ${endPt.x} ${endPt.y}`;
    midWaypoint = {
      x: Math.round((startPt.x + endPt.x) / 2),
      y: Math.round((startPt.y + endPt.y) / 2),
    };
  } else if (routing === 'curved') {
    if (conn.waypoints && conn.waypoints.length > 0) {
      // Solve quadratic Bezier control point so the curve passes directly through waypoints[0] at t=0.5
      const wp = conn.waypoints[0];
      const ctrlX = Math.round(2 * wp.x - 0.5 * (startPt.x + endPt.x));
      const ctrlY = Math.round(2 * wp.y - 0.5 * (startPt.y + endPt.y));
      pathD = `M ${startPt.x} ${startPt.y} Q ${ctrlX} ${ctrlY} ${endPt.x} ${endPt.y}`;
      midWaypoint = wp;
    } else {
      const dist = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);
      const tangent = Math.max(48, Math.min(180, Math.round(dist * 0.45)));
      // Slight perpendicular bow if nodes are collinear so curved mode always looks curved
      const isCollinearVert = Math.abs(startPt.x - endPt.x) < 4 && sVertical && tVertical;
      const isCollinearHoriz = Math.abs(startPt.y - endPt.y) < 4 && !sVertical && !tVertical;
      const bowX = isCollinearVert && segOffset === 0 ? 36 : segOffset;
      const bowY = isCollinearHoriz && segOffset === 0 ? -36 : segOffset;

      const cp1 = {
        x: Math.round(startPt.x + sDir.x * tangent + (sVertical ? bowX : 0)),
        y: Math.round(startPt.y + sDir.y * tangent + (!sVertical ? bowY : 0)),
      };
      const cp2 = {
        x: Math.round(endPt.x + tDir.x * tangent + (tVertical ? bowX : 0)),
        y: Math.round(endPt.y + tDir.y * tangent + (!tVertical ? bowY : 0)),
      };
      pathD = `M ${startPt.x} ${startPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${endPt.x} ${endPt.y}`;
      // Exact point on cubic Bezier at t = 0.5
      midWaypoint = {
        x: Math.round(0.125 * startPt.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * endPt.x),
        y: Math.round(0.125 * startPt.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * endPt.y),
      };
    }
  } else if (conn.waypoints && conn.waypoints.length > 0) {
    if (conn.waypoints.length === 1) {
      const wp = conn.waypoints[0];
      if (sVertical && tVertical) {
        const needsSideDetour =
          (effectiveSourceHandle === 'bottom' && effectiveTargetHandle === 'top' && endPt.y < startPt.y + 12) ||
          (effectiveSourceHandle === 'top' && effectiveTargetHandle === 'bottom' && endPt.y > startPt.y - 12);
        if (needsSideDetour) {
          const exitY = startPt.y + sDir.y * 24;
          const entryY = endPt.y + tDir.y * 24;
          pathD = buildOrthoPath([
            startPt,
            { x: startPt.x, y: exitY },
            { x: wp.x, y: exitY },
            { x: wp.x, y: entryY },
            { x: endPt.x, y: entryY },
            endPt,
          ]);
          midWaypoint = wp;
        } else {
          pathD = buildOrthoPath([
            startPt,
            { x: startPt.x, y: wp.y },
            { x: endPt.x, y: wp.y },
            endPt,
          ]);
          midWaypoint = { x: Math.round((startPt.x + endPt.x) / 2), y: wp.y };
        }
      } else if (!sVertical && !tVertical) {
        const needsVertDetour =
          (effectiveSourceHandle === 'right' && effectiveTargetHandle === 'left' && endPt.x < startPt.x + 12) ||
          (effectiveSourceHandle === 'left' && effectiveTargetHandle === 'right' && endPt.x > startPt.x - 12);
        if (needsVertDetour) {
          const exitX = startPt.x + sDir.x * 28;
          const entryX = endPt.x + tDir.x * 28;
          pathD = buildOrthoPath([
            startPt,
            { x: exitX, y: startPt.y },
            { x: exitX, y: wp.y },
            { x: entryX, y: wp.y },
            { x: entryX, y: endPt.y },
            endPt,
          ]);
          midWaypoint = wp;
        } else {
          pathD = buildOrthoPath([
            startPt,
            { x: wp.x, y: startPt.y },
            { x: wp.x, y: endPt.y },
            endPt,
          ]);
          midWaypoint = { x: wp.x, y: Math.round((startPt.y + endPt.y) / 2) };
        }
      } else if (!sVertical && tVertical) {
        // Horizontal exit -> vertical entry passing orthogonally through wp
        pathD = buildOrthoPath([
          startPt,
          { x: wp.x, y: startPt.y },
          { x: wp.x, y: wp.y },
          { x: endPt.x, y: wp.y },
          endPt,
        ]);
        midWaypoint = wp;
      } else {
        // Vertical exit -> horizontal entry passing orthogonally through wp
        pathD = buildOrthoPath([
          startPt,
          { x: startPt.x, y: wp.y },
          { x: wp.x, y: wp.y },
          { x: wp.x, y: endPt.y },
          endPt,
        ]);
        midWaypoint = wp;
      }
    } else {
      // Multi-waypoint strictly orthogonal routing respecting source & target handle axes
      const wps = conn.waypoints;
      const pts: FlowPoint[] = [startPt];
      let lastHoriz: boolean;

      if (sVertical) {
        pts.push({ x: startPt.x, y: wps[0].y });
        pts.push(wps[0]);
        lastHoriz = wps[0].x !== startPt.x;
      } else {
        pts.push({ x: wps[0].x, y: startPt.y });
        pts.push(wps[0]);
        lastHoriz = wps[0].y === startPt.y;
      }

      for (let i = 1; i < wps.length; i++) {
        const prev = wps[i - 1];
        const curr = wps[i];
        if (lastHoriz) {
          pts.push({ x: prev.x, y: curr.y });
          lastHoriz = curr.x !== prev.x;
        } else {
          pts.push({ x: curr.x, y: prev.y });
          lastHoriz = curr.y === prev.y;
        }
        pts.push(curr);
      }

      const lastWp = wps[wps.length - 1];
      if (tVertical) {
        pts.push({ x: endPt.x, y: lastWp.y });
      } else {
        pts.push({ x: lastWp.x, y: endPt.y });
      }
      pts.push(endPt);

      pathD = buildOrthoPath(pts);
      midWaypoint = wps[Math.floor(wps.length / 2)];
    }
  } else {
    // Auto-orthogonal routing for ALL 16 (sourceHandle x targetHandle) combinations
    const STUB = 26;

    if (effectiveSourceHandle === 'bottom' && effectiveTargetHandle === 'top') {
      if (endPt.y >= startPt.y + 12) {
        const midY = Math.round((startPt.y + endPt.y) / 2) + segOffset;
        pathD = buildOrthoPath([
          startPt,
          { x: startPt.x, y: midY },
          { x: endPt.x, y: midY },
          endPt,
        ]);
        midWaypoint = { x: Math.round((startPt.x + endPt.x) / 2), y: midY };
      } else {
        const exitY = startPt.y + STUB;
        const entryY = endPt.y - STUB;
        const hasHorizGap = tx > sx + sw + 24 || tx + tw + 24 < sx;
        const detourX = hasHorizGap
          ? Math.round((startPt.x + endPt.x) / 2) + segOffset
          : Math.max(sx + sw, tx + tw) + 38 + segOffset;
        pathD = buildOrthoPath([
          startPt,
          { x: startPt.x, y: exitY },
          { x: detourX, y: exitY },
          { x: detourX, y: entryY },
          { x: endPt.x, y: entryY },
          endPt,
        ]);
        midWaypoint = { x: detourX, y: Math.round((exitY + entryY) / 2) };
      }
    } else if (effectiveSourceHandle === 'top' && effectiveTargetHandle === 'bottom') {
      if (endPt.y <= startPt.y - 12) {
        const midY = Math.round((startPt.y + endPt.y) / 2) + segOffset;
        pathD = buildOrthoPath([
          startPt,
          { x: startPt.x, y: midY },
          { x: endPt.x, y: midY },
          endPt,
        ]);
        midWaypoint = { x: Math.round((startPt.x + endPt.x) / 2), y: midY };
      } else {
        const exitY = startPt.y - STUB;
        const entryY = endPt.y + STUB;
        const hasHorizGap = tx > sx + sw + 24 || tx + tw + 24 < sx;
        const detourX = hasHorizGap
          ? Math.round((startPt.x + endPt.x) / 2) + segOffset
          : Math.max(sx + sw, tx + tw) + 38 + segOffset;
        pathD = buildOrthoPath([
          startPt,
          { x: startPt.x, y: exitY },
          { x: detourX, y: exitY },
          { x: detourX, y: entryY },
          { x: endPt.x, y: entryY },
          endPt,
        ]);
        midWaypoint = { x: detourX, y: Math.round((exitY + entryY) / 2) };
      }
    } else if (effectiveSourceHandle === 'right' && effectiveTargetHandle === 'left') {
      if (endPt.x >= startPt.x + 12) {
        const midX = Math.round((startPt.x + endPt.x) / 2) + segOffset;
        pathD = buildOrthoPath([
          startPt,
          { x: midX, y: startPt.y },
          { x: midX, y: endPt.y },
          endPt,
        ]);
        midWaypoint = { x: midX, y: Math.round((startPt.y + endPt.y) / 2) };
      } else {
        const exitX = startPt.x + STUB;
        const entryX = endPt.x - STUB;
        const hasVertGap = ty > sy + sh + 20 || ty + th + 20 < sy;
        const detourY = hasVertGap
          ? Math.round((startPt.y + endPt.y) / 2) + segOffset
          : Math.min(sy, ty) - 34 + segOffset;
        pathD = buildOrthoPath([
          startPt,
          { x: exitX, y: startPt.y },
          { x: exitX, y: detourY },
          { x: entryX, y: detourY },
          { x: entryX, y: endPt.y },
          endPt,
        ]);
        midWaypoint = { x: Math.round((exitX + entryX) / 2), y: detourY };
      }
    } else if (effectiveSourceHandle === 'left' && effectiveTargetHandle === 'right') {
      if (endPt.x <= startPt.x - 12) {
        const midX = Math.round((startPt.x + endPt.x) / 2) + segOffset;
        pathD = buildOrthoPath([
          startPt,
          { x: midX, y: startPt.y },
          { x: midX, y: endPt.y },
          endPt,
        ]);
        midWaypoint = { x: midX, y: Math.round((startPt.y + endPt.y) / 2) };
      } else {
        const exitX = startPt.x - STUB;
        const entryX = endPt.x + STUB;
        const hasVertGap = ty > sy + sh + 20 || ty + th + 20 < sy;
        const detourY = hasVertGap
          ? Math.round((startPt.y + endPt.y) / 2) + segOffset
          : Math.min(sy, ty) - 34 + segOffset;
        pathD = buildOrthoPath([
          startPt,
          { x: exitX, y: startPt.y },
          { x: exitX, y: detourY },
          { x: entryX, y: detourY },
          { x: entryX, y: endPt.y },
          endPt,
        ]);
        midWaypoint = { x: Math.round((exitX + entryX) / 2), y: detourY };
      }
    } else if (effectiveSourceHandle === 'right' && effectiveTargetHandle === 'right') {
      const loopX = Math.max(startPt.x, endPt.x) + 44 + segOffset;
      pathD = buildOrthoPath([
        startPt,
        { x: loopX, y: startPt.y },
        { x: loopX, y: endPt.y },
        endPt,
      ]);
      midWaypoint = { x: loopX, y: Math.round((startPt.y + endPt.y) / 2) };
    } else if (effectiveSourceHandle === 'left' && effectiveTargetHandle === 'left') {
      const loopX = Math.min(startPt.x, endPt.x) - 44 - segOffset;
      pathD = buildOrthoPath([
        startPt,
        { x: loopX, y: startPt.y },
        { x: loopX, y: endPt.y },
        endPt,
      ]);
      midWaypoint = { x: loopX, y: Math.round((startPt.y + endPt.y) / 2) };
    } else if (effectiveSourceHandle === 'top' && effectiveTargetHandle === 'top') {
      const loopY = Math.min(startPt.y, endPt.y) - 34 - segOffset;
      pathD = buildOrthoPath([
        startPt,
        { x: startPt.x, y: loopY },
        { x: endPt.x, y: loopY },
        endPt,
      ]);
      midWaypoint = { x: Math.round((startPt.x + endPt.x) / 2), y: loopY };
    } else if (effectiveSourceHandle === 'bottom' && effectiveTargetHandle === 'bottom') {
      const loopY = Math.max(startPt.y, endPt.y) + 34 + segOffset;
      pathD = buildOrthoPath([
        startPt,
        { x: startPt.x, y: loopY },
        { x: endPt.x, y: loopY },
        endPt,
      ]);
      midWaypoint = { x: Math.round((startPt.x + endPt.x) / 2), y: loopY };
    } else if (!sVertical && tVertical) {
      // Perpendicular H -> V (right/left -> top/bottom)
      const dxToward = (endPt.x - startPt.x) * sDir.x;
      const dyToward = (startPt.y - endPt.y) * tDir.y;

      if (dxToward >= 18 && dyToward >= 18 && segOffset === 0) {
        // Clean 1-corner L-bend
        pathD = buildOrthoPath([startPt, { x: endPt.x, y: startPt.y }, endPt]);
        midWaypoint = { x: Math.round((startPt.x + endPt.x) / 2), y: startPt.y };
      } else {
        const entryY = endPt.y + tDir.y * 24;
        let cornerX: number;
        if (dxToward >= 32) {
          cornerX = startPt.x + sDir.x * Math.max(30, Math.round(dxToward / 2) + segOffset);
        } else {
          cornerX =
            sDir.x > 0
              ? Math.max(startPt.x + 36, tx + tw + 30) + segOffset
              : Math.min(startPt.x - 36, tx - 30) - segOffset;
        }
        pathD = buildOrthoPath([
          startPt,
          { x: cornerX, y: startPt.y },
          { x: cornerX, y: entryY },
          { x: endPt.x, y: entryY },
          endPt,
        ]);
        midWaypoint = { x: cornerX, y: Math.round((startPt.y + entryY) / 2) };
      }
    } else {
      // Perpendicular V -> H (top/bottom -> left/right)
      const dyToward = (endPt.y - startPt.y) * sDir.y;
      const dxToward = (startPt.x - endPt.x) * tDir.x;

      if (dyToward >= 18 && dxToward >= 18 && segOffset === 0) {
        // Clean 1-corner L-bend
        pathD = buildOrthoPath([startPt, { x: startPt.x, y: endPt.y }, endPt]);
        midWaypoint = { x: startPt.x, y: Math.round((startPt.y + endPt.y) / 2) };
      } else {
        const entryX = endPt.x + tDir.x * 32;
        let cornerY: number;
        if (dyToward >= 30) {
          cornerY = startPt.y + sDir.y * Math.max(24, Math.round(dyToward / 2) + segOffset);
        } else {
          cornerY =
            sDir.y > 0
              ? Math.max(startPt.y + 30, ty + th + 28) + segOffset
              : Math.min(startPt.y - 30, ty - 28) - segOffset;
        }
        pathD = buildOrthoPath([
          startPt,
          { x: startPt.x, y: cornerY },
          { x: entryX, y: cornerY },
          { x: entryX, y: endPt.y },
          endPt,
        ]);
        midWaypoint = { x: Math.round((startPt.x + entryX) / 2), y: cornerY };
      }
    }
  }

  return {
    startPt,
    endPt,
    pathD,
    midWaypoint,
    effectiveSourceHandle,
    effectiveTargetHandle,
  };
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLabelLines(text: string, maxChars: number): string[] {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (current.length === 0) {
      current = w;
    } else if (current.length + 1 + w.length <= maxChars) {
      current += ` ${w}`;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

/**
 * Generates a pure-SVG string (no foreignObject!) so HTML5 Canvas can rasterize
 * the flowchart cleanly for Word (.docx) export without browser security tainting.
 */
export function buildFlowchartSvgMarkup(spo: Partial<SpoDocument>): {
  svg: string;
  width: number;
  height: number;
} {
  const model = autoLayoutFlowchart(generateDefaultFlowchartModel(spo));
  const lanes = getModelLanes(model);
  const laneCount = Math.max(1, lanes.length);
  const width = Math.max(960, laneCount * 320);
  const laneWidth = width / laneCount;
  const diagramHeight =
    Math.max(...model.nodes.map((n) => (n.y || 0) + (n.height || 74)), model.canvasHeight || 760) + 60;
  const height = diagramHeight;
  const connections = model.connections || [];

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif">`
  );
  parts.push(`<rect width="${width}" height="${height}" fill="#ffffff"/>`);
  parts.push(`<defs>
    <marker id="docx-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9 z" fill="#1e293b"/>
    </marker>
  </defs>`);

  // Swimlane columns & headers
  lanes.forEach((lane, idx) => {
    const lx = idx * laneWidth;
    parts.push(`<rect x="${lx}" y="42" width="${laneWidth}" height="${diagramHeight - 42}" fill="${lane.bgColor || '#f8fafc'}" fill-opacity="0.25"/>`);
    parts.push(`<rect x="${lx}" y="0" width="${laneWidth}" height="42" fill="${lane.bgColor || '#f1f5f9'}" stroke="#cbd5e1" stroke-width="1"/>`);
    parts.push(`<rect x="${lx}" y="0" width="${laneWidth}" height="4" fill="${lane.color || '#0f766e'}"/>`);
    parts.push(
      `<text x="${lx + laneWidth / 2}" y="25" text-anchor="middle" fill="${lane.color || '#1e293b'}" font-size="12" font-weight="700" letter-spacing="0.5">${escapeXml(`${idx + 1}. ${lane.name.toUpperCase()}`)}</text>`
    );
    if (idx > 0) {
      parts.push(`<line x1="${lx}" y1="0" x2="${lx}" y2="${diagramHeight}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4 3"/>`);
    }
  });
  parts.push(`<line x1="0" y1="42" x2="${width}" y2="42" stroke="#94a3b8" stroke-width="1.5"/>`);

  // Connections
  connections.forEach((conn) => {
    const src = model.nodes.find((n) => n.id === conn.sourceId);
    const tgt = model.nodes.find((n) => n.id === conn.targetId);
    if (!src || !tgt) return;
    const { pathD, midWaypoint } = computeConnectionGeometry(conn, src, tgt, connections);
    const dashAttr = conn.dashed ? ` stroke-dasharray="5,4"` : '';
    const strokeCol = conn.color || '#334155';
    parts.push(
      `<path d="${pathD}" fill="none" stroke="${strokeCol}" stroke-width="2"${dashAttr} marker-end="url(#docx-arrow)"/>`
    );
    if (conn.label) {
      const lbl = conn.label;
      const isNo = lbl.toLowerCase().includes('tidak');
      const isYes = lbl.toLowerCase().includes('ya');
      const badgeBg = isNo ? '#fff1f2' : isYes ? '#ecfdf5' : '#ffffff';
      const badgeStroke = isNo ? '#fda4af' : isYes ? '#6ee7b7' : '#cbd5e1';
      const badgeText = isNo ? '#be123c' : isYes ? '#065f46' : '#334155';
      const bw = Math.max(36, lbl.length * 6.5 + 16);
      parts.push(
        `<rect x="${midWaypoint.x - bw / 2}" y="${midWaypoint.y - 10}" width="${bw}" height="20" rx="10" fill="${badgeBg}" stroke="${badgeStroke}" stroke-width="1"/>`
      );
      parts.push(
        `<text x="${midWaypoint.x}" y="${midWaypoint.y + 3.5}" text-anchor="middle" fill="${badgeText}" font-size="10" font-weight="700">${escapeXml(lbl)}</text>`
      );
    }
  });

  // Nodes
  model.nodes.forEach((node) => {
    const w = node.width || 180;
    const h = node.height || 74;
    const x = node.x || 0;
    const y = node.y || 0;
    const fs = node.fontSize || (node.type === 'decision' || node.type === 'document' || node.type === 'datastore' ? 10 : 11);
    const pxFont = Math.round(fs * 1.25);
    const cx = x + w / 2;
    const cy = y + h / 2;
    let textColor = '#0f172a';
    let fontWeight = '700';
    let maxChars = 22;

    if (node.type === 'start' || node.type === 'terminator') {
      parts.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" ry="${h / 2}" fill="#ecfdf5" stroke="#059669" stroke-width="2.2"/>`
      );
      textColor = '#064e3b';
      maxChars = 18;
    } else if (node.type === 'end') {
      parts.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" ry="${h / 2}" fill="#fff1f2" stroke="#0f172a" stroke-width="3.8"/>`
      );
      textColor = '#4c0519';
      fontWeight = '900';
      maxChars = 18;
    } else if (node.type === 'decision' || node.type === 'gateway') {
      parts.push(
        `<polygon points="${cx},${y + 3} ${x + w - 3},${cy} ${cx},${y + h - 3} ${x + 3},${cy}" fill="#fffbeb" stroke="#d97706" stroke-width="2.5" stroke-linejoin="round"/>`
      );
      textColor = '#451a03';
      maxChars = 16;
    } else if (node.type === 'document') {
      parts.push(
        `<path d="M ${x + 2} ${y + 2} L ${x + w - 2} ${y + 2} L ${x + w - 2} ${y + h - 12} Q ${x + w * 0.75} ${y + h - 20} ${x + w * 0.5} ${y + h - 12} T ${x + 2} ${y + h - 12} Z" fill="#faf5ff" stroke="#7c3aed" stroke-width="2.5" stroke-linejoin="round"/>`
      );
      textColor = '#3b0764';
      maxChars = 20;
    } else if (node.type === 'datastore' || node.type === 'data') {
      parts.push(
        `<path d="M ${x + 3} ${y + 14} C ${x + 3} ${y + 6}, ${x + w - 3} ${y + 6}, ${x + w - 3} ${y + 14} L ${x + w - 3} ${y + h - 14} C ${x + w - 3} ${y + h - 6}, ${x + 3} ${y + h - 6}, ${x + 3} ${y + h - 14} Z" fill="#f0f9ff" stroke="#0284c7" stroke-width="2.5"/>`
      );
      parts.push(
        `<path d="M ${x + 3} ${y + 14} C ${x + 3} ${y + 22}, ${x + w - 3} ${y + 22}, ${x + w - 3} ${y + 14}" fill="none" stroke="#0284c7" stroke-width="2.5"/>`
      );
      textColor = '#082f49';
      maxChars = 20;
    } else {
      parts.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" ry="12" fill="#ffffff" stroke="#334155" stroke-width="2.2"/>`
      );
      textColor = '#0f172a';
      maxChars = 22;
    }

    const lines = wrapLabelLines(node.label, maxChars);
    const lineHeight = pxFont + 3;
    const totalTextHeight = lines.length * lineHeight;
    const startTextY = cy - totalTextHeight / 2 + pxFont * 0.85;
    lines.forEach((line, lIdx) => {
      parts.push(
        `<text x="${cx}" y="${startTextY + lIdx * lineHeight}" text-anchor="middle" fill="${textColor}" font-size="${pxFont}" font-weight="${fontWeight}">${escapeXml(line)}</text>`
      );
    });
  });

  // Outer frame border matching container border
  parts.push(`<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" fill="none" stroke="#94a3b8" stroke-width="1.5"/>`);

  parts.push(`</svg>`);
  return { svg: parts.join(''), width, height };
}
