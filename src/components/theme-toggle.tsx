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

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="bg-background/50 border-border text-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="bg-background/50 border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 backdrop-blur-sm"
    >
      {theme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}