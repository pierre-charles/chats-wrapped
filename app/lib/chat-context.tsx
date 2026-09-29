import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { type ChatData, ChatDataSchema, SlugSchema } from "./schemas";

const STORAGE_KEY = "chats-wrapped-data";

function loadFromSession(): ChatData | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  const result = ChatDataSchema.safeParse(JSON.parse(raw));
  return result.success ? result.data : null;
}

type ChatContextValue = {
  data: ChatData | null;
  slugMap: Map<string, string>;
  setData: (data: ChatData) => void;
  clear: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<ChatData | null>(loadFromSession);

  function setData(chatData: ChatData) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatData));
    } catch {
      // Data too large for sessionStorage — works in-memory only
    }
    setDataState(chatData);
  }

  const slugMap = useMemo(() => {
    const map = new Map<string, string>();
    if (data) {
      for (const name of data.users) {
        map.set(SlugSchema.parse(name), name);
      }
    }
    return map;
  }, [data]);

  function clear() {
    sessionStorage.removeItem(STORAGE_KEY);
    setDataState(null);
  }

  return (
    <ChatContext value={{ data, slugMap, setData, clear }}>
      {children}
    </ChatContext>
  );
}

export function useChatData(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatData must be used within ChatProvider");
  }
  return context;
}
