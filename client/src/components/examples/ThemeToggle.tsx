import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '../ThemeProvider';

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="p-8 bg-background text-foreground">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Theme Toggle</h3>
          <ThemeToggle />
        </div>
      </div>
    </ThemeProvider>
  );
}