import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/ui/app-shell";
import { Inter, Montserrat, Lato, Source_Code_Pro } from "next/font/google";

const fontSans = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans", display: "swap" });
const fontHeadline = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-headline", display: "swap" });
const fontDisplay = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-display", display: "swap" });
const fontCode = Source_Code_Pro({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-code", display: "swap" });

const bodyClassName = cn(
  "min-h-screen bg-background font-sans antialiased",
  fontSans.variable,
  fontHeadline.variable,
  fontDisplay.variable,
  fontCode.variable
);

export const metadata: Metadata = {
  title: 'MastraMind',
  description: 'AI-powered customer service and appointment booking',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName}>
        <ThemeProvider>
          <AppShell className="flex min-h-screen flex-col">
            {children}
          </AppShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
