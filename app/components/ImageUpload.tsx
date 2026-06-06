"use client";

import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  label: string;
  recommended?: string;
  currentFile: File | null;
  previewUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  onRemove: () => void;
  aspect?: string; // visual hint
}

export default function ImageUpload({
  label,
  recommended,
  currentFile,
  previewUrl,
  onFileSelect,
  onRemove,
  aspect = "auto",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Παρακαλώ επιλέξτε αρχείο εικόνας (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      alert("Το αρχείο είναι πολύ μεγάλο (>12MB). Παρακαλώ συμπιέστε το.");
      return;
    }
    onFileSelect(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div className="label">{label}</div>
      {recommended && (
        <div className="text-[11px] text-zinc-500 mb-1.5">{recommended}</div>
      )}

      {!currentFile && !previewUrl ? (
        <div
          className={`upload-zone ${isDragging ? "dragover" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <Upload className="mx-auto mb-3 text-zinc-400" size={26} />
          <div className="font-medium text-sm">Σύρετε εικόνα ή κάντε κλικ</div>
          <div className="text-xs text-zinc-500 mt-1">PNG, JPG, WEBP • έως 12MB</div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="upload-zone has-image p-3">
          <div className="relative">
            {previewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="preview"
                  className="preview-img"
                  style={{ aspectRatio: aspect === "1:1" ? "1/1" : aspect === "16:9" ? "16/9" : "auto" }}
                />
              </>
            ) : (
              <div className="h-[110px] flex items-center justify-center bg-zinc-100 rounded-lg text-sm text-zinc-500">
                <ImageIcon size={28} className="mr-2" /> {currentFile?.name}
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1"
              aria-label="Αφαίρεση εικόνας"
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 px-1 text-xs text-zinc-500">
            <span className="truncate max-w-[180px]">{currentFile?.name}</span>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-[var(--primary)] hover:underline font-medium"
            >
              Αλλαγή
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
