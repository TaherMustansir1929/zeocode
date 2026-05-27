import type { ModeType, SupportedChatModelId } from "@zeocode/shared";
import type { DialogContextValue } from "../../providers/dialog";
import type { ToastContextValue } from "../../providers/toast";

export interface CommandContext {
  dialog: DialogContextValue;
  exit: () => void;
  mode: ModeType;
  navigate: (path: string) => void;
  setMode: (mode: ModeType) => void;
  setModel: (model: SupportedChatModelId) => void;
  toast: ToastContextValue;
}

export interface Command {
  action?: (ctx: CommandContext) => void | Promise<void>;
  description: string;
  name: string;
  value: string;
}
