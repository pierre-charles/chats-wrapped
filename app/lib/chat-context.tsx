import { createContext, type ReactNode, useContext, useState } from "react";
import type { ChatData } from "./schemas";

type ChatContextValue = {
  data: ChatData | null;
  setData: (data: ChatData) => void;
  clear: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ChatData | null>(null);

  return (
    <ChatContext value={{ data, setData, clear: () => setData(null) }}>
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
