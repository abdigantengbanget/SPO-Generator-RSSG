import React, { useState } from "react";
import { SpoDocument } from "./types/spo";
import { BLANK_SPO_TEMPLATE } from "./data/defaultSpo";
import { HeaderNav } from "./components/HeaderNav";
import { SpoDocumentView } from "./components/SpoDocumentView";
import { SpoEditor, EditorTab } from "./components/SpoEditor";
import { FlowchartView } from "./components/FlowchartView";
import { GenerateModal } from "./components/GenerateModal";
import { exportToDocx } from "./utils/docxExport";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function App() {
  const [spo, setSpo] = useState<SpoDocument>(BLANK_SPO_TEMPLATE);
  const [viewMode, setViewMode] = useState<"preview" | "edit" | "flowchart">(
    "preview",
  );
  const [editorTab, setEditorTab] = useState<EditorTab>("metadata");
  const [docVersion, setDocVersion] = useState<number>(1);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Notification Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const toastTimerRef = React.useRef<number | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    const duration =
      type === "error" ||
      message.includes("GEMINI_API_KEY") ||
      message.includes("OPENROUTER_API_KEY") ||
      message.includes("OpenRouter")
        ? 7500
        : 4500;
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, duration);
  };

  const handleExportWord = async () => {
    const meta = spo.metadata;
    const isApprovalIncomplete =
      !meta.kepalaRumahSakit?.trim() ||
      !meta.drafter?.nama?.trim() ||
      !meta.drafter?.jabatan?.trim() ||
      !meta.creator?.nama?.trim() ||
      !meta.creator?.jabatan?.trim() ||
      !meta.reviewer?.nama?.trim() ||
      !meta.reviewer?.jabatan?.trim();

    if (isApprovalIncomplete) {
      setEditorTab("metadata");
      setViewMode("edit");
      showToast(
        "Nama Kepala Rumah Sakit serta Lembar Pengesahan (Drafter, Creator, Reviewer) wajib diisi terlebih dahulu sebelum ekspor Word.",
        "error",
      );
      return;
    }

    try {
      showToast(
        "Menyiapkan file Microsoft Word (.docx) beserta diagram alur...",
      );
      await exportToDocx(spo);
      showToast("File Word (.docx) berhasil diunduh!");
    } catch (err: any) {
      console.error(err);
      showToast("Gagal mengekspor file Word. Silakan coba kembali.", "error");
    }
  };

  const handleGenerated = (newSpo: SpoDocument, notice?: string) => {
    setSpo(newSpo);
    setDocVersion((v) => v + 1);
    setEditorTab("metadata");
    setViewMode("preview");
    showToast(
      notice ||
        "Dokumen SPO baru berhasil disusun dan siap diedit atau diunduh ke Word!",
    );
  };

  const handleEditSectionJump = (sectionTab: string) => {
    const validTabs: EditorTab[] = [
      "metadata",
      "pengertian",
      "tujuan_kebijakan",
      "risiko",
      "prosedur",
      "unit_dokumen",
    ];
    if (validTabs.includes(sectionTab as EditorTab)) {
      setEditorTab(sectionTab as EditorTab);
    } else {
      setEditorTab("metadata");
    }
    setViewMode("edit");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="no-print fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
              toast.type === "success"
                ? "bg-emerald-900 text-emerald-50 border-emerald-700"
                : "bg-rose-900 text-rose-50 border-rose-700"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <HeaderNav
        spo={spo}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
        onExportWord={handleExportWord}
        isGenerating={isGenerating}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {viewMode === "preview" && (
          <SpoDocumentView
            key={`preview-${docVersion}`}
            spo={spo}
            onEditSection={handleEditSectionJump}
            onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
            onSwitchToFlowchart={() => setViewMode("flowchart")}
          />
        )}

        {viewMode === "edit" && (
          <SpoEditor
            key={`edit-${docVersion}`}
            spo={spo}
            onChange={(updated) => setSpo(updated)}
            activeTab={editorTab}
            onTabChange={setEditorTab}
          />
        )}

        {viewMode === "flowchart" && (
          <FlowchartView
            key={`flowchart-${docVersion}`}
            spo={spo}
            onChange={(updated) => setSpo(updated)}
          />
        )}
      </main>

      {/* AI Generator Modal */}
      <GenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerated={handleGenerated}
        currentSpo={spo}
        onGeneratingChange={setIsGenerating}
      />
    </div>
  );
}
