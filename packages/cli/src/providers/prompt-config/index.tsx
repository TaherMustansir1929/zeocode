import {
  DEFAULT_CHAT_MODEL_ID,
  Mode,
  type ModeType,
  type SupportedChatModelId,
} from "@zeocode/shared";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface PromptConfigContextValue {
  mode: ModeType;
  model: SupportedChatModelId;
  setMode: (mode: ModeType) => void;
  setModel: (model: SupportedChatModelId) => void;
  toggleMode: () => void;
}

const PromptConfigContext = createContext<PromptConfigContextValue | null>(
  null
);

export function usePromptConfig(): PromptConfigContextValue {
  const value = useContext(PromptConfigContext);
  if (!value) {
    throw new Error(
      "usePromptConfig must be used within a PromptConfigProvider"
    );
  }
  return value;
}

interface PromptConfigProviderProps {
  children: ReactNode;
}

export function PromptConfigProvider({ children }: PromptConfigProviderProps) {
  const [mode, setMode] = useState<ModeType>(Mode.BUILD);
  const [model, setModel] = useState<SupportedChatModelId>(
    DEFAULT_CHAT_MODEL_ID
  );

  const toggleMode = useCallback(() => {
    setMode((m) => (m === Mode.BUILD ? Mode.PLAN : Mode.BUILD));
  }, []);

  return (
    <PromptConfigContext.Provider
      value={{
        mode,
        toggleMode,
        setMode,
        model,
        setModel,
      }}
    >
      {children}
    </PromptConfigContext.Provider>
  );
}
