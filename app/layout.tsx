import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "탐구 주제 찾기", description: "10가지 사고 형식으로 학생의 탐구 주제를 찾아가는 Inquiry Studio" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
