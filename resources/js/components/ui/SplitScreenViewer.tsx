import React, { useState } from 'react';
import { Maximize2, Minimize2, Download, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export interface SplitScreenViewerProps {
  pdfUrl: string;
  documentTitle: string;
  formContent: React.ReactNode;
  headerActions?: React.ReactNode;
}

export const SplitScreenViewer: React.FC<SplitScreenViewerProps> = ({
  pdfUrl,
  documentTitle,
  formContent,
  headerActions,
}) => {
  const { t } = useTranslation();
  const [isPdfExpanded, setIsPdfExpanded] = useState(false);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100">
      {/* Top Utility Bar */}
      <div className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 truncate">
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-slate-500">
            {t.components.splitScreen.reviewTitle}
          </span>
          <span className="text-sm font-serif font-semibold text-slate-900 truncate max-w-md">
            {documentTitle}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {headerActions}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-600 hover:text-blue-900 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
            title={t.components.splitScreen.openNewTab}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={pdfUrl}
            download
            className="p-1.5 text-slate-600 hover:text-blue-900 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
            title={t.components.splitScreen.downloadPdf}
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => setIsPdfExpanded(!isPdfExpanded)}
            className="p-1.5 text-slate-600 hover:text-blue-900 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
            title={isPdfExpanded ? t.components.splitScreen.collapsePdf : t.components.splitScreen.expandPdf}
          >
            {isPdfExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: PDF Viewer (60% Default / 100% Expanded) */}
        <div
          className={`h-full border-r border-slate-300 bg-slate-800 transition-all duration-200 ${
            isPdfExpanded ? 'w-full' : 'w-full lg:w-[60%]'
          }`}
        >
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            title={documentTitle || t.components.splitScreen.reviewTitle}
            className="w-full h-full border-0"
          />
        </div>

        {/* Right Pane: Interactive Evaluation Form (40% Default / Hidden when Expanded) */}
        {!isPdfExpanded && (
          <div className="hidden lg:flex flex-col w-[40%] h-full bg-white overflow-y-auto">
            <div className="p-6">
              {formContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitScreenViewer;
