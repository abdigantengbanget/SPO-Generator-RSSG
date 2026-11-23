import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  SpoDocument,
  FlowchartModel,
  FlowNode,
  FlowNodeType,
  FlowLane,
  FlowConnection,
  FlowPoint,
} from "../types/spo";
import {
  CheckCircle,
  Layers,
  MousePointer,
  Hand,
  GitBranch,
  Circle,
  Square,
  FileText,
  Database,
  StopCircle,
  HelpCircle,
  Trash2,
  Type,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Spline,
  Users,
  X,
  Grid,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  ArrowLeftRight,
  Maximize2,
  AlertCircle,
} from "lucide-react";
import {
  generateDefaultFlowchartModel,
  autoLayoutFlowchart,
  computeConnectionGeometry,
  getDefaultNodeDimensions,
  getModelLanes,
  getLaneXCenter,
  LANE_PALETTES,
  calculateAutoNodeDimensions,
  SYMBOL_DEFINITIONS,
} from "../utils/flowchartHelper";
import { FlowchartNodeShape } from "./FlowchartNodeShape";
import { getInstitutionBranding } from "../utils/institutionBranding";

interface FlowchartViewProps {
  spo: SpoDocument;
  onChange?: (updated: SpoDocument) => void;
}

const MAX_HISTORY = 40;

const SHAPE_OPTIONS: {
  type: FlowNodeType;
  label: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    type: "process",
    label: "Proses",
    icon: <Square className="w-3.5 h-3.5 text-slate-700" />,
    accent: "border-slate-300 hover:border-blue-500",
  },
  {
    type: "decision",
    label: "Keputusan",
    icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600" />,
    accent: "border-amber-200 hover:border-amber-500",
  },
  {
    type: "start",
    label: "Mulai",
    icon: <Circle className="w-3.5 h-3.5 text-emerald-600" />,
    accent: "border-emerald-200 hover:border-emerald-500",
  },
  {
    type: "end",
    label: "Selesai",
    icon: <StopCircle className="w-3.5 h-3.5 text-rose-600" />,
    accent: "border-rose-200 hover:border-rose-500",
  },
  {
    type: "document",
    label: "Dokumen",
    icon: <FileText className="w-3.5 h-3.5 text-purple-600" />,
    accent: "border-purple-200 hover:border-purple-500",
  },
  {
    type: "datastore",
    label: "SIMRS",
    icon: <Database className="w-3.5 h-3.5 text-sky-600" />,
    accent: "border-sky-200 hover:border-sky-500",
  },
  {
    type: "subprocess",
    label: "Subproses",
    icon: <Layers className="w-3.5 h-3.5 text-indigo-600" />,
    accent: "border-indigo-200 hover:border-indigo-500",
  },
];

function getPortPoint(
  node: FlowNode,
  handle: "top" | "bottom" | "left" | "right",
): FlowPoint {
  const x = node.x || 0;
  const y = node.y || 0;
  const w = node.width || 180;
  const h = node.height || 74;
  switch (handle) {
    case "top":
      return { x: x + w / 2, y };
    case "right":
      return { x: x + w, y: y + h / 2 };
    case "left":
      return { x, y: y + h / 2 };
    case "bottom":
    default:
      return { x: x + w / 2, y: y + h };
  }
}

