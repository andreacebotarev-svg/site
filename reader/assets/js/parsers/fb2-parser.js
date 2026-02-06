/**
 * @fileoverview FB2 Format Parser
 * Handles parsing of FictionBook 2.0 files with support for:
 * - Encoding detection (windows-1251, koi8-r, utf-8)
 * - Multiple body handling (main text vs notes)
 * - Formatting preservation (emphasis, strong, etc.)
 * - Image extraction
 */

export class FB2Parser {
  constructor() {
    this.parser = new DOMParser();
  }

  /**
   * Parse FB2 file
   * @param {Blob|File} file - File object
   * @returns {Promise<Object>} Parsed content
   */
  async parse(file) {
    const encoding = await this.detectEncoding(file);
    const decoder = new TextDecoder(encoding);
    const buffer = await file.arrayBuffer();
    const text = decoder.decode(buffer);

    const xmlDoc = this.parser.parseFromString(text, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`XML Parsing Error: ${parserError.textContent}`);
    }

    // Extract images
    const images = this.extractImages(xmlDoc);

    // Metadata
    const metadata = this.extractMetadata(xmlDoc);

    // Content
    const body = this.findMainBody(xmlDoc);
    if (!body) {
      throw new Error('No valid body element found in FB2');
    }

    const { html, sections, wordCount, paragraphs } = this.processBody(body, images);

