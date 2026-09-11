// Sample documents that exercise each extraction path without needing files
// on disk: a hand-assembled PDF (text layer), a canvas-rendered receipt image
// (OCR) and a markdown note (plain text).

export interface SampleFile {
  file: File
  tags: string[]
}

export async function buildSampleFiles(): Promise<SampleFile[]> {
  return [
    {
      file: new File(
        [
          buildPdf([
            'RESIDENTIAL LEASE AGREEMENT',
            '',
            'Premises: 14 Maple Street, Apt 3B, Portland',
            'Landlord: Harbor View Properties LLC',
            'Tenant: Jordan Alvarez',
            '',
            'Term: 12 months starting 1 October 2026.',
            'Monthly rent: $1,850 due on the first of each month.',
            'Security deposit: $1,850 held in escrow.',
            'Utilities: tenant pays electricity and internet;',
            'landlord pays water, sewer and trash.',
            'Pets: one cat permitted with a $300 refundable deposit.',
            '',
            'Signed 12 September 2026.',
          ]),
        ],
        'Lease agreement - 14 Maple Street.pdf',
        { type: 'application/pdf' },
      ),
      tags: ['housing', 'contract'],
    },
    {
      file: new File(
        [
          buildPdf([
            'NORTHWEST POWER & LIGHT',
            'Account 4471-2290-18',
            'Statement date: 3 September 2026',
            '',
            'Service address: 14 Maple Street, Apt 3B',
            'Billing period: 1 Aug 2026 - 31 Aug 2026',
            'Electricity used: 412 kWh',
            '',
            'Energy charge          $58.92',
            'Delivery charge        $21.40',
            'Taxes and fees          $6.13',
            'Amount due             $86.45',
            '',
            'Due date: 24 September 2026. Pay online or by mail.',
          ]),
        ],
        'Electricity bill - August 2026.pdf',
        { type: 'application/pdf' },
      ),
      tags: ['utilities', 'bill'],
    },
    {
      file: new File([await buildReceiptImage()], 'Receipt - Acme Hardware.png', {
        type: 'image/png',
      }),
      tags: ['receipt'],
    },
    {
      file: new File(
        [
          [
            '# Dentist appointment',
            '',
            'Dr. Priya Natarajan, Riverside Dental',
            'Tuesday 29 September 2026, 9:30am',
            '',
            '- Bring insurance card (policy DEN-88213)',
            '- Ask about the night guard quote',
            '- Follow-up cleaning due March 2027',
          ].join('\n'),
        ],
        'Dentist appointment.md',
        { type: 'text/markdown' },
      ),
      tags: ['health'],
    },
  ]
}

function buildReceiptImage(): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 1100
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#111111'
  ctx.textBaseline = 'top'

  const lines: [string, number, boolean?][] = [
    ['ACME HARDWARE', 56, true],
    ['221 Industrial Way, Portland', 30],
    ['Receipt #48213', 30],
    ['Date: 09/08/2026  14:22', 30],
    ['', 20],
    ['Cordless drill 18V        89.00', 34],
    ['Wood screws 200 pack       6.40', 34],
    ['Sanding sponge x3          7.50', 34],
    ['', 20],
    ['Subtotal                 102.90', 34],
    ['Tax                        0.00', 34],
    ['TOTAL                    102.90', 44, true],
    ['', 20],
    ['Paid by card ending 4417', 30],
    ['Thank you for shopping local', 30],
  ]
  let y = 70
  for (const [text, size, bold] of lines) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px "Courier New", monospace`
    ctx.fillText(text, 70, y)
    y += size + 22
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}

/** Single-page Helvetica PDF with a real text layer, no library needed. */
function buildPdf(lines: string[]): Uint8Array<ArrayBuffer> {
  const escaped = lines.map((l) => l.replace(/[\\()]/g, (c) => `\\${c}`))
  const content = [
    'BT',
    '/F1 12 Tf',
    '16 TL',
    '72 720 Td',
    ...escaped.map((l, i) => (i === 0 ? `(${l}) Tj` : `T* (${l}) Tj`)),
    'ET',
  ].join('\n')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let body = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((obj, i) => {
    offsets.push(body.length)
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xref = body.length
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) body += `${off.toString().padStart(10, '0')} 00000 n \n`
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  const bytes = new TextEncoder().encode(body)
  return new Uint8Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength)
}
