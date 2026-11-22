import type { FileRow } from "@clinic/shared";
import { fileContentUrl } from "./api";

type Props = {
  files: FileRow[];
  selectedIds: string[];
  onOpen: (id: string) => void;
  onToggleCompare: (id: string) => void;
};

export function FileGrid({ files, selectedIds, onOpen, onToggleCompare }: Props) {
  if (files.length === 0) {
    return <p className="muted">No files yet. Upload an X-ray, photo, scan or consent.</p>;
  }

  return (
    <ul className="file-grid">
      {files.map((f) => {
        const selected = selectedIds.includes(f.id);
        const preview = f.mime.startsWith("image/") && fileContentUrl(f.id, f.hasThumb);
        return (
          <li key={f.id} className={selected ? "is-selected" : undefined}>
            <button type="button" className="file-card" onClick={() => onOpen(f.id)}>
              {preview ? (
                <img src={preview} alt="" className="file-thumb" />
              ) : (
                <span className="file-thumb file-thumb-pdf">PDF</span>
              )}
              <span className="file-card-meta">
                <strong>{f.kind}</strong>
                <span className="muted small">
                  {f.takenOn ?? f.createdAt.slice(0, 10)}
                  {f.toothFdi ? ` · tooth ${f.toothFdi}` : ""}
                </span>
                <span className="small">{f.originalFilename}</span>
              </span>
            </button>
            {f.mime.startsWith("image/") ? (
              <button
                type="button"
                className="file-compare-btn"
                aria-pressed={selected}
                onClick={() => onToggleCompare(f.id)}
              >
                {selected ? "In compare" : "Compare"}
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
