/**
 * Utility function to log the component tree structure
 * This can be called from the browser console to get a snapshot of the current component structure
 */
export function logComponentTree() {
  console.log("%c[COMPONENT TREE]", "background: #06d6a0; color: white; padding: 2px 4px; border-radius: 2px;")

  // Get all elements with data-testid
  const elementsWithTestId = document.querySelectorAll("[data-testid]")
  const testIdMap: Record<string, HTMLElement> = {}

  elementsWithTestId.forEach((el) => {
    const testId = el.getAttribute("data-testid")
    if (testId) {
      testIdMap[testId] = el as HTMLElement
    }
  })

  // Log the map of testIds
  console.log("Available components by test ID:", testIdMap)

  // Create a tree representation
  const body = document.body
  const treeData = createElementTree(body)

  // Log the tree
  console.log("Component tree:", treeData)

  return {
    testIdMap,
    treeData,
  }
}

/**
 * Helper function to create a tree representation of the DOM
 */
function createElementTree(element: HTMLElement, depth = 0, maxDepth = 10): any {
  if (depth > maxDepth) return { type: "max-depth-reached" }

  const children: any[] = []
  const testId = element.getAttribute("data-testid")
  const id = element.id
  const className = element.className

  // Process children
  Array.from(element.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      children.push(createElementTree(child, depth + 1, maxDepth))
    }
  })

  return {
    type: element.tagName.toLowerCase(),
    testId,
    id: id || undefined,
    className: className || undefined,
    children: children.length > 0 ? children : undefined,
  }
}

/**
 * Creates a reference map that maps UI elements to their source code locations
 */
export function createSourceCodeMap() {
  // Get all components with source info
  const componentsWithSourceInfo = document.querySelectorAll("[data-component-name][data-component-file]")

  // Create a map of component references
  const componentRefs: Record<
    string,
    {
      componentName: string
      fileName: string
      testIds: string[]
      sourceReference: string
    }
  > = {}

  componentsWithSourceInfo.forEach((el) => {
    const componentName = el.getAttribute("data-component-name") || "Unknown"
    const fileName = el.getAttribute("data-component-file") || "Unknown"

    // Find all testIds within this component
    const testIdElements = el.querySelectorAll("[data-testid]")
    const testIds: string[] = []

    testIdElements.forEach((testIdEl) => {
      const testId = testIdEl.getAttribute("data-testid")
      if (testId) testIds.push(testId)
    })

    // Create a unique reference string
    const sourceReference = `${componentName}@${fileName}`

    componentRefs[sourceReference] = {
      componentName,
      fileName,
      testIds,
      sourceReference,
    }
  })

  console.log("%c[SOURCE CODE MAP]", "background: #ef476f; color: white; padding: 2px 4px; border-radius: 2px;")
  console.table(Object.values(componentRefs))

  return componentRefs
}

/**
 * Utility to expose the component tree to the window object for easy access
 */
export function exposeDebugUtils() {
  if (typeof window !== "undefined") {
    ;(window as any).nesDebug = {
      logComponentTree,
      createSourceCodeMap,
      logEvent: (type: string, element: string, details?: any) => {
        console.log(
          `%c[MANUAL EVENT] ${type} | ${element}`,
          "background: #ef476f; color: white; padding: 2px 4px; border-radius: 2px;",
          details || "",
        )
      },
    }

    console.log(
      "%c[NES TODO DEBUG] Debug utilities available at window.nesDebug",
      "background: #06d6a0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;",
    )
  }
}

/**
 * Creates a simple reference string for a component that can be used in conversations
 */
export function getComponentReference(componentName: string, fileName: string): string {
  return `${componentName}@${fileName}`
}
