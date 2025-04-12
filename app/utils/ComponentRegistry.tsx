"use client"

import type React from "react"

import { createContext, useContext, useEffect, useRef } from "react"
import type { ReactNode } from "react"

// Define the structure for component metadata
export interface ComponentInfo {
  id: string
  name: string
  fileName?: string
  displayName?: string
  parentId?: string
  children: string[]
  props?: Record<string, any>
  depth: number
  path: string[]
}

interface ComponentRegistryContextType {
  registerComponent: (info: Omit<ComponentInfo, "children" | "depth" | "path">) => string
  unregisterComponent: (id: string) => void
  getComponent: (id: string) => ComponentInfo | undefined
  getComponentByName: (name: string) => ComponentInfo | undefined
  getComponentTree: () => Record<string, ComponentInfo>
  getComponentPath: (id: string) => string[]
}

const ComponentRegistryContext = createContext<ComponentRegistryContextType | undefined>(undefined)

export function ComponentRegistryProvider({ children }: { children: ReactNode }) {
  // Use a ref to store the component registry to avoid re-renders
  const componentsRef = useRef<Record<string, ComponentInfo>>({})

  const registerComponent = (info: Omit<ComponentInfo, "children" | "depth" | "path">) => {
    const id = info.id
    const parentInfo = info.parentId ? componentsRef.current[info.parentId] : undefined
    const depth = parentInfo ? parentInfo.depth + 1 : 0
    const parentPath = parentInfo ? parentInfo.path : []

    // Create the component info
    const componentInfo: ComponentInfo = {
      ...info,
      children: [],
      depth,
      path: [...parentPath, info.name],
    }

    // Add to registry
    componentsRef.current[id] = componentInfo

    // Update parent's children list
    if (info.parentId && componentsRef.current[info.parentId]) {
      componentsRef.current[info.parentId].children.push(id)
    }

    return id
  }

  const unregisterComponent = (id: string) => {
    const component = componentsRef.current[id]
    if (!component) return

    // Remove from parent's children list
    if (component.parentId && componentsRef.current[component.parentId]) {
      const parent = componentsRef.current[component.parentId]
      parent.children = parent.children.filter((childId) => childId !== id)
    }

    // Remove the component
    delete componentsRef.current[id]
  }

  const getComponent = (id: string) => {
    return componentsRef.current[id]
  }

  const getComponentByName = (name: string) => {
    return Object.values(componentsRef.current).find((component) => component.name === name)
  }

  const getComponentTree = () => {
    return { ...componentsRef.current }
  }

  const getComponentPath = (id: string) => {
    const component = componentsRef.current[id]
    if (!component) return []
    return component.path
  }

  return (
    <ComponentRegistryContext.Provider
      value={{
        registerComponent,
        unregisterComponent,
        getComponent,
        getComponentByName,
        getComponentTree,
        getComponentPath,
      }}
    >
      {children}
    </ComponentRegistryContext.Provider>
  )
}

export function useComponentRegistry() {
  const context = useContext(ComponentRegistryContext)
  if (!context) {
    throw new Error("useComponentRegistry must be used within a ComponentRegistryProvider")
  }
  return context
}

// HOC to register a component
export function withComponentInfo<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    name?: string
    fileName?: string
  } = {},
) {
  const displayName = options.name || Component.displayName || Component.name || "UnknownComponent"
  const fileName = options.fileName || "unknown-file"

  const WrappedComponent = (props: P) => {
    const { registerComponent, unregisterComponent } = useComponentRegistry()
    const idRef = useRef<string | null>(null)

    useEffect(() => {
      // Generate a unique ID for this component instance
      const id = `${displayName}_${Math.random().toString(36).substr(2, 9)}`

      // Register the component
      idRef.current = registerComponent({
        id,
        name: displayName,
        fileName,
        displayName,
        props: { ...props },
      })

      return () => {
        if (idRef.current) {
          unregisterComponent(idRef.current)
        }
      }
    }, [])

    return <Component {...props} />
  }

  WrappedComponent.displayName = `WithComponentInfo(${displayName})`
  return WrappedComponent
}

// Custom hook to register a component
export function useRegisterComponent(name: string, fileName?: string, parentId?: string, props?: Record<string, any>) {
  const { registerComponent, unregisterComponent } = useComponentRegistry()
  const idRef = useRef<string | null>(null)

  useEffect(() => {
    // Generate a unique ID for this component instance
    const id = `${name}_${Math.random().toString(36).substr(2, 9)}`

    // Register the component
    idRef.current = registerComponent({
      id,
      name,
      fileName,
      parentId,
      props,
    })

    return () => {
      if (idRef.current) {
        unregisterComponent(idRef.current)
      }
    }
  }, [name, fileName, parentId, registerComponent, unregisterComponent])

  return idRef.current
}
