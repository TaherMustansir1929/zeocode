import { TextAttributes } from "@opentui/core";
import { useTheme } from "../../providers/theme";
import { SplitBorderChars } from "../border";

type Props = {
	message: string;
};

export function ErrorMessage({ message }: Props) {
	const { colors } = useTheme();

	return (
		<box width="100%" alignItems="center">
			<box
				border={["left"]}
				borderColor={colors.error}
				width="100%"
				customBorderChars={SplitBorderChars}
			>
				<box
					justifyContent="center"
					paddingX={2}
					paddingY={1}
					width="100%"
					backgroundColor={colors.surface}
				>
					<text attributes={TextAttributes.DIM}>{message}</text>
				</box>
			</box>
		</box>
	);
}
