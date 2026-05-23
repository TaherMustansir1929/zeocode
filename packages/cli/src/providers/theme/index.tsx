import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactNode,
} from "react";
import {
	DEFAULT_THEME,
	THEMES,
	type Theme,
	type ThemeColors,
} from "../../theme";

const CONFIG_DIR = join(homedir(), ".zeocode");
const THEME_PREFERENCES_PATH = join(CONFIG_DIR, "preferences.json");

type ThemePreferences = {
	themeName: string;
};

function getInitialTheme(): Theme {
	try {
		const preferences = JSON.parse(
			readFileSync(THEME_PREFERENCES_PATH, "utf8"),
		) as Partial<ThemePreferences>;
		const savedTheme = THEMES.find((t) => t.name === preferences.themeName);
		return savedTheme ?? DEFAULT_THEME;
	} catch {
		return DEFAULT_THEME;
	}
}

function persistTheme(theme: Theme) {
	try {
		mkdirSync(CONFIG_DIR, { recursive: true });
		writeFileSync(
			THEME_PREFERENCES_PATH,
			JSON.stringify(
				{ themeName: theme.name } satisfies ThemePreferences,
				null,
				2,
			),
			"utf8",
		);
	} catch {
		// ignore preference write failures so theme switching still works for the current session
	}
}

type ThemeContextValue = {
	colors: ThemeColors;
	currentTheme: Theme;
	setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
	const value = useContext(ThemeContext);
	if (!value) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return value;
}

type ThemeProviderProps = {
	children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
	const [currentTheme, setCurrentTheme] = useState<Theme>(getInitialTheme);

	const setTheme = useCallback((theme: Theme) => {
		setCurrentTheme(theme);
		persistTheme(theme);
	}, []);

	return (
		<ThemeContext.Provider
			value={{ colors: currentTheme.colors, currentTheme, setTheme }}
		>
			{children}
		</ThemeContext.Provider>
	);
}
