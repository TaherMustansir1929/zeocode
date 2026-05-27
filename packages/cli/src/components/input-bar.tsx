/** biome-ignore-all lint/a11y/noStaticElementInteractions: interactive element error */

import { readdir } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import type {
  KeyBinding,
  ScrollBoxRenderable,
  TextareaRenderable,
} from "@opentui/core";
import { TextAttributes } from "@opentui/core";
import { useKeyboard, useRenderer } from "@opentui/react";
import { Mode } from "@zeocode/shared";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { useDialog } from "../providers/dialog";
import { useKeyboardLayer } from "../providers/keyboard-layer";
import { usePromptConfig } from "../providers/prompt-config";
import { useTheme } from "../providers/theme";
import { useToast } from "../providers/toast";
import { EmptyBorder } from "./border";
import { CommandMenu } from "./command-menu";
import type { Command } from "./command-menu/types";
import { useCommandMenu } from "./command-menu/use-command-menu";
import { StatusBar } from "./status-bar";

const MAX_VISIBLE_MENTIONS = 8;
const CURRENT_DIRECTORY = process.cwd();
const MAX_FALLBACK_MENTION_CANDIDATES = 32;
const MENTION_QUERY_CHARACTER = /[A-Za-z0-9._/-]/;
const WHITESPACE_REGEX = /\s/;
const RECURSIVE_MENTION_IGNORED_DIRECTORIES = new Set(["node_modules"]);

interface MentionMatch {
  end: number;
  query: string;
  start: number;
}

interface MentionCandidate {
  kind: "file" | "directory";
  path: string;
}

function isWithinCurrentDirectory(targetPath: string) {
  const relativePath = relative(CURRENT_DIRECTORY, targetPath);
  return (
    relativePath === "" ||
    !(relativePath.startsWith("..") || isAbsolute(relativePath))
  );
}

function isMentionQueryCharacter(character: string) {
  return MENTION_QUERY_CHARACTER.test(character);
}

function findActiveMention(
  text: string,
  cursorOffset: number
): MentionMatch | null {
  const safeOffset = Math.max(0, Math.min(cursorOffset, text.length));

  let start = safeOffset;
  while (start > 0 && !WHITESPACE_REGEX.test(text[start - 1] ?? "")) {
    start -= 1;
  }

  let end = safeOffset;
  while (end < text.length && !WHITESPACE_REGEX.test(text[end] ?? "")) {
    end += 1;
  }

  const token = text.slice(start, end);
  const relativeCursor = safeOffset - start;
  const mentionStart = token.lastIndexOf("@", relativeCursor);

  if (mentionStart === -1) {
    return null;
  }

  const previousCharacter = token[mentionStart - 1];
  if (previousCharacter && isMentionQueryCharacter(previousCharacter)) {
    return null;
  }

  let mentionEnd = mentionStart + 1;
  while (
    mentionEnd < token.length &&
    isMentionQueryCharacter(token[mentionEnd] ?? "")
  ) {
    mentionEnd += 1;
  }

  if (relativeCursor < mentionStart || relativeCursor > mentionEnd) {
    return null;
  }

  return {
    start: start + mentionStart,
    end: start + mentionEnd,
    query: token.slice(mentionStart + 1, mentionEnd),
  };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: recursive tree traversal
async function recursiveVisit(
  absoluteDirectory: string,
  directoryPart: string,
  showHiddenEntries: boolean,
  lowercasePrefix: string,
  fallbackMatches: MentionCandidate[]
): Promise<void> {
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (!showHiddenEntries && entry.name.startsWith(".")) {
      continue;
    }

    if (
      entry.isDirectory() &&
      RECURSIVE_MENTION_IGNORED_DIRECTORIES.has(entry.name)
    ) {
      continue;
    }

    const path = directoryPart ? `${directoryPart}/${entry.name}` : entry.name;
    const kind: MentionCandidate["kind"] = entry.isDirectory()
      ? "directory"
      : "file";

    if (entry.name.toLowerCase().startsWith(lowercasePrefix)) {
      fallbackMatches.push({
        path: kind === "directory" ? `${path}/` : path,
        kind,
      });
      if (fallbackMatches.length >= MAX_FALLBACK_MENTION_CANDIDATES) {
        return;
      }
    }

    if (entry.isDirectory()) {
      await recursiveVisit(
        resolve(absoluteDirectory, entry.name),
        path,
        showHiddenEntries,
        lowercasePrefix,
        fallbackMatches
      );
      if (fallbackMatches.length >= MAX_FALLBACK_MENTION_CANDIDATES) {
        return;
      }
    }
  }
}

