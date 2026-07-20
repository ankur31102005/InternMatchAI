import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "InternMatch AI | PM Internship Scheme Recommendations",
  description:
    "AI-powered internship matching platform. Upload your resume, check qualifications and match with the finest PM Internship Scheme openings.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-background text-foreground antialiased min-h-screen relative overflow-x-hidden`}>
        {/* Background Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none -z-10" />
        
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
