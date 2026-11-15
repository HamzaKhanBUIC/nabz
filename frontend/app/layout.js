import localFont from "next/font/local";
import "./globals.css";
import { StoreProvider } from "@/lib/data/store";
import { SessionProvider } from "@/lib/data/session";
import { ThemeProvider, themeBootstrapScript } from "@/lib/theme";
import AppShell from "@/components/layout/AppShell";

const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  title: {
    default: "Nabz | Crew Health Monitoring",
    template: "%s · Nabz",
  },
  description:
    "Onboard crew health monitor for reaction speed, sleep, blood pressure, baseline trends, and offline emergency steps.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`h-full ${inter.variable}`}
      // themeBootstrapScript sets data-theme and color-scheme here before hydration, on purpose.
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased">
        {/* Applies the stored theme before first paint — no flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <ThemeProvider>
          <SessionProvider>
            <StoreProvider>
              <AppShell>{children}</AppShell>
            </StoreProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
