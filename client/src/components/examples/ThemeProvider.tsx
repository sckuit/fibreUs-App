import { ThemeProvider } from '../ThemeProvider';
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from '../ThemeProvider';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      data-testid="button-theme-toggle"
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}

export default function ThemeProviderExample() {
  return (
    <ThemeProvider>
      <div className="p-8 bg-background text-foreground">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Theme Toggle Example</h3>
          <ThemeToggle />
        </div>
        <p className="text-muted-foreground">
          Click the button above to toggle between light and dark themes.
        </p>
      </div>
    </ThemeProvider>
  );
}