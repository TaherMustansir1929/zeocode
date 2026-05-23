import { useCallback, useEffect, useRef, useState } from "react";
import { useDialog } from "../../providers/dialog";
import { useTheme } from "../../providers/theme";
import { THEMES, type Theme } from "../../theme";
import { DialogSearchList } from "../dialog-search-list";

export const ThemeDialogContent = () => {
	const dialog = useDialog();
	const { setTheme, currentTheme } = useTheme();
	const originalThemeRef = useRef(currentTheme);
	const confirmedRef = useRef(false);
	const [previewTheme, setPreviewTheme] = useState<Theme>(currentTheme);

	// Apply preview theme changes transiently
	useEffect(() => {
		setTheme(previewTheme);
	}, [previewTheme, setTheme]);

	// Revert to original theme if dialog is closed without confirming
	useEffect(() => {
		return () => {
			if (!confirmedRef.current) {
				setTheme(originalThemeRef.current);
			}
		};
	}, [setTheme]);

	const handleSelect = useCallback(
		(theme: Theme) => {
			confirmedRef.current = true;
			setTheme(theme);
			dialog.close();
		},
		[setTheme, dialog],
	);

	const handleHighlight = useCallback(
		(theme: Theme) => {
			setPreviewTheme(theme);
		},
		[],
	);

	return (
		<DialogSearchList
			items={THEMES}
			onSelect={handleSelect}
			onHighlight={handleHighlight}
			filterFn={(t, query) =>
				t.name.toLowerCase().includes(query.toLowerCase())
			}
			renderItem={(theme, isSelected) => {
				const { colors } = currentTheme;
				return (
					<text
						selectable={false}
						fg={isSelected ? colors.selectionForeground : colors.foreground}
					>
						{theme.name === originalThemeRef.current.name
							? "\u0020\u2022\u0020"
							: "\u0020\u0020\u0020"}
						{theme.name}
					</text>
				);
			}}
			getKey={(t) => t.name}
			placeholder="Search themes"
			emptyText="No matching themes"
		/>
	);
};
