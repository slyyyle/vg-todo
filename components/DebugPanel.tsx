"use client"

import { useState, useEffect } from "react"
import { useEventLogger, type LoggedEvent } from "@/app/EventLoggerContext"
import { useComponentRegistry } from "@/app/utils/ComponentRegistry"
import { createSourceCodeMap } from "@/app/utils/debugUtils"

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<"events" | "components" | "references">("events")
  const [events, setEvents] = useState<LoggedEvent[]>([])
  const { logEvent, getRecentEvents, clearEvents } = useEventLogger()
  const { getComponentTree } = useComponentRegistry()
  const [sourceMap, setSourceMap] = useState<Record<string, any>>({})

  // Toggle visibility with Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault()
        setIsVisible((prev) => !prev)
        logEvent("toggle", "DebugPanel", { value: !isVisible })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isVisible, logEvent])

  // Update events from the event logger
  useEffect(() => {
    const intervalId = setInterval(() => {
      setEvents(getRecentEvents())
    }, 500)

    return () => clearInterval(intervalId)
  }, [getRecentEvents])

  // Generate source map when switching to references tab
  useEffect(() => {
    if (activeTab === "references" && isVisible) {
      setSourceMap(createSourceCodeMap())
    }
  }, [activeTab, isVisible])

  // Expose debug utilities to window
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).nesDebug = {
        ...((window as any).nesDebug || {}),
        getComponentTree,
        getRecentEvents,
        clearEvents,
        createSourceCodeMap,
        logEvent: (type: string, element: string, details?: any) => {
          logEvent(type, element, details)
        },
      }

      console.log(
        "%c[NES TODO DEBUG] Enhanced debug utilities available at window.nesDebug",
        "background: #06d6a0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;",
      )
    }
  }, [getComponentTree, getRecentEvents, clearEvents, logEvent])

  if (!isVisible) return null

  const componentTree = getComponentTree()

  return (
    <div className="fixed bottom-0 right-0 w-96 h-80 bg-black bg-opacity-90 text-white z-50 overflow-hidden flex flex-col">
      <div className="p-2 bg-gray-800 flex justify-between items-center">
        <h3 className="text-xs">NES Todo Debug Panel (Ctrl+Shift+D to toggle)</h3>
        <div className="flex gap-2">
          <button
            className={`text-xs px-2 py-1 rounded ${activeTab === "events" ? "bg-blue-600" : "bg-gray-600"}`}
            onClick={() => setActiveTab("events")}
          >
            Events
          </button>
          <button
            className={`text-xs px-2 py-1 rounded ${activeTab === "components" ? "bg-blue-600" : "bg-gray-600"}`}
            onClick={() => setActiveTab("components")}
          >
            Components
          </button>
          <button
            className={`text-xs px-2 py-1 rounded ${activeTab === "references" ? "bg-blue-600" : "bg-gray-600"}`}
            onClick={() => setActiveTab("references")}
          >
            References
          </button>
          <button className="text-xs bg-red-600 px-2 py-1 rounded" onClick={clearEvents}>
            Clear
          </button>
          <button className="text-xs bg-gray-600 px-2 py-1 rounded" onClick={() => setIsVisible(false)}>
            Close
          </button>
        </div>
      </div>

      {activeTab === "events" && (
        <div className="flex-1 overflow-auto p-2 text-xs font-mono">
          {events.map((event, i) => (
            <div key={i} className="mb-1 border-b border-gray-700 pb-1">
              <div className="flex justify-between">
                <span className="font-bold">{event.type}</span>
                <span className="text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
              <div>{event.element}</div>
              {event.sourceInfo?.componentName && (
                <div className="text-green-400">
                  Reference: {event.sourceInfo.componentName}@{event.sourceInfo.fileName}
                </div>
              )}
              {event.sourceInfo?.componentPath && (
                <div className="text-blue-400 text-xs">Path: {event.sourceInfo.componentPath.join(" > ")}</div>
              )}
              {event.value && event.value.sourceReference && (
                <div className="text-yellow-400">Source: {event.value.sourceReference}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "components" && (
        <div className="flex-1 overflow-auto p-2 text-xs font-mono">
          {Object.values(componentTree)
            .sort((a, b) => a.depth - b.depth)
            .map((component) => (
              <div key={component.id} className="mb-1 border-b border-gray-700 pb-1">
                <div className="flex justify-between">
                  <span className="font-bold" style={{ marginLeft: `${component.depth * 10}px` }}>
                    {component.name}
                  </span>
                  {component.fileName && <span className="text-gray-400">{component.fileName}</span>}
                </div>
                <div className="text-yellow-400">
                  Reference: {component.name}@{component.fileName}
                </div>
                <div className="text-blue-400 text-xs">Path: {component.path.join(" > ")}</div>
              </div>
            ))}
        </div>
      )}

      {activeTab === "references" && (
        <div className="flex-1 overflow-auto p-2 text-xs font-mono">
          <div className="mb-2 p-2 bg-gray-800 rounded">
            <p>Use these references when talking about components:</p>
          </div>
          {Object.values(sourceMap).map((component: any, index) => (
            <div key={index} className="mb-1 border-b border-gray-700 pb-1">
              <div className="text-yellow-400 font-bold">{component.sourceReference}</div>
              <div>File: {component.fileName}</div>
              {component.testIds.length > 0 && (
                <div className="text-green-400">TestIDs: {component.testIds.join(", ")}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
