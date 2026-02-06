/**
 * @fileoverview Web Worker for off-main-thread book parsing
 * Note: Requires browser support for Module Workers and DOMParser in Workers (e.g. Firefox)
 * Chrome does not support DOMParser in Workers yet.
 */

import { FB2Parser } from '../parsers/fb2-parser.js';
import { EPUBParser } from '../parsers/epub-parser.js';

self.onmessage = async ({ data }) => {
  const { file, format } = data;
  
  try {
    let result;
    
    // Check environment capabilities
    if (typeof DOMParser === 'undefined') {
      throw new Error('DOMParser is not available in this worker environment. Parsing must be done on main thread.');
    }

    switch (format) {
      case 'fb2':
        const fb2Parser = new FB2Parser();
        result = await fb2Parser.parse(file);
        break;
        
      case 'epub':
        const epubParser = new EPUBParser();
        // JSZip needs to be available or imported. 
        // EPUBParser handles dynamic loading from window.JSZip or CDN.
        // In a worker, we might need to importScripts or import it.
        // EPUBParser.loadJSZip uses document.createElement which fails in Worker.
        // So this will fail unless we modify EPUBParser to use importScripts or import.
        throw new Error('EPUB parsing in worker requires JSZip module support');
        
      default:
        throw new Error(`Unsupported format in worker: ${format}`);
    }
    
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

