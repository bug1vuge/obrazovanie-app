/**
 * Renders a DOM node to an A4 landscape PDF and triggers a download.
 * Heavy libraries are loaded on demand to keep the main bundle small.
 */
export async function downloadElementAsPdf(element: HTMLElement, fileName: string): Promise<void> {
  const [{ toPng }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
  const image = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
  });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = element.offsetHeight / element.offsetWidth || 1 / 1.414;
  let width = pageWidth;
  let height = width * ratio;
  if (height > pageHeight) {
    height = pageHeight;
    width = height / ratio;
  }
  pdf.addImage(image, 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
  pdf.save(fileName);
}
