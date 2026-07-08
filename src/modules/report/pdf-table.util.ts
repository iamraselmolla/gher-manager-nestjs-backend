import PDFDocument from 'pdfkit';

export interface PdfTableColumn {
  header: string;
  width: number;
  key: string;
}

/**
 * Renders a titled table as a PDF buffer. Deliberately simple (one table,
 * no page-break-aware row grouping) — this is a farm-operations report, not
 * a typesetting system; pdfkit is pure JS so this works with zero external
 * binaries or headless-browser dependencies.
 */
export function renderPdfTable(
  title: string,
  subtitle: string,
  columns: PdfTableColumn[],
  rows: Record<string, string>[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(title, { align: 'left' });
    doc.fontSize(10).fillColor('#555').text(subtitle);
    doc.moveDown(1);
    doc.fillColor('#000');

    const startX = doc.page.margins.left;
    let y = doc.y;
    const rowHeight = 20;

    const drawRow = (values: string[], isHeader: boolean) => {
      let x = startX;
      doc.fontSize(9).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
      values.forEach((value, i) => {
        doc.text(value, x, y, { width: columns[i].width, ellipsis: true });
        x += columns[i].width;
      });
      y += rowHeight;
      if (y > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    };

    drawRow(columns.map((c) => c.header), true);
    doc
      .moveTo(startX, y - 4)
      .lineTo(startX + columns.reduce((sum, c) => sum + c.width, 0), y - 4)
      .strokeColor('#ccc')
      .stroke();

    for (const row of rows) {
      drawRow(columns.map((c) => row[c.key] ?? ''), false);
    }

    if (rows.length === 0) {
      doc.fontSize(9).fillColor('#888').text('No data for this period.', startX, y);
    }

    doc.end();
  });
}
