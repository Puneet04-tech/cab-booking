import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import LoadingProvider from "@/components/LoadingProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RideSwift – Cab Booking App",
    template: "%s | RideSwift",
  },
  description:
    "Book reliable, fast, and affordable rides anywhere. Real-time tracking, secure payments, and professional drivers.",
  keywords: ["cab booking", "ride hailing", "uber clone", "taxi"],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LoadingProvider>
          {children}
        </LoadingProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "rgba(16, 0, 31, 0.95)",
              color: "#00ff9f",
              border: "2px solid #7b3ff2",
              borderRadius: "8px",
              fontFamily: "Orbitron, sans-serif",
              fontSize: "14px",
              boxShadow: "0 0 20px rgba(123, 63, 242, 0.5)",
            },
            success: { 
              iconTheme: { primary: "#00ff9f", secondary: "#10001f" },
              style: { borderColor: "#00ff9f" }
            },
            error: {
              iconTheme: { primary: "#ff006e", secondary: "#10001f" },
              style: { borderColor: "#ff006e" }
            },
          }}
        />
      </body>
    </html>
  );
}
