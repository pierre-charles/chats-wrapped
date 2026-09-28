import { type ChangeEvent, type DragEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useChatData } from "../lib/chat-context";
import { handleFileUpload } from "../lib/upload";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Chats Wrapped" },
    {
      name: "description",
      content: "Upload your WhatsApp chat export to see your stats"
    }
  ];
}

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { setData } = useChatData();
  const navigate = useNavigate();

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);

      const result = await handleFileUpload(file);

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setData(result.data);
      navigate("/stats");
    },
    [setData, navigate]
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  return (
    <main className="upload-page">
      <h1 className="upload-title">Chats Wrapped</h1>
      <p className="upload-subtitle">
        Upload your WhatsApp chat export to see your stats. Your data never
        leaves your browser.
      </p>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop target */}
      <div
        className={`upload-dropzone ${dragging ? "upload-dropzone--active" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {loading ? (
          <p>Parsing your chat...</p>
        ) : (
          <>
            <p>Drop your .txt file here</p>
            <p className="upload-or">or</p>
            <label className="upload-button">
              Choose file
              <input type="file" accept=".txt" onChange={onChange} hidden />
            </label>
          </>
        )}
      </div>
      {error && <p className="upload-error">{error}</p>}
    </main>
  );
}
