import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/lib/i18n";
import { BugReportButton } from "@/components/BugReportButton";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RLM Explained - Namastex Labs",
  description: "Interactive visualizer for Recursive Language Models (RLM). See how AI solves context rot by processing documents through code execution and helper AIs.",
  keywords: ["RLM", "Recursive Language Models", "AI visualization", "context rot", "MIT", "Namastex Labs"],
  authors: [{ name: "Namastex Labs" }],
  openGraph: {
    title: "RLM Explained - Namastex Labs",
    description: "Interactive visualizer for Recursive Language Models. See how AI solves context rot.",
    type: "website",
    locale: "en_US",
    siteName: "RLM Explained",
  },
  twitter: {
    card: "summary_large_image",
    title: "RLM Explained - Namastex Labs",
    description: "Interactive visualizer for Recursive Language Models. See how AI solves context rot.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <TooltipProvider>
              {children}
              <BugReportButton />
            </TooltipProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
