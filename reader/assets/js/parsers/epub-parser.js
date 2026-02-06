/**
 * @fileoverview EPUB Format Parser
 * Handles parsing of EPUB 2/3 files using JSZip
 */

export class EPUBParser {
  constructor() {
    this.parser = new DOMParser();
    this.jszip = null;
    this.bookId = null; // Set by BookService
    this.imageBlobs = new Map(); // Store image blobs: path -> blob
  }

  setBookId(bookId) {
    this.bookId = bookId;
    // Clear image blobs from previous book parsing to prevent leaks
    this.imageBlobs.clear();
  }

  /**
   * Sanitize DOM element to ensure consistent rendering
   * Removes inline styles, classes, and unwraps formatting tags.
   */
  sanitizeNode(node) {
    // 1. Remove ALL attributes (style, class, width...) except functional ones
    if (node.attributes) {
        // Создаем массив имен атрибутов для удаления (чтобы не ломать итератор)
        const attrsToRemove = [];
        for (const attr of node.attributes) {
            if (!['src', 'href', 'alt', 'id'].includes(attr.name)) {
                attrsToRemove.push(attr.name);
            }
        }
        attrsToRemove.forEach(attr => node.removeAttribute(attr));
    }

    // 2. Unwrap Formatting Tags (flatten the text)
    // Эти теги создают вложенность, которая мешает кликам
    const tagsToUnwrap = ['SPAN', 'I', 'EM', 'B', 'STRONG', 'U', 'FONT', 'SMALL', 'BIG', 'MARK', 'S'];

    if (tagsToUnwrap.includes(node.tagName)) {
      const parent = node.parentNode;
      if (parent) {
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
        return; // Узел удален, выходим
      }
    }

    // 3. Recursively clean children
    Array.from(node.children).forEach(child => this.sanitizeNode(child));
  }

  /**
   * Load JSZip library dynamically
   */
  async loadJSZip() {
    if (window.JSZip) {
      this.jszip = window.JSZip;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
      script.onload = () => {
        this.jszip = window.JSZip;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load JSZip library'));
      document.head.appendChild(script);
    });
  }

  /**
   * Parse EPUB file
   * @param {Blob|File} file - File object
   * @returns {Promise<Object>} Parsed content
   */
  async parse(file) {
    await this.loadJSZip();
    
    const zip = await new this.jszip().loadAsync(file);
    
    // 1. Parse container.xml to find OPF path
    const containerXML = await zip.file('META-INF/container.xml').async('text');
    const opfPath = this.extractOPFPath(containerXML);
    
    // 2. Parse OPF
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error(`OPF file not found at ${opfPath}`);
    
    const opfXML = await opfFile.async('text');
    const { metadata, spine, manifest } = this.parseOPF(opfXML, opfPath);
    
    // 3. Process Spine (Chapters)
    const sections = [];
    let fullHtml = '';
    let totalWordCount = 0;

    for (let i = 0; i < spine.length; i++) {
        const itemId = spine[i];
        const item = manifest[itemId];
        if (!item) continue;

        // Resolve path relative to OPF
        const itemPath = this.resolvePath(opfPath, item.href);
        const file = zip.file(itemPath);
        
        if (file) {
            const content = await file.async('text');
            const { html, title, wordCount, paragraphs: chapterParagraphs, blocks: chapterBlocks } = await this.processChapter(content, itemPath, zip, opfPath);

            sections.push({
                id: `chapter-${i}`,
                title: title || `Chapter ${i+1}`,
                wordCount,
                paragraphs: chapterParagraphs || [],
                blocks: chapterBlocks || []
            });
            
            fullHtml += `<div class="book-section" id="chapter-${i}">${html}</div>`;
            totalWordCount += wordCount;
        }
    }

    // Extract structured paragraphs from all chapters (legacy)
    const paragraphs = [];
    const allBlocks = [];
    sections.forEach(section => {
        if (section.paragraphs) {
            paragraphs.push(...section.paragraphs);
        }
        if (section.blocks) {
            allBlocks.push(...section.blocks);
        }
    });

    // Debug logging
    console.log(`EPUB parsed: ${sections.length} sections, ${paragraphs.length} paragraphs, ${allBlocks.length} blocks`);

    return {
        html: fullHtml,
        sections,
        metadata,
        wordCount: totalWordCount,
        content: {
            reading: paragraphs
        },
        blocks: allBlocks, // New structured format with images
        images: this.imageBlobs // ✅ FIX: Return images explicitly
    };
  }

  extractOPFPath(containerXML) {
    const doc = this.parser.parseFromString(containerXML, 'text/xml');
    const rootfile = doc.querySelector('rootfile');
    if (!rootfile) throw new Error('Invalid container.xml: no rootfile');
    return rootfile.getAttribute('full-path');
  }

