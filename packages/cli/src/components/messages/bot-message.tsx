/** biome-ignore-all lint/suspicious/noArrayIndexKey: ignore that index error */
import { TextAttributes } from "@opentui/core";
import { Mode, type ModeType } from "@zeocode/shared";
import prettyMs from "pretty-ms";
import type { Message } from "../../hooks/use-chat";
import { useTheme } from "../../providers/theme";
import { EmptyBorder } from "../border";

type ClientMessagePart = Message["parts"][number];
type ToolPart = Extract<
  ClientMessagePart,
  { type: `tool-${string}` | "dynamic-tool" }
>;

interface Props {
  durationMs?: number;
  mode: ModeType;
  model: string;
  parts: ClientMessagePart[];
  streaming?: boolean;
}

const TOOL_NAME_REGEX = /([a-z0-9])([A-Z])/g;
const START_OF_STRING_REGEX = /^./;

function formatToolName(name: string): string {
  return name
    .replace(TOOL_NAME_REGEX, "$1 $2")
    .replace(START_OF_STRING_REGEX, (c) => c.toUpperCase());
}

function isToolPart(part: ClientMessagePart): part is ToolPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

function formatToolArgs(tc: ToolPart): string {
  if (!("input" in tc) || tc.input == null) {
    return "";
  }
  if (typeof tc.input !== "object") {
    return String(tc.input);
  }
  return Object.values(tc.input).map(String).join(" ");
}

interface PartGroup {
  key: string;
  parts: ClientMessagePart[];
  type: ClientMessagePart["type"];
}

function groupConsecutiveParts(parts: ClientMessagePart[]): PartGroup[] {
  const groups: PartGroup[] = [];
  let i = 0;

  for (const part of parts) {
    const lastGroup = groups.at(-1);

    if (lastGroup && lastGroup.type === part.type) {
      lastGroup.parts.push(part);
    } else {
      const key = isToolPart(part)
        ? `group-tc-${part.toolCallId}`
        : `group-${part.type}-${i}`;
      groups.push({ type: part.type, parts: [part], key });
    }
    i++;
  }

  return groups;
}

export function BotMessage({ parts, model, mode, durationMs }: Props) {
  const { colors } = useTheme();
  return (
    <box alignItems="center" width="100%">
      {groupConsecutiveParts(parts).map((group, i) => (
        <box key={group.key} paddingTop={i === 0 ? 0 : 1} width="100%">
          {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: jsx rendering branch */}
          {group.parts.map((part, j) => {
            if (part.type === "reasoning") {
              return (
                <box
                  border={["left"]}
                  borderColor={colors.thinkingBorder}
                  customBorderChars={{
                    ...EmptyBorder,
                    vertical: "│",
                  }}
                  key={`reasoning-${j}`}
                  paddingX={2}
                  width="100%"
                >
                  <text attributes={TextAttributes.DIM}>
                    <em fg={colors.thinking}>Thinking:</em> {part.text}
                  </text>
                </box>
              );
            }

            if (isToolPart(part)) {
              const toolName =
                part.type === "dynamic-tool"
                  ? part.toolName
                  : part.type.slice("tool-".length);

              return (
                <box
                  border={["left"]}
                  borderColor={colors.thinkingBorder}
                  customBorderChars={{
                    ...EmptyBorder,
                    vertical: "│",
                  }}
                  key={part.toolCallId}
                  paddingX={2}
                  width="100%"
                >
                  <text attributes={TextAttributes.DIM}>
                    <em fg={colors.info}>{formatToolName(toolName)}:</em>{" "}
                    {formatToolArgs(part)}
                    {part.state !== "output-available" &&
                    part.state !== "output-error"
                      ? " …"
                      : ""}
                    {part.state === "output-error" ? ` ${part.errorText}` : ""}
                  </text>
                </box>
              );
            }

            if (part.type === "text") {
              return (
                <box key={`text-${j}`} paddingX={3} width="100%">
                  <text>{part.text}</text>
                </box>
              );
            }

            return null;
          })}
        </box>
      ))}

      <box gap={1} paddingX={3} paddingY={1} width="100%">
        <box flexDirection="row" gap={2}>
          <text fg={mode === Mode.PLAN ? colors.planMode : colors.primary}>
            ◉
          </text>
          <box flexDirection="row" gap={1}>
            <text>{mode === Mode.PLAN ? "Plan" : "Build"}</text>
            <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
              ›
            </text>
            <text attributes={TextAttributes.DIM}>{model}</text>
            {durationMs != null && (
              <>
                <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                  ›
                </text>
                <text attributes={TextAttributes.DIM}>
                  {prettyMs(durationMs)}
                </text>
              </>
            )}
          </box>
        </box>
      </box>
    </box>
  );
}
