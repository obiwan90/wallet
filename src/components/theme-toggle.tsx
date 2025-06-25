"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = React.useCallback(() => {
    if (!mounted) return;
    setTheme(theme === "dark" ? "light" : "dark");
  }, [mounted, theme, setTheme]);

  // 始终显示 Moon 图标，避免服务器端/客户端差异
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className="bg-background/50 border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 backdrop-blur-sm"
      suppressHydrationWarning
    >
      <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300" />
      <span className="sr-only" suppressHydrationWarning>
        Toggle theme
      </span>
    </Button>
  );
}