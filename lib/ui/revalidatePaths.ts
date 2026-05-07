export async function revalidatePaths(paths: string[]) {
  if (!Array.isArray(paths) || paths.length === 0) return

  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-key": process.env.NEXT_PUBLIC_REVALIDATE_KEY || "",
      },
      body: JSON.stringify({ paths }),
    })
  } catch (err) {
    console.error("revalidatePaths failed", err)
  }
}
