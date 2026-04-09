import type { ReactElement } from "react"
import type { DocumentProps } from "@react-pdf/renderer"
import { pdf } from "@react-pdf/renderer"

async function readableStreamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = []

  for await (const chunk of stream as unknown as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

export async function generatePDFBuffer(
  component: ReactElement<DocumentProps>
): Promise<Buffer> {
  const instance = pdf(component)
  const output = await instance.toBuffer()

  if (Buffer.isBuffer(output)) {
    return Buffer.from(output)
  }

  return readableStreamToBuffer(output)
}