  /**
   * Unwrap images from paragraphs to prevent rendering issues
   * Moves standalone images out of <p> tags
   */
  unwrapImagesFromParagraphs(container) {
    const images = container.querySelectorAll('p > img');

    images.forEach(img => {
        const p = img.parentNode;

        // If paragraph contains ONLY the image (or whitespace)
        if (p.textContent.trim().length === 0 && p.childNodes.length === 1) {
            // Replace paragraph with image
            p.parentNode.replaceChild(img, p);
        } else {
            // If text is mixed with image (complex case)
            // Add special class for inline images
            img.classList.add('inline-image');
        }
    });
  }

  /**
   * Fix EPUB image tags that break HTML rendering
   * Converts XML <image> tags to HTML <img> tags
   */
  fixImageTags(xmlDoc) {
    // 1. Convert <image> (SVG or old HTML) to standard <img>
    const svgImages = xmlDoc.querySelectorAll('image, svg\\:image');

    svgImages.forEach(oldImg => {
        const newImg = xmlDoc.createElement('img');

        // Transfer attributes
        // Important: xlink:href is EPUB standard, src is for HTML
        const src = oldImg.getAttribute('xlink:href') ||
                   oldImg.getAttribute('href') ||
                   oldImg.getAttribute('src');
        if (src) newImg.setAttribute('src', src);

        // Copy classes and ID
        if (oldImg.className) newImg.className = oldImg.className;
        if (oldImg.id) newImg.id = oldImg.id;

        newImg.setAttribute('loading', 'lazy'); // Optimization

        // Replace in DOM
        oldImg.parentNode.replaceChild(newImg, oldImg);
    });

    // 2. Ensure self-closing img tags are properly handled
    // Browser innerHTML can choke on <img /> when parsing as HTML
    const allImages = xmlDoc.querySelectorAll('img');
    allImages.forEach(img => {
        // Force explicit closing (though not needed in HTML5)
        if (!img.hasAttribute('alt')) {
            img.setAttribute('alt', ''); // Ensure alt attribute for accessibility
        }
    });
  }

  parseOPF(opfXML, opfPath) {
    const doc = this.parser.parseFromString(opfXML, 'text/xml');

    // Metadata
    const metadata = {
        title: doc.querySelector('metadata title')?.textContent || 'Untitled',
        author: doc.querySelector('metadata creator')?.textContent || 'Unknown',
        language: doc.querySelector('metadata language')?.textContent || 'en',
        description: doc.querySelector('metadata description')?.textContent || '',
    };

    // Manifest (files)
    const manifest = {};
    doc.querySelectorAll('manifest item').forEach(item => {
        manifest[item.getAttribute('id')] = {
            href: item.getAttribute('href'),
            mediaType: item.getAttribute('media-type')
        };
    });

    // Spine (reading order)
    const spine = Array.from(doc.querySelectorAll('spine itemref')).map(ref => ref.getAttribute('idref'));

    return { metadata, manifest, spine };
  }

