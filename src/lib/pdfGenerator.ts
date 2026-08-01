import PDFDocument from 'pdfkit';

interface PDFReportData {
  monthYear: string;
  totalSpent: number;
  salary: number;
  savings: number;
  categoryTotals: Record<string, number>;
  aiAnalysis: string;
}

export function generatePDFReport(data: PDFReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Header ---
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('ExpenseTracker - Surgical Monthly Report', { align: 'center' });
      
      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('gray')
        .text(`Month: ${data.monthYear}`, { align: 'center' })
        .moveDown(2);

      // --- Summary Section ---
      doc.fillColor('black').fontSize(18).font('Helvetica-Bold').text('Overview', { underline: true }).moveDown(0.5);
      
      doc.fontSize(12).font('Helvetica');
      doc.text(`Total Salary/Income: Rs. ${data.salary.toFixed(2)}`);
      doc.text(`Total Expenses: Rs. ${data.totalSpent.toFixed(2)}`);
      doc.text(`Total Savings/Remaining: Rs. ${data.savings.toFixed(2)}`);
      doc.moveDown(2);

      // --- Category Breakdown ---
      doc.fontSize(18).font('Helvetica-Bold').text('Category Breakdown', { underline: true }).moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      
      Object.entries(data.categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, amount]) => {
          doc.text(`- ${cat}: Rs. ${amount.toFixed(2)}`);
        });
      doc.moveDown(2);

      // --- AI Surgical Analysis (Hinglish) ---
      doc.fontSize(18).font('Helvetica-Bold').text('AI Surgical Analysis', { underline: true }).moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      
      // PDFKit doesn't natively render emojis or complex markdown well without extra plugins.
      // So we will just print the text, handling basic formatting.
      const cleanAnalysis = data.aiAnalysis.replace(/\*\*/g, ''); // Remove markdown bold asterisks
      doc.text(cleanAnalysis, {
        align: 'justify',
        lineGap: 4
      });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
