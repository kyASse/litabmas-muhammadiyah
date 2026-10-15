import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

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
  helperText = 'Format dokumen wajib PDF, ukuran berkas maksimal 10 MB.',
  label = 'Unggah Dokumen Proposal (PDF)',
  required = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (file: File) => {
    setErrorMessage(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Berkas tidak valid. Hanya berkas berformat .pdf yang diperbolehkan.');
      return;
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const actualMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(`Ukuran berkas (${actualMB} MB) melebihi batas maksimal ${maxSizeMB} MB.`);
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
        <label className="block text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
        <span className="text-xs text-slate-500 font-mono">Batas: {maxSizeMB} MB</span>
      </div>

      {!value && !existingFileUrl ? (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-150 ${
            isDragging 
              ? 'border-blue-900 bg-blue-50/50' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
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
          <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-800">
            Seret dan lepas dokumen PDF di sini, atau <span className="text-blue-900 underline">pilih dari komputer</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">{helperText}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-white border border-slate-200 rounded text-rose-700">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-slate-900 truncate">
                {value ? value.name : 'Dokumen-Usulan-Tersimpan.pdf'}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {value ? `${(value.size / (1024 * 1024)).toFixed(2)} MB` : 'Berkas Tersimpan'}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => { onChange(null); setErrorMessage(null); }}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-white transition-colors"
              title="Hapus berkas"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center space-x-1.5 text-xs text-rose-700 mt-1">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
