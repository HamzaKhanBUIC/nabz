import localFont from "next/font/local";
import "./globals.css";
import { StoreProvider } from "@/lib/data/store";
import { SessionProvider } from "@/lib/data/session";
import { ThemeProvider, themeBootstrapScript } from "@/lib/theme";
import AppShell from "@/components/layout/AppShell";

const plusJakarta = localFont({
  src: "../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-jakarta",
  display: "swap",
});

const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  style: "normal",
  variable: "--font-mono-face",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  title: {
    default: "CrewPulse | Crew Health Monitoring",
    template: "%s · CrewPulse",
  },
  description:
    "Onboard crew health monitor for reaction speed, sleep, blood pressure, baseline trends, and offline emergency steps.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`h-full ${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
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
