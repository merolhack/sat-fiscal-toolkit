import JSZip from 'jszip';
import { parseCFDIXML } from './cfdiParser';
import { CFDIInvoice } from './types';

/**
 * Extracts and parses all CFDI XML files found inside a ZIP file or array of files
 */
export async function extractCFDIsFromZip(zipFile: File): Promise<CFDIInvoice[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);
  const invoices: CFDIInvoice[] = [];

  const xmlEntries: { name: string; file: JSZip.JSZipObject }[] = [];
  loadedZip.forEach((relativePath, file) => {
    if (!file.dir && relativePath.toLowerCase().endsWith('.xml')) {
      xmlEntries.push({ name: relativePath, file });
    }
  });

  for (const entry of xmlEntries) {
    try {
      const xmlText = await entry.file.async('text');
      const invoice = parseCFDIXML(xmlText, entry.name.split('/').pop() || entry.name);
      if (invoice) {
        invoices.push(invoice);
      }
    } catch (e) {
      console.warn(`Could not parse XML from zip entry ${entry.name}:`, e);
    }
  }

  return invoices;
}

/**
 * Parses multiple individual XML files uploaded by user
 */
export async function parseMultipleXMLFiles(files: File[]): Promise<CFDIInvoice[]> {
  const invoices: CFDIInvoice[] = [];
  for (const file of files) {
    if (file.name.toLowerCase().endsWith('.xml')) {
      try {
        const text = await file.text();
        const invoice = parseCFDIXML(text, file.name);
        if (invoice) {
          invoices.push(invoice);
        }
      } catch (e) {
        console.warn(`Could not read XML file ${file.name}:`, e);
      }
    }
  }
  return invoices;
}

