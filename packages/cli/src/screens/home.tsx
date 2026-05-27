import { TextAttributes } from "@opentui/core";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/header";
import { InputBar } from "../components/input-bar";
import { usePromptConfig } from "../providers/prompt-config";

export function Home() {
  const navigate = useNavigate();
  const { mode, model } = usePromptConfig();

  const handleSubmit = useCallback(
    (text: string) => {
      navigate("/sessions/new", { state: { message: text, mode, model } });
    },
    [navigate, mode, model]
  );

  return (
    <box
      alignItems="center"
      flexGrow={1}
      gap={2}
      height="100%"
      justifyContent="center"
      position="relative"
      width="100%"
    >
      <Header />
      <box
        flexDirection="column"
        gap={1}
        maxWidth={78}
        paddingX={2}
        width="100%"
      >
        <InputBar onSubmit={handleSubmit} />
        <box flexDirection="row" flexShrink={0} gap={1} marginLeft="auto">
          <text>tab</text>
          <text attributes={TextAttributes.DIM}>agents</text>
        </box>
      </box>
    </box>
  );
}
