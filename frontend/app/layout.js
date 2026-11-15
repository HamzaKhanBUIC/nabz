import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/data/store";
import { SessionProvider } from "@/lib/data/session";
import { ThemeProvider, themeBootstrapScript } from "@/lib/theme";
import AppShell from "@/components/layout/AppShell";

/* Nova uses Inter only, weights 400 / 500 / 600 / 700. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: {
    default: "CrewPulse — Crew Health Monitoring",
    template: "%s · CrewPulse",
  },
  description:
    "CrewPulse helps astronauts monitor wellbeing, track reaction time, sleep, mood and blood pressure, and understand their personal Normal Zone on long-duration missions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased">
        {/* Applies the stored theme before first paint — no flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <ThemeProvider>
          <StoreProvider>
            <SessionProvider>
              <AppShell>{children}</AppShell>
            </SessionProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
