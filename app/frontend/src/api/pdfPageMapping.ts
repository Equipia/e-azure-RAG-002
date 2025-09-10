// Utility to map split PDF part/page to original page number
// Place this in app/frontend/src/api/pdfPageMapping.ts

export interface PdfPart {
    part: number;
    file: string;
    start_page: number;
    end_page: number;
}

// This should be loaded from z8000-18-parts.json, but for demo, hardcode here:
export const pdfParts: PdfPart[] = [
    { part: 1, file: "z8000-18-part1.pdf", start_page: 1, end_page: 67 },
    { part: 2, file: "z8000-18-part2.pdf", start_page: 68, end_page: 121 },
    { part: 3, file: "z8000-18-part3.pdf", start_page: 122, end_page: 172 },
    { part: 4, file: "z8000-18-part4.pdf", start_page: 173, end_page: 226 },
    { part: 5, file: "z8000-18-part5.pdf", start_page: 227, end_page: 280 },
    { part: 6, file: "z8000-18-part6.pdf", start_page: 281, end_page: 335 },
    { part: 7, file: "z8000-18-part7.pdf", start_page: 336, end_page: 387 },
    { part: 8, file: "z8000-18-part8.pdf", start_page: 388, end_page: 475 },
    { part: 9, file: "z8000-18-part9.pdf", start_page: 476, end_page: 583 }
];

export function getOriginalPage(partFile: string, internalPage: number): number | null {
    const part = pdfParts.find(p => p.file === partFile);
    if (!part) return null;
    return part.start_page + (internalPage - 1);
}

// Example: getOriginalPage('z8000-18-part8.pdf', 6) // returns 393
