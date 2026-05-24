import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { BotMessage, ErrorMessage, UserMessage } from "../components/messages";
import { SessionShell } from "../components/session-shell";

export function NewSession() {
	const navigate = useNavigate();
	const location = useLocation();

	const state = location.state as { message?: string } | null;

	useEffect(() => {
		if (!state?.message) {
			navigate("/", { replace: true });
		}
	}, [state, navigate]);

	if (!state?.message) return null;

	return (
		<SessionShell onSubmit={() => {}} inputDisabled loading>
			<UserMessage message={state.message} />
			<BotMessage
				content="This is a simple bot message to demonstrate the message layout."
				model="opus-4-6"
			/>
			<ErrorMessage message="This is a sample error message" />
		</SessionShell>
	);
}
