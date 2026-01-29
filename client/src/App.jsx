import { useMemo, useState } from "react";
import "./App.css";

const DEFAULT_API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export default function App() {
  const [apiBase, setApiBase] = useState(DEFAULT_API);
  const [folder, setFolder] = useState("gallery");
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("Idle");
  const [response, setResponse] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileMeta = useMemo(() => {
    if (!selectedFile) return null;
    return {
      name: selectedFile.name,
      type: selectedFile.type || "Unknown type",
      size: formatSize(selectedFile.size)
    };
  }, [selectedFile]);

  const handleFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setStatus("Ready to upload");
    setResponse(null);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const [file] = event.dataTransfer.files;
    handleFile(file);
  };

  const onUpload = async () => {
    if (!selectedFile) return;
    setStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (folder.trim()) {
      formData.append("folder", folder.trim());
    }

    try {
      const res = await fetch(`${apiBase}/upload`, {
        method: "POST",
        body: formData
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Upload failed");
      }

      setResponse(json);
      setStatus("Upload complete");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="app">
      <div className="gradient" />
      <header className="top-bar">
        <div className="traffic-lights">
          <span className="traffic red" />
          <span className="traffic yellow" />
          <span className="traffic green" />
        </div>
        <div className="title">
          R2 Uploader <span>•</span> Cloudflare-ready
        </div>
        <div className="status">
          <span className="dot" /> {status}
        </div>
      </header>

      <main className="content">
        <section className="glass card">
          <h1>Ship new gallery images without redeploys.</h1>
          <p>
            Drop a photo, pick a folder, and we’ll push it to Cloudflare R2 using your
            uploader service.
          </p>

          <div className="form-grid">
            <label>
              API base URL
              <input
                type="url"
                value={apiBase}
                onChange={(event) => setApiBase(event.target.value)}
                placeholder="http://localhost:3000"
              />
            </label>
            <label>
              Folder
              <input
                type="text"
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
                placeholder="gallery"
              />
            </label>
          </div>

          <div
            className={`drop-zone ${dragActive ? "active" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
          >
            <div>
              <strong>Drag & drop</strong> your image here
            </div>
            <span>or</span>
            <label className="file-picker">
              Browse files
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>
          </div>

          {fileMeta ? (
            <div className="file-meta">
              <div>
                <span>Filename</span>
                <strong>{fileMeta.name}</strong>
              </div>
              <div>
                <span>Type</span>
                <strong>{fileMeta.type}</strong>
              </div>
              <div>
                <span>Size</span>
                <strong>{fileMeta.size}</strong>
              </div>
            </div>
          ) : (
            <div className="file-meta empty">No file selected yet.</div>
          )}

          <button className="primary" onClick={onUpload} disabled={!selectedFile}>
            Upload to R2
          </button>

          {response ? (
            <div className="response">
              <h3>Upload response</h3>
              <pre>{JSON.stringify(response, null, 2)}</pre>
              {response.publicUrl ? (
                <a href={response.publicUrl} target="_blank" rel="noreferrer">
                  View public asset →
                </a>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="glass panel">
          <h2>Next up</h2>
          <ul>
            <li>Point the uploader API at your hosted service.</li>
            <li>Paste the public URL into your macOS portfolio gallery data.</li>
            <li>Set up a webhook to trigger refreshes when R2 changes.</li>
          </ul>

          <div className="note">
            <h3>Tip</h3>
            <p>
              Use the <code>/presign</code> endpoint to let your portfolio upload
              directly to R2 without proxying through this server.
            </p>
          </div>
        </aside>
      </main>

      <footer className="dock">
        <div className="dock-item active">Uploader</div>
        <div className="dock-item">Gallery</div>
        <div className="dock-item">Settings</div>
        <div className="dock-item">Logs</div>
      </footer>
    </div>
  );
}
