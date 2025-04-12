"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { useRegisterComponent } from "@/app/utils/ComponentRegistry"

// This HOC adds source information to components
export function withSourceInfo<P extends object>(Component: React.ComponentType<P>, fileName: string) {
  const displayName = Component.displayName || Component.name || "UnknownComponent"

  const WrappedComponent = (props: P) => {
    // Register this component instance
    const componentId = useRegisterComponent(displayName, fileName, undefined, props)

    // Create a ref to hold the DOM element
    const ref = useRef<HTMLDivElement>(null)

    // Add component name to the DOM element for easier identification
    useEffect(() => {
      if (ref.current) {
        ref.current.setAttribute("data-component-name", displayName)
        ref.current.setAttribute("data-component-file", fileName)
        if (componentId) {
          ref.current.setAttribute("data-component-id", componentId)
        }
      }
    }, [componentId])

    return (
      <div ref={ref} className="source-info-wrapper">
        <Component {...props} />
      </div>
    )
  }

  WrappedComponent.displayName = `WithSourceInfo(${displayName})`
  return WrappedComponent
}

// This hook can be used inside functional components
export function useSourceInfo(componentName: string, fileName: string) {
  const componentId = useRegisterComponent(componentName, fileName)

  // Create a ref to be attached to the component's root element
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute("data-component-name", componentName)
      ref.current.setAttribute("data-component-file", fileName)
      if (componentId) {
        ref.current.setAttribute("data-component-id", componentId)
      }
    }
  }, [componentId, componentName, fileName])

  return { ref, componentId }
}
