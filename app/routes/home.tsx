import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { useChatData } from "../lib/chat-context";
import { parseChatFile } from "../lib/parser";
import { handleFileUpload } from "../lib/upload";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  const description =
    "Upload your WhatsApp chat export and get instant stats — message counts, activity heatmaps, emoji rankings, trends and more. 100% private, everything runs in your browser.";
  return [
    { title: "Chats Wrapped — WhatsApp Chat Stats" },
    { name: "description", content: description },
    { property: "og:title", content: "Chats Wrapped — WhatsApp Chat Stats" },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/og.png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: "/og.png" },
    { name: "twitter:title", content: "Chats Wrapped — WhatsApp Chat Stats" },
    { name: "twitter:description", content: description },
  ];
}

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { setData } = useChatData();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/preloaded-chat.txt", { method: "HEAD" }).then((res) => {
      if (!res.ok) {
        return;
      }
      setLoading(true);
      fetch("/preloaded-chat.txt")
        .then((r) => r.text())
        .then((content) => {
          const result = parseChatFile(content);
          if (result.success) {
            setData(result.data);
            navigate("/stats");
          } else {
            setLoading(false);
          }
        });
    });
  }, [setData, navigate]);

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
    [setData, navigate],
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
    [processFile],
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
    [processFile],
  );

  const loadSampleData = useCallback(async () => {
    setError(null);
    setLoading(true);

    const response = await fetch("/mock-chat.txt");
    const content = await response.text();
    const result = parseChatFile(content);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setData(result.data);
    navigate("/stats");
  }, [setData, navigate]);

  return (
    <main className="upload-page">
      <div className="upload-subtitle">
        <p>
          Upload your WhatsApp chat export to see your stats. No data is stored
          or sent anywhere, everything is processed entirely in your browser.
        </p>
        <p>
          Want to see for yourself?{" "}
          <a
            href="https://github.com/pierre-charles/chats-wrapped/blob/main/app/lib/parser.ts"
            target="_blank"
            rel="noopener noreferrer"
          >
            Check out the code
          </a>
        </p>
      </div>
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
            <p className="upload-or">or</p>
            <button
              type="button"
              className="upload-sample"
              onClick={loadSampleData}
            >
              Try with sample data
            </button>
          </>
        )}
      </div>
      {error && <p className="upload-error">{error}</p>}
    </main>
  );
}
