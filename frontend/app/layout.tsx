// frontend/app/layout.tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Orbitron, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ashu-ai.vercel.app";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const developerName = "AWS - Arshad Wasib Shaik";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "𝗔𝗦𝗛𝗨 𝗔𝗜 𝗠𝘂𝗹𝘁𝗶⚡𝗣𝗿𝗼𝘃𝗶𝗱𝗲𝗿 𝗔𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝘁",
    template: "%s | ASHU AI Terminal",
  },
  description:
    "AdvancedSystemHolographicUnified Artificial Intelligence Assistant — Multi-provider AI terminal with Iron Man Jarvis holographic interface, voice commands, and intelligent 13-provider fallback routing.",
  keywords: [
    "AI terminal",
    "holographic interface",
    "multi-provider AI",
    "voice commands",
    "Google Gemini",
    "Groq",
    "Mistral AI",
    "OpenAI",
    "Anthropic Claude",
    "developer tools",
    "AI assistant",
    "ASHU AI",
    "Iron Man Jarvis",
    "hacking terminal",
  ],
  authors: [{ name: developerName }],
  creator: developerName,
  publisher: developerName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: "𝗔𝗦𝗛𝗨 𝗔𝗜 𝗠𝘂𝗹𝘁𝗶⚡𝗣𝗿𝗼𝘃𝗶𝗱𝗲𝗿 𝗔𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝘁",
    description:
      "Multi-provider AI terminal with Iron Man Jarvis holographic interface, voice commands, and intelligent 13-provider fallback routing.",
    siteName: "ASHU AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ASHU AI — Advanced Holographic AI Terminal",
    description:
      "Multi-provider AI terminal with Iron Man Jarvis holographic interface, voice commands, and intelligent 13-provider fallback routing.",
    creator: `@arshadwasibshaik`,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "ASHU AI",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false,
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000408" },
    { media: "(prefers-color-scheme: light)", color: "#eef3f9" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "dark light",
  viewportFit: "cover",
};

const THEME_INIT_SCRIPT = `(function(){try{var modeKey="ashu-color-mode";var storeKey="ashu-terminal-store";var storedMode=localStorage.getItem(modeKey);var resolvedMode=(storedMode==="light"||storedMode==="dark")?storedMode:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-mode",resolvedMode);var storeRaw=localStorage.getItem(storeKey);if(storeRaw){var parsed=JSON.parse(storeRaw);var theme=parsed&&parsed.state&&parsed.state.theme;if(typeof theme==="string"&&theme.length>0){document.documentElement.setAttribute("data-theme",theme);}}}catch(e){}})();`;

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${orbitron.variable} ${jetbrainsMono.variable} ${inter.variable}`}
    >
      <head>
        <script
          id="ashu-theme-init"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        {supabaseUrl.length > 0 && (
          <link rel="preconnect" href={supabaseUrl} crossOrigin="anonymous" />
        )}
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
        <link rel="dns-prefetch" href="https://api.groq.com" />
        <link rel="dns-prefetch" href="https://api.mistral.ai" />
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <link rel="dns-prefetch" href="https://api.x.ai" />
        <link rel="dns-prefetch" href="https://api.cerebras.ai" />
        <link rel="dns-prefetch" href="https://openrouter.ai" />
        <link rel="dns-prefetch" href="https://api.cohere.com" />
        <link rel="dns-prefetch" href="https://api-inference.huggingface.co" />
        <link rel="dns-prefetch" href="https://api.cloudflare.com" />
        <link rel="dns-prefetch" href="https://api.together.xyz" />
        <link rel="dns-prefetch" href="https://api.deepseek.com" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000408" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className="terminal-root scrollbar-terminal"
        suppressHydrationWarning
      >
        <div className="relative w-full h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
