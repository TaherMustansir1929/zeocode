import { useTheme } from "../../providers/theme";
import { SplitBorderChars } from "../border";

type Props = {
	message: string;
};

export function UserMessage({ message }: Props) {
	const { colors } = useTheme();

	return (
		<box width="100%" alignItems="center">
			<box
				border={["left"]}
				borderColor={colors.primary}
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
					<text>{message}</text>
				</box>
			</box>
		</box>
	);
}