async function getMentionCandidates(
  query: string
): Promise<MentionCandidate[]> {
  const normalizedQuery = query.startsWith("./") ? query.slice(2) : query;
  if (normalizedQuery.startsWith("/")) {
    return [];
  }

  const hasTrailingSlash = normalizedQuery.endsWith("/");
  const lastSlashIndex = hasTrailingSlash
    ? normalizedQuery.length - 1
    : normalizedQuery.lastIndexOf("/");

  let directoryPart = "";
  if (hasTrailingSlash) {
    directoryPart = normalizedQuery.slice(0, -1);
  } else if (lastSlashIndex === -1) {
    directoryPart = "";
  } else {
    directoryPart = normalizedQuery.slice(0, lastSlashIndex);
  }

  let namePrefix = "";
  if (hasTrailingSlash) {
    namePrefix = "";
  } else if (lastSlashIndex === -1) {
    namePrefix = normalizedQuery;
  } else {
    namePrefix = normalizedQuery.slice(lastSlashIndex + 1);
  }

  const absoluteDirectory = resolve(CURRENT_DIRECTORY, directoryPart || ".");
  if (!isWithinCurrentDirectory(absoluteDirectory)) {
    return [];
  }

  try {
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });
    const lowercasePrefix = namePrefix.toLowerCase();
    const showHiddenEntries = namePrefix.startsWith(".");

    const directMatches = entries
      .filter((entry) => showHiddenEntries || !entry.name.startsWith("."))
      .filter(
        (entry) =>
          lowercasePrefix === "" ||
          entry.name.toLowerCase().startsWith(lowercasePrefix)
      )
      .sort((left, right) => {
        if (left.isDirectory() !== right.isDirectory()) {
          return left.isDirectory() ? -1 : 1;
        }
        return left.name.localeCompare(right.name);
      })
      .map((entry) => {
        const path = directoryPart
          ? `${directoryPart}/${entry.name}`
          : entry.name;
        const kind: MentionCandidate["kind"] = entry.isDirectory()
          ? "directory"
          : "file";
        return {
          path: kind === "directory" ? `${path}/` : path,
          kind,
        };
      });

    if (directMatches.length > 0 || directoryPart !== "" || namePrefix === "") {
      return directMatches;
    }

    const fallbackMatches: MentionCandidate[] = [];
    await recursiveVisit(
      CURRENT_DIRECTORY,
      "",
      showHiddenEntries,
      lowercasePrefix,
      fallbackMatches
    );
    return fallbackMatches.sort((left, right) =>
      left.path.localeCompare(right.path)
    );
  } catch {
    return [];
  }
}

interface FileMentionMenuProps {
  candidates: MentionCandidate[];
  onExecute: (index: number) => void;
  onSelect: (index: number) => void;
  scrollRef: RefObject<ScrollBoxRenderable | null>;
  selectedIndex: number;
}

function FileMentionMenu({
  candidates,
  selectedIndex,
  scrollRef,
  onSelect,
  onExecute,
}: FileMentionMenuProps) {
  const { colors } = useTheme();
  const visibleHeight = Math.min(candidates.length, MAX_VISIBLE_MENTIONS);

  if (candidates.length === 0) {
    return (
      <box paddingX={1}>
        <text attributes={TextAttributes.DIM}>
          No matching files or folders
        </text>
      </box>
    );
  }

  return (
    <scrollbox height={visibleHeight} ref={scrollRef}>
      {candidates.map((candidate, index) => {
        const isSelected = index === selectedIndex;

        return (
          <box
            backgroundColor={isSelected ? colors.selection : undefined}
            flexDirection="row"
            height={1}
            key={candidate.path}
            onMouseDown={() => onExecute(index)}
            onMouseMove={() => onSelect(index)}
            overflow="hidden"
            paddingX={1}
          >
            <box flexGrow={1} flexShrink={1} overflow="hidden">
              <text fg={isSelected ? "black" : "white"} selectable={false}>
                {candidate.path}
              </text>
            </box>

            <box alignItems="flex-end" flexShrink={0} width={8}>
              <text fg={isSelected ? "black" : "gray"} selectable={false}>
                {candidate.kind === "directory" ? "Folder" : "File"}
              </text>
            </box>
          </box>
        );
      })}
    </scrollbox>
  );
}

interface Props {
  disabled?: boolean;
  onSubmit: (text: string) => void;
}

export const TEXTAREA_KEY_BINDINGS: KeyBinding[] = [
  { name: "return", action: "submit" },
  { name: "enter", action: "submit" },
  { name: "return", shift: true, action: "newline" },
  { name: "enter", shift: true, action: "newline" },
];

