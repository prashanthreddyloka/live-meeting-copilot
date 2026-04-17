import { Download } from 'lucide-react';

interface ExportButtonProps {
  disabled: boolean;
  onExport: () => void;
}

export const ExportButton = ({ disabled, onExport }: ExportButtonProps) => (
  <button
    type="button"
    onClick={onExport}
    disabled={disabled}
    className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
  >
    <Download className="h-4 w-4" />
    Export
  </button>
);
