import os
from PyPDF2 import PdfReader, PdfWriter

PDF_PATH = "data/z8000-18-searchable_converted-to-text_resaved.pdf"
OUTPUT_DIR = "data/"
MAX_SIZE_MB = 10


def split_pdf_by_size(pdf_path, output_dir, max_size_mb=10):
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    part = 1
    start_page = 0

    while start_page < total_pages:
        writer = PdfWriter()
        current_size = 0
        end_page = start_page
        while end_page < total_pages:
            writer.add_page(reader.pages[end_page])
            # Write to a temp file to check size
            temp_path = os.path.join(output_dir, f"temp_part_{part}.pdf")
            with open(temp_path, "wb") as temp_f:
                writer.write(temp_f)
            size_mb = os.path.getsize(temp_path) / (1024 * 1024)
            if size_mb > max_size_mb:
                # Remove last page, finalize this part
                writer = PdfWriter()
                for i in range(start_page, end_page):
                    writer.add_page(reader.pages[i])
                out_path = os.path.join(output_dir, f"z8000-18-part{part}.pdf")
                with open(out_path, "wb") as out_f:
                    writer.write(out_f)
                os.remove(temp_path)
                print(f"Created {out_path} with pages {start_page+1}-{end_page}")
                start_page = end_page
                part += 1
                break
            else:
                os.remove(temp_path)
                end_page += 1
        else:
            # Write remaining pages
            out_path = os.path.join(output_dir, f"z8000-18-part{part}.pdf")
            with open(out_path, "wb") as out_f:
                writer.write(out_f)
            print(f"Created {out_path} with pages {start_page+1}-{end_page}")
            break

if __name__ == "__main__":
    split_pdf_by_size(PDF_PATH, OUTPUT_DIR, MAX_SIZE_MB)

# --- Utility for mapping part-relative to original page numbers ---
import json

def get_original_page_number(part_file, part_page_number, mapping_json="data/z8000-18-parts.json"):
    """
    Given a part file (e.g., 'z8000-18-part2.pdf') and a page number within that part (1-based),
    return the original page number in the full PDF.
    """
    with open(mapping_json, "r") as f:
        parts = json.load(f)
    for part in parts:
        if part["file"] == part_file:
            return part["start_page"] + (part_page_number - 1)
    raise ValueError(f"Part file {part_file} not found in mapping.")
