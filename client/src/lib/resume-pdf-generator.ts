import html2pdf from 'html2pdf.js';
import Handlebars from 'handlebars';
import { ResumeContent } from '@shared/schema';

/**
 * Generate PDF from resume content and template
 * @param resumeContent The resume content object
 * @param template The template object with HTML template
 * @param resumeName The name of the resume (used for the filename)
 */
export async function generatePDF(
  resumeContent: ResumeContent,
  template: { htmlTemplate: string; name: string },
  resumeName: string
): Promise<void> {
  try {
    // Register Handlebars helpers
    Handlebars.registerHelper('if', function(conditional, options) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Register the 'each' helper explicitly
    Handlebars.registerHelper('each', function(context, options) {
      let ret = "";
      
      if (context && context.length > 0) {
        for (let i = 0; i < context.length; i++) {
          ret = ret + options.fn(context[i]);
        }
      } else {
        ret = options.inverse(this);
      }
      
      return ret;
    });

    // Compile the template
    const compiledTemplate = Handlebars.compile(template.htmlTemplate);
    
    // Generate HTML with the resume data
    const html = compiledTemplate(resumeContent);

    // Create a complete HTML document with necessary styles
    const completeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${resumeName || 'Resume'}</title>
      <style>
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background-color: #ffffff;
          color: #000000;
        }
        /* Tailwind-like utilities */
        .font-sans { font-family: Arial, sans-serif; }
        .font-serif { font-family: Georgia, serif; }
        .max-w-\\[800px\\] { max-width: 800px; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .p-10 { padding: 2.5rem; }
        .p-8 { padding: 2rem; }
        .bg-white { background-color: #ffffff; }
        .text-gray-800 { color: #1f2937; }
        .text-gray-900 { color: #111827; }
        .text-gray-700 { color: #374151; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-500 { color: #6b7280; }
        .text-white { color: #ffffff; }
        .text-blue-600 { color: #2563eb; }
        .text-blue-700 { color: #1d4ed8; }
        .text-blue-100 { color: #dbeafe; }
        .bg-blue-600 { background-color: #2563eb; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .text-center { text-align: center; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-5 { margin-bottom: 1.25rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mr-2 { margin-right: 0.5rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-4 { margin-top: 1rem; }
        .pb-1 { padding-bottom: 0.25rem; }
        .pb-2 { padding-bottom: 0.5rem; }
        .pt-6 { padding-top: 1.5rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .italic { font-style: italic; }
        .text-3xl { font-size: 1.875rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-xl { font-size: 1.25rem; }
        .text-lg { font-size: 1.125rem; }
        .text-base { font-size: 1rem; }
        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .tracking-wide { letter-spacing: 0.025em; }
        .tracking-wider { letter-spacing: 0.05em; }
        .leading-relaxed { line-height: 1.625; }
        .rounded-full { border-radius: 9999px; }
        .rounded-md { border-radius: 0.375rem; }
        .border { border-width: 1px; }
        .border-b { border-bottom-width: 1px; }
        .border-gray-300 { border-color: #d1d5db; }
        .border-blue-400 { border-color: #60a5fa; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-row { flex-direction: row; }
        .flex-wrap { flex-wrap: wrap; }
        .items-start { align-items: flex-start; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .gap-x-3 { column-gap: 0.75rem; }
        .gap-x-4 { column-gap: 1rem; }
        .gap-y-2 { row-gap: 0.5rem; }
        .gap-2 { gap: 0.5rem; }
        .w-2 { width: 0.5rem; }
        .h-2 { height: 0.5rem; }
        .inline-block { display: inline-block; }
        .rounded-full { border-radius: 9999px; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .space-y-1 > * + * { margin-top: 0.25rem; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .uppercase { text-transform: uppercase; }

        /* Media query for small screens */
        @media (max-width: 768px) {
          .md\\:flex-row { flex-direction: row; }
          .md\\:w-1\\/3 { width: 33.333333%; }
          .md\\:w-2\\/3 { width: 66.666667%; }
        }

        /* Print-specific styles */
        @media print {
          body { margin: 0; padding: 0; }
          a { text-decoration: none; }
          .page-break { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
    `;

    // Create a temporary iframe to render the HTML properly
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '794px'; // A4 width in pixels at 96 DPI
    iframe.style.height = '1123px'; // A4 height
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    // Write the complete HTML to the iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(completeHtml);
      iframeDoc.close();
    }

    console.log('Generating PDF with template:', template.name);
    
    // Set up html2pdf options with improved settings
    const options = {
      margin: 10,
      filename: `${resumeName || 'Resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
        letterRendering: true,
        allowTaint: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      }
    };

    // Generate PDF
    try {
      // Make sure we use the document element from the iframe
      const element = iframeDoc?.documentElement || iframe;
      
      console.log('Using element for PDF generation:', element.tagName);
      
      const pdf = await html2pdf()
        .from(element)
        .set(options)
        .save();
      
      document.body.removeChild(iframe);
      return pdf;
    } catch (error) {
      console.error('PDF generation error details:', error);
      document.body.removeChild(iframe);
      throw error;
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

/**
 * Generate a preview image of the resume
 * This can be used to show a thumbnail of the resume
 * @param resumeContent The resume content object
 * @param template The template object with HTML template
 */
export async function generatePreviewImage(
  resumeContent: ResumeContent,
  template: { htmlTemplate: string }
): Promise<string> {
  try {
    // Register Handlebars helpers
    Handlebars.registerHelper('if', function(conditional, options) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Register the 'each' helper explicitly
    Handlebars.registerHelper('each', function(context, options) {
      let ret = "";
      
      if (context && context.length > 0) {
        for (let i = 0; i < context.length; i++) {
          ret = ret + options.fn(context[i]);
        }
      } else {
        ret = options.inverse(this);
      }
      
      return ret;
    });

    // Compile the template
    const compiledTemplate = Handlebars.compile(template.htmlTemplate);
    
    // Generate HTML with the resume data
    const html = compiledTemplate(resumeContent);

    // Create a complete HTML document with necessary styles
    const completeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Resume Preview</title>
      <style>
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background-color: #ffffff;
          color: #000000;
        }
        /* Tailwind-like utilities */
        .font-sans { font-family: Arial, sans-serif; }
        .font-serif { font-family: Georgia, serif; }
        .max-w-\\[800px\\] { max-width: 800px; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .p-10 { padding: 2.5rem; }
        .p-8 { padding: 2rem; }
        .bg-white { background-color: #ffffff; }
        .text-gray-800 { color: #1f2937; }
        .text-gray-900 { color: #111827; }
        .text-gray-700 { color: #374151; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-500 { color: #6b7280; }
        .text-white { color: #ffffff; }
        .text-blue-600 { color: #2563eb; }
        .text-blue-700 { color: #1d4ed8; }
        .text-blue-100 { color: #dbeafe; }
        .bg-blue-600 { background-color: #2563eb; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .text-center { text-align: center; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-5 { margin-bottom: 1.25rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mr-2 { margin-right: 0.5rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-4 { margin-top: 1rem; }
        .pb-1 { padding-bottom: 0.25rem; }
        .pb-2 { padding-bottom: 0.5rem; }
        .pt-6 { padding-top: 1.5rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .italic { font-style: italic; }
        .text-3xl { font-size: 1.875rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-xl { font-size: 1.25rem; }
        .text-lg { font-size: 1.125rem; }
        .text-base { font-size: 1rem; }
        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .tracking-wide { letter-spacing: 0.025em; }
        .tracking-wider { letter-spacing: 0.05em; }
        .leading-relaxed { line-height: 1.625; }
        .rounded-full { border-radius: 9999px; }
        .rounded-md { border-radius: 0.375rem; }
        .border { border-width: 1px; }
        .border-b { border-bottom-width: 1px; }
        .border-gray-300 { border-color: #d1d5db; }
        .border-blue-400 { border-color: #60a5fa; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-row { flex-direction: row; }
        .flex-wrap { flex-wrap: wrap; }
        .items-start { align-items: flex-start; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .gap-x-3 { column-gap: 0.75rem; }
        .gap-x-4 { column-gap: 1rem; }
        .gap-y-2 { row-gap: 0.5rem; }
        .gap-2 { gap: 0.5rem; }
        .w-2 { width: 0.5rem; }
        .h-2 { height: 0.5rem; }
        .inline-block { display: inline-block; }
        .rounded-full { border-radius: 9999px; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .space-y-1 > * + * { margin-top: 0.25rem; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .uppercase { text-transform: uppercase; }

        /* Media query for small screens */
        @media (max-width: 768px) {
          .md\\:flex-row { flex-direction: row; }
          .md\\:w-1\\/3 { width: 33.333333%; }
          .md\\:w-2\\/3 { width: 66.666667%; }
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
    `;

    // Create a temporary iframe to render the HTML properly
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '794px'; // A4 width in pixels at 96 DPI
    iframe.style.height = '1123px'; // A4 height
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    // Write the complete HTML to the iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(completeHtml);
      iframeDoc.close();
    }

    // Use html2canvas to create an image
    try {
      // Make sure we use the document element from the iframe
      const element = iframeDoc?.documentElement || iframe;
      
      const canvas = await html2pdf.html2canvas(element, { 
        scale: 1,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        letterRendering: true,
        allowTaint: true,
        width: 800,
        height: 1132 // A4 ratio
      });
      document.body.removeChild(iframe);
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      console.error('Preview generation error details:', error);
      document.body.removeChild(iframe);
      throw error;
    }
  } catch (error) {
    console.error('Error generating preview image:', error);
    throw new Error('Failed to generate preview image.');
  }
}
