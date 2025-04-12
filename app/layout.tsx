import type React from "react"
import "./globals.css"
// Import the providers
import { EventLoggerProvider } from "./EventLoggerContext"
import { ComponentRegistryProvider } from "./utils/ComponentRegistry"
import EventLogger from "@/components/EventLogger"
import DebugPanel from "@/components/DebugPanel"

export const metadata = {
  title: "NES Todo Quest",
  description: "A retro-themed todo application",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Import Press Start 2P font with preconnect for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />

        {/* Import NES.css with the recommended approach */}
        <link href="https://unpkg.com/nes.css@2.3.0/css/nes.min.css" rel="stylesheet" />

        {/* Optional: Add normalize.css before NES.css */}
        <link href="https://unpkg.com/normalize.css@8.0.1/normalize.css" rel="stylesheet" />
      </head>
      <body>
        <ComponentRegistryProvider>
          <EventLoggerProvider>
              <EventLogger>{children}</EventLogger>
              <DebugPanel />
          </EventLoggerProvider>
        </ComponentRegistryProvider>
      </body>
    </html>
  )
}


import './globals.css'