    return {
      html,
      sections,
      metadata,
      images, // Raw images map if needed
      wordCount,
      content: {
        reading: paragraphs // Add structured paragraphs like in lesson data
      }
    };
  }

  /**
   * Detect file encoding from XML declaration
   * @param {Blob} file 
   * @returns {Promise<string>}
   */
  async detectEncoding(file) {
    // Read first 1KB to find declaration
    const chunk = file.slice(0, 1024);
    const buffer = await chunk.arrayBuffer();
    const latin1Text = new TextDecoder('iso-8859-1').decode(buffer);
    
    // Look for encoding="..."
    const match = latin1Text.match(/<\?xml[^>]+encoding=["']([^"']+)["']/i);
    
    if (match && match[1]) {
      const enc = match[1].toLowerCase();
      // Validate encoding is supported
      try {
        new TextDecoder(enc);
        return enc;
      } catch (e) {
        console.warn(`Unsupported encoding: ${enc}, falling back to utf-8`);
      }
    }
    return 'utf-8';
  }

  /**
   * Find the main body element, skipping notes/comments
   * @param {Document} doc 
   * @returns {Element}
   */
  findMainBody(doc) {
    const bodies = Array.from(doc.querySelectorAll('body'));
    // Main body usually has no name attribute, or name is empty
    // Notes usually have name="notes"
    return bodies.find(b => !b.getAttribute('name')) || bodies[0];
  }

  extractMetadata(doc) {
    const description = doc.querySelector('description');
    if (!description) return { title: 'Unknown' };

    const titleInfo = description.querySelector('title-info');
    
    const getVal = (parent, selector) => parent?.querySelector(selector)?.textContent?.trim();
    
    // Author
    const authors = Array.from(titleInfo?.querySelectorAll('author') || []).map(a => {
      const first = getVal(a, 'first-name') || '';
      const last = getVal(a, 'last-name') || '';
      const middle = getVal(a, 'middle-name') || '';
      return `${first} ${middle} ${last}`.replace(/\s+/g, ' ').trim();
    }).filter(Boolean);

    return {
      title: getVal(titleInfo, 'book-title') || 'Untitled',
      author: authors.join(', ') || 'Unknown Author',
      language: getVal(titleInfo, 'lang') || 'en',
      description: getVal(titleInfo, 'annotation') || '',
      cover: this.getCoverImage(doc, description)
    };
  }

  extractImages(doc) {
    const images = new Map();
    const binaries = doc.querySelectorAll('binary');
    
    binaries.forEach(bin => {
      const id = bin.getAttribute('id');
      const contentType = bin.getAttribute('content-type');
      const data = bin.textContent.trim();
      if (id && data) {
        images.set(id, `data:${contentType};base64,${data}`);
      }
    });
    return images;
  }

  getCoverImage(doc, description) {
    const coverPage = description?.querySelector('coverpage image');
    if (coverPage) {
      const href = coverPage.getAttribute('l:href') || coverPage.getAttribute('xlink:href') || coverPage.getAttribute('href');
      if (href) {
        const id = href.replace(/^#/, '');
        // We can't resolve it here fully without the images map, 
        // but we can return the ID reference for later resolution
        return { type: 'reference', id };
      }
    }
    return null;
  }

  processBody(body, images) {
    const sections = [];
    const paragraphs = []; // New: structured paragraphs like in lesson data
    let wordCount = 0;

    // Process sections
    const sectionEls = Array.from(body.children).filter(el => el.nodeName.toLowerCase() === 'section');
    // If no sections at top level, wrap content in one section
    if (sectionEls.length === 0) {
      // Logic for flat bodies or other structures could go here
      // For now, assume standard FB2 structure or fallback
    }

    let html = '';

    const processNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            return this.escapeHtml(node.textContent);
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        const tag = node.nodeName.toLowerCase();
        let content = '';

        // Recursively process children
        if (tag !== 'image') { // Images are self-closing or empty usually
            content = Array.from(node.childNodes).map(processNode).join('');
        }

        switch (tag) {
            case 'p': return `<p>${content}</p>`;
            case 'strong':
            case 'b': return `<strong>${content}</strong>`;
            case 'emphasis':
            case 'i': return `<em>${content}</em>`;
            case 'strikethrough':
            case 'del': return `<del>${content}</del>`;
            case 'sub': return `<sub>${content}</sub>`;
            case 'sup': return `<sup>${content}</sup>`;
            case 'code': return `<code>${content}</code>`;
            case 'cite': return `<cite>${content}</cite>`;
            case 'epigraph': return `<blockquote class="epigraph">${content}</blockquote>`;
            case 'poem': return `<div class="poem">${content}</div>`;
            case 'stanza': return `<div class="stanza">${content}</div>`;
            case 'v': return `<div class="line">${content}</div>`;
            case 'title': return `<h3>${content}</h3>`; // Section titles usually
            case 'subtitle': return `<h4>${content}</h4>`;
            case 'empty-line': return `<br/>`;
            case 'image':
                const href = node.getAttribute('l:href') || node.getAttribute('xlink:href') || node.getAttribute('href');
                if (href) {
                    const id = href.replace(/^#/, '');
                    const src = images.get(id);
                    if (src) return `<img src="${src}" class="book-image" loading="lazy" alt="Image" />`;
                }
                return '';
            case 'a':
                const linkHref = node.getAttribute('l:href') || node.getAttribute('xlink:href') || node.getAttribute('href');
                return `<a href="${linkHref}">${content}</a>`;
            case 'section':
                // Sections are handled at top level, but nested sections exist
                return `<div class="sub-section">${content}</div>`;
            default: return content; // Unwrap unknown tags
        }
    };

    // Top level sections logic
    sectionEls.forEach((section, idx) => {
        const titleEl = section.querySelector('title');
        let sectionTitle = '';
        if (titleEl) {
             sectionTitle = titleEl.textContent.trim();
        }

        // Extract all paragraphs from this section for structured data
        const sectionParagraphs = [];
        const allParagraphEls = Array.from(section.querySelectorAll('p, blockquote, .epigraph, .poem'));

        allParagraphEls.forEach((paraEl, paraIdx) => {
            const paraText = paraEl.textContent.trim();
            if (paraText) {
                // Determine paragraph type
                let paraType = 'regular';
                if (paraEl.matches('.epigraph, blockquote')) {
                    paraType = 'fact'; // Treat quotes as facts
                } else if (paraText.includes('\n-') || paraText.includes('\n•')) {
                    paraType = 'list';
                }

                // Extract title if this is the first paragraph after a title
                let paraTitle = '';
                const prevSibling = paraEl.previousElementSibling;
                if (prevSibling && prevSibling.matches('h3, h4, .title')) {
                    paraTitle = prevSibling.textContent.trim();
                }

                sectionParagraphs.push({
                    text: paraText,
                    type: paraType,
                    title: paraTitle
                });
            }
        });

        // Add all paragraphs from this section to global paragraphs array
        paragraphs.push(...sectionParagraphs);

        const sectionWordCount = sectionParagraphs.reduce((count, p) => count + p.text.split(/\s+/).length, 0);
        wordCount += sectionWordCount;

        // Process full HTML of the section
        const sectionContent = processNode(section);

        sections.push({
            id: `section-${idx}`,
            title: sectionTitle,
            wordCount: sectionWordCount
        });

        html += `<div class="book-section" id="section-${idx}">${sectionContent}</div>`;
    });

    // Fallback if no sections
    if (sections.length === 0) {
        // Собираем параграфы прямо из body
        const bodyParagraphs = Array.from(body.querySelectorAll('p, blockquote, .epigraph, .poem')).map(p => ({
            text: p.textContent.trim(),
            type: 'regular',
            title: ''
        })).filter(p => p.text);

        paragraphs.push(...bodyParagraphs); // Заполняем массив!

        html = `<div class="book-section">${processNode(body)}</div>`; // Use local processNode function
        wordCount = body.textContent.split(/\s+/).length;
        sections.push({ id: 'section-0', title: 'Main', wordCount });
    }

    // ВАЖНО: Возвращаем paragraphs
    return { html, sections, wordCount, paragraphs };
  }


  escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
  }
}

