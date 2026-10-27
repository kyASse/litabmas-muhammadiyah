import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export interface PDFUploaderProps {
  value: File | null;
  existingFileUrl?: string;
  onChange: (file: File | null) => void;
  maxSizeMB?: number;
  disabled?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  value,
  existingFileUrl,
  onChange,
  maxSizeMB = 10,
  disabled = false,
  helperText,
  label,
  required = false,
}) => {
  const { t, format } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayLabel = label ?? t.components.pdfUploader.defaultLabel;
  const displayHelperText = helperText ?? t.components.pdfUploader.helperText;

  const validateAndSet = (file: File) => {
    setErrorMessage(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage(t.components.pdfUploader.invalidFormat);
      return;
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const actualMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(
        format(t.components.pdfUploader.sizeExceeded, {
          actual: actualMB,
          max: maxSizeMB,
        })
      );
      return;
    }
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-sans font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {displayLabel} {required && <span className="text-rose-600 dark:text-rose-400">*</span>}
        </label>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {t.components.pdfUploader.limitPrefix} {maxSizeMB} MB
        </span>
      </div>

      {!value && !existingFileUrl ? (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-150 ${
            isDragging 
              ? 'border-blue-900 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30' 
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            disabled={disabled}
            onChange={(e) => e.target.files?.[0] && validateAndSet(e.target.files[0])}
          />
          <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {t.components.pdfUploader.dragDropText} <span className="text-blue-900 dark:text-blue-400 underline">{t.components.pdfUploader.browseText}</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{displayHelperText}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-rose-700 dark:text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {value ? value.name : 'Dokumen-Usulan-Tersimpan.pdf'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {value ? `${(value.size / (1024 * 1024)).toFixed(2)} MB` : t.components.pdfUploader.fileSaved}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => { onChange(null); setErrorMessage(null); }}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-white dark:hover:bg-slate-800 transition-colors"
              title={t.components.pdfUploader.removeFile}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center space-x-1.5 text-xs text-rose-700 dark:text-rose-400 mt-1">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
