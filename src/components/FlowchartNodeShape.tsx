import React, { useRef } from 'react';
import { FlowNode, FlowNodeType, FlowLane } from '../types/spo';
import {
  Trash2,
  Plus,
  ArrowRight,
  Square,
  HelpCircle,
  StopCircle,
  Copy,
} from 'lucide-react';

interface FlowchartNodeShapeProps {
  node: FlowNode;
  isSelected: boolean;
  isConnectSource?: boolean;
  isDirectEditMode: boolean;
  isConnectMode?: boolean;
  onSelect: () => void;
  onUpdateNode: (patch: Partial<FlowNode>) => void;
  onDeleteNode: () => void;
  onDuplicateNode?: (nodeId: string) => void;
  onStartConnect: (nodeId: string, handle?: 'top' | 'bottom' | 'left' | 'right') => void;
  onPinClick?: (nodeId: string, handle: 'top' | 'bottom' | 'left' | 'right') => void;
  onStartResize?: (e: React.MouseEvent, nodeId: string, dir: 'se' | 'e' | 's') => void;
  onQuickAppend: (sourceId: string, type: FlowNodeType) => void;
  actors?: {
    admin: string;
    system: string;
    customer: string;
    [key: string]: string;
  };
  lanes?: FlowLane[];
}

export const FlowchartNodeShape: React.FC<FlowchartNodeShapeProps> = ({
  node,
  isSelected,
  isConnectSource = false,
  isDirectEditMode,
  isConnectMode = false,
  onSelect,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onPinClick,
  onStartResize,
  onQuickAppend,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePinAction = (
    e: React.MouseEvent,
    handle: 'top' | 'bottom' | 'left' | 'right'
  ) => {
    e.stopPropagation();
    if (onPinClick) {
      onPinClick(node.id, handle);
    } else {
      onStartConnect(node.id, handle);
    }
  };

  const handleDoubleClickNode = (e: React.MouseEvent) => {
    if (!isDirectEditMode || isConnectMode) return;
    e.stopPropagation();
    onSelect();
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 10);
  };

  if (!isDirectEditMode) {
    return (
      <div
        onClick={onSelect}
        className="w-full h-full cursor-pointer select-none transition-transform hover:scale-[1.01]"
      >
        {renderCleanBpmnShape(node)}
      </div>
    );
  }

  // Place compact action bar below node if near top lane header so it never clips
  const placePadBelow = (node.y || 0) < 95;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={handleDoubleClickNode}
      className={`relative w-full h-full select-none group ${
        isSelected ? 'z-30' : 'z-10'
      }`}
    >
      {/* Visio-Style Selection Bounding Box & Interactive Resize Handles */}
      {(isSelected || isConnectSource) && (
        <div
          className={`absolute -inset-1.5 border-2 pointer-events-none rounded-sm z-30 ${
            isConnectSource
              ? 'border-emerald-600 ring-2 ring-emerald-500/25'
              : 'border-[#0078d4]'
          }`}
        >
          {/* Decorative Corner Handles */}
          <span className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-white border-2 border-[#0078d4] shadow-2xs" />
          <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-white border-2 border-[#0078d4] shadow-2xs" />
          <span className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-white border-2 border-[#0078d4] shadow-2xs" />
          {/* Interactive Corner SE Resize Handle */}
          <span
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartResize?.(e, node.id, 'se');
            }}
            title="Tarik untuk mengubah lebar & tinggi simbol"
            className="no-print pointer-events-auto cursor-nwse-resize absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#0078d4] border-2 border-white shadow-sm hover:scale-125 transition-transform"
          />
          {/* Edge Midpoint Handles */}
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-[#0078d4] shadow-2xs" />
          <span
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartResize?.(e, node.id, 's');
            }}
            title="Tarik untuk mengubah tinggi simbol"
            className="no-print pointer-events-auto cursor-ns-resize absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-white border-2 border-[#0078d4] shadow-2xs hover:bg-[#0078d4]"
          />
          <span className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-[#0078d4] shadow-2xs" />
          <span
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartResize?.(e, node.id, 'e');
            }}
            title="Tarik untuk mengubah lebar simbol"
            className="no-print pointer-events-auto cursor-ew-resize absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-4 bg-white border-2 border-[#0078d4] shadow-2xs hover:bg-[#0078d4]"
          />
        </div>
      )}

      {/* Render the BPMN Shape */}
      <div className="w-full h-full">
        {renderEditableBpmnShape(node, onUpdateNode, textareaRef, isSelected)}
      </div>

      {/* 4-Side Connection Pin Handles (Top, Right, Bottom, Left) */}
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => handlePinAction(e, 'top')}
        className={`no-print absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md transition-all cursor-crosshair z-35 flex items-center justify-center text-white text-[10px] font-black leading-none ${
          isConnectMode
            ? 'bg-emerald-600 opacity-100 scale-110 hover:scale-125 ring-2 ring-emerald-300'
            : 'bg-[#0078d4] opacity-0 group-hover:opacity-100 hover:scale-125'
        }`}
        title={isConnectMode ? 'Sambungkan panah ke sisi atas simbol ini' : 'Tarik panah dari sisi atas'}
      >
        +
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => handlePinAction(e, 'right')}
        className={`no-print absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md transition-all cursor-crosshair z-35 flex items-center justify-center text-white text-[10px] font-black leading-none ${
          isConnectMode
            ? 'bg-emerald-600 opacity-100 scale-110 hover:scale-125 ring-2 ring-emerald-300'
            : 'bg-[#0078d4] opacity-0 group-hover:opacity-100 hover:scale-125'
        }`}
        title={isConnectMode ? 'Sambungkan panah ke sisi kanan simbol ini' : 'Tarik panah dari sisi kanan'}
      >
        +
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => handlePinAction(e, 'bottom')}
        className={`no-print absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md transition-all cursor-crosshair z-35 flex items-center justify-center text-white text-[10px] font-black leading-none ${
          isConnectMode
            ? 'bg-emerald-600 opacity-100 scale-110 hover:scale-125 ring-2 ring-emerald-300'
            : 'bg-[#0078d4] opacity-0 group-hover:opacity-100 hover:scale-125'
        }`}
        title={isConnectMode ? 'Sambungkan panah ke sisi bawah simbol ini' : 'Tarik panah dari sisi bawah'}
      >
        +
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => handlePinAction(e, 'left')}
        className={`no-print absolute top-1/2 -left-2.5 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md transition-all cursor-crosshair z-35 flex items-center justify-center text-white text-[10px] font-black leading-none ${
          isConnectMode
            ? 'bg-emerald-600 opacity-100 scale-110 hover:scale-125 ring-2 ring-emerald-300'
            : 'bg-[#0078d4] opacity-0 group-hover:opacity-100 hover:scale-125'
        }`}
        title={isConnectMode ? 'Sambungkan panah ke sisi kiri simbol ini' : 'Tarik panah dari sisi kiri'}
      >
        +
      </button>

      {/* Compact Non-Clipping Quick Action Pad (Detail Editing lives in Right Inspector) */}
      {isSelected && !isConnectMode && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={`no-print absolute left-1/2 -translate-x-1/2 ${
            placePadBelow ? '-bottom-11' : '-top-11'
          } bg-slate-900 text-white rounded-lg shadow-xl px-1.5 py-1 flex items-center space-x-1 border border-slate-700 z-40 whitespace-nowrap`}
        >
          <button
            type="button"
            onClick={() => onQuickAppend(node.id, 'process')}
            className="flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-semibold bg-slate-800 hover:bg-blue-600 text-slate-100 transition-colors cursor-pointer"
            title="Tambah langkah Proses baru di bawah dan langsung hubungkan panah"
          >
            <Plus className="w-3 h-3 text-blue-300" />
            <Square className="w-3 h-3 text-blue-300" />
            <span>Langkah</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickAppend(node.id, 'decision')}
            className="p-1.5 rounded bg-slate-800 hover:bg-amber-600 text-amber-300 hover:text-white transition-colors cursor-pointer"
            title="Tambah percabangan Keputusan di bawah dan hubungkan panah"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onQuickAppend(node.id, 'end')}
            className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors cursor-pointer"
            title="Tambah simbol Selesai di bawah dan hubungkan panah"
          >
            <StopCircle className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={() => onStartConnect(node.id, 'bottom')}
            className="flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-semibold bg-slate-800 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors cursor-pointer"
            title="Tarik panah ke simbol lain"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Panah</span>
          </button>
          {onDuplicateNode && (
            <button
              type="button"
              onClick={() => onDuplicateNode(node.id)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Duplikat simbol (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDeleteNode}
            className="p-1.5 rounded bg-rose-950/70 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors cursor-pointer"
            title="Hapus simbol (Delete)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

// ==============================================================
// EDITABLE SHAPES (Direct Inline Text Editing with Zero Cut-Off)
// ==============================================================
function renderEditableBpmnShape(
  node: FlowNode,
  onUpdate: (patch: Partial<FlowNode>) => void,
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  isSelected: boolean
) {
  const currentFontSize =
    node.fontSize ||
    (node.type === 'decision' || node.type === 'document' || node.type === 'datastore' ? 10 : 11);
  const w = node.width || 180;
  const h = node.height || 74;

  const stopDragWhenSelected = (e: React.MouseEvent) => {
    if (isSelected) {
      e.stopPropagation();
    }
  };

  switch (node.type) {
    case 'start':
    case 'terminator':
      return (
        <div className="w-full h-full px-3.5 py-2 rounded-full border-2 border-emerald-600 bg-emerald-50/95 shadow-md flex items-center justify-center text-center overflow-visible">
          <textarea
            ref={textareaRef}
            rows={Math.max(1, Math.min(3, Math.ceil((node.label || '').length / 16)))}
            value={node.label}
            onMouseDown={stopDragWhenSelected}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Mulai Prosedur"
            style={{ fontSize: `${currentFontSize}pt` }}
            className="w-full text-center font-bold text-emerald-950 bg-transparent border border-dashed border-transparent hover:border-emerald-300 focus:border-emerald-500 outline-hidden px-1 resize-none leading-tight break-words whitespace-normal"
          />
        </div>
      );

    case 'end':
      return (
        <div className="w-full h-full px-3.5 py-2 rounded-full border-4 border-slate-900 bg-rose-50/95 shadow-md flex items-center justify-center text-center overflow-visible">
          <textarea
            ref={textareaRef}
            rows={Math.max(1, Math.min(3, Math.ceil((node.label || '').length / 16)))}
            value={node.label}
            onMouseDown={stopDragWhenSelected}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Selesai Prosedur"
            style={{ fontSize: `${currentFontSize}pt` }}
            className="w-full text-center font-black text-rose-950 bg-transparent border border-dashed border-transparent hover:border-rose-300 focus:border-rose-500 outline-hidden px-1 resize-none leading-tight break-words whitespace-normal"
          />
        </div>
      );

    case 'decision':
    case 'gateway':
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-visible">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="absolute inset-0 w-full h-full overflow-visible drop-shadow-md pointer-events-none"
            preserveAspectRatio="none"
          >
            <polygon
              points={`${w / 2},3 ${w - 3},${h / 2} ${w / 2},${h - 3} 3,${h / 2}`}
              fill="#fffbeb"
              stroke="#d97706"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
          <div className="relative z-10 px-6 py-2 w-full flex items-center justify-center text-center overflow-visible">
            <textarea
              ref={textareaRef}
              rows={Math.max(2, Math.min(4, Math.ceil((node.label || '').length / 16)))}
              value={node.label}
              onMouseDown={stopDragWhenSelected}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Apakah berkas valid?"
              style={{ fontSize: `${currentFontSize}pt` }}
              className="w-full text-center font-bold text-amber-950 bg-transparent border border-dashed border-amber-300/80 focus:border-amber-600 outline-hidden focus:bg-white/80 rounded p-1 resize-none leading-tight break-words whitespace-normal"
            />
          </div>
        </div>
      );

    case 'document':
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-visible">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="absolute inset-0 w-full h-full overflow-visible drop-shadow-md pointer-events-none"
            preserveAspectRatio="none"
          >
            <path
              d={`M 2 2 L ${w - 2} 2 L ${w - 2} ${h - 12} Q ${w * 0.75} ${h - 20} ${w * 0.5} ${h - 12} T 2 ${h - 12} Z`}
              fill="#faf5ff"
              stroke="#7c3aed"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
          <div className="relative z-10 px-4 pb-3 pt-2 w-full flex items-center justify-center overflow-visible">
            <textarea
              ref={textareaRef}
              rows={Math.max(2, Math.min(4, Math.ceil((node.label || '').length / 20)))}
              value={node.label}
              onMouseDown={stopDragWhenSelected}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Nama formulir / berkas..."
              style={{ fontSize: `${currentFontSize}pt` }}
              className="w-full text-center font-bold text-purple-950 bg-transparent border border-dashed border-purple-300/80 focus:border-purple-600 outline-hidden focus:bg-white/80 rounded p-1 resize-none leading-tight break-words whitespace-normal"
            />
          </div>
        </div>
      );

    case 'datastore':
    case 'data':
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-visible">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="absolute inset-0 w-full h-full overflow-visible drop-shadow-md pointer-events-none"
            preserveAspectRatio="none"
          >
            <path
              d={`M 3 14 C 3 6, ${w - 3} 6, ${w - 3} 14 L ${w - 3} ${h - 14} C ${w - 3} ${h - 6}, 3 ${h - 6}, 3 ${h - 14} Z`}
              fill="#f0f9ff"
              stroke="#0284c7"
              strokeWidth="2.5"
            />
            <path
              d={`M 3 14 C 3 22, ${w - 3} 22, ${w - 3} 14`}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
            />
          </svg>
          <div className="relative z-10 px-4 pt-2.5 pb-2 w-full flex flex-col items-center justify-center overflow-visible">
            <textarea
              ref={textareaRef}
              rows={Math.max(2, Math.min(4, Math.ceil((node.label || '').length / 20)))}
              value={node.label}
              onMouseDown={stopDragWhenSelected}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Registrasi SIMRS / RME..."
              style={{ fontSize: `${currentFontSize}pt` }}
              className="w-full text-center font-bold text-sky-950 bg-transparent border border-dashed border-sky-300/80 focus:border-sky-600 outline-hidden focus:bg-white/80 rounded p-1 resize-none leading-tight break-words whitespace-normal"
            />
          </div>
        </div>
      );

    case 'subprocess':
      return (
        <div className="relative w-full h-full px-5 py-2.5 rounded-xl border-2 border-indigo-700 bg-indigo-50/70 shadow-md text-center flex items-center justify-center overflow-visible">
          <span className="pointer-events-none absolute top-1 bottom-1 left-2.5 w-px bg-indigo-400" />
          <span className="pointer-events-none absolute top-1 bottom-1 right-2.5 w-px bg-indigo-400" />
          <textarea
            ref={textareaRef}
            rows={Math.max(2, Math.min(4, Math.ceil((node.label || '').length / 20)))}
            value={node.label}
            onMouseDown={stopDragWhenSelected}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Sub-prosedur teknis..."
            style={{ fontSize: `${currentFontSize}pt` }}
            className="w-full text-center font-bold text-indigo-950 bg-transparent border border-dashed border-indigo-300 focus:border-indigo-500 outline-hidden focus:bg-white/70 rounded p-1 resize-none leading-tight break-words whitespace-normal"
          />
        </div>
      );

    case 'process':
    default:
      return (
        <div className="w-full h-full p-2.5 rounded-xl border-2 border-slate-700 bg-white shadow-md text-center flex items-center justify-center overflow-visible">
          <textarea
            ref={textareaRef}
            rows={Math.max(2, Math.min(4, Math.ceil((node.label || '').length / 22)))}
            value={node.label}
            onMouseDown={stopDragWhenSelected}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Aktivitas tindakan medis..."
            style={{ fontSize: `${currentFontSize}pt` }}
            className="w-full text-center font-bold text-slate-900 bg-transparent border border-dashed border-slate-300 focus:border-blue-500 outline-hidden focus:bg-blue-50/60 rounded p-1 resize-none leading-tight break-words whitespace-normal"
          />
        </div>
      );
  }
}

// ==============================================================
// CLEAN SHAPES (For Pristine View & Clean Export - Zero Cut-Off)
// ==============================================================
function renderCleanBpmnShape(node: FlowNode) {
  const currentFontSize =
    node.fontSize ||
    (node.type === 'decision' || node.type === 'document' || node.type === 'datastore' ? 10 : 11);
  const w = node.width || 180;
  const h = node.height || 74;

  switch (node.type) {
    case 'start':
    case 'terminator':
      return (
        <div className="w-full h-full px-3.5 py-2 rounded-full border-2 border-emerald-600 bg-emerald-50/95 shadow-sm flex items-center justify-center text-center overflow-visible">
          <div
            className="font-bold text-emerald-950 leading-tight break-words whitespace-normal w-full"
            style={{ fontSize: `${currentFontSize}pt` }}
          >
            {node.label}
          </div>
        </div>
      );

    case 'end':
      return (
        <div className="w-full h-full px-3.5 py-2 rounded-full border-4 border-slate-900 bg-rose-50/95 shadow-sm flex items-center justify-center text-center overflow-visible">
          <div
            className="font-black text-rose-950 leading-tight break-words whitespace-normal w-full"
            style={{ fontSize: `${currentFontSize}pt` }}
          >
            {node.label}
          </div>
        </div>
      );

    case 'decision':
    case 'gateway':
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-visible">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="absolute inset-0 w-full h-full overflow-visible drop-shadow-sm pointer-events-none"
            preserveAspectRatio="none"
          >
            <polygon
              points={`${w / 2},3 ${w - 3},${h / 2} ${w / 2},${h - 3} 3,${h / 2}`}
              fill="#fffbeb"
              stroke="#d97706"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
          <div className="relative z-10 px-6 py-2 text-center w-full overflow-visible flex items-center justify-center">
            <div
              className="font-bold text-amber-950 leading-tight break-words whitespace-normal w-full"
              style={{ fontSize: `${currentFontSize}pt` }}
            >
              {node.label}
            </div>
          </div>
        </div>
      );

    case 'document':
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-visible">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="absolute inset-0 w-full h-full overflow-visible drop-shadow-sm pointer-events-none"
            preserveAspectRatio="none"
          >
            <path
              d={`M 2 2 L ${w - 2} 2 L ${w - 2} ${h - 12} Q ${w * 0.75} ${h - 20} ${w * 0.5} ${h - 12} T 2 ${h - 12} Z`}
              fill="#faf5ff"
              stroke="#7c3aed"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
          <div className="relative z-10 px-4 pb-3 pt-2 text-center w-full overflow-visible flex items-center justify-center">
            <div
              className="font-bold text-purple-950 leading-tight break-words whitespace-normal w-full"
              style={{ fontSize: `${currentFontSize}pt` }}
            >
              {node.label}
            </div>
          </div>
        </div>
      );

    case 'datastore':
    case 'data':
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-visible">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="absolute inset-0 w-full h-full overflow-visible drop-shadow-sm pointer-events-none"
            preserveAspectRatio="none"
          >
            <path
              d={`M 3 14 C 3 6, ${w - 3} 6, ${w - 3} 14 L ${w - 3} ${h - 14} C ${w - 3} ${h - 6}, 3 ${h - 6}, 3 ${h - 14} Z`}
              fill="#f0f9ff"
              stroke="#0284c7"
              strokeWidth="2.5"
            />
            <path
              d={`M 3 14 C 3 22, ${w - 3} 22, ${w - 3} 14`}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
            />
          </svg>
          <div className="relative z-10 px-4 pt-2.5 pb-2 text-center w-full overflow-visible flex items-center justify-center">
            <div
              className="font-bold text-sky-950 leading-tight break-words whitespace-normal w-full"
              style={{ fontSize: `${currentFontSize}pt` }}
            >
              {node.label}
            </div>
          </div>
        </div>
      );

    case 'subprocess':
      return (
        <div className="relative w-full h-full px-5 py-2.5 rounded-xl border-2 border-indigo-700 bg-indigo-50/70 shadow-sm text-center flex items-center justify-center overflow-visible">
          <span className="pointer-events-none absolute top-1 bottom-1 left-2.5 w-px bg-indigo-400" />
          <span className="pointer-events-none absolute top-1 bottom-1 right-2.5 w-px bg-indigo-400" />
          <div
            className="font-bold text-indigo-950 leading-tight break-words whitespace-normal w-full"
            style={{ fontSize: `${currentFontSize}pt` }}
          >
            {node.label}
          </div>
        </div>
      );

    case 'process':
    default:
      return (
        <div className="w-full h-full p-2.5 rounded-xl border-2 border-slate-700 bg-white shadow-sm text-center flex items-center justify-center overflow-visible">
          <div
            className="font-bold text-slate-900 leading-tight break-words whitespace-normal w-full"
            style={{ fontSize: `${currentFontSize}pt` }}
          >
            {node.label}
          </div>
        </div>
      );
  }
}
