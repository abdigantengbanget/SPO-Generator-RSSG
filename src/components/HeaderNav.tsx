import React from "react";
import { Download, Edit3, GitBranch, Eye } from "lucide-react";
import { SpoDocument } from "../types/spo";

interface HeaderNavProps {
  spo: SpoDocument;
  viewMode: "preview" | "edit" | "flowchart";
  setViewMode: (mode: "preview" | "edit" | "flowchart") => void;
  onOpenGenerateModal: () => void;
  onExportWord: () => void;
  isGenerating: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  viewMode,
  setViewMode,
  onOpenGenerateModal,
  onExportWord,
  isGenerating,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end md:justify-between h-16">
          {/* Navigation View Modes */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "preview"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Dokumen</span>
            </button>
            <button
              onClick={() => setViewMode("edit")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "edit"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Form & Konten</span>
            </button>
            <button
              onClick={() => setViewMode("flowchart")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "flowchart"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Diagram Alur</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* AI Generator CTA Button */}
            <button
              onClick={onOpenGenerateModal}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>
                {isGenerating ? "Sedang Memproses..." : "Generate SPO Baru"}
              </span>
            </button>

            {/* Word Export */}
            <button
              onClick={onExportWord}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              title="Unduh sebagai dokumen Microsoft Word (.docx)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Unduh Word</span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200 text-xs">
          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center space-x-1 py-1 px-2 rounded-md ${
              viewMode === "preview"
                ? "bg-emerald-100 text-emerald-800 font-bold"
                : "text-slate-600"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setViewMode("edit")}
            className={`flex items-center space-x-1 py-1 px-2 rounded-md ${
              viewMode === "edit"
                ? "bg-emerald-100 text-emerald-800 font-bold"
                : "text-slate-600"
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit Konten</span>
          </button>
          <button
            onClick={() => setViewMode("flowchart")}
            className={`flex items-center space-x-1 py-1 px-2 rounded-md ${
              viewMode === "flowchart"
                ? "bg-emerald-100 text-emerald-800 font-bold"
                : "text-slate-600"
            }`}
          >
            <GitBranch className="w-3 h-3" />
            <span>Alur</span>
          </button>
        </div>
      </div>
    </header>
  );
};