  /**
   * Process XHTML chapter
   */
  async processChapter(htmlContent, chapterPath, zip, opfPath) {
    try {
    const doc = this.parser.parseFromString(htmlContent, 'application/xhtml+xml') ||
                this.parser.parseFromString(htmlContent, 'text/html');

    const body = doc.body;

    // Fix EPUB image tags that break HTML rendering
    this.fixImageTags(doc);

    // Extract structured content blocks (new contract with proper image handling)
    const blocks = [];
    const contentElements = Array.from(body.querySelectorAll('p, blockquote, .epigraph, img'));

    // Log found images before processing
    const allImages = body.querySelectorAll('img');
    console.log(`🖼️ Found ${allImages.length} images in chapter HTML:`);
    allImages.forEach((img, i) => {
      const src = img.getAttribute('src');
      console.log(`  ${i}: src="${src}"`);
    });

    contentElements.forEach((element, idx) => {
        if (element.tagName === 'IMG') {
            // Handle standalone images
            const img = element;
            const src = img.getAttribute('src');
            if (src) {
                // Resolve path relative to chapter for consistent storage/retrieval
                const resolvedZipPath = this.resolvePath(chapterPath, src);
                console.log(`🔗 EPUB Parser - Standalone image path resolution: "${src}" (from ${chapterPath}) -> "${resolvedZipPath}"`);

                blocks.push({
                    kind: 'img',
                    src: null, // Don't set blob URLs during parsing
                    alt: img.getAttribute('alt') || '',
                    originalSrc: resolvedZipPath, // Use resolved path for IndexedDB lookup
                    rawSrc: src, // Keep raw src for debugging
                    className: 'epub-image'
                });
            }
        } else {
            // Handle text paragraphs
            const paraEl = element;

            // Clone the element to safely manipulate it
            const clonedPara = paraEl.cloneNode(true);

            // ✅ SANITIZE: Clean DOM before processing (Senior-level fix)
            this.sanitizeNode(clonedPara);

            // Extract images from paragraph for separate blocks
            const images = clonedPara.querySelectorAll('img');
            const inlineImages = [];

            images.forEach(img => {
                const src = img.getAttribute('src');
                if (src) {
                    // Resolve path for consistent storage/retrieval
                    const resolvedZipPath = this.resolvePath(chapterPath, src);
                    console.log(`🔗 EPUB Parser - Inline image path resolution: "${src}" (from ${chapterPath}) -> "${resolvedZipPath}"`);

                    inlineImages.push({
                        src: null, // Don't set blob URLs during parsing
                        alt: img.getAttribute('alt') || '',
                        originalSrc: resolvedZipPath, // Use resolved path for IndexedDB lookup
                        rawSrc: src, // Keep raw src for debugging
                        className: 'epub-image'
                    });
                }
                img.remove(); // Remove from text for clean extraction
            });

            // Get text content without images
            const paraText = clonedPara.textContent.trim();
            const paraHtml = clonedPara.innerHTML.trim();

            if (paraText || inlineImages.length > 0) {
                let paraType = 'regular';
                if (paraEl.matches('blockquote, .epigraph')) {
                    paraType = 'fact';
                } else if (paraText.includes('\n-') || paraText.includes('\n•')) {
                    paraType = 'list';
                }

                blocks.push({
                    kind: 'p',
                    text: paraText,
                    html: paraHtml,
                    type: paraType,
                    title: '',
                    hasImages: inlineImages.length > 0,
                    inlineImages: inlineImages
                });

                // Add inline images as separate blocks after the paragraph
                inlineImages.forEach(imageData => {
                    blocks.push({
                        kind: 'img',
                        ...imageData
                    });
                });
            }
        }
    });

    // Convert blocks to legacy paragraphs format for backward compatibility
    const paragraphs = blocks
        .filter(block => block.kind === 'p')
        .map(block => ({
            text: block.text,
            type: block.type,
            title: block.title,
            hasImages: block.hasImages
        }));
    
    // Extract title if present
    const title = doc.querySelector('title')?.textContent || 
                  doc.querySelector('h1')?.textContent || 
                  doc.querySelector('h2')?.textContent || '';
    
      // Process images: extract from ZIP and convert to base64 URLs
      const images = body.querySelectorAll('img');
      const imagePromises = [];

      for (const img of images) {
        const src = img.getAttribute('src');
        if (src) {
          // Resolve image path relative to chapter
          const imagePath = this.resolvePath(chapterPath, src);

          // Process the image from ZIP (returns image ID, stores blob)
          const promise = this.processImageFromZip(zip, imagePath)
            .then(async (imageId) => {
              console.log(`📦 Processed image from ZIP: "${imagePath}" -> ID: ${imageId}`);
              if (imageId) {
                // Set src to Service Worker endpoint
                const imageUrl = `/book-images/${this.bookId}/${imageId}`;
                console.log(`🔗 Setting src="${imageUrl}" on img element`);
                img.src = imageUrl;
                img.classList.add('epub-image');
                console.log(`✅ Image element now has src:`, img.src);
              } else {
                console.warn(`⚠️ Failed to process image: "${imagePath}"`);
                img.classList.add('image-error');
                img.title = `Failed to load image: ${imagePath}`;
              }
            })
            .catch(error => {
              console.error(`💥 Failed to process image "${imagePath}":`, error);
              img.classList.add('image-error');
              img.title = `Failed to load image: ${imagePath}`;
            });

          imagePromises.push(promise);
        }
      }

      // Wait for all images to be processed
      if (imagePromises.length > 0) {
        await Promise.all(imagePromises);
      }

    // Clean up
    // Remove scripts, styles
    body.querySelectorAll('script, style').forEach(el => el.remove());

    // Fix image issues that could break text rendering
    this.unwrapImagesFromParagraphs(body);

    const bodyImages = body.querySelectorAll('img');
    bodyImages.forEach(img => {
        // Remove problematic styles and attributes
        img.removeAttribute('style');
        img.removeAttribute('width');
        img.removeAttribute('height');

        // Ensure image doesn't have inline styles that could break layout
        img.style.cssText = '';

        // Add CSS class for proper styling (but preserve data-image-id!)
        if (!img.classList.contains('epub-image')) {
            img.classList.add('epub-image');
        }
    });

    const wordCount = body.textContent.split(/\s+/).length;

    // Return structured data with new contract
    return {
        html: body.innerHTML,
        title,
        wordCount,
        paragraphs, // Legacy format for backward compatibility
        blocks     // New structured format with proper image handling
    };
    } catch (error) {
      console.error('Error processing EPUB chapter:', error);
      // Return basic content if processing fails
      return {
          html: htmlContent,
          title: '',
          wordCount: 0,
          paragraphs: []
      };
    }
  }

