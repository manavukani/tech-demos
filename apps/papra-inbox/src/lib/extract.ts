import type { DocKind } from './types'

export interface ExtractResult {
  text: string
  status: 'ok' | 'unavailable'
  note: string
  pageCount?: number
}

export type ProgressFn = (progress: number, stage: string) => void

/** Pages of a scanned PDF we're willing to OCR before giving up (OCR is slow). */
const MAX_OCR_PAGES = 3
/** Below this many characters we treat a PDF text layer as effectively empty. */
const MIN_TEXT_LAYER_CHARS = 20

export async function extractText(
  blob: Blob,
  kind: DocKind,
  onProgress: ProgressFn,
): Promise<ExtractResult> {
  switch (kind) {
    case 'text':
      return extractPlainText(blob)
    case 'pdf':
      return extractPdf(blob, onProgress)
    case 'image':
      return extractImage(blob, onProgress)
    default:
      return {
        text: '',
        status: 'unavailable',
        note: 'Unsupported file type. Text extraction only covers PDFs, images and text files.',
      }
  }
}

async function extractPlainText(blob: Blob): Promise<ExtractResult> {
  const text = normalize(await blob.text())
  return text
    ? { text, status: 'ok', note: 'Read as plain text.' }
    : { text: '', status: 'unavailable', note: 'The file is empty.' }
}

async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const { default: workerSrc } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
  }
  return pdfjs
}

async function extractPdf(blob: Blob, onProgress: ProgressFn): Promise<ExtractResult> {
  const pdfjs = await loadPdfjs()
  const data = new Uint8Array(await blob.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const pageCount = pdf.numPages

  const pages: string[] = []
  for (let i = 1; i <= pageCount; i++) {
    onProgress((i - 1) / pageCount, `Reading text layer, page ${i}/${pageCount}`)
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    let line = ''
    const lines: string[] = []
    for (const item of content.items) {
      if (!('str' in item)) continue
      line += item.str
      if (item.hasEOL) {
        lines.push(line)
        line = ''
      } else if (item.str && !item.str.endsWith(' ')) {
        line += ' '
      }
    }
    if (line) lines.push(line)
    pages.push(lines.join('\n'))
  }

  const layerText = normalize(pages.join('\n\n'))
  if (layerText.length >= MIN_TEXT_LAYER_CHARS) {
    return {
      text: layerText,
      status: 'ok',
      note: `Text layer extracted from ${pageCount} page${pageCount === 1 ? '' : 's'}.`,
      pageCount,
    }
  }

  // No usable text layer: this is probably a scan. Rasterise the first few
  // pages and run them through OCR.
  const ocrPages = Math.min(pageCount, MAX_OCR_PAGES)
  const ocrText: string[] = []
  for (let i = 1; i <= ocrPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const canvasContext = canvas.getContext('2d')
    if (!canvasContext) throw new Error('Canvas 2D context unavailable')
    await page.render({ canvas, canvasContext, viewport }).promise
    const pageText = await ocr(canvas, (p) =>
      onProgress((i - 1 + p) / ocrPages, `No text layer — OCR page ${i}/${ocrPages}`),
    )
    ocrText.push(pageText)
  }

  const text = normalize(ocrText.join('\n\n'))
  const scope = pageCount > ocrPages ? ` (first ${ocrPages} of ${pageCount} pages)` : ''
  return text
    ? { text, status: 'ok', note: `No text layer; OCR'd${scope}.`, pageCount }
    : {
        text: '',
        status: 'unavailable',
        note: `No text layer and OCR found no readable text${scope}.`,
        pageCount,
      }
}

async function extractImage(blob: Blob, onProgress: ProgressFn): Promise<ExtractResult> {
  const text = normalize(await ocr(blob, (p) => onProgress(p, 'Running OCR')))
  return text
    ? { text, status: 'ok', note: 'OCR (Tesseract, English).' }
    : { text: '', status: 'unavailable', note: 'OCR found no readable text in this image.' }
}

// One Tesseract worker for the whole session: model download + WASM init is
// the expensive part, recognition itself is comparatively cheap.
let workerPromise: Promise<import('tesseract.js').Worker> | undefined
let activeProgress: ((p: number) => void) | undefined

function getOcrWorker() {
  workerPromise ??= import('tesseract.js').then(({ createWorker }) =>
    createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') activeProgress?.(m.progress)
      },
    }),
  ).catch((err) => {
    workerPromise = undefined
    throw err
  })
  return workerPromise
}

async function ocr(image: Blob | HTMLCanvasElement, onProgress: (p: number) => void) {
  const worker = await getOcrWorker()
  activeProgress = onProgress
  try {
    const { data } = await worker.recognize(image)
    return data.text
  } finally {
    activeProgress = undefined
  }
}

function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