export function InputBar({ onSubmit, disabled = false }: Props) {
  const { mode, toggleMode, setMode, setModel } = usePromptConfig();
  const textareaRef = useRef<TextareaRenderable>(null);
  const onSubmitRef = useRef<() => void>(() => {
    /* noop */
  });
  const activeMentionRef = useRef<MentionMatch | null>(null);
  const mentionScrollRef = useRef<ScrollBoxRenderable>(null);

  const renderer = useRenderer();
  const navigate = useNavigate();
  const toast = useToast();
  const dialog = useDialog();
  const { colors } = useTheme();
  const { isTopLayer, push, pop, setResponder } = useKeyboardLayer();

  const [activeMention, setActiveMention] = useState<MentionMatch | null>(null);
  const [mentionCandidates, setMentionCandidates] = useState<
    MentionCandidate[]
  >([]);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  const {
    showCommandMenu,
    commandQuery,
    selectedIndex,
    scrollRef,
    handleContentChange,
    resolveCommand,
    setSelectedIndex,
  } = useCommandMenu();

  const showMentionMenu = activeMention !== null;

  const closeMentionMenu = useCallback(() => {
    activeMentionRef.current = null;
    setActiveMention(null);
    setMentionCandidates([]);
    pop("mention");
  }, [pop]);

  const syncMentionMenu = useCallback(
    (text: string, cursorOffset: number) => {
      const nextMention = findActiveMention(text, cursorOffset);
      const previousMention = activeMentionRef.current;
      const mentionChanged =
        previousMention?.start !== nextMention?.start ||
        previousMention?.end !== nextMention?.end ||
        previousMention?.query !== nextMention?.query;

      if (!nextMention) {
        if (previousMention) {
          closeMentionMenu();
        }
        return;
      }

      activeMentionRef.current = nextMention;
      setActiveMention(nextMention);
      push("mention", () => {
        closeMentionMenu();
        return true;
      });

      if (mentionChanged) {
        setMentionSelectedIndex(0);
        mentionScrollRef.current?.scrollTo(0);
      }
    },
    [closeMentionMenu, push]
  );

  const handleTextareaContentChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const text = textarea.plainText;

    handleContentChange(textarea.plainText);
    syncMentionMenu(text, textarea.cursorOffset);
  }, [handleContentChange, syncMentionMenu]);

  const handleSubmit = useCallback(() => {
    if (disabled) {
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const text = textarea.plainText.trim();
    if (text.length === 0) {
      return;
    }

    onSubmit(text);
    textarea.setText("");
  }, [disabled, onSubmit]);

  const handleMentionExecute = useCallback(
    (index: number) => {
      const textarea = textareaRef.current;
      const mention = activeMentionRef.current;
      const candidate = mentionCandidates[index];

      if (!(textarea && mention && candidate)) {
        return;
      }

      const insertion =
        candidate.kind === "directory" ? candidate.path : `${candidate.path} `;

      const nextText = `${textarea.plainText.slice(0, mention.start)}@${insertion}${textarea.plainText.slice(mention.end)}`;

      textarea.replaceText(nextText);
      textarea.cursorOffset = mention.start + insertion.length + 1;
      syncMentionMenu(nextText, textarea.cursorOffset);
    },
    [mentionCandidates, syncMentionMenu]
  );

  const _handleTextareaCursorChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    syncMentionMenu(textarea.plainText, textarea.cursorOffset);
  }, [syncMentionMenu]);

  const handleCommand = useCallback(
    (command: Command | undefined) => {
      const textarea = textareaRef.current;
      if (!(textarea && command)) {
        return;
      }

      textarea.setText("");

      if (command.action) {
        command.action({
          exit: () => renderer.destroy(),
          toast,
          dialog,
          navigate,
          mode,
          setMode,
          setModel,
        });
      } else {
        textarea.insertText(`${command.value} `);
      }
    },
    [renderer, toast, dialog, navigate, mode, setMode, setModel]
  );

  const handleCommandExecute = useCallback(
    (index: number) => {
      const command = resolveCommand(index);
      handleCommand(command);
    },
    [resolveCommand, handleCommand]
  );

  // Keep the file picker in sync with the current @mention token.
  useEffect(() => {
    if (!activeMention) {
      setMentionCandidates([]);
      return;
    }

    let ignore = false;
    const loadCandidates = async () => {
      const nextCandidates = await getMentionCandidates(activeMention.query);
      if (ignore) {
        return;
      }

      setMentionCandidates(nextCandidates);
      setMentionSelectedIndex((currentIndex) => {
        if (nextCandidates.length === 0) {
          return 0;
        }
        return Math.min(currentIndex, nextCandidates.length - 1);
      });
    };

    loadCandidates();

    return () => {
      ignore = true;
    };
  }, [activeMention]);

  // Wire up textarea submit handler once so it always reads the latest state.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.onSubmit = () => {
      onSubmitRef.current();
    };
  }, []);

  onSubmitRef.current = () => {
    if (disabled) {
      return;
    }

    if (showCommandMenu) {
      const command = resolveCommand(selectedIndex);
      handleCommand(command);
      return;
    }

    if (showMentionMenu) {
      const candidate = mentionCandidates[mentionSelectedIndex];
      if (candidate) {
        handleMentionExecute(mentionSelectedIndex);
        return;
      }
    }

    handleSubmit();
  };

  useKeyboard((key) => {
    if (disabled) {
      return;
    }
    if (!isTopLayer("base")) {
      return;
    }
    if (key.name === "tab") {
      key.preventDefault();
      toggleMode();
    }
  });

  // Register the base layer responder for ctrl+c dismissal
  useEffect(() => {
    setResponder("base", () => {
      if (disabled) {
        return false;
      }

      const textarea = textareaRef.current;
      if (textarea && textarea.plainText.length > 0) {
        textarea.setText("");
        return true;
      }
      return false;
    });

    return () => setResponder("base", null);
  }, [disabled, setResponder]);

  useKeyboard((key) => {
    if (disabled) {
      return;
    }
    if (!(showMentionMenu && isTopLayer("mention"))) {
      return;
    }

    if (key.name === "escape") {
      key.preventDefault();
      closeMentionMenu();
    } else if (key.name === "up") {
      key.preventDefault();
      setMentionSelectedIndex((currentIndex) => {
        const nextIndex = Math.max(0, currentIndex - 1);
        const scrollbox = mentionScrollRef.current;
        if (scrollbox && nextIndex < scrollbox.scrollTop) {
          scrollbox.scrollTo(nextIndex);
        }
        return nextIndex;
      });
    } else if (key.name === "down") {
      key.preventDefault();
      setMentionSelectedIndex((currentIndex) => {
        if (mentionCandidates.length === 0) {
          return 0;
        }

        const nextIndex = Math.min(
          mentionCandidates.length - 1,
          currentIndex + 1
        );
        const scrollbox = mentionScrollRef.current;

        if (scrollbox) {
          const viewportHeight = scrollbox.viewport.height;
          const visibleEnd = scrollbox.scrollTop + viewportHeight - 1;
          if (nextIndex > visibleEnd) {
            scrollbox.scrollTo(nextIndex - viewportHeight + 1);
          }
        }

        return nextIndex;
      });
    }
  });

  return (
    <box alignItems="center" width="100%">
      <box
        border={["left"]}
        borderColor={mode === Mode.BUILD ? colors.primary : colors.planMode}
        customBorderChars={{
          ...EmptyBorder,
          vertical: "┃",
          bottomLeft: "╹",
        }}
        width="100%"
      >
        <box
          backgroundColor={colors.surface}
          gap={1}
          justifyContent="center"
          paddingX={2}
          paddingY={1}
          position="relative"
          width="100%"
        >
          {showCommandMenu && (
            <box
              backgroundColor={colors.surface}
              bottom="100%"
              left={0}
              position="absolute"
              width="100%"
              zIndex={10}
            >
              <CommandMenu
                onExecute={handleCommandExecute}
                onSelect={setSelectedIndex}
                query={commandQuery}
                scrollRef={scrollRef}
                selectedIndex={selectedIndex}
              />
            </box>
          )}
          {!showCommandMenu && showMentionMenu && (
            <box
              backgroundColor={colors.surface}
              bottom="100%"
              left={0}
              position="absolute"
              width="100%"
              zIndex={10}
            >
              <FileMentionMenu
                candidates={mentionCandidates}
                onExecute={handleMentionExecute}
                onSelect={setMentionSelectedIndex}
                scrollRef={mentionScrollRef}
                selectedIndex={mentionSelectedIndex}
              />
            </box>
          )}
          <textarea
            focused={
              !disabled &&
              (isTopLayer("base") ||
                isTopLayer("command") ||
                isTopLayer("mention"))
            }
            keyBindings={TEXTAREA_KEY_BINDINGS}
            onContentChange={handleTextareaContentChange}
            placeholder={`Ask anything... "Fix a bug in the database"`}
            ref={textareaRef}
          />
          <StatusBar />
        </box>
      </box>
    </box>
  );
}
