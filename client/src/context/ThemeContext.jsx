import { createContext, useContext, useEffect, useState, useMemo } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("studybuddy_theme");
      if (savedTheme === "web") return "dark"; // migrated to dark theme + web skin
      if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    } catch {}
    return "dark"; // Default theme remains dark
  });

  const [skin, setSkin] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("studybuddy_theme");
      const savedSkin = localStorage.getItem("studybuddy_skin");
      if (savedTheme === "web") return "web"; // migrated legacy setting
      if (savedSkin === "web" || savedSkin === "basic") return savedSkin;
    } catch {}
    return "basic"; // Default skin is basic
  });

  const [animatedBg, setAnimatedBg] = useState(() => {
    try {
      const saved = localStorage.getItem("studybuddy_animated_bg");
      if (saved !== null) return saved === "true";
    } catch {}
    return true; // Default animated background is On
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "theme-web");
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-skin", skin);

    try {
      localStorage.setItem("studybuddy_theme", theme);
      localStorage.setItem("studybuddy_skin", skin);
      localStorage.setItem("studybuddy_animated_bg", String(animatedBg));
    } catch {}
  }, [theme, skin, animatedBg]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleSkin = () => {
    setSkin((prev) => (prev === "web" ? "basic" : "web"));
  };

  const toggleAnimatedBg = () => {
    setAnimatedBg((prev) => !prev);
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      skin,
      setSkin,
      toggleSkin,
      animatedBg,
      setAnimatedBg,
      toggleAnimatedBg,
      isDark: theme === "dark",
      isWeb: skin === "web",
    }),
    [theme, skin, animatedBg],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
