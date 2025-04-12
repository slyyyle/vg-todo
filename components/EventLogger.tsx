"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { useEventLogger } from "@/app/EventLoggerContext"
import { getComponentReference } from "@/app/utils/debugUtils"

interface EventLoggerProps {
  children: React.ReactNode
}

export default function EventLogger({ children }: EventLoggerProps) {
  const { logEvent, getEventPath } = useEventLogger()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Log all click events
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const path = getEventPath(target)

      // Get the most specific identifier
      const testId = target.getAttribute("data-testid")
      const id = target.id
      const text = target.textContent?.trim()

      // Get component information
      const componentName = findClosestComponentName(target)
      const fileName = findClosestComponentFile(target)

      let elementDesc = testId || id || text || target.tagName.toLowerCase()
      if (elementDesc.length > 30) {
        elementDesc = elementDesc.substring(0, 30) + "..."
      }

      // Create a clear reference string
      const sourceReference = componentName && fileName ? getComponentReference(componentName, fileName) : undefined

      logEvent("click", elementDesc, {
        id: testId || id,
        value: {
          path,
          tagName: target.tagName,
          sourceReference,
        },
        componentName,
        fileName,
      })
    }

    // Log form interactions
    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      const path = getEventPath(target as HTMLElement)

      const testId = target.getAttribute("data-testid")
      const id = target.id
      const name = target.name

      // Get component information
      const componentName = findClosestComponentName(target as HTMLElement)
      const fileName = findClosestComponentFile(target as HTMLElement)

      // Create a clear reference string
      const sourceReference = componentName && fileName ? getComponentReference(componentName, fileName) : undefined

      let value = target.value
      // Don't log actual values for password fields
      if (target.type === "password") {
        value = "*****"
      }

      logEvent("change", testId || id || name || target.tagName.toLowerCase(), {
        id: testId || id || name,
        value: {
          path,
          value,
          sourceReference,
        },
        componentName,
        fileName,
      })
    }

    // Log form submissions
    const handleSubmit = (e: Event) => {
      const target = e.target as HTMLFormElement
      const path = getEventPath(target)

      const testId = target.getAttribute("data-testid")
      const id = target.id

      // Get component information
      const componentName = findClosestComponentName(target)
      const fileName = findClosestComponentFile(target)

      // Create a clear reference string
      const sourceReference = componentName && fileName ? getComponentReference(componentName, fileName) : undefined

      logEvent("submit", testId || id || "form", {
        id: testId || id,
        value: {
          path,
          sourceReference,
        },
        componentName,
        fileName,
      })
    }

    // Helper function to find the closest component name
    function findClosestComponentName(element: HTMLElement): string | undefined {
      let current: HTMLElement | null = element
      while (current) {
        const componentName = current.getAttribute("data-component-name")
        if (componentName) {
          return componentName
        }
        current = current.parentElement
      }
      return undefined
    }

    // Helper function to find the closest component file
    function findClosestComponentFile(element: HTMLElement): string | undefined {
      let current: HTMLElement | null = element
      while (current) {
        const componentFile = current.getAttribute("data-component-file")
        if (componentFile) {
          return componentFile
        }
        current = current.parentElement
      }
      return undefined
    }

    // Add event listeners
    const root = containerRef.current
    root.addEventListener("click", handleClick)

    // Add listeners for form elements
    const formElements = root.querySelectorAll("input, select, textarea")
    formElements.forEach((el) => el.addEventListener("change", handleChange))

    const forms = root.querySelectorAll("form")
    forms.forEach((form) => form.addEventListener("submit", handleSubmit))

    // Cleanup
    return () => {
      root.removeEventListener("click", handleClick)

      formElements.forEach((el) => el.removeEventListener("change", handleChange))
      forms.forEach((form) => form.removeEventListener("submit", handleSubmit))
    }
  }, [logEvent, getEventPath])

  return <div ref={containerRef}>{children}</div>
}
