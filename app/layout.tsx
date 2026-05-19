import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NIEFA — Neural Interference Engine for Agents',
  description: 'NIEFA — Neural Interference Engine for Agents. An open-source platform for building and deploying autonomous AI agents. Give your agent a goal and watch it think, plan, and execute — all in real time.',
  icons: {
    icon: '/icon.jpg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="hero__scanlines" />
        {children}
      </body>
    </html>
  )
}
