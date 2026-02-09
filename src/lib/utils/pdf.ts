
export async function extractTextFromPDF(file: File): Promise<string> {
    try {
        // Dynamically import pdfjs-dist only when needed
        const pdfjsLib = await import('pdfjs-dist');

        // Initialize worker with CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Iterate over all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Extract text items and join them
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n';
        }

        return fullText;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
        throw new Error('Failed to extract text from PDF: Unknown error');
    }
}
