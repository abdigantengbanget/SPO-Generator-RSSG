export interface DefinisiItem {
  istilah: string;
  penjelasan: string;
}

export interface RuangLingkup {
  pengantar: string;
  unitList: string[];
}

export interface PengertianSection {
  definisi: DefinisiItem[];
  ruangLingkup: RuangLingkup;
}

export interface TujuanItem {
  judulTujuan: string;
  deskripsi: string;
}

export interface RiskRegisterItem {
  kode: string;
  proses: string;
  namaRisiko: string;
  deskripsiRisiko: string;
  mitigasi: string[];
}

export interface KebijakanSection {
  ketentuan: string[];
  riskRegister: RiskRegisterItem[];
}

export interface ProsedurItem {
  noProses: string;
  judulTahapan: string;
  langkah: string[];
  leadTime: string;
  pelaksana: string;
}

export interface TanggungJawabUnitItem {
  unit: string;
  tugas: string[];
}

export interface RiwayatPerubahanItem {
  tanggal: string;
  versi: string;
  deskripsi: string;
}

export interface FormulirPendukungSection {
  dokumenTerkait: string[];
  riwayatPerubahan: RiwayatPerubahanItem[];
}

export type FlowNodeType =
  | "terminator"
  | "process"
  | "decision"
  | "document"
  | "data"
  | "connector"
  | "start"
  | "end"
  | "gateway"
  | "datastore"
  | "subprocess";

export type FlowLaneKey = string;

export interface FlowLane {
  id: string;
  name: string;
  bgColor?: string;
  color?: string;
}

export interface FlowPoint {
  x: number;
  y: number;
}

export interface FlowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string; // e.g. 'Ya', 'Tidak', 'Kirim', 'Lanjut'
  waypoints?: FlowPoint[]; // custom bendpoints for dragging arrows
  sourceHandle?: "top" | "bottom" | "left" | "right";
  targetHandle?: "top" | "bottom" | "left" | "right";
  routingType?: "orthogonal" | "waypoints" | "direct" | "curved";
  segmentOffset?: number; // pergeseran posisi garis panah tengah (Y atau X)
  dashed?: boolean;
  color?: string;
}

export interface FlowNode {
  id: string;
  lane: FlowLaneKey;
  type: FlowNodeType;
  label: string;
  subLabel?: string;
  leadTime?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number; // Ukuran teks dalam pt
  // Connection / Panah configuration
  nextTargetId?: string; // target node ID for standard flow
  arrowLabel?: string; // label on standard arrow (e.g. 'Kirim', 'Verifikasi', 'Lanjut')
  // For Decision symbol
  targetYesId?: string;
  labelYes?: string; // default: 'Ya'
  targetNoId?: string;
  labelNo?: string; // default: 'Tidak'
}

export interface FlowchartModel {
  actors: {
    admin: string;
    system: string;
    customer: string;
    [key: string]: string;
  };
  lanes?: FlowLane[];
  nodes: FlowNode[];
  connections?: FlowConnection[];
  canvasHeight?: number;
  canvasWidth?: number;
}

export interface AlurNode {
  id: string;
  noProsesTerkait?: string;
  tipe: "start" | "process" | "decision" | "end";
  label: string;
  subText?: string;
  kondisiYa?: string;
  kondisiTidak?: string;
}

export interface SpoMetadata {
  institusi: string;
  noDokumen: string;
  noRevisi: string;
  tanggalTerbit: string;
  kepalaRumahSakit: string;
  kepalaRumahSakitJabatan?: string;
  drafter: {
    nama: string;
    jabatan: string;
  };
  creator: {
    nama: string;
    jabatan: string;
  };
  reviewer: {
    nama: string;
    jabatan: string;
  };
}

export interface SpoDocument {
  judulSpo: string;
  metadata: SpoMetadata;
  pengertian: PengertianSection;
  tujuan: TujuanItem[];
  kebijakan: KebijakanSection;
  prosedur: ProsedurItem[];
  tanggungJawabUnit: TanggungJawabUnitItem[];
  formulirPendukung: FormulirPendukungSection;
  alurFlowchart?: AlurNode[];
  flowchartModel?: FlowchartModel;
}