export const FlowchartView: React.FC<FlowchartViewProps> = ({
  spo,
  onChange,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const isDirectEditMode = true;
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isSnapToGrid, setIsSnapToGrid] = useState<boolean>(true);
  const [isStencilSidebarOpen, setIsStencilSidebarOpen] =
    useState<boolean>(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  // Undo / Redo history stacks
  const [historyPast, setHistoryPast] = useState<FlowchartModel[]>([]);
  const [historyFuture, setHistoryFuture] = useState<FlowchartModel[]>([]);
  const lastTextEditTimeRef = useRef<number>(0);
  const toastTimerRef = useRef<number | null>(null);

  // Smooth drag local draft model (commits 1 undo step on mouseUp)
  const [draftModel, setDraftModel] = useState<FlowchartModel | null>(null);
  const draftModelRef = useRef<FlowchartModel | null>(null);
  const preDragModelRef = useRef<FlowchartModel | null>(null);

  // Smart alignment guide lines during node drag
  const [alignmentGuides, setAlignmentGuides] = useState<{
    x: number | null;
    y: number | null;
  }>({ x: null, y: null });

  // Modal states for Tambah Panah and Kelola/Hapus Panah
  const [isAddArrowModalOpen, setIsAddArrowModalOpen] =
    useState<boolean>(false);
  const [isManageArrowsModalOpen, setIsManageArrowsModalOpen] =
    useState<boolean>(false);
  const [addArrowError, setAddArrowError] = useState<string | null>(null);
  const [newArrowSource, setNewArrowSource] = useState<string>("");
  const [newArrowTarget, setNewArrowTarget] = useState<string>("");
  const [newArrowLabel, setNewArrowLabel] = useState<string>("");
  const [newArrowSourceHandle, setNewArrowSourceHandle] = useState<
    "bottom" | "right" | "left" | "top"
  >("bottom");
  const [newArrowTargetHandle, setNewArrowTargetHandle] = useState<
    "top" | "right" | "left" | "bottom"
  >("top");
  const [newArrowRouting, setNewArrowRouting] = useState<
    "orthogonal" | "direct" | "curved"
  >("orthogonal");

  // Active Tool: 'select' (default) | 'hand' (pan) | 'connect' (drawing arrow)
  const [activeTool, setActiveTool] = useState<"select" | "hand" | "connect">(
    "select",
  );

  // Connection in progress state
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [connectSourceHandle, setConnectSourceHandle] = useState<
    "top" | "bottom" | "left" | "right"
  >("bottom");
  const [connectMousePos, setConnectMousePos] = useState<FlowPoint | null>(
    null,
  );

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartMouse, setDragStartMouse] = useState<FlowPoint>({
    x: 0,
    y: 0,
  });
  const [dragStartNodePos, setDragStartNodePos] = useState<FlowPoint>({
    x: 0,
    y: 0,
  });

  // Node Resizing State
  const [resizingNode, setResizingNode] = useState<{
    nodeId: string;
    dir: "se" | "e" | "s";
    startMouse: FlowPoint;
    startW: number;
    startH: number;
  } | null>(null);

  // Waypoint Dragging State
  const [draggingWaypoint, setDraggingWaypoint] = useState<{
    connId: string;
    waypointIndex: number;
    startMouse: FlowPoint;
    startPos: FlowPoint;
  } | null>(null);

  // Canvas Pan state for Hand tool
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState<FlowPoint>({ x: 0, y: 0 });
  const [panStartMouse, setPanStartMouse] = useState<FlowPoint>({ x: 0, y: 0 });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const arrowLabelInputRef = useRef<HTMLInputElement>(null);
  const nodeLabelInputRef = useRef<HTMLTextAreaElement>(null);

  // Base model from SPO props
  const baseFlowchartModel: FlowchartModel = useMemo(() => {
    const model = generateDefaultFlowchartModel(spo);
    return autoLayoutFlowchart(model);
  }, [spo]);

  // Active displayed model (local draft during active drag, else prop model)
  const flowchartModel = draftModel || baseFlowchartModel;
  const { actors, nodes, connections = [] } = flowchartModel;

  const lanes: FlowLane[] = useMemo(() => {
    return getModelLanes(flowchartModel);
  }, [flowchartModel]);

  const canvasWidth = useMemo(() => {
    return Math.max(960, lanes.length * 320);
  }, [lanes.length]);

  const showToast = useCallback((msg: string) => {
    setExportNotice(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setExportNotice(null);
    }, 3000);
  }, []);

  const pushModel = useCallback(
    (updatedModel: FlowchartModel) => {
      if (onChange) {
        onChange({
          ...spo,
          flowchartModel: updatedModel,
        });
      }
    },
    [onChange, spo],
  );

  // Commit model update with clean Undo history snapshot
  const commitModelChange = useCallback(
    (
      updatedModel: FlowchartModel,
      recordHistory: boolean | "coalesce" = true,
    ) => {
      if (recordHistory === true) {
        setHistoryPast((prev) => [
          ...prev.slice(-(MAX_HISTORY - 1)),
          baseFlowchartModel,
        ]);
        setHistoryFuture([]);
      } else if (recordHistory === "coalesce") {
        const now = Date.now();
        if (now - lastTextEditTimeRef.current > 900) {
          setHistoryPast((prev) => [
            ...prev.slice(-(MAX_HISTORY - 1)),
            baseFlowchartModel,
          ]);
          setHistoryFuture([]);
        }
        lastTextEditTimeRef.current = now;
      }
      pushModel(updatedModel);
    },
    [baseFlowchartModel, pushModel],
  );

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((prev) => prev.slice(0, -1));
    setHistoryFuture((prev) => [
      baseFlowchartModel,
      ...prev.slice(0, MAX_HISTORY - 1),
    ]);
    pushModel(previous);
    if (
      selectedNodeId &&
      !previous.nodes.some((n) => n.id === selectedNodeId)
    ) {
      setSelectedNodeId(null);
    }
    if (
      selectedConnectionId &&
      !(previous.connections || []).some((c) => c.id === selectedConnectionId)
    ) {
      setSelectedConnectionId(null);
    }
    showToast("Perubahan dibatalkan (Undo).");
  }, [
    baseFlowchartModel,
    historyPast,
    pushModel,
    selectedConnectionId,
    selectedNodeId,
    showToast,
  ]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((prev) => prev.slice(1));
    setHistoryPast((prev) => [
      ...prev.slice(-(MAX_HISTORY - 1)),
      baseFlowchartModel,
    ]);
    pushModel(next);
    showToast("Perubahan dikembalikan (Redo).");
  }, [baseFlowchartModel, historyFuture, pushModel, showToast]);

  // ==============================================================
  // LANE (KOLOM AKTOR) CRUD: TAMBAH, HAPUS, UBAH NAMA, GESER URUTAN
  // ==============================================================
  const handleAddLane = () => {
    const newLaneIndex = lanes.length;
    const palette = LANE_PALETTES[newLaneIndex % LANE_PALETTES.length];
    const newLaneId = `lane_${Date.now()}`;
    const newLaneName = `Kolom Aktor ${newLaneIndex + 1}`;
    const updatedLanes: FlowLane[] = [
      ...lanes,
      {
        id: newLaneId,
        name: newLaneName,
        bgColor: palette.bgColor,
        color: palette.color,
      },
    ];
    const updatedModel = autoLayoutFlowchart({
      ...flowchartModel,
      lanes: updatedLanes,
      actors: {
        ...actors,
        [newLaneId]: newLaneName,
      },
    });
    commitModelChange(updatedModel);
    showToast(
      `Kolom aktor #${newLaneIndex + 1} ("${newLaneName}") ditambahkan.`,
    );
  };

  const handleDeleteLane = (laneId: string) => {
    if (lanes.length <= 1) {
      showToast("Minimal harus ada 1 kolom aktor dalam diagram alur.");
      return;
    }
    const targetLane = lanes.find((l) => l.id === laneId);
    const remainingLanes = lanes.filter((l) => l.id !== laneId);
    const fallbackLaneId = remainingLanes[0].id;
    const newCanvasWidth = Math.max(960, remainingLanes.length * 320);
    const fallbackCenter = getLaneXCenter(
      fallbackLaneId,
      remainingLanes,
      newCanvasWidth,
    );

    const updatedNodes = nodes.map((node) => {
      if (node.lane !== laneId) return node;
      const w = node.width || 180;
      return {
        ...node,
        lane: fallbackLaneId,
        x: Math.round(fallbackCenter - w / 2),
      };
    });

    const updatedModel = autoLayoutFlowchart({
      ...flowchartModel,
      lanes: remainingLanes,
      nodes: updatedNodes,
    });
    commitModelChange(updatedModel);
    showToast(`Kolom "${targetLane?.name || ""}" dihapus.`);
  };

  const handleMoveLane = (laneId: string, direction: -1 | 1) => {
    const idx = lanes.findIndex((l) => l.id === laneId);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= lanes.length) return;

    const reordered = [...lanes];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    // Reposition nodes horizontally so they follow their assigned lane
    const updatedNodes = nodes.map((n) => {
      const w = n.width || 180;
      const center = getLaneXCenter(n.lane, reordered, canvasWidth);
      return {
        ...n,
        x: Math.round(center - w / 2),
      };
    });

    const updatedModel = autoLayoutFlowchart({
      ...flowchartModel,
      lanes: reordered,
      nodes: updatedNodes,
    });
    commitModelChange(updatedModel);
    showToast(`Urutan kolom "${moved.name}" dipindahkan.`);
  };

  const handleUpdateLaneName = (laneId: string, newName: string) => {
    const updatedLanes = lanes.map((l) =>
      l.id === laneId ? { ...l, name: newName } : l,
    );
    commitModelChange(
      {
        ...flowchartModel,
        lanes: updatedLanes,
        actors: {
          ...actors,
          [laneId]: newName,
        },
      },
      "coalesce",
    );
  };

  // ==============================================================
  // NODE CRUD & MANIPULATION
  // ==============================================================
  const handleUpdateNode = (
    nodeId: string,
    patch: Partial<FlowNode>,
    historyMode: boolean | "coalesce" = true,
  ) => {
    const updatedNodes = nodes.map((n) => {
      if (n.id !== nodeId) return n;
      const next = { ...n, ...patch };
      // When switching lane explicitly via menu/inspector, center X into target lane automatically
      if (patch.lane && patch.lane !== n.lane && patch.x === undefined) {
        const w = next.width || 180;
        const centerX = getLaneXCenter(patch.lane, lanes, canvasWidth);
        next.x = Math.max(
          10,
          Math.min(canvasWidth - w - 10, Math.round(centerX - w / 2)),
        );
      }
      return next;
    });
    commitModelChange(
      {
        ...flowchartModel,
        nodes: updatedNodes,
      },
      historyMode,
    );
  };

  const handleAutoFitNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const fitted = calculateAutoNodeDimensions({
      ...node,
      width: undefined,
      height: undefined,
    });
    const laneCenter = getLaneXCenter(node.lane, lanes, canvasWidth);
    const nextX = Math.max(
      10,
      Math.min(
        canvasWidth - fitted.width - 10,
        Math.round(laneCenter - fitted.width / 2),
      ),
    );
    handleUpdateNode(nodeId, {
      width: fitted.width,
      height: fitted.height,
      x: nextX,
    });
    showToast("Ukuran kotak disesuaikan otomatis dengan panjang teks.");
  };

  const handleAddNodeAt = useCallback(
    (type: FlowNodeType, laneId: string, x: number, y: number) => {
      const newId = `node-${Date.now()}`;
      const labels: Record<string, string> = {
        start: "Mulai Prosedur",
        process: "Langkah Aktivitas Baru",
        decision: "Apakah Syarat Terpenuhi?",
        document: "Formulir / Lembar Verifikasi",
        datastore: "Input / Simpan Data SIMRS",
        end: "Selesai Prosedur",
        subprocess: "Prosedur Teknis Khusus",
      };
      const dim = getDefaultNodeDimensions(type);
      const safeX = Math.max(10, Math.min(canvasWidth - dim.width - 10, x));
      const safeY = Math.max(54, y);
      const newNode: FlowNode = {
        id: newId,
        lane: laneId,
        type,
        label: labels[type] || "Langkah Prosedur Baru",
        x: safeX,
        y: safeY,
        width: dim.width,
        height: dim.height,
      };
      commitModelChange({
        ...flowchartModel,
        nodes: [...nodes, newNode],
      });
      setSelectedNodeId(newId);
      setSelectedConnectionId(null);
      setActiveTool("select");
      showToast(
        `Simbol ${SYMBOL_DEFINITIONS[type]?.label || type} ditambahkan ke kanvas.`,
      );
    },
    [canvasWidth, commitModelChange, flowchartModel, nodes, showToast],
  );

  const handleAddNodeFromPalette = (type: FlowNodeType) => {
    const defaultLaneId = lanes[0]?.id || "admin";
    const dim = getDefaultNodeDimensions(type);
    const laneCenter = getLaneXCenter(defaultLaneId, lanes, canvasWidth);
    const defaultX = Math.round(laneCenter - dim.width / 2);
    const maxY = nodes.reduce(
      (acc, n) => Math.max(acc, (n.y || 0) + (n.height || 74)),
      64,
    );
    const defaultY = nodes.length === 0 ? 70 : maxY + 46;
    handleAddNodeAt(type, defaultLaneId, defaultX, defaultY);
  };

  const handleDropStencil = (e: React.DragEvent) => {
    e.preventDefault();
    const type = (e.dataTransfer.getData("application/visio-shape") ||
      e.dataTransfer.getData("text/plain")) as FlowNodeType;
    if (!type || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const rawX = (e.clientX - rect.left) / scale;
    const rawY = (e.clientY - rect.top) / scale;
    const gridSize = isSnapToGrid ? 10 : 1;
    const dim = getDefaultNodeDimensions(type);
    const x = Math.max(
      10,
      Math.min(
        canvasWidth - dim.width - 10,
        Math.round((rawX - dim.width / 2) / gridSize) * gridSize,
      ),
    );
    const y = Math.max(
      54,
      Math.round((rawY - dim.height / 2) / gridSize) * gridSize,
    );

    const laneCount = Math.max(1, lanes.length);
    const laneWidth = canvasWidth / laneCount;
    const laneIndex = Math.min(
      laneCount - 1,
      Math.max(0, Math.floor((x + dim.width / 2) / laneWidth)),
    );
    const targetLane = lanes[laneIndex]?.id || lanes[0]?.id || "admin";

    handleAddNodeAt(type, targetLane, x, y);
  };

  // Double-click empty swimlane canvas to insert a Process node at cursor
  const handleDoubleClickCanvas = (e: React.MouseEvent) => {
    if (activeTool !== "select" || !canvasContainerRef.current) return;
    const target = e.target as HTMLElement;
    // Do not trigger if user double-clicked inside an existing node, input, or button
    if (
      target.closest('[data-flow-node="true"]') ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea")
    ) {
      return;
    }
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const rawX = (e.clientX - rect.left) / scale;
    const rawY = (e.clientY - rect.top) / scale;
    if (rawY < 46) return; // clicked inside lane header bar

    const gridSize = isSnapToGrid ? 10 : 1;
    const dim = getDefaultNodeDimensions("process");
    const x = Math.max(
      10,
      Math.min(
        canvasWidth - dim.width - 10,
        Math.round((rawX - dim.width / 2) / gridSize) * gridSize,
      ),
    );
    const y = Math.max(
      54,
      Math.round((rawY - dim.height / 2) / gridSize) * gridSize,
    );

    const laneCount = Math.max(1, lanes.length);
    const laneWidth = canvasWidth / laneCount;
    const laneIndex = Math.min(
      laneCount - 1,
      Math.max(0, Math.floor((x + dim.width / 2) / laneWidth)),
    );
    const targetLane = lanes[laneIndex]?.id || lanes[0]?.id || "admin";

    handleAddNodeAt("process", targetLane, x, y);
  };

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const src = nodes.find((n) => n.id === nodeId);
      if (!src) return;
      const newId = `node-${Date.now()}`;
      const newX = Math.min(
        canvasWidth - (src.width || 180) - 10,
        (src.x || 50) + 30,
      );
      const newY = (src.y || 80) + 90;
      const cloned: FlowNode = {
        ...src,
        id: newId,
        label: `${src.label} (Salinan)`,
        x: newX,
        y: newY,
        nextTargetId: undefined,
        targetYesId: undefined,
        targetNoId: undefined,
      };
      commitModelChange({
        ...flowchartModel,
        nodes: [...nodes, cloned],
      });
      setSelectedNodeId(newId);
      setSelectedConnectionId(null);
      showToast("Simbol berhasil diduplikat.");
    },
    [canvasWidth, commitModelChange, flowchartModel, nodes, showToast],
  );

  const handleQuickAppend = (sourceId: string, appendType: FlowNodeType) => {
    const sourceNode = nodes.find((n) => n.id === sourceId);
    if (!sourceNode) return;

    const newId = `node-${Date.now()}`;
    const dim = getDefaultNodeDimensions(appendType);

    const newX = Math.max(
      10,
      Math.min(
        canvasWidth - dim.width - 10,
        Math.round(
          (sourceNode.x || 390) + ((sourceNode.width || 180) - dim.width) / 2,
        ),
      ),
    );
    const newY = (sourceNode.y || 100) + (sourceNode.height || 74) + 52;

    const labels: Record<string, string> = {
      process: "Langkah Tindak Lanjut",
      decision: "Apakah Hasil Memenuhi Standar?",
      document: "Formulir / Berkas Terkait",
      datastore: "Simpan Data ke SIMRS",
      end: "Prosedur Selesai",
    };

    const newNode: FlowNode = {
      id: newId,
      lane: sourceNode.lane,
      type: appendType,
      label: labels[appendType] || "Tahapan Baru",
      x: newX,
      y: newY,
      width: dim.width,
      height: dim.height,
    };

    const newConnection: FlowConnection = {
      id: `conn-${sourceId}-${newId}-${Date.now()}`,
      sourceId,
      targetId: newId,
      label: sourceNode.type === "decision" ? "Ya" : undefined,
      sourceHandle: "bottom",
      targetHandle: "top",
    };

    commitModelChange({
      ...flowchartModel,
      nodes: [...nodes, newNode],
      connections: [...connections, newConnection],
    });
    setSelectedNodeId(newId);
    setSelectedConnectionId(null);
    showToast("Langkah berikutnya ditambahkan dan otomatis terhubung panah.");
  };

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (nodes.length <= 2) {
        showToast("Diagram alur minimal harus memiliki 2 simbol.");
        return;
      }
      const updatedNodes = nodes
        .filter((n) => n.id !== nodeId)
        .map((n) => ({
          ...n,
          nextTargetId: n.nextTargetId === nodeId ? undefined : n.nextTargetId,
          targetYesId: n.targetYesId === nodeId ? undefined : n.targetYesId,
          targetNoId: n.targetNoId === nodeId ? undefined : n.targetNoId,
        }));
      const updatedConnections = connections.filter(
        (c) => c.sourceId !== nodeId && c.targetId !== nodeId,
      );
      commitModelChange({
        ...flowchartModel,
        nodes: updatedNodes,
        connections: updatedConnections,
      });
      setSelectedNodeId(null);
      showToast("Simbol dan panah terkait dihapus.");
    },
    [commitModelChange, connections, flowchartModel, nodes, showToast],
  );

  // ==============================================================
  // ARROW (CONNECTION) CRUD, REVERSE, SEPARATION & BENDPOINTS
  // ==============================================================
  const handleStartConnect = (
    sourceId: string,
    handle?: "top" | "bottom" | "left" | "right",
  ) => {
    setActiveTool("connect");
    setConnectSourceId(sourceId);
    setConnectSourceHandle(handle || "bottom");
    setSelectedNodeId(sourceId);
    setSelectedConnectionId(null);
    showToast(
      "Klik simbol atau titik pin (+) tujuan untuk menyambungkan panah (Esc untuk batal).",
    );
  };

  const handleFinishConnect = (
    targetId: string,
    explicitTargetHandle?: "top" | "bottom" | "left" | "right",
  ) => {
    if (!connectSourceId || connectSourceId === targetId) {
      setConnectSourceId(null);
      setConnectMousePos(null);
      setActiveTool("select");
      return;
    }

    const sourceNode = nodes.find((n) => n.id === connectSourceId);
    const targetNode = nodes.find((n) => n.id === targetId);
    let resolvedTargetHandle: "top" | "bottom" | "left" | "right" =
      explicitTargetHandle || "top";
    if (!explicitTargetHandle && sourceNode && targetNode) {
      const sy = sourceNode.y || 0;
      const ty = targetNode.y || 0;
      const sx = sourceNode.x || 0;
      const tx = targetNode.x || 0;
      if (connectSourceHandle === "right") {
        resolvedTargetHandle = ty < sy ? "right" : tx > sx ? "left" : "top";
      } else if (connectSourceHandle === "left") {
        resolvedTargetHandle = ty < sy ? "left" : tx < sx ? "right" : "top";
      } else if (connectSourceHandle === "top") {
        resolvedTargetHandle = "bottom";
      } else {
        resolvedTargetHandle = "top";
      }
    }

    const newConnId = `conn-${connectSourceId}-${targetId}-${Date.now()}`;
    const newConn: FlowConnection = {
      id: newConnId,
      sourceId: connectSourceId,
      targetId,
      label: sourceNode?.type === "decision" ? "Ya" : "",
      sourceHandle: connectSourceHandle,
      targetHandle: resolvedTargetHandle,
    };

    commitModelChange({
      ...flowchartModel,
      connections: [...connections, newConn],
    });

    setConnectSourceId(null);
    setConnectMousePos(null);
    setActiveTool("select");
    setSelectedConnectionId(newConnId);
    setSelectedNodeId(null);
    showToast("Tanda panah baru terhubung.");
  };

  const handlePinClick = (
    nodeId: string,
    handle: "top" | "bottom" | "left" | "right",
  ) => {
    if (
      activeTool === "connect" &&
      connectSourceId &&
      connectSourceId !== nodeId
    ) {
      handleFinishConnect(nodeId, handle);
      return;
    }
    handleStartConnect(nodeId, handle);
  };

  const handleOpenAddArrowModal = (
    defaultSourceId?: string,
    defaultTargetId?: string,
  ) => {
    const srcId = defaultSourceId || (nodes.length > 0 ? nodes[0].id : "");
    const tgtId =
      defaultTargetId ||
      (nodes.length > 1
        ? nodes[0].id === srcId
          ? nodes[1].id
          : nodes[0].id
        : nodes[0]?.id || "");
    setNewArrowSource(srcId);
    setNewArrowTarget(tgtId);
    setNewArrowLabel("");
    setNewArrowSourceHandle("bottom");
    setNewArrowTargetHandle("top");
    setNewArrowRouting("orthogonal");
    setAddArrowError(null);
    setIsAddArrowModalOpen(true);
  };

  const handleConfirmAddArrow = () => {
    if (!newArrowSource || !newArrowTarget) {
      setAddArrowError("Pilih simbol asal dan simbol tujuan terlebih dahulu.");
      return;
    }
    if (newArrowSource === newArrowTarget) {
      setAddArrowError("Simbol asal dan simbol tujuan tidak boleh sama.");
      return;
    }
    const newConnId = `conn-${newArrowSource}-${newArrowTarget}-${Date.now()}`;
    const newConn: FlowConnection = {
      id: newConnId,
      sourceId: newArrowSource,
      targetId: newArrowTarget,
      label: newArrowLabel.trim() || undefined,
      sourceHandle: newArrowSourceHandle,
      targetHandle: newArrowTargetHandle,
      routingType: newArrowRouting,
    };

    commitModelChange({
      ...flowchartModel,
      connections: [...connections, newConn],
    });
    setSelectedConnectionId(newConnId);
    setSelectedNodeId(null);
    setAddArrowError(null);
    setIsAddArrowModalOpen(false);
    showToast("Tanda panah baru ditambahkan dan terhubung.");
  };

  const handleDeleteConnection = useCallback(
    (connId: string) => {
      const conn = connections.find((c) => c.id === connId);
      const updatedConnections = connections.filter((c) => c.id !== connId);

      let updatedNodes = nodes;
      if (conn) {
        updatedNodes = nodes.map((n) => {
          if (n.id === conn.sourceId) {
            const patch: Partial<FlowNode> = {};
            if (n.nextTargetId === conn.targetId)
              patch.nextTargetId = undefined;
            if (n.targetYesId === conn.targetId) patch.targetYesId = undefined;
            if (n.targetNoId === conn.targetId) patch.targetNoId = undefined;
            return { ...n, ...patch };
          }
          return n;
        });
      }

      commitModelChange({
        ...flowchartModel,
        nodes: updatedNodes,
        connections: updatedConnections,
      });
      if (selectedConnectionId === connId) {
        setSelectedConnectionId(null);
      }
      showToast("Tanda panah dihapus dari diagram.");
    },
    [
      commitModelChange,
      connections,
      flowchartModel,
      nodes,
      selectedConnectionId,
      showToast,
    ],
  );

  const handleReverseConnection = (connId: string) => {
    const updated = connections.map((c) => {
      if (c.id !== connId) return c;
      return {
        ...c,
        sourceId: c.targetId,
        targetId: c.sourceId,
        sourceHandle: c.targetHandle || "bottom",
        targetHandle: c.sourceHandle || "top",
        waypoints: c.waypoints ? [...c.waypoints].reverse() : undefined,
      };
    });
    commitModelChange({ ...flowchartModel, connections: updated });
    showToast("Arah tanda panah dibalik.");
  };

  const handleOffsetConnection = (
    connId: string,
    delta: number,
    resetZero = false,
  ) => {
    const conn = connections.find((c) => c.id === connId);
    if (!conn) return;
    const newOffset = resetZero ? 0 : (conn.segmentOffset || 0) + delta;
    const updated = connections.map((c) =>
      c.id === connId ? { ...c, segmentOffset: newOffset } : c,
    );
    commitModelChange({ ...flowchartModel, connections: updated });
    showToast(
      resetZero
        ? "Posisi jalur di-reset ke tengah."
        : `Jalur digeser (${newOffset > 0 ? "+" : ""}${newOffset}px).`,
    );
  };

  const handleSetConnectionHandles = (
    connId: string,
    sourceHandle?: "top" | "bottom" | "left" | "right",
    targetHandle?: "top" | "bottom" | "left" | "right",
  ) => {
    const updated = connections.map((c) => {
      if (c.id !== connId) return c;
      return {
        ...c,
        ...(sourceHandle ? { sourceHandle } : {}),
        ...(targetHandle ? { targetHandle } : {}),
      };
    });
    commitModelChange({ ...flowchartModel, connections: updated });
  };

  const handleUpdateConnectionLabel = (
    connId: string,
    newLabel: string,
    historyMode: boolean | "coalesce" = true,
  ) => {
    const updatedConnections = connections.map((c) =>
      c.id === connId ? { ...c, label: newLabel } : c,
    );
    commitModelChange(
      { ...flowchartModel, connections: updatedConnections },
      historyMode,
    );
  };

  const handleResetConnectionWaypoints = (connId: string) => {
    const updatedConnections = connections.map((c) =>
      c.id === connId ? { ...c, waypoints: undefined, segmentOffset: 0 } : c,
    );
    commitModelChange({ ...flowchartModel, connections: updatedConnections });
    showToast("Belokan panah di-reset ke jalur standar.");
  };

  const handleNudgeConnection = (
    connId: string,
    dx: number,
    dy: number,
    fallbackMidPt?: FlowPoint,
  ) => {
    const conn = connections.find((c) => c.id === connId);
    if (!conn) return;
    let wps =
      conn.waypoints && conn.waypoints.length > 0
        ? [...conn.waypoints]
        : fallbackMidPt
          ? [{ ...fallbackMidPt }]
          : [{ x: 480, y: 300 }];
    wps = wps.map((wp) => ({
      x: Math.round((wp.x + dx) / 10) * 10,
      y: Math.round((wp.y + dy) / 10) * 10,
    }));
    const updated = connections.map((c) =>
      c.id === connId ? { ...c, waypoints: wps } : c,
    );
    commitModelChange({ ...flowchartModel, connections: updated });
  };

  const handleAddConnectionWaypoint = (
    connId: string,
    fallbackMidPt?: FlowPoint,
  ) => {
    const conn = connections.find((c) => c.id === connId);
    if (!conn) return;
    const currentWps =
      conn.waypoints && conn.waypoints.length > 0
        ? [...conn.waypoints]
        : fallbackMidPt
          ? [{ ...fallbackMidPt }]
          : [{ x: 480, y: 300 }];
    const lastWp = currentWps[currentWps.length - 1];
    const newWp: FlowPoint = { x: lastWp.x + 30, y: lastWp.y + 30 };
    const updated = connections.map((c) =>
      c.id === connId ? { ...c, waypoints: [...currentWps, newWp] } : c,
    );
    commitModelChange({ ...flowchartModel, connections: updated });
    showToast(
      "Titik belokan baru ditambahkan. Tarik titik biru untuk menggesernya.",
    );
  };

  const handleUpdateConnectionRouting = (
    connId: string,
    routingType: "orthogonal" | "direct" | "curved",
  ) => {
    const updated = connections.map((c) =>
      c.id === connId ? { ...c, routingType } : c,
    );
    commitModelChange({ ...flowchartModel, connections: updated });
  };

  const handleToggleConnectionDashed = (connId: string) => {
    const updated = connections.map((c) =>
      c.id === connId ? { ...c, dashed: !c.dashed } : c,
    );
    commitModelChange({ ...flowchartModel, connections: updated });
  };

  const handleSetNodeFontSize = (nodeId: string, size: number) => {
    const node = nodes.find((n) => n.id === nodeId);
    const minH =
      size >= 15 ? Math.max(node?.height || 72, 86) : node?.height || 72;
    handleUpdateNode(nodeId, { fontSize: size, height: minH });
  };

  const handleSetAllNodesFontSize = (size: number) => {
    const minH = size >= 15 ? 86 : 72;
    const updated = nodes.map((n) => ({
      ...n,
      fontSize: size,
      height: Math.max(n.height || 72, minH),
    }));
    commitModelChange({ ...flowchartModel, nodes: updated });
    showToast(`Ukuran teks semua simbol disetel ke ${size}pt.`);
  };

  const handleNudgeNodeSize = (nodeId: string, dW: number, dH: number) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const newW = Math.max(120, Math.min(420, (node.width || 180) + dW));
    const newH = Math.max(48, Math.min(240, (node.height || 72) + dH));
    handleUpdateNode(nodeId, { width: newW, height: newH });
  };

  // ==============================================================
  // KEYBOARD SHORTCUTS (Undo/Redo, Delete, Duplicate, Nudge, Esc)
  // ==============================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTyping =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.isContentEditable);

      if (e.key === "Escape") {
        if (connectSourceId || activeTool !== "select") {
          setConnectSourceId(null);
          setConnectMousePos(null);
          setActiveTool("select");
        } else {
          setSelectedNodeId(null);
          setSelectedConnectionId(null);
        }
        return;
      }

      if (isTyping) return;

      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (
        (isMod && e.key.toLowerCase() === "y") ||
        (isMod && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (isMod && e.key.toLowerCase() === "d" && selectedNodeId) {
        e.preventDefault();
        handleDuplicateNode(selectedNodeId);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedConnectionId) {
          handleDeleteConnection(selectedConnectionId);
        } else if (selectedNodeId) {
          handleDeleteNode(selectedNodeId);
        }
        return;
      }

      // Quick tool switch keys
      if (!isMod && e.key.toLowerCase() === "v") {
        setActiveTool("select");
        setConnectSourceId(null);
        setConnectMousePos(null);
        return;
      }
      if (!isMod && e.key.toLowerCase() === "c") {
        setActiveTool("connect");
        return;
      }
      if (!isMod && e.key.toLowerCase() === "h") {
        setActiveTool("hand");
        return;
      }

      // Arrow key nudge for selected node
      if (
        selectedNodeId &&
        (e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown")
      ) {
        e.preventDefault();
        const node = nodes.find((n) => n.id === selectedNodeId);
        if (!node) return;
        const step = e.shiftKey ? 2 : 10;
        const dx =
          e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy =
          e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        const w = node.width || 180;
        const nextX = Math.max(
          10,
          Math.min(canvasWidth - w - 10, (node.x || 50) + dx),
        );
        const nextY = Math.max(52, (node.y || 60) + dy);
        const laneCount = Math.max(1, lanes.length);
        const laneWidth = canvasWidth / laneCount;
        const laneIndex = Math.min(
          laneCount - 1,
          Math.max(0, Math.floor((nextX + w / 2) / laneWidth)),
        );
        const nextLane = lanes[laneIndex]?.id || node.lane;
        handleUpdateNode(
          node.id,
          { x: nextX, y: nextY, lane: nextLane },
          "coalesce",
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTool,
    canvasWidth,
    connectSourceId,
    handleDeleteConnection,
    handleDeleteNode,
    handleDuplicateNode,
    handleRedo,
    handleUndo,
    lanes,
    nodes,
    selectedConnectionId,
    selectedNodeId,
  ]);

  // ==============================================================
  // MOUSE DRAGGING & RESIZING SYSTEM (SMOOTH DRAFT + 1 UNDO ON UP)
  // ==============================================================
  const beginDraftInteraction = () => {
    preDragModelRef.current = baseFlowchartModel;
    draftModelRef.current = baseFlowchartModel;
    setDraftModel(baseFlowchartModel);
  };

  const handleStartResize = (
    e: React.MouseEvent,
    nodeId: string,
    dir: "se" | "e" | "s",
  ) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null);
    beginDraftInteraction();
    setResizingNode({
      nodeId,
      dir,
      startMouse: { x: e.clientX, y: e.clientY },
      startW: node.width || 180,
      startH: node.height || 74,
    });
  };

  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    if (activeTool === "connect") {
      e.stopPropagation();
      if (connectSourceId) {
        handleFinishConnect(nodeId);
      } else {
        handleStartConnect(nodeId, "bottom");
      }
      return;
    }
    if (!isDirectEditMode || activeTool === "hand") return;

    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null);
    beginDraftInteraction();
    setDraggingNodeId(nodeId);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setDragStartNodePos({ x: node.x || 0, y: node.y || 0 });
  };

  const handleMouseDownWaypoint = (
    e: React.MouseEvent,
    connId: string,
    waypointIndex: number,
    startPos: FlowPoint,
  ) => {
    if (!isDirectEditMode || activeTool === "hand") return;
    e.stopPropagation();
    setSelectedConnectionId(connId);
    setSelectedNodeId(null);
    beginDraftInteraction();
    setDraggingWaypoint({
      connId,
      waypointIndex,
      startMouse: { x: e.clientX, y: e.clientY },
      startPos: { x: startPos.x, y: startPos.y },
    });
  };

  const handleMouseDownArrowLine = (
    e: React.MouseEvent,
    conn: FlowConnection,
    midPt: FlowPoint,
  ) => {
    if (!isDirectEditMode || activeTool === "hand") return;
    e.stopPropagation();
    setSelectedConnectionId(conn.id);
    setSelectedNodeId(null);

    let idx = 0;
    let basePos = midPt;
    let startingModel = baseFlowchartModel;

    if (!conn.waypoints || conn.waypoints.length === 0) {
      const updated = connections.map((c) =>
        c.id === conn.id
          ? { ...c, waypoints: [{ x: midPt.x, y: midPt.y }] }
          : c,
      );
      startingModel = { ...baseFlowchartModel, connections: updated };
      basePos = midPt;
    } else {
      idx = Math.floor(conn.waypoints.length / 2);
      basePos = conn.waypoints[idx];
    }

    preDragModelRef.current = baseFlowchartModel;
    draftModelRef.current = startingModel;
    setDraftModel(startingModel);

    setDraggingWaypoint({
      connId: conn.id,
      waypointIndex: idx,
      startMouse: { x: e.clientX, y: e.clientY },
      startPos: { x: basePos.x, y: basePos.y },
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "hand") {
      setIsPanning(true);
      setPanStartMouse({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
      return;
    }
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    if (connectSourceId) {
      setConnectSourceId(null);
      setConnectMousePos(null);
      setActiveTool("select");
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPanOffset({
          x: e.clientX - panStartMouse.x,
          y: e.clientY - panStartMouse.y,
        });
        return;
      }

      const scale = zoomLevel / 100;
      const activeDraft = draftModelRef.current;

      if (resizingNode && activeDraft) {
        const deltaX = (e.clientX - resizingNode.startMouse.x) / scale;
        const deltaY = (e.clientY - resizingNode.startMouse.y) / scale;
        const gridSize = isSnapToGrid ? 10 : 1;

        const nextW =
          resizingNode.dir === "e" || resizingNode.dir === "se"
            ? Math.max(
                120,
                Math.min(
                  420,
                  Math.round((resizingNode.startW + deltaX) / gridSize) *
                    gridSize,
                ),
              )
            : resizingNode.startW;
        const nextH =
          resizingNode.dir === "s" || resizingNode.dir === "se"
            ? Math.max(
                48,
                Math.min(
                  260,
                  Math.round((resizingNode.startH + deltaY) / gridSize) *
                    gridSize,
                ),
              )
            : resizingNode.startH;

        const nextModel: FlowchartModel = {
          ...activeDraft,
          nodes: activeDraft.nodes.map((n) =>
            n.id === resizingNode.nodeId
              ? { ...n, width: nextW, height: nextH }
              : n,
          ),
        };
        draftModelRef.current = nextModel;
        setDraftModel(nextModel);
        return;
      }

      if (draggingNodeId && activeDraft) {
        const deltaX = (e.clientX - dragStartMouse.x) / scale;
        const deltaY = (e.clientY - dragStartMouse.y) / scale;

        const rawX = dragStartNodePos.x + deltaX;
        const rawY = dragStartNodePos.y + deltaY;
        const gridSize = isSnapToGrid ? 10 : 1;
        const dragNode = activeDraft.nodes.find((n) => n.id === draggingNodeId);
        const nodeW = dragNode?.width || 180;
        const nodeH = dragNode?.height || 74;

        let newX = Math.max(
          10,
          Math.min(
            canvasWidth - nodeW - 10,
            Math.round(rawX / gridSize) * gridSize,
          ),
        );
        let newY = Math.max(52, Math.round(rawY / gridSize) * gridSize);

        // Smart snap guides against lane centers & sibling nodes
        const laneCount = Math.max(1, lanes.length);
        const laneWidth = canvasWidth / laneCount;
        const midX = newX + nodeW / 2;
        const midY = newY + nodeH / 2;

        let guideX: number | null = null;
        let guideY: number | null = null;

        for (let i = 0; i < laneCount; i++) {
          const laneCenter = Math.round((i + 0.5) * laneWidth);
          if (Math.abs(midX - laneCenter) <= 8) {
            newX = Math.round(laneCenter - nodeW / 2);
            guideX = laneCenter;
            break;
          }
        }

        if (guideX === null) {
          for (const other of activeDraft.nodes) {
            if (other.id === draggingNodeId) continue;
            const otherMidX = Math.round(
              (other.x || 0) + (other.width || 180) / 2,
            );
            if (Math.abs(midX - otherMidX) <= 7) {
              newX = Math.round(otherMidX - nodeW / 2);
              guideX = otherMidX;
              break;
            }
          }
        }

        for (const other of activeDraft.nodes) {
          if (other.id === draggingNodeId) continue;
          const otherMidY = Math.round(
            (other.y || 0) + (other.height || 74) / 2,
          );
          if (Math.abs(midY - otherMidY) <= 7) {
            newY = Math.round(otherMidY - nodeH / 2);
            guideY = otherMidY;
            break;
          }
        }

        setAlignmentGuides({ x: guideX, y: guideY });

        const laneIndex = Math.min(
          laneCount - 1,
          Math.max(0, Math.floor((newX + nodeW / 2) / laneWidth)),
        );
        const newLane = lanes[laneIndex]?.id || lanes[0]?.id || "admin";

        const nextModel: FlowchartModel = {
          ...activeDraft,
          nodes: activeDraft.nodes.map((n) =>
            n.id === draggingNodeId
              ? { ...n, x: newX, y: newY, lane: newLane }
              : n,
          ),
        };
        draftModelRef.current = nextModel;
        setDraftModel(nextModel);
        return;
      }

      if (draggingWaypoint && activeDraft) {
        const deltaX = (e.clientX - draggingWaypoint.startMouse.x) / scale;
        const deltaY = (e.clientY - draggingWaypoint.startMouse.y) / scale;

        const newX =
          Math.round((draggingWaypoint.startPos.x + deltaX) / 10) * 10;
        const newY =
          Math.round((draggingWaypoint.startPos.y + deltaY) / 10) * 10;

        const updatedConnections = (activeDraft.connections || []).map((c) => {
          if (c.id !== draggingWaypoint.connId) return c;
          const currentWaypoints = [...(c.waypoints || [])];
          if (currentWaypoints.length === 0) {
            currentWaypoints.push({ x: newX, y: newY });
          } else {
            currentWaypoints[draggingWaypoint.waypointIndex] = {
              x: newX,
              y: newY,
            };
          }
          return { ...c, waypoints: currentWaypoints };
        });

        const nextModel: FlowchartModel = {
          ...activeDraft,
          connections: updatedConnections,
        };
        draftModelRef.current = nextModel;
        setDraftModel(nextModel);
        return;
      }

      if (connectSourceId && canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setConnectMousePos({
          x: (e.clientX - rect.left) / scale,
          y: (e.clientY - rect.top) / scale,
        });
      }
    };

    const handleMouseUp = () => {
      if (draggingNodeId || resizingNode || draggingWaypoint) {
        const finishedDraft = draftModelRef.current;
        const beforeDrag = preDragModelRef.current;
        if (
          finishedDraft &&
          beforeDrag &&
          JSON.stringify(finishedDraft) !== JSON.stringify(beforeDrag)
        ) {
          setHistoryPast((prev) => [
            ...prev.slice(-(MAX_HISTORY - 1)),
            beforeDrag,
          ]);
          setHistoryFuture([]);
          pushModel(finishedDraft);
        }
        draftModelRef.current = null;
        preDragModelRef.current = null;
        setDraftModel(null);
        setAlignmentGuides({ x: null, y: null });
      }
      setDraggingNodeId(null);
      setResizingNode(null);
      setDraggingWaypoint(null);
      setIsPanning(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isPanning,
    panStartMouse,
    zoomLevel,
    isSnapToGrid,
    canvasWidth,
    lanes,
    resizingNode,
    draggingNodeId,
    dragStartMouse,
    dragStartNodePos,
    draggingWaypoint,
    connectSourceId,
    pushModel,
  ]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const selectedConnection =
    connections.find((c) => c.id === selectedConnectionId) || null;

  const canvasHeight =
    Math.max(
      ...nodes.map((n) => (n.y || 0) + (n.height || 70)),
      flowchartModel.canvasHeight || 780,
    ) + 120;

  const scale = zoomLevel / 100;
  const draggedNodeLane = draggingNodeId
    ? nodes.find((n) => n.id === draggingNodeId)?.lane
    : null;
  const institutionBranding = getInstitutionBranding(spo.metadata?.institusi);

  return (
    <div className="max-w-[1640px] mx-auto py-4 px-2 sm:px-5">
      {/* Toast Notification */}
      {exportNotice && (
        <div className="no-print fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-2 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold bg-slate-900 text-white border border-slate-700">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          SINGLE-ELEVATION TOP COMMAND BAR (NO LAYOUT JUMPING)
          ======================================================== */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-3 sm:px-4 mb-3">
        <div className="pb-2.5 border-b border-slate-100">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Editor Diagram Alur Cross-Functional (Swimlane) —{" "}
              {institutionBranding.fullName}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {spo.judulSpo ||
                "DIAGRAM ALUR STANDAR PROSEDUR OPERASIONAL (SPO)"}
            </h2>
          </div>
        </div>

        {/* Sleek Fixed Single-Row Tool Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Pointer / Connector / Pan */}
            <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTool("select");
                  setConnectSourceId(null);
                  setConnectMousePos(null);
                }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTool === "select"
                    ? "bg-white text-[#0078d4] shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Pointer (V) - Pilih, geser, & edit teks"
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>Pointer</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTool("connect")}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTool === "connect"
                    ? "bg-[#0078d4] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Connector (C) - Sambungkan panah antar simbol"
              >
                <Spline className="w-3.5 h-3.5" />
                <span>Connector</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTool("hand")}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTool === "hand"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Pan (H) - Geser posisi tampilan kanvas"
              >
                <Hand className="w-3.5 h-3.5" />
                <span>Geser</span>
              </button>
            </div>

            {/* Undo / Redo */}
            <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyPast.length === 0}
                className="p-1.5 rounded-md text-slate-700 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Batalkan Perubahan (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyFuture.length === 0}
                className="p-1.5 rounded-md text-slate-700 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Ulangi Perubahan (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 tabular-nums">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                disabled={zoomLevel <= 60}
                className="p-1.5 rounded-md text-slate-700 hover:bg-white disabled:opacity-35 cursor-pointer"
                title="Perkecil Tampilan (Zoom Out)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(100);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="px-2 py-1 rounded-md text-[11px] font-bold text-slate-800 hover:bg-white min-w-[48px] text-center cursor-pointer"
                title="Reset Zoom 100% & Posisi Kanvas"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                disabled={zoomLevel >= 150}
                className="p-1.5 rounded-md text-slate-700 hover:bg-white disabled:opacity-35 cursor-pointer"
                title="Perbesar Tampilan (Zoom In)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Snap Grid */}
            <button
              type="button"
              onClick={() => {
                setIsSnapToGrid((prev) => !prev);
                showToast(
                  `Snap Grid: ${!isSnapToGrid ? "Aktif (10px)" : "Nonaktif"}`,
                );
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isSnapToGrid
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
              title="Kunci posisi simbol ke grid 10px"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Snap Grid</span>
            </button>

            {/* Arrow Modals */}
            <button
              type="button"
              onClick={() =>
                handleOpenAddArrowModal(selectedNodeId || undefined)
              }
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              title="Tambah tanda panah antar simbol"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Panah</span>
            </button>

            <button
              type="button"
              onClick={() => setIsManageArrowsModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs border border-slate-200 transition-colors cursor-pointer tabular-nums"
              title="Lihat dan kelola seluruh tanda panah"
            >
              <GitBranch className="w-3.5 h-3.5 text-slate-500" />
              <span>Daftar Panah ({connections.length})</span>
            </button>
          </div>

          {/* Left / Right Panel Toggles */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setIsStencilSidebarOpen((prev) => !prev)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isStencilSidebarOpen
                  ? "bg-blue-50 text-[#0078d4] border-blue-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title="Tampilkan / sembunyikan bilah simbol stensil"
            >
              {isStencilSidebarOpen ? (
                <PanelLeftClose className="w-3.5 h-3.5" />
              ) : (
                <PanelLeft className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">Stensil</span>
            </button>

            <button
              type="button"
              onClick={() => setIsInspectorOpen((prev) => !prev)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isInspectorOpen
                  ? "bg-blue-50 text-[#0078d4] border-blue-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title="Tampilkan / sembunyikan panel properti kanan"
            >
              {isInspectorOpen ? (
                <PanelRightClose className="w-3.5 h-3.5" />
              ) : (
                <PanelRight className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">Properti</span>
            </button>
          </div>
        </div>

        {/* Active Connector Mode Instruction Bar */}
        {activeTool === "connect" && (
          <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
            <span className="font-medium">
              {connectSourceId
                ? "Mode Sambung Panah aktif: klik simbol atau titik pin (+) tujuan untuk menyambung panah."
                : "Mode Sambung Panah aktif: klik simbol asal (atau titik pin +) terlebih dahulu."}
            </span>
            <button
              type="button"
              onClick={() => {
                setConnectSourceId(null);
                setConnectMousePos(null);
                setActiveTool("select");
              }}
              className="px-2 py-0.5 rounded bg-white border border-blue-300 text-blue-800 font-semibold hover:bg-blue-100 cursor-pointer"
            >
              Batal (Esc)
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          3-PANE WORKSPACE: STENCIL + SWIMLANE CANVAS + INSPECTOR
          ======================================================== */}
      <div className="relative flex flex-col lg:flex-row gap-3 items-start bg-slate-100 rounded-xl p-2 sm:p-3 border border-slate-200">
        {/* 1. LEFT STENCIL PALETTE */}
        {isStencilSidebarOpen && (
          <aside className="no-print w-full lg:w-60 shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden lg:sticky lg:top-4 z-20">
            <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Stensil Simbol
                </h3>
                <p className="text-[10px] text-slate-300">
                  Klik atau tarik ke kolom
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStencilSidebarOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                title="Tutup panel stensil"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-2.5 space-y-1.5 max-h-[75vh] overflow-y-auto">
              {[
                {
                  type: "process" as FlowNodeType,
                  title: "Proses / Aktivitas",
                  desc: "Langkah kerja / tindakan",
                  preview: (
                    <div className="w-8 h-6 rounded border-2 border-slate-700 bg-white flex items-center justify-center shrink-0">
                      <Square className="w-3 h-3 text-slate-700" />
                    </div>
                  ),
                },
                {
                  type: "decision" as FlowNodeType,
                  title: "Keputusan",
                  desc: "Cabang Ya / Tidak",
                  preview: (
                    <div className="w-6 h-6 rounded-xs border-2 border-amber-600 bg-amber-50 flex items-center justify-center shrink-0 rotate-45 mx-1">
                      <span className="w-1.5 h-1.5 rounded-xs bg-amber-600" />
                    </div>
                  ),
                },
                {
                  type: "start" as FlowNodeType,
                  title: "Mulai (Start)",
                  desc: "Titik awal prosedur",
                  preview: (
                    <div className="w-8 h-6 rounded-full border-2 border-emerald-600 bg-emerald-50 flex items-center justify-center shrink-0">
                      <Circle className="w-3 h-3 text-emerald-600" />
                    </div>
                  ),
                },
                {
                  type: "end" as FlowNodeType,
                  title: "Selesai (End)",
                  desc: "Titik akhir prosedur",
                  preview: (
                    <div className="w-8 h-6 rounded-full border-4 border-slate-900 bg-rose-50 flex items-center justify-center shrink-0" />
                  ),
                },
                {
                  type: "document" as FlowNodeType,
                  title: "Dokumen / Berkas",
                  desc: "Formulir, SEP, resep",
                  preview: (
                    <div className="w-8 h-6 rounded-t border-2 border-purple-600 bg-purple-50 flex items-center justify-center shrink-0">
                      <FileText className="w-3 h-3 text-purple-600" />
                    </div>
                  ),
                },
                {
                  type: "datastore" as FlowNodeType,
                  title: "Data / SIMRS",
                  desc: "Input & arsip sistem",
                  preview: (
                    <div className="w-8 h-6 rounded-xs border-2 border-sky-600 bg-sky-50 flex items-center justify-center shrink-0">
                      <Database className="w-3 h-3 text-sky-600" />
                    </div>
                  ),
                },
                {
                  type: "subprocess" as FlowNodeType,
                  title: "Subproses",
                  desc: "SPO / prosedur terkait",
                  preview: (
                    <div className="w-8 h-6 rounded border-2 border-indigo-600 bg-indigo-50 flex items-center justify-center shrink-0">
                      <Layers className="w-3 h-3 text-indigo-600" />
                    </div>
                  ),
                },
              ].map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", item.type);
                    e.dataTransfer.setData(
                      "application/visio-shape",
                      item.type,
                    );
                  }}
                  onClick={() => handleAddNodeFromPalette(item.type)}
                  className="p-2 rounded-lg border border-slate-200 hover:border-[#0078d4] hover:bg-blue-50/40 transition-colors cursor-grab active:cursor-grabbing flex items-center space-x-2.5 bg-white"
                  title="Klik untuk menambah atau tarik langsung ke kolam kanvas"
                >
                  {item.preview}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-2 pt-2 border-t border-slate-100 px-1 space-y-1 text-[10px] text-slate-500 leading-relaxed">
                <div className="font-bold text-slate-700">Cara Cepat:</div>
                <div>
                  • Klik 2x area kosong kolam = tambah simbol di lokasi kursor
                </div>
                <div>• Klik 2x simbol = langsung ketik teks</div>
                <div>• Klik 2x panah = edit label panah</div>
                <div>
                  • Arahkan kursor ke simbol = titik biru (+) untuk tarik panah
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* 2. CENTER INTERACTIVE CANVAS */}
        <div
          onMouseDown={handleCanvasMouseDown}
          className={`flex-1 min-w-0 w-full overflow-auto rounded-xl bg-slate-200/50 border border-slate-200 p-2 sm:p-4 max-h-[84vh] ${
            activeTool === "hand"
              ? "cursor-grab active:cursor-grabbing"
              : "cursor-default"
          }`}
        >
          {/* Sized outer shell so scrollbars accurately wrap zoomed canvas */}
          <div
            style={{
              width: `${(canvasWidth + 56) * scale}px`,
              minHeight: `${(canvasHeight + 130) * scale}px`,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
                transformOrigin: "top left",
                width: `${canvasWidth + 56}px`,
              }}
              className="bg-white p-6 sm:p-7 rounded-xl shadow-md border border-slate-300 relative select-none"
            >
              {/* Lane Bar Quick Strip */}
              <div className="no-print flex items-center justify-between mb-2.5 px-0.5">
                <div className="flex items-center space-x-2 text-xs text-slate-700">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-bold tabular-nums">
                    Kolom Aktor ({lanes.length})
                  </span>
                  <span className="text-[11px] text-slate-500 hidden md:inline">
                    Klik nama kolom untuk mengubah, atau klik 2x area kosong
                    untuk menambah langkah
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddLane}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  title="Tambah satu kolom aktor baru ke diagram"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kolom</span>
                </button>
              </div>

              {/* SWIMLANE POOL CONTAINER */}
              <div
                ref={canvasContainerRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropStencil}
                onDoubleClick={handleDoubleClickCanvas}
                style={{
                  height: `${canvasHeight}px`,
                  width: `${canvasWidth}px`,
                }}
                className="border-2 border-slate-700 rounded-lg overflow-visible bg-white relative"
              >
                {/* Dynamic Column Lane Headers */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${lanes.length}, minmax(0, 1fr))`,
                    width: `${canvasWidth}px`,
                  }}
                  className="border-b-2 border-slate-700 text-center font-bold text-xs uppercase tracking-wide sticky top-0 z-25 bg-white rounded-t-md"
                >
                  {lanes.map((lane, index) => {
                    const isLast = index === lanes.length - 1;
                    return (
                      <div
                        key={lane.id}
                        style={{
                          backgroundColor: lane.bgColor || "#f8fafc",
                          color: lane.color || "#1e293b",
                        }}
                        className={`py-2 px-2 flex items-center justify-between relative group ${
                          !isLast ? "border-r-2 border-slate-700" : ""
                        }`}
                      >
                        <span className="text-[10px] font-black opacity-65 mr-1 shrink-0 tabular-nums">
                          #{index + 1}
                        </span>
                        <input
                          type="text"
                          value={lane.name}
                          onChange={(e) =>
                            handleUpdateLaneName(lane.id, e.target.value)
                          }
                          placeholder={`Nama Aktor ${index + 1}`}
                          style={{ color: lane.color || "#1e293b" }}
                          className="w-full text-center font-bold text-xs bg-white/75 hover:bg-white focus:bg-white border border-slate-300/80 focus:border-emerald-600 rounded px-1.5 py-0.5 outline-hidden transition-colors"
                        />
                        {lanes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLane(lane.id)}
                            className="no-print ml-1 p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-100 transition-colors opacity-65 hover:opacity-100 cursor-pointer shrink-0"
                            title={`Hapus kolom aktor "${lane.name}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Background Swimlane Column Shading */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${lanes.length}, minmax(0, 1fr))`,
                    width: `${canvasWidth}px`,
                  }}
                  className="absolute inset-0 pt-9 pointer-events-none"
                >
                  {lanes.map((lane, index) => {
                    const isLast = index === lanes.length - 1;
                    const isDropTargetLane = draggedNodeLane === lane.id;
                    return (
                      <div
                        key={lane.id}
                        style={{
                          backgroundColor: isDropTargetLane
                            ? `${lane.bgColor || "#f8fafc"}66`
                            : `${lane.bgColor || "#f8fafc"}26`,
                        }}
                        className={`h-full transition-colors ${
                          !isLast ? "border-r-2 border-slate-300" : ""
                        }`}
                      />
                    );
                  })}
                </div>

                {/* SVG LAYER: GRID, ALIGNMENT GUIDES & SEQUENCE FLOW ARROWS */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
                  style={{ pointerEvents: "auto" }}
                >
                  <defs>
                    <pattern
                      id="visio-minor-grid"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="0.8"
                      />
                    </pattern>
                    <pattern
                      id="visio-major-grid"
                      width="100"
                      height="100"
                      patternUnits="userSpaceOnUse"
                    >
                      <rect
                        width="100"
                        height="100"
                        fill="url(#visio-minor-grid)"
                      />
                      <path
                        d="M 100 0 L 0 0 0 100"
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="1.2"
                      />
                    </pattern>
                    <marker
                      id="bpmn-arrowhead"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#334155" />
                    </marker>
                    <marker
                      id="bpmn-arrowhead-selected"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#0078d4" />
                    </marker>
                  </defs>

                  <rect
                    width={canvasWidth}
                    height={canvasHeight}
                    fill="url(#visio-major-grid)"
                    opacity="0.55"
                    pointerEvents="none"
                  />

                  {/* Snap Alignment Guides during Drag */}
                  {alignmentGuides.x !== null && (
                    <line
                      x1={alignmentGuides.x}
                      y1={42}
                      x2={alignmentGuides.x}
                      y2={canvasHeight}
                      stroke="#0078d4"
                      strokeWidth="1.2"
                      strokeDasharray="4,4"
                      pointerEvents="none"
                    />
                  )}
                  {alignmentGuides.y !== null && (
                    <line
                      x1={0}
                      y1={alignmentGuides.y}
                      x2={canvasWidth}
                      y2={alignmentGuides.y}
                      stroke="#0078d4"
                      strokeWidth="1.2"
                      strokeDasharray="4,4"
                      pointerEvents="none"
                    />
                  )}

                  {/* Connections */}
                  {connections.map((conn) => {
                    const sourceNode = nodes.find(
                      (n) => n.id === conn.sourceId,
                    );
                    const targetNode = nodes.find(
                      (n) => n.id === conn.targetId,
                    );
                    if (!sourceNode || !targetNode) return null;

                    const isSelected = conn.id === selectedConnectionId;
                    const { pathD, midWaypoint } = computeConnectionGeometry(
                      conn,
                      sourceNode,
                      targetNode,
                      connections,
                    );

                    const selectAndFocusLabel = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedConnectionId(conn.id);
                      setSelectedNodeId(null);
                      setIsInspectorOpen(true);
                      setTimeout(() => {
                        arrowLabelInputRef.current?.focus();
                        arrowLabelInputRef.current?.select();
                      }, 40);
                    };

                    return (
                      <g key={conn.id} className="cursor-pointer group">
                        {/* Transparent hit target */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="transparent"
                          strokeWidth="22"
                          className="cursor-move"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConnectionId(conn.id);
                            setSelectedNodeId(null);
                          }}
                          onDoubleClick={selectAndFocusLabel}
                          onMouseDown={(e) =>
                            handleMouseDownArrowLine(e, conn, midWaypoint)
                          }
                        >
                          <title>
                            Klik untuk pilih, tarik untuk geser, atau klik 2x
                            untuk edit label
                          </title>
                        </path>

                        {/* Visible Arrow Line */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={
                            isSelected ? "#0078d4" : conn.color || "#334155"
                          }
                          strokeWidth={isSelected ? "3.5" : "2.4"}
                          strokeDasharray={conn.dashed ? "6,4" : undefined}
                          markerEnd={
                            isSelected
                              ? "url(#bpmn-arrowhead-selected)"
                              : "url(#bpmn-arrowhead)"
                          }
                          className="transition-colors group-hover:stroke-[#0078d4]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConnectionId(conn.id);
                            setSelectedNodeId(null);
                          }}
                          onDoubleClick={selectAndFocusLabel}
                          onMouseDown={(e) =>
                            handleMouseDownArrowLine(e, conn, midWaypoint)
                          }
                        />

                        {/* Draggable Waypoint Handles */}
                        {conn.waypoints && conn.waypoints.length > 0 ? (
                          conn.waypoints.map((wp, wIdx) => (
                            <g
                              key={`wp-${conn.id}-${wIdx}`}
                              className="cursor-move"
                            >
                              {isSelected && (
                                <circle
                                  cx={wp.x}
                                  cy={wp.y}
                                  r={11}
                                  fill="#0078d4"
                                  fillOpacity="0.22"
                                />
                              )}
                              <circle
                                cx={wp.x}
                                cy={wp.y}
                                r={isSelected ? 7 : 5}
                                fill={isSelected ? "#0078d4" : "#0284c7"}
                                stroke="#ffffff"
                                strokeWidth="2.5"
                                className="hover:scale-125 transition-transform drop-shadow-sm"
                                onMouseDown={(e) =>
                                  handleMouseDownWaypoint(e, conn.id, wIdx, wp)
                                }
                              >
                                <title>
                                  Tarik titik belokan untuk menggeser jalur
                                  panah
                                </title>
                              </circle>
                            </g>
                          ))
                        ) : (
                          <g className="cursor-move">
                            {isSelected && (
                              <circle
                                cx={midWaypoint.x}
                                cy={midWaypoint.y}
                                r={10}
                                fill="#0078d4"
                                fillOpacity="0.22"
                              />
                            )}
                            <circle
                              cx={midWaypoint.x}
                              cy={midWaypoint.y}
                              r={isSelected ? 6.5 : 4.5}
                              fill={isSelected ? "#0078d4" : "#64748b"}
                              stroke="#ffffff"
                              strokeWidth="2"
                              className="opacity-0 group-hover:opacity-100 hover:scale-125 transition-all"
                              style={{ opacity: isSelected ? 1 : undefined }}
                              onMouseDown={(e) =>
                                handleMouseDownArrowLine(e, conn, midWaypoint)
                              }
                            >
                              <title>Tarik untuk membelokkan jalur panah</title>
                            </circle>
                          </g>
                        )}

                        {/* Arrow Label Badge (double-click to edit) */}
                        {conn.label && (
                          <foreignObject
                            x={midWaypoint.x - 54}
                            y={midWaypoint.y - 12}
                            width="108"
                            height="24"
                            className="overflow-visible pointer-events-auto"
                          >
                            <div className="flex items-center justify-center">
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedConnectionId(conn.id);
                                  setSelectedNodeId(null);
                                }}
                                onDoubleClick={selectAndFocusLabel}
                                title="Klik 2x untuk ubah teks label panah"
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs border cursor-pointer ${
                                  conn.label.toLowerCase().includes("tidak")
                                    ? "bg-rose-50 text-rose-700 border-rose-300"
                                    : conn.label.toLowerCase().includes("ya")
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                      : "bg-white text-slate-700 border-slate-300"
                                } ${isSelected ? "ring-2 ring-[#0078d4]/40" : ""}`}
                              >
                                {conn.label}
                              </span>
                            </div>
                          </foreignObject>
                        )}

                        {/* Quick Delete Button on Arrow */}
                        <foreignObject
                          x={midWaypoint.x + (conn.label ? 30 : -10)}
                          y={midWaypoint.y - 11}
                          width="22"
                          height="22"
                          className="overflow-visible pointer-events-auto z-30"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConnection(conn.id);
                            }}
                            className={`no-print w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs border ${
                              isSelected
                                ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-700 opacity-100"
                                : "bg-white hover:bg-rose-600 text-slate-400 hover:text-white border-slate-300 hover:border-rose-600 opacity-0 group-hover:opacity-100"
                            }`}
                            title="Hapus panah ini"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </foreignObject>
                      </g>
                    );
                  })}

                  {/* Temporary Drawing Arrow from exact source pin port */}
                  {connectSourceId && connectMousePos && (
                    <g className="pointer-events-none">
                      {(() => {
                        const sNode = nodes.find(
                          (n) => n.id === connectSourceId,
                        );
                        if (!sNode) return null;
                        const sPt = getPortPoint(sNode, connectSourceHandle);
                        return (
                          <line
                            x1={sPt.x}
                            y1={sPt.y}
                            x2={connectMousePos.x}
                            y2={connectMousePos.y}
                            stroke="#0078d4"
                            strokeWidth="2.5"
                            strokeDasharray="6,4"
                            markerEnd="url(#bpmn-arrowhead-selected)"
                          />
                        );
                      })()}
                    </g>
                  )}
                </svg>

                {/* NODE ELEMENTS LAYER */}
                {nodes.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  return (
                    <div
                      key={node.id}
                      data-flow-node="true"
                      onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                      style={{
                        position: "absolute",
                        left: `${node.x || 50}px`,
                        top: `${node.y || 50}px`,
                        width: `${node.width || 180}px`,
                        minHeight: `${node.height || 74}px`,
                        height: "auto",
                        cursor: activeTool === "connect" ? "crosshair" : "move",
                      }}
                      className="z-20 overflow-visible"
                    >
                      <FlowchartNodeShape
                        node={node}
                        isSelected={isSelected}
                        isConnectSource={connectSourceId === node.id}
                        isDirectEditMode={isDirectEditMode}
                        isConnectMode={
                          activeTool === "connect" &&
                          Boolean(connectSourceId) &&
                          connectSourceId !== node.id
                        }
                        onSelect={() => {
                          setSelectedNodeId(node.id);
                          setSelectedConnectionId(null);
                        }}
                        onUpdateNode={(patch) =>
                          handleUpdateNode(
                            node.id,
                            patch,
                            patch.label !== undefined ? "coalesce" : true,
                          )
                        }
                        onDeleteNode={() => handleDeleteNode(node.id)}
                        onDuplicateNode={handleDuplicateNode}
                        onStartConnect={handleStartConnect}
                        onPinClick={handlePinClick}
                        onStartResize={handleStartResize}
                        onQuickAppend={handleQuickAppend}
                        actors={actors}
                        lanes={lanes}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. RIGHT DOCKED PROPERTIES INSPECTOR (ZERO LAYOUT JUMPING) */}
        {isInspectorOpen && (
          <aside className="no-print w-full lg:w-76 xl:w-80 shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden lg:sticky lg:top-4 z-20">
            {/* INSPECTOR HEADER */}
            <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  {selectedNode
                    ? "Properti Simbol"
                    : selectedConnection
                      ? "Properti Tanda Panah"
                      : "Properti Diagram"}
                </h3>
                <p className="text-[10px] text-slate-300">
                  {selectedNode
                    ? SYMBOL_DEFINITIONS[selectedNode.type]?.label ||
                      selectedNode.type
                    : selectedConnection
                      ? "Atur arah, label, dan jalur garis"
                      : "Ringkasan, kolom aktor & pintasan"}
                </p>
              </div>
              {(selectedNode || selectedConnection) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNodeId(null);
                    setSelectedConnectionId(null);
                  }}
                  className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                  title="Kembali ke ringkasan diagram"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="p-3 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
              {/* ==================================================
                  CASE A: NODE SELECTED
                  ================================================== */}
              {selectedNode &&
                (() => {
                  const currentFontSize =
                    selectedNode.fontSize ||
                    (selectedNode.type === "decision" ||
                    selectedNode.type === "document" ||
                    selectedNode.type === "datastore"
                      ? 10
                      : 11);
                  const relatedOut = connections.filter(
                    (c) => c.sourceId === selectedNode.id,
                  );
                  const relatedIn = connections.filter(
                    (c) => c.targetId === selectedNode.id,
                  );

                  return (
                    <>
                      {/* Label Editor */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700">
                            Teks Simbol
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAutoFitNode(selectedNode.id)}
                            className="flex items-center space-x-1 text-[10px] font-semibold text-[#0078d4] hover:underline cursor-pointer"
                            title="Sesuaikan lebar & tinggi kotak dengan teks"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Auto Fit Kotak</span>
                          </button>
                        </div>
                        <textarea
                          ref={nodeLabelInputRef}
                          rows={3}
                          value={selectedNode.label}
                          onChange={(e) =>
                            handleUpdateNode(
                              selectedNode.id,
                              { label: e.target.value },
                              "coalesce",
                            )
                          }
                          placeholder="Ketik teks langkah prosedur..."
                          className="w-full p-2 bg-slate-50 border border-slate-300 focus:border-[#0078d4] focus:bg-white rounded-lg text-xs font-medium text-slate-900 outline-hidden resize-y"
                        />
                      </div>

                      {/* Shape Switcher */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">
                          Bentuk Simbol
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {SHAPE_OPTIONS.map((opt) => {
                            const isActive =
                              selectedNode.type === opt.type ||
                              (opt.type === "start" &&
                                selectedNode.type === "terminator") ||
                              (opt.type === "decision" &&
                                selectedNode.type === "gateway") ||
                              (opt.type === "datastore" &&
                                selectedNode.type === "data");
                            return (
                              <button
                                key={opt.type}
                                type="button"
                                onClick={() =>
                                  handleUpdateNode(selectedNode.id, {
                                    type: opt.type,
                                  })
                                }
                                className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-lg border text-left text-[11px] font-semibold transition-colors cursor-pointer ${
                                  isActive
                                    ? "bg-blue-50 border-[#0078d4] text-[#0078d4]"
                                    : `bg-white text-slate-700 ${opt.accent}`
                                }`}
                              >
                                {opt.icon}
                                <span className="truncate">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Swimlane Actor Selector (auto-centers X in chosen lane) */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Kolom Aktor (Swimlane)
                        </label>
                        <select
                          value={selectedNode.lane}
                          onChange={(e) =>
                            handleUpdateNode(selectedNode.id, {
                              lane: e.target.value,
                            })
                          }
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0078d4]"
                        >
                          {lanes.map((lane, idx) => (
                            <option key={lane.id} value={lane.id}>
                              #{idx + 1} — {lane.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Font Size Controls */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-700 flex items-center space-x-1">
                            <Type className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ukuran Teks</span>
                          </span>
                          <div className="flex items-center space-x-1 tabular-nums">
                            <button
                              type="button"
                              onClick={() =>
                                handleSetNodeFontSize(
                                  selectedNode.id,
                                  Math.max(5, currentFontSize - 1),
                                )
                              }
                              className="p-1 rounded border border-slate-200 hover:bg-slate-100 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-bold text-slate-900 min-w-[38px] text-center">
                              {currentFontSize}pt
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleSetNodeFontSize(
                                  selectedNode.id,
                                  Math.min(26, currentFontSize + 1),
                                )
                              }
                              className="p-1 rounded border border-slate-200 hover:bg-slate-100 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {[8, 10, 11, 12, 14, 16].map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() =>
                                handleSetNodeFontSize(selectedNode.id, sz)
                              }
                              className={`px-2 py-0.5 rounded border text-[11px] font-semibold tabular-nums cursor-pointer ${
                                currentFontSize === sz
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {sz}pt
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSetAllNodesFontSize(currentFontSize)
                          }
                          className="mt-1.5 w-full py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
                        >
                          Terapkan {currentFontSize}pt ke Semua Simbol
                        </button>
                      </div>

                      {/* Box Dimensions */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-700">
                            Ukuran Kotak
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                            {Math.round(selectedNode.width || 180)} ×{" "}
                            {Math.round(selectedNode.height || 74)} px
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                            <span className="text-[11px] text-slate-600 font-semibold">
                              Lebar
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleNudgeNodeSize(selectedNode.id, -20, 0)
                                }
                                className="p-0.5 rounded hover:bg-slate-200 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleNudgeNodeSize(selectedNode.id, 20, 0)
                                }
                                className="p-0.5 rounded hover:bg-slate-200 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                            <span className="text-[11px] text-slate-600 font-semibold">
                              Tinggi
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleNudgeNodeSize(selectedNode.id, 0, -10)
                                }
                                className="p-0.5 rounded hover:bg-slate-200 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleNudgeNodeSize(selectedNode.id, 0, 10)
                                }
                                className="p-0.5 rounded hover:bg-slate-200 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Append Next Connected Step */}
                      <div className="pt-2 border-t border-slate-100">
                        <label className="block font-bold text-slate-700 mb-1.5">
                          Tambah Langkah Berikutnya (Otomatis Terhubung)
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickAppend(selectedNode.id, "process")
                            }
                            className="flex items-center space-x-1.5 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-[11px] font-semibold text-slate-800 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 text-blue-600" />
                            <span>Proses</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickAppend(selectedNode.id, "decision")
                            }
                            className="flex items-center space-x-1.5 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-[11px] font-semibold text-slate-800 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 text-amber-600" />
                            <span>Keputusan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickAppend(selectedNode.id, "document")
                            }
                            className="flex items-center space-x-1.5 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-300 text-[11px] font-semibold text-slate-800 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 text-purple-600" />
                            <span>Dokumen</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickAppend(selectedNode.id, "end")
                            }
                            className="flex items-center space-x-1.5 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-[11px] font-semibold text-slate-800 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 text-rose-600" />
                            <span>Selesai</span>
                          </button>
                        </div>
                      </div>

                      {/* Related Arrows */}
                      {(relatedOut.length > 0 || relatedIn.length > 0) && (
                        <div className="pt-2 border-t border-slate-100">
                          <label className="block font-bold text-slate-700 mb-1.5">
                            Panah Terhubung (
                            {relatedOut.length + relatedIn.length})
                          </label>
                          <div className="space-y-1">
                            {relatedOut.map((c) => {
                              const tgt = nodes.find(
                                (n) => n.id === c.targetId,
                              );
                              return (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedConnectionId(c.id);
                                      setSelectedNodeId(null);
                                    }}
                                    className="truncate text-left font-medium text-slate-800 hover:text-[#0078d4] cursor-pointer flex-1"
                                    title="Klik untuk edit panah ini"
                                  >
                                    Ke: {c.label ? `[${c.label}] ` : ""}
                                    {tgt?.label || "Target"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteConnection(c.id)}
                                    className="ml-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                                    title="Hapus panah"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                            {relatedIn.map((c) => {
                              const src = nodes.find(
                                (n) => n.id === c.sourceId,
                              );
                              return (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedConnectionId(c.id);
                                      setSelectedNodeId(null);
                                    }}
                                    className="truncate text-left font-medium text-slate-600 hover:text-[#0078d4] cursor-pointer flex-1"
                                    title="Klik untuk edit panah ini"
                                  >
                                    Dari: {c.label ? `[${c.label}] ` : ""}
                                    {src?.label || "Asal"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteConnection(c.id)}
                                    className="ml-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                                    title="Hapus panah"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleStartConnect(selectedNode.id, "bottom")
                          }
                          className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Tarik Panah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateNode(selectedNode.id)}
                          className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Duplikat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNode(selectedNode.id)}
                          className="col-span-2 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Simbol (Del)</span>
                        </button>
                      </div>
                    </>
                  );
                })()}

              {/* ==================================================
                  CASE B: CONNECTION (ARROW) SELECTED
                  ================================================== */}
              {!selectedNode &&
                selectedConnection &&
                (() => {
                  const src = nodes.find(
                    (n) => n.id === selectedConnection.sourceId,
                  );
                  const tgt = nodes.find(
                    (n) => n.id === selectedConnection.targetId,
                  );
                  return (
                    <>
                      {/* Route Summary + Reverse Direction */}
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                        <div className="text-[11px] text-slate-700 leading-snug">
                          <div>
                            <span className="font-bold text-slate-500">
                              Dari:
                            </span>{" "}
                            <span className="font-semibold text-slate-900">
                              {src?.label || "Asal"}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="font-bold text-slate-500">
                              Ke:
                            </span>{" "}
                            <span className="font-semibold text-slate-900">
                              {tgt?.label || "Tujuan"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleReverseConnection(selectedConnection.id)
                          }
                          className="w-full flex items-center justify-center space-x-1.5 py-1 px-2 rounded-md bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-semibold text-slate-800 cursor-pointer"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 text-[#0078d4]" />
                          <span>Balik Arah Panah</span>
                        </button>
                      </div>

                      {/* Arrow Label */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Label Panah
                        </label>
                        <input
                          ref={arrowLabelInputRef}
                          type="text"
                          value={selectedConnection.label || ""}
                          onChange={(e) =>
                            handleUpdateConnectionLabel(
                              selectedConnection.id,
                              e.target.value,
                              "coalesce",
                            )
                          }
                          placeholder="Contoh: Ya, Tidak, Lanjut..."
                          className="w-full p-2 bg-slate-50 border border-slate-300 focus:border-[#0078d4] focus:bg-white rounded-lg text-xs font-medium outline-hidden"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {["Ya", "Tidak", "Lanjut", "Selesai", "Revisi"].map(
                            (lbl) => (
                              <button
                                key={lbl}
                                type="button"
                                onClick={() =>
                                  handleUpdateConnectionLabel(
                                    selectedConnection.id,
                                    lbl,
                                  )
                                }
                                className={`px-2 py-0.5 rounded border text-[11px] font-semibold cursor-pointer ${
                                  selectedConnection.label === lbl
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {lbl}
                              </button>
                            ),
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateConnectionLabel(
                                selectedConnection.id,
                                "",
                              )
                            }
                            className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-600 cursor-pointer"
                          >
                            Kosongkan
                          </button>
                        </div>
                      </div>

                      {/* Routing & Line Style */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Model Garis
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {(
                              [
                                { id: "orthogonal", label: "Siku" },
                                { id: "direct", label: "Lurus" },
                                { id: "curved", label: "Lengkung" },
                              ] as const
                            ).map((rt) => {
                              const active =
                                (selectedConnection.routingType ||
                                  "orthogonal") === rt.id;
                              return (
                                <button
                                  key={rt.id}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateConnectionRouting(
                                      selectedConnection.id,
                                      rt.id,
                                    )
                                  }
                                  className={`py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                                    active
                                      ? "bg-slate-900 text-white border-slate-900"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {rt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedConnection.dashed) {
                                handleToggleConnectionDashed(
                                  selectedConnection.id,
                                );
                              }
                            }}
                            className={`py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                              !selectedConnection.dashed
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Garis Solid
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedConnection.dashed) {
                                handleToggleConnectionDashed(
                                  selectedConnection.id,
                                );
                              }
                            }}
                            className={`py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                              selectedConnection.dashed
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Putus-putus
                          </button>
                        </div>
                      </div>

                      {/* Ports (Keluar & Masuk) */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Port Keluar
                          </label>
                          <div className="grid grid-cols-2 gap-1">
                            {(["top", "right", "bottom", "left"] as const).map(
                              (h) => {
                                const names = {
                                  top: "Atas",
                                  right: "Kanan",
                                  bottom: "Bawah",
                                  left: "Kiri",
                                };
                                const active =
                                  (selectedConnection.sourceHandle ||
                                    "bottom") === h;
                                return (
                                  <button
                                    key={h}
                                    type="button"
                                    onClick={() =>
                                      handleSetConnectionHandles(
                                        selectedConnection.id,
                                        h,
                                        undefined,
                                      )
                                    }
                                    className={`py-1 rounded border text-[11px] font-semibold cursor-pointer ${
                                      active
                                        ? "bg-[#0078d4] text-white border-[#0078d4]"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    {names[h]}
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Port Masuk
                          </label>
                          <div className="grid grid-cols-2 gap-1">
                            {(["top", "right", "bottom", "left"] as const).map(
                              (h) => {
                                const names = {
                                  top: "Atas",
                                  right: "Kanan",
                                  bottom: "Bawah",
                                  left: "Kiri",
                                };
                                const active =
                                  (selectedConnection.targetHandle || "top") ===
                                  h;
                                return (
                                  <button
                                    key={h}
                                    type="button"
                                    onClick={() =>
                                      handleSetConnectionHandles(
                                        selectedConnection.id,
                                        undefined,
                                        h,
                                      )
                                    }
                                    className={`py-1 rounded border text-[11px] font-semibold cursor-pointer ${
                                      active
                                        ? "bg-[#0078d4] text-white border-[#0078d4]"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    {names[h]}
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Offset & Waypoint Nudge */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Pisahkan Jalur Tumpuk
                          </label>
                          <div className="grid grid-cols-3 gap-1 tabular-nums">
                            <button
                              type="button"
                              onClick={() =>
                                handleOffsetConnection(
                                  selectedConnection.id,
                                  -35,
                                )
                              }
                              className="py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-[11px] cursor-pointer"
                            >
                              -35px
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOffsetConnection(
                                  selectedConnection.id,
                                  0,
                                  true,
                                )
                              }
                              className="py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold text-[11px] cursor-pointer"
                            >
                              Tengah
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOffsetConnection(
                                  selectedConnection.id,
                                  35,
                                )
                              }
                              className="py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-[11px] cursor-pointer"
                            >
                              +35px
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-slate-700">
                              Belokan Panah
                            </label>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddConnectionWaypoint(
                                    selectedConnection.id,
                                  )
                                }
                                className="px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold cursor-pointer"
                              >
                                + Titik
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleResetConnectionWaypoints(
                                    selectedConnection.id,
                                  )
                                }
                                className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-600 cursor-pointer"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleNudgeConnection(
                                  selectedConnection.id,
                                  -20,
                                  0,
                                )
                              }
                              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                              title="Geser belokan ke kiri"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleNudgeConnection(
                                  selectedConnection.id,
                                  20,
                                  0,
                                )
                              }
                              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                              title="Geser belokan ke kanan"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleNudgeConnection(
                                  selectedConnection.id,
                                  0,
                                  -20,
                                )
                              }
                              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                              title="Geser belokan ke atas"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleNudgeConnection(
                                  selectedConnection.id,
                                  0,
                                  20,
                                )
                              }
                              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                              title="Geser belokan ke bawah"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteConnection(selectedConnection.id)
                          }
                          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Tanda Panah (Del)</span>
                        </button>
                      </div>
                    </>
                  );
                })()}

              {/* ==================================================
                  CASE C: NOTHING SELECTED (DIAGRAM OVERVIEW & LANES)
                  ================================================== */}
              {!selectedNode && !selectedConnection && (
                <>
                  {/* Summary Metrics */}
                  <div className="grid grid-cols-3 gap-1.5 text-center tabular-nums">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-base font-bold text-slate-900">
                        {nodes.length}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Simbol
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-base font-bold text-slate-900">
                        {connections.length}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Panah
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-base font-bold text-slate-900">
                        {lanes.length}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Kolom
                      </div>
                    </div>
                  </div>

                  {/* Swimlane Manager */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">
                        Kelola Kolom Aktor
                      </span>
                      <button
                        type="button"
                        onClick={handleAddLane}
                        className="flex items-center space-x-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Kolom</span>
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {lanes.map((lane, idx) => (
                        <div
                          key={lane.id}
                          className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: lane.bgColor || "#dcfce7",
                              border: `1.5px solid ${lane.color || "#166534"}`,
                            }}
                          />
                          <input
                            type="text"
                            value={lane.name}
                            onChange={(e) =>
                              handleUpdateLaneName(lane.id, e.target.value)
                            }
                            className="flex-1 min-w-0 bg-white border border-slate-200 focus:border-[#0078d4] rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-800 outline-hidden"
                          />
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveLane(lane.id, -1)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            title="Geser kolom ke kiri"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === lanes.length - 1}
                            onClick={() => handleMoveLane(lane.id, 1)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            title="Geser kolom ke kanan"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          {lanes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteLane(lane.id)}
                              className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Hapus kolom"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Global Font Size */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block font-bold text-slate-800 mb-1.5">
                      Ukuran Teks Semua Simbol
                    </label>
                    <div className="flex flex-wrap gap-1 tabular-nums">
                      {[
                        { sz: 8, lbl: "8pt" },
                        { sz: 10, lbl: "10pt" },
                        { sz: 11, lbl: "11pt (Standar)" },
                        { sz: 12, lbl: "12pt" },
                        { sz: 14, lbl: "14pt" },
                      ].map((item) => (
                        <button
                          key={item.sz}
                          type="button"
                          onClick={() => handleSetAllNodesFontSize(item.sz)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
                        >
                          {item.lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset View Helper */}
                  {(zoomLevel !== 100 ||
                    panOffset.x !== 0 ||
                    panOffset.y !== 0) && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setZoomLevel(100);
                          setPanOffset({ x: 0, y: 0 });
                        }}
                        className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Tampilan (100%)</span>
                      </button>
                    </div>
                  )}

                  {/* Keyboard Shortcuts */}
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                    <div className="font-bold text-slate-800 mb-1">
                      Pintasan Keyboard
                    </div>
                    <div className="flex justify-between">
                      <span>Undo / Redo</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Ctrl+Z / Ctrl+Y
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duplikat Simbol</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Ctrl+D
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hapus Simbol / Panah</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Delete
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Geser Presisi</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Tombol Panah
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ganti Alat (Pointer/Panah/Geser)</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        V / C / H
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ========================================================
          MODAL 1: TAMBAH TANDA PANAH BARU (INLINE VALIDATION, NO ALERT)
          ======================================================== */}
      {isAddArrowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Tambah Tanda Panah Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddArrowModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              {addArrowError && (
                <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addArrowError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  1. Dari Simbol Asal
                </label>
                <select
                  value={newArrowSource}
                  onChange={(e) => {
                    setNewArrowSource(e.target.value);
                    setAddArrowError(null);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0078d4]"
                >
                  {nodes.map((n, i) => (
                    <option key={`src-${n.id}`} value={n.id}>
                      {i + 1}. [{n.type.toUpperCase()}] {n.label} (
                      {lanes.find((l) => l.id === n.lane)?.name ||
                        actors[n.lane] ||
                        n.lane}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2. Menuju Simbol Tujuan
                </label>
                <select
                  value={newArrowTarget}
                  onChange={(e) => {
                    setNewArrowTarget(e.target.value);
                    setAddArrowError(null);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0078d4]"
                >
                  {nodes.map((n, i) => (
                    <option key={`tgt-${n.id}`} value={n.id}>
                      {i + 1}. [{n.type.toUpperCase()}] {n.label} (
                      {lanes.find((l) => l.id === n.lane)?.name ||
                        actors[n.lane] ||
                        n.lane}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  3. Label Teks Panah (Opsional)
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={newArrowLabel}
                    onChange={(e) => setNewArrowLabel(e.target.value)}
                    placeholder="Contoh: Ya, Tidak, Lanjut, Berkas Lengkap"
                    className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0078d4]"
                  />
                  {newArrowLabel && (
                    <button
                      type="button"
                      onClick={() => setNewArrowLabel("")}
                      className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer"
                      title="Kosongkan Label"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 self-center">
                    Pilihan cepat:
                  </span>
                  {["Ya", "Tidak", "Lanjut", "Selesai", "Revisi"].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setNewArrowLabel(lbl)}
                      className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border transition-colors cursor-pointer ${
                        newArrowLabel === lbl
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Port Keluar (Asal)
                  </label>
                  <select
                    value={newArrowSourceHandle}
                    onChange={(e) =>
                      setNewArrowSourceHandle(e.target.value as any)
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  >
                    <option value="bottom">Bawah (Standar)</option>
                    <option value="right">Kanan</option>
                    <option value="left">Kiri</option>
                    <option value="top">Atas</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Port Masuk (Tujuan)
                  </label>
                  <select
                    value={newArrowTargetHandle}
                    onChange={(e) =>
                      setNewArrowTargetHandle(e.target.value as any)
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  >
                    <option value="top">Atas (Standar)</option>
                    <option value="left">Kiri</option>
                    <option value="right">Kanan</option>
                    <option value="bottom">Bawah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tipe Garis Alur
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["orthogonal", "direct", "curved"] as const).map((rt) => {
                    const titles = {
                      orthogonal: "Siku (BPMN)",
                      direct: "Lurus",
                      curved: "Lengkung",
                    };
                    return (
                      <button
                        key={rt}
                        type="button"
                        onClick={() => setNewArrowRouting(rt)}
                        className={`p-2 rounded-xl text-center font-semibold border transition-colors cursor-pointer ${
                          newArrowRouting === rt
                            ? "bg-blue-50 text-[#0078d4] border-[#0078d4]"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {titles[rt]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddArrowModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAddArrow}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan &amp; Hubungkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: KELOLA & HAPUS TANDA PANAH
          ======================================================== */}
      {isManageArrowsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    Daftar &amp; Kelola Tanda Panah
                  </h3>
                  <p className="text-[11px] text-slate-300 tabular-nums">
                    Total {connections.length} tanda panah terhubung dalam
                    diagram
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsManageArrowsModalOpen(false);
                    handleOpenAddArrowModal();
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Panah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsManageArrowsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 flex-1 text-xs">
              {connections.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <GitBranch className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">
                    Belum ada tanda panah dalam diagram ini.
                  </p>
                  <p className="text-[11px] mt-1">
                    Klik "Tambah Panah" atau gunakan alat Connector untuk
                    menghubungkan simbol.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManageArrowsModalOpen(false);
                      handleOpenAddArrowModal();
                    }}
                    className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Panah Sekarang</span>
                  </button>
                </div>
              ) : (
                connections.map((conn, idx) => {
                  const srcNode = nodes.find((n) => n.id === conn.sourceId);
                  const tgtNode = nodes.find((n) => n.id === conn.targetId);
                  return (
                    <div
                      key={conn.id}
                      className="p-3 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 tabular-nums">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900">
                            {srcNode?.label || conn.sourceId}
                          </span>
                          <span className="text-emerald-700 font-bold">
                            {conn.label ? `──[${conn.label}]──▶` : "───▶"}
                          </span>
                          <span className="font-bold text-slate-900">
                            {tgtNode?.label || conn.targetId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                            Keluar: {conn.sourceHandle || "bottom"}
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                            Masuk: {conn.targetHandle || "top"}
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                            Garis: {conn.routingType || "orthogonal"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedConnectionId(conn.id);
                            setSelectedNodeId(null);
                            setIsInspectorOpen(true);
                            setIsManageArrowsModalOpen(false);
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-[#0078d4] rounded-lg font-semibold border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteConnection(conn.id)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg font-semibold border border-rose-200 hover:border-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsManageArrowsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
