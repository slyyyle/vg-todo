/**
 * Returns the appropriate NES.css class for a progress bar based on the progress value
 * @param progress - Progress value from 0 to 100
 * @returns The appropriate NES.css class for the progress bar
 */
export function getProgressBarClass(progress: number): string {
  if (progress === 100) return "is-pattern"
  if (progress >= 80) return "is-success"
  if (progress >= 30) return "is-warning"
  return "is-primary"
}
