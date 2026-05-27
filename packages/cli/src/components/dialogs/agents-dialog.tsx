import { Mode, type ModeType } from "@zeocode/shared";
import { useCallback } from "react";
import { useDialog } from "../../providers/dialog";
import { DialogSearchList } from "../dialog-search-list";

const AVAILABLE_MODES: ModeType[] = [Mode.BUILD, Mode.PLAN];

interface AgentsDialogContentProps {
  currentMode: ModeType;
  onSelectMode: (mode: ModeType) => void;
}

function getModeLabel(mode: ModeType) {
  return mode === Mode.PLAN ? "Plan" : "Build";
}

export const AgentsDialogContent = ({
  currentMode,
  onSelectMode,
}: AgentsDialogContentProps) => {
  const dialog = useDialog();

  const handleSelect = useCallback(
    (nextMode: ModeType) => {
      onSelectMode(nextMode);
      dialog.close();
    },
    [onSelectMode, dialog]
  );

  return (
    <DialogSearchList
      emptyText="No matching agents"
      filterFn={(item, query) =>
        getModeLabel(item).toLowerCase().includes(query.toLowerCase())
      }
      getKey={(item) => item}
      items={AVAILABLE_MODES}
      onSelect={handleSelect}
      placeholder="Search agents"
      renderItem={(item, isSelected) => (
        <text fg={isSelected ? "black" : "white"} selectable={false}>
          {item === currentMode ? " • " : "   "}
          {getModeLabel(item)}
        </text>
      )}
    />
  );
};
