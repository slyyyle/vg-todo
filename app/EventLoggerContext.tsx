"use client"

import type React from "react"
import { createContext, useContext, useCallback, useRef } from "react"
import { useComponentRegistry } from "./utils/ComponentRegistry"

// Define the structure of our logged events
export interface LoggedEvent {
  type: string
  element: string
  id?: string
  value?: any
  timestamp: number
  path?: string
  sourceInfo?: {
    componentName?: string
    fileName?: string
    componentPath?: string[]
  }
}

// Store for recent events
const recentEvents: LoggedEvent[] = []
const MAX_EVENTS = 100

// Define the context type
interface EventLoggerContextType {
  logEvent: (
    type: string,
    element: string,
    details?: { id?: string; value?: any; componentName?: string; fileName?: string },
  ) => void
  getEventPath: (element: HTMLElement | null) => string
  getRecentEvents: () => LoggedEvent[]
  clearEvents: () => void
}

// Create the context
const EventLoggerContext = createContext<EventLoggerContextType | undefined>(undefined)

export function EventLoggerProvider({ children }: { children: React.ReactNode }) {
  const { getComponentTree, getComponentByName } = useComponentRegistry()
  const eventsRef = useRef<LoggedEvent[]>(recentEvents)

  // Function to get a readable path to an element
  const getEventPath = useCallback((element: HTMLElement | null): string => {
    if (!element) return "unknown"

    const path: string[] = []
    let current: HTMLElement | null = element

    // Walk up the DOM tree to build a path
    while (current && current !== document.body) {
      let identifier = current.tagName.toLowerCase()

      // Add any useful identifiers
      if (current.id) {
        identifier += `#${current.id}`
      } else if (current.className && typeof current.className === "string") {
        identifier += `.${current.className.split(" ")[0]}`
      }

      // Add data-testid if available
      const testId = current.getAttribute("data-testid")
      if (testId) {
        identifier += `[data-testid="${testId}"]`
      }

      // Add component name if available
      const componentName = current.getAttribute("data-component-name")
      if (componentName) {
        identifier += `[${componentName}]`
      }

      path.unshift(identifier)
      current = current.parentElement
    }

    return path.join(" > ")
  }, [])

  // The main logging function
  const logEvent = useCallback(
    (
      type: string,
      element: string,
      details?: { id?: string; value?: any; componentName?: string; fileName?: string },
    ) => {
      // Try to find component information
      let sourceInfo: LoggedEvent["sourceInfo"] = {}

      if (details?.componentName) {
        const componentInfo = getComponentByName(details.componentName)
        if (componentInfo) {
          sourceInfo = {
            componentName: componentInfo.name,
            fileName: componentInfo.fileName,
            componentPath: componentInfo.path,
          }
        } else {
          sourceInfo = {
            componentName: details.componentName,
            fileName: details.fileName,
          }
        }
      }

      const event: LoggedEvent = {
        type,
        element,
        id: details?.id,
        value: details?.value,
        timestamp: Date.now(),
        sourceInfo,
      }

      // Add to recent events
      eventsRef.current = [event, ...eventsRef.current.slice(0, MAX_EVENTS - 1)]

      // Log to console with a distinctive style and source information
      console.log(
        `%c[EVENT] ${type} | ${element}${details?.id ? ` | ID: ${details.id}` : ""}${
          sourceInfo.componentName ? ` | Component: ${sourceInfo.componentName}` : ""
        }${sourceInfo.fileName ? ` | File: ${sourceInfo.fileName}` : ""}`,
        "background: #2a9df4; color: white; padding: 2px 4px; border-radius: 2px;",
        {
          value: details?.value,
          sourceInfo,
          componentTree: getComponentTree(),
        },
      )

      return event
    },
    [getComponentByName, getComponentTree],
  )

  const getRecentEvents = useCallback(() => {
    return [...eventsRef.current]
  }, [])

  const clearEvents = useCallback(() => {
    eventsRef.current = []
  }, [])

  return (
    <EventLoggerContext.Provider value={{ logEvent, getEventPath, getRecentEvents, clearEvents }}>
      {children}
    </EventLoggerContext.Provider>
  )
}

// Custom hook to use the event logger
export function useEventLogger() {
  const context = useContext(EventLoggerContext)
  if (context === undefined) {
    throw new Error("useEventLogger must be used within an EventLoggerProvider")
  }
  return context
}
