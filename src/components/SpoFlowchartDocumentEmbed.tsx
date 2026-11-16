import React, { useMemo } from 'react';
import { SpoDocument, FlowchartModel, FlowLane } from '../types/spo';
import {
  generateDefaultFlowchartModel,
  autoLayoutFlowchart,
  getModelLanes,
  computeConnectionGeometry,
} from '../utils/flowchartHelper';
import { ExternalLink, GitBranch } from 'lucide-react';

interface SpoFlowchartDocumentEmbedProps {
  spo: SpoDocument;
  onSwitchToFlowchart?: () => void;
}

export const SpoFlowchartDocumentEmbed: React.FC<SpoFlowchartDocumentEmbedProps> = ({
  spo,
  onSwitchToFlowchart,
}) => {
  const isBlankTemplate =
    !spo.judulSpo?.trim() &&
    (!Array.isArray(spo.prosedur) || spo.prosedur.length === 0) &&
    (!spo.flowchartModel ||
      !Array.isArray(spo.flowchartModel.nodes) ||
      spo.flowchartModel.nodes.length === 0);

  const flowchartModel: FlowchartModel = useMemo(() => {
    const raw = generateDefaultFlowchartModel(spo);
    return autoLayoutFlowchart(raw);
  }, [spo]);

  const lanes: FlowLane[] = useMemo(() => {
    return getModelLanes(flowchartModel);
  }, [flowchartModel]);

  const { nodes, connections = [] } = flowchartModel;

  const laneCount = Math.max(1, lanes.length);
  const canvasWidth = Math.max(960, laneCount * 320);
  const laneWidth = canvasWidth / laneCount;
  const canvasHeight =
    Math.max(
      ...nodes.map((n) => (n.y || 0) + (n.height || 74)),
      flowchartModel.canvasHeight || 760
    ) + 60;

  return (
    <div className="mt-6">
      {/* Sub-judul Bagian D.2 Diagram Alur Pelayanan */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-tight">
          D.2 DIAGRAM ALUR PELAYANAN (FLOWCHART):
        </h3>
        {onSwitchToFlowchart && (
          <button
            type="button"
            onClick={onSwitchToFlowchart}
            className="no-print flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
            title="Buka diagram alur dalam editor modeler interaktif"
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-700" />
            <span>Edit Diagram Alur</span>
            <ExternalLink className="w-3 h-3 text-emerald-700 opacity-70" />
          </button>
        )}
      </div>

      {isBlankTemplate ? (
        <div className="p-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center space-y-2">
          <p className="text-slate-500 text-xs italic">
            [Diagram Alur Pelayanan (Flowchart BPMN) akan otomatis ter-generate selaras dengan tabel Prosedur D.1 setelah Anda klik &ldquo;Generate SPO Baru&rdquo;]
          </p>
        </div>
      ) : (
        <div className="w-full bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs print:border-black print:shadow-none">
        <svg
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="w-full h-auto block font-sans"
        >
          <defs>
            <marker
              id="spo-doc-arrowhead"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#1e293b" />
            </marker>
          </defs>

          {/* 1. SWIMLANE COLUMN BACKGROUNDS & HEADERS */}
          {lanes.map((lane, idx) => {
            const laneX = idx * laneWidth;
            return (
              <g key={lane.id}>
                <rect
                  x={laneX}
                  y={42}
                  width={laneWidth}
                  height={canvasHeight - 42}
                  fill={lane.bgColor || '#f8fafc'}
                  fillOpacity="0.25"
                />
                <rect
                  x={laneX}
                  y={0}
                  width={laneWidth}
                  height={42}
                  fill={lane.bgColor || '#f1f5f9'}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <rect
                  x={laneX}
                  y={0}
                  width={laneWidth}
                  height={4}
                  fill={lane.color || '#0f766e'}
                />
                <text
                  x={laneX + laneWidth / 2}
                  y={24}
                  textAnchor="middle"
                  fill={lane.color || '#1e293b'}
                  fontWeight="700"
                  fontSize="12"
                  letterSpacing="0.5"
                >
                  {`${idx + 1}. ${lane.name.toUpperCase()}`}
                </text>
                {idx > 0 && (
                  <line
                    x1={laneX}
                    y1={0}
                    x2={laneX}
                    y2={canvasHeight}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                )}
              </g>
            );
          })}

          <line
            x1={0}
            y1={42}
            x2={canvasWidth}
            y2={42}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* 2. ARROW CONNECTIONS (100% SYNCED WITH FLOWCHARTVIEW) */}
          {connections.map((conn) => {
            const sourceNode = nodes.find((n) => n.id === conn.sourceId);
            const targetNode = nodes.find((n) => n.id === conn.targetId);
            if (!sourceNode || !targetNode) return null;

            const { pathD, midWaypoint } = computeConnectionGeometry(
              conn,
              sourceNode,
              targetNode,
              connections
            );

            return (
              <g key={`doc-${conn.id}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={conn.color || '#334155'}
                  strokeWidth="2"
                  strokeDasharray={conn.dashed ? '5,4' : undefined}
                  markerEnd="url(#spo-doc-arrowhead)"
                />
                {conn.label && (
                  <foreignObject
                    x={midWaypoint.x - 45}
                    y={midWaypoint.y - 12}
                    width="90"
                    height="24"
                    className="overflow-visible pointer-events-none"
                  >
                    <div className="flex items-center justify-center">
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-2xs border ${
                          conn.label.toLowerCase().includes('tidak')
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : conn.label.toLowerCase().includes('ya')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {conn.label}
                      </span>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* 3. BPMN NODES (100% MATCHED WITH FLOWCHARTNODESHAPE) */}
          {nodes.map((node) => {
            const w = node.width || 180;
            const h = node.height || 74;
            const x = node.x || 0;
            const y = node.y || 0;
            const defaultFs =
              node.type === 'decision' || node.type === 'document' || node.type === 'datastore'
                ? 10
                : 11;
            const fs = node.fontSize || defaultFs;

            const isStart = node.type === 'start' || node.type === 'terminator';
            const isEnd = node.type === 'end';
            const isDecision = node.type === 'decision' || node.type === 'gateway';
            const isDoc = node.type === 'document';
            const isData = node.type === 'datastore' || node.type === 'data';

            return (
              <foreignObject
                key={`doc-node-${node.id}`}
                x={x}
                y={y}
                width={w}
                height={h}
                className="overflow-visible"
              >
                {isStart ? (
                  <div className="w-full h-full px-3.5 py-2 rounded-full border-2 border-emerald-600 bg-emerald-50/95 shadow-sm flex items-center justify-center text-center">
                    <div
                      className="font-bold text-emerald-950 leading-tight break-words whitespace-normal w-full"
                      style={{ fontSize: `${fs}pt` }}
                    >
                      {node.label}
                    </div>
                  </div>
                ) : isEnd ? (
                  <div className="w-full h-full px-3.5 py-2 rounded-full border-4 border-slate-900 bg-rose-50/95 shadow-sm flex items-center justify-center text-center">
                    <div
                      className="font-black text-rose-950 leading-tight break-words whitespace-normal w-full"
                      style={{ fontSize: `${fs}pt` }}
                    >
                      {node.label}
                    </div>
                  </div>
                ) : isDecision ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg
                      viewBox={`0 0 ${w} ${h}`}
                      className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
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
                    <div className="relative z-10 px-6 py-2 text-center w-full flex items-center justify-center">
                      <div
                        className="font-bold text-amber-950 leading-tight break-words whitespace-normal w-full"
                        style={{ fontSize: `${fs}pt` }}
                      >
                        {node.label}
                      </div>
                    </div>
                  </div>
                ) : isDoc ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg
                      viewBox={`0 0 ${w} ${h}`}
                      className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
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
                    <div className="relative z-10 px-4 pb-3 pt-2 text-center w-full flex items-center justify-center">
                      <div
                        className="font-bold text-purple-950 leading-tight break-words whitespace-normal w-full"
                        style={{ fontSize: `${fs}pt` }}
                      >
                        {node.label}
                      </div>
                    </div>
                  </div>
                ) : isData ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg
                      viewBox={`0 0 ${w} ${h}`}
                      className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
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
                    <div className="relative z-10 px-4 pt-2.5 pb-2 text-center w-full flex items-center justify-center">
                      <div
                        className="font-bold text-sky-950 leading-tight break-words whitespace-normal w-full"
                        style={{ fontSize: `${fs}pt` }}
                      >
                        {node.label}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full p-2.5 rounded-xl border-2 border-slate-700 bg-white shadow-sm text-center flex items-center justify-center">
                    <div
                      className="font-bold text-slate-900 leading-tight break-words whitespace-normal w-full"
                      style={{ fontSize: `${fs}pt` }}
                    >
                      {node.label}
                    </div>
                  </div>
                )}
              </foreignObject>
            );
          })}
        </svg>

        {/* Legend Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-[10px] text-slate-600 gap-2 print:border-black">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-800">Keterangan Simbol BPMN:</span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full border border-emerald-600 inline-block bg-emerald-50" />
              <span>Mulai / Selesai</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2 rounded border border-slate-700 inline-block bg-white" />
              <span>Aktivitas / Tindakan</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rotate-45 border border-amber-600 inline-block bg-amber-50" />
              <span>Keputusan (Ya/Tidak)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2 border border-purple-600 inline-block bg-purple-50" />
              <span>Dokumen / Resep</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2 border border-sky-600 inline-block bg-sky-50" />
              <span>SIMRS / Database</span>
            </span>
          </div>
          <span className="italic text-slate-400">Standar SPO PT Cipta Nirmala / RS Semen Gresik</span>
        </div>
        </div>
      )}
    </div>
  );
};
