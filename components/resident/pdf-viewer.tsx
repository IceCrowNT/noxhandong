"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Set up PDF worker for Next.js (client side only)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PDFViewer({ file }: { file: string }) {
  const [numPages, setNumPages] = useState<number>();
  const [containerWidth, setContainerWidth] = useState<number>(700);

  // Measure the width when dialog opens
  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(window.innerWidth < 768 ? window.innerWidth - 32 : 720);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <Document
      file={file}
      onLoadSuccess={onDocumentLoadSuccess}
      className="flex flex-col items-center"
      loading={<div className="py-10 text-center text-sm font-semibold text-[var(--muted)]">Đang tải tài liệu PDF...</div>}
      error={<div className="py-10 text-center text-sm text-red-600">Lỗi khi tải PDF. Vui lòng thử lại sau.</div>}
    >
      {Array.from(new Array(numPages), (el, index) => (
        <div key={`page_${index + 1}`} className="mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-sm overflow-hidden bg-white">
          <Page
            pageNumber={index + 1}
            width={containerWidth}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            loading={<div className="py-20 text-center text-[var(--muted)]">Đang tải trang {index + 1}...</div>}
          />
        </div>
      ))}
    </Document>
  );
}
