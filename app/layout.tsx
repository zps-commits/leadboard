import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { MobileNav, Sidebar } from "@/components/layout/Nav";
import { CrmProvider } from "@/components/providers/CrmProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'LeadBoard — a small CRM',
  description:
    'Track leads, move them through a sales pipeline and see what the pipeline is worth.',
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CrmProvider>
          <div className="flex flex-1">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <DemoBanner />
              <main className="flex-1">{children}</main>
            </div>
          </div>
          <MobileNav />
        </CrmProvider>
      </body>
    </html>
  );
}
