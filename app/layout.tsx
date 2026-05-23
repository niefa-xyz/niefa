import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NIEFA — Neural Interference Engine for Agents',
  description: 'Deploy autonomous AI agents that think, plan, and execute. Open-source neural orchestration runtime. Goal in → reasoning, action, results out.',
  icons: { icon: '/icon.jpg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="fx-noise" />
        <div className="fx-scanlines" />
        <div className="top-strip" />
        {children}
      </body>
    </html>
  )
}
