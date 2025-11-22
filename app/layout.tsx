import type React from "react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Metadata, Viewport } from "next";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nhập code hàng loạt Bomber VNG",
  description:
    "Công cụ nhập code hàng loạt cho Bomber VNG — quản lý tài khoản, redeem tự động và theo dõi trạng thái.",
  keywords: [
    "Bomber VNG",
    "nhập code",
    "redeem code",
    "nhập code hàng loạt",
    "bulk redeem",
    "tool Bomber",
  ],
  authors: [{ name: "Chin" }],
  generator: "NhapCodeBomberVNG",
  openGraph: {
    title: "Nhập code hàng loạt | Bomber VNG",
    description:
      "Công cụ nhập code hàng loạt cho Bomber VNG — xử lý auto, báo cáo trạng thái chi tiết.",
    // url: "https://your-domain.example",
    siteName: "NhapCodeBomberVNG",
    // images: [
    //   {
    //     url: "/og-image.png", // thay ảnh thật nếu có
    //     width: 1200,
    //     height: 630,
    //     alt: "Nhập code Bomber VNG",
    //   },
    // ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nhập code hàng loạt Bomber VNG",
    description:
      "Công cụ nhập code hàng loạt Bomber VNG — auto redeem, theo dõi trạng thái dễ dàng.",
    // images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
