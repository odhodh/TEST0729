import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "탐구 주제 설계실",
  description: "막연한 관심사를 깊이 있는 학술 탐구 주제로 확장하는 Inquiry Studio",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
