import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function downloadHtmlReport(id: string) {
  const linkTags = document.querySelectorAll('link');
  let cssString = '';
  await Promise.all(
    Array.from(linkTags)
      .filter((link) => link.getAttribute('rel') === 'stylesheet')
      .map((link) =>
        fetch(link.getAttribute('href') as string).then((response) =>
          response.text()
        )
      )
  ).then((texts) => (cssString += texts.join('')));

  const bodyContent = document.querySelector('#report-content');
  if (!bodyContent) return;
  const clonedBodyContent = bodyContent.cloneNode(true) as HTMLElement;
  const elementsToRemove = clonedBodyContent.querySelectorAll(
    '[data-download="hide"]'
  );
  elementsToRemove.forEach((element) => {
    element.remove();
  });
  const bodyClass = document.querySelector('body')?.getAttribute('class');
  const completeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
      <style>${cssString}</style>
      </head>
      <body class="${bodyClass}" style="overflow-x:hidden;">
        ${clonedBodyContent.innerHTML}
        <script>
          document.querySelectorAll('[data-download="collapsible-trigger"]').forEach((element) => {
            element.addEventListener('click', () => element.nextElementSibling.classList.toggle('main-visible'))
          });
        </script>
      </body>
      </html>
    `;

  const blob = new Blob([completeHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `benchmark-report-${id}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadPdfReport(id: string) {
  try {
    // Get the original content
    const originalContent = document.querySelector('#report-content');
    if (!originalContent) {
      throw new Error('Report content not found');
    }

    // Create a temporary container that's visible but off-screen
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '1024px';
    container.style.backgroundColor = 'white';
    container.style.zIndex = '-9999';

    // Clone the content
    const clonedContent = originalContent.cloneNode(true) as HTMLElement;
    
    // Remove unwanted elements
    const elementsToRemove = clonedContent.querySelectorAll(
      '[data-download="hide"]'
    );
    elementsToRemove.forEach(element => element.remove());

    // Get all stylesheet links
    const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
    const styles = await Promise.all(
      Array.from(linkTags).map(async (link) => {
        try {
          const response = await fetch(link.getAttribute('href') || '');
          const css = await response.text();
          return css;
        } catch (error) {
          console.warn('Failed to fetch stylesheet:', error);
          return '';
        }
      })
    );

    // Create style element
    const styleElement = document.createElement('style');
    styleElement.textContent = styles.join('\n');
    container.appendChild(styleElement);

    // Add the cloned content
    container.appendChild(clonedContent);
    document.body.appendChild(container);

    // Function to ensure everything is loaded
    const waitForImages = () => {
      const images = container.getElementsByTagName('img');
      const promises = Array.from(images).map(img => {
        if (img.complete) {
          return Promise.resolve();
        } else {
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }
      });
      return Promise.all(promises);
    };

    // Wait for everything to be ready
    await Promise.all([
      document.fonts.ready,
      waitForImages(),
      new Promise(resolve => setTimeout(resolve, 1000)) // Extra delay for rendering
    ]);

    console.log('Starting PDF generation...');

    // Generate PDF with better error handling
    try {
      // First, create the canvas
      const canvas = await html2canvas(container, {
        // scale: 2,
        useCORS: true,
        logging: true, // Enable logging for debugging
        width: 1024,
        // windowWidth: 1024,
        // onclone: (clonedDoc) => {
        //   console.log('Content cloned for PDF generation');
        // }
      });

      console.log('Canvas generated:', canvas.width, 'x', canvas.height);

      // Create PDF with A4 size
      const pdf = new jsPDF({
        unit: 'px',
        format: 'a4',
        orientation: 'portrait'
      });

      // PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const imgWidth = pdfWidth - 40; // 20px margins on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add content to PDF
      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;

      while (heightLeft >= 0) {
        pdf.addImage(
          imgData,
          'JPEG',
          20, // left margin
          pageNumber === 1 ? 20 : -(position - 20), // top margin or continued position
          imgWidth,
          imgHeight
        );

        heightLeft -= (pdfHeight - 40); // Page height minus margins
        position += (pdfHeight - 40);

        if (heightLeft >= 0) {
          pdf.addPage();
          pageNumber++;
        }
      }

      // Save the PDF
      pdf.save(`benchmark-report-${id}.pdf`);
      console.log('PDF generated successfully');

    } catch (error) {
      console.error('Error during PDF generation:', error);
      throw error;
    } finally {
      // Clean up
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }

  } catch (error) {
    console.error('Error in downloadPdfReport:', error);
    alert('Failed to generate PDF. Please check the console for details.');
  }
}

// Helper function to check if an element is visible
function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

// Main function to trigger PDF generation
export async function generateAndDownloadPdf(id: string) {
  try {
    console.log('Starting PDF generation process...');
    
    // Verify content exists and is visible
    const content = document.querySelector('#report-content');
    if (!content) {
      throw new Error('Content element not found');
    }
    
    if (!isElementVisible(content as HTMLElement)) {
      console.warn('Warning: Content might not be visible');
    }

    await downloadPdfReport(id);
    console.log('PDF generation completed');
  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Failed to generate PDF. Please check the console for details.');
  }
}