  resolvePath(base, relative) {
    console.log(`🔗 resolvePath: "${base}" + "${relative}"`);

    // Normalize EPUB-specific path quirks
    let cleanRelative = relative;

    // Remove fragment identifiers (#anchor)
    cleanRelative = cleanRelative.split('#')[0];

    // Remove query parameters (?param=value)
    cleanRelative = cleanRelative.split('?')[0];

    // URL decode (%20 -> space, etc.)
    try {
      cleanRelative = decodeURIComponent(cleanRelative);
    } catch (e) {
      // If decoding fails, use as-is
    }

    // Remove leading slash (EPUB sometimes uses absolute paths)
    cleanRelative = cleanRelative.replace(/^\/+/, '');

    console.log(`🔧 After cleaning: "${cleanRelative}"`);

    // Standard path resolution
    const stack = base.split('/');
    stack.pop(); // remove filename

    const parts = cleanRelative.split('/');
    for (const part of parts) {
        if (part === '.' || part === '') continue;
        if (part === '..') {
          if (stack.length > 0) stack.pop();
        } else {
          stack.push(part);
        }
    }
    const result = stack.join('/');
    console.log(`📍 Final resolved path: "${result}"`);
    return result;
  }

  /**
   * Process image from ZIP file and convert to base64 URL
   * @param {JSZip} zip - The ZIP file object
   * @param {string} imagePath - Path to the image in the ZIP
   * @returns {Promise<string|null>} Base64 URL of the image or null if failed
   */
  /**
   * Get MIME type based on file extension
   * @param {string} filename
   * @returns {string}
   */
  getMimeType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml'
    };
    return types[ext] || 'application/octet-stream';
  }

  async processImageFromZip(zip, imagePath) {
    try {
      // Check if the image file exists in the ZIP
      const imageFile = zip.file(imagePath);
      if (!imageFile) {
        // Try with common image extensions if the path doesn't work
        const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        for (const ext of extensions) {
          // Remove existing extension and add new one
          const pathWithoutExt = imagePath.replace(/\.[^/.]+$/, '');
          const newPath = pathWithoutExt + ext;
          const altImageFile = zip.file(newPath);
          if (altImageFile) {
            return await this.convertImageToBase64(altImageFile);
          }
        }
        console.warn(`Image file not found: ${imagePath}`);
        return null;
      }

      // 1. Extract raw blob from ZIP
      const rawBlob = await imageFile.async('blob');

      // 2. ✅ FIX: Create blob with explicit MIME type
      const mimeType = this.getMimeType(imagePath);
      const blob = new Blob([rawBlob], { type: mimeType });

      console.log(`📁 Extracted blob for "${imagePath}" (${blob.size} bytes, type: "${blob.type}")`);

      // 3. Store blob with normalized path as key
      const normalizedPath = imagePath.replace(/\\/g, '/').toLowerCase();
      this.imageBlobs.set(normalizedPath, blob);
      console.log(`💾 Stored image blob: "${normalizedPath}" (${this.imageBlobs.size} total blobs)`);

      // 4. Return image ID for structured data
      return normalizedPath;
    } catch (error) {
      console.error(`Error processing image ${imagePath}:`, error);
      return null;
    }
  }

  /**
   * Convert image file to base64 data URL
   * @param {JSZipObject} imageFile - The image file from ZIP
   * @returns {Promise<string>} Base64 data URL
   */
  async convertImageToBlobUrl(imageFile) {
    try {
      // Get the image as a Blob
      const blob = await imageFile.async('blob');

      // Determine MIME type based on file extension
      const fileName = imageFile.name.toLowerCase();
      let mimeType = 'image/jpeg'; // default
      if (fileName.endsWith('.png')) mimeType = 'image/png';
      else if (fileName.endsWith('.gif')) mimeType = 'image/gif';
      else if (fileName.endsWith('.webp')) mimeType = 'image/webp';
      else if (fileName.endsWith('.svg')) mimeType = 'image/svg+xml';

      // Create a new blob with correct MIME type
      const correctBlob = new Blob([blob], { type: mimeType });

      // Create blob URL and track it for cleanup
      const blobUrl = URL.createObjectURL(correctBlob);
      this.blobUrls.add(blobUrl);
      return blobUrl;
    } catch (error) {
      console.error('Error converting image to blob URL:', error);
      return null;
    }
  }

}
