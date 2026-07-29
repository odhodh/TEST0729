import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "세특 스튜디오", description: "학생 활동을 과목별 세부능력 및 특기사항 초안으로 정리하는 교사용 워크스페이스" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
