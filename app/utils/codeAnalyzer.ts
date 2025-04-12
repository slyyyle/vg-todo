/**
 * Utility to analyze the code structure and provide a mapping between UI elements and code
 */
export function analyzeCodeStructure() {
  // Get all elements with data attributes
  const elementsWithData = document.querySelectorAll("[data-component-name], [data-testid]")

  // Create a mapping of elements to their source information
  const elementMap: Record<
    string,
    {
      element: HTMLElement
      componentName?: string
      fileName?: string
      testId?: string
      id?: string
      path: string
    }
  > = {}

  elementsWithData.forEach((el) => {
    const element = el as HTMLElement
    const componentName = element.getAttribute("data-component-name")
    const fileName = element.getAttribute("data-component-file")
    const testId = element.getAttribute("data-testid")
    const id = element.id

    // Create a path to this element
    let path = ""
    let current: HTMLElement | null = element
    while (current && current !== document.body) {
      let identifier = current.tagName.toLowerCase()

      if (current.id) {
        identifier += `#${current.id}`
      } else if (current.getAttribute("data-testid")) {
        identifier += `[data-testid="${current.getAttribute("data-testid")}"]`
      } else if (current.getAttribute("data-component-name")) {
        identifier += `[${current.getAttribute("data-component-name")}]`
      }

      path = identifier + (path ? " > " + path : "")
      current = current.parentElement
    }

    const key =
      testId || (componentName ? `component-${componentName}` : `element-${Math.random().toString(36).substr(2, 9)}`)

    elementMap[key] = {
      element,
      componentName,
      fileName,
      testId,
      id,
      path,
    }
  })

  // Log the mapping
  console.log(
    "%c[CODE ANALYZER] Element to Code Mapping",
    "background: #ef476f; color: white; padding: 2px 4px; border-radius: 2px;",
  )
  console.table(
    Object.entries(elementMap).map(([key, info]) => ({
      key,
      component: info.componentName || "Unknown",
      file: info.fileName || "Unknown",
      testId: info.testId || "None",
      path: info.path,
    })),
  )

  // Return the mapping
  return elementMap
}

// Expose this function to the window object
if (typeof window !== "undefined") {
  ;(window as any).nesDebug = {
    ...((window as any).nesDebug || {}),
    analyzeCodeStructure,
  }
}
