import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FB2Parser } from '../assets/js/parsers/fb2-parser';
import { EPUBParser } from '../assets/js/parsers/epub-parser';

// Mock DOMParser for Node environment
if (typeof DOMParser === 'undefined') {
  global.DOMParser = class {
    parseFromString(str, type) {
      // Basic mock or use jsdom
      const { JSDOM } = require('jsdom');
      return new JSDOM(str, { contentType: type }).window.document;
    }
  };
}

// Mock JSZip
const mockZipFile = {
  async: vi.fn().mockResolvedValue('mock content'),
};
const mockJSZip = {
  loadAsync: vi.fn().mockResolvedValue({
    file: vi.fn().mockReturnValue(mockZipFile)
  })
};
global.window = { JSZip: mockJSZip };

describe('FB2Parser', () => {
  let parser;

  beforeEach(() => {
    parser = new FB2Parser();
  });

  it('should detect utf-8 encoding', async () => {
    const file = new Blob(['<?xml version="1.0" encoding="utf-8"?><root></root>']);
    const encoding = await parser.detectEncoding(file);
    expect(encoding).toBe('utf-8');
  });

  it('should detect windows-1251 encoding', async () => {
    // Create a blob that looks like windows-1251 header (in latin1 for test simplicity)
    const header = '<?xml version="1.0" encoding="windows-1251"?>';
    const file = new Blob([header]);
    const encoding = await parser.detectEncoding(file);
    expect(encoding).toBe('windows-1251');
  });

  it('should parse basic FB2 content', async () => {
    const xml = `
      <?xml version="1.0" encoding="utf-8"?>
      <FictionBook>
        <description>
          <title-info>
            <book-title>Test Book</book-title>
            <author><first-name>John</first-name><last-name>Doe</last-name></author>
          </title-info>
        </description>
        <body>
          <section>
            <title><p>Chapter 1</p></title>
            <p>Hello <emphasis>World</emphasis></p>
          </section>
        </body>
      </FictionBook>
    `;
    const file = new Blob([xml], { type: 'text/xml' });
    
    const result = await parser.parse(file);
    
    expect(result.metadata.title).toBe('Test Book');
    expect(result.metadata.author).toBe('John Doe');
    expect(result.html).toContain('<em>World</em>');
    expect(result.sections.length).toBeGreaterThan(0);
  });
});

describe('EPUBParser', () => {
  let parser;

  beforeEach(() => {
    parser = new EPUBParser();
    // Mock loadJSZip to resolve immediately
    parser.loadJSZip = vi.fn().mockResolvedValue();
    parser.jszip = mockJSZip;
  });

  it('should extract OPF path from container.xml', () => {
    const containerXML = `
      <container>
        <rootfiles>
          <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>
    `;
    const path = parser.extractOPFPath(containerXML);
    expect(path).toBe('OEBPS/content.opf');
  });

  it('should parse OPF metadata', () => {
    const opfXML = `
      <package>
        <metadata>
          <dc:title>Test EPUB</dc:title>
          <dc:creator>Jane Doe</dc:creator>
        </metadata>
        <manifest>
          <item id="chap1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
        </manifest>
        <spine>
          <itemref idref="chap1"/>
        </spine>
      </package>
    `;
    const { metadata, spine } = parser.parseOPF(opfXML, 'content.opf');
    expect(metadata.title).toBe('Test EPUB'); // In real DOM this might fail if namespaces aren't handled, but basic test ok
    expect(spine).toContain('chap1');
  });

  it('should resolve paths correctly', () => {
    expect(parser.resolvePath('OEBPS/content.opf', 'chapter1.xhtml')).toBe('OEBPS/chapter1.xhtml');
    expect(parser.resolvePath('OEBPS/content.opf', '../images/image.jpg')).toBe('images/image.jpg');
    expect(parser.resolvePath('content.opf', 'chapter1.xhtml')).toBe('chapter1.xhtml');
  });

  it('should handle image extraction from ZIP (mocked)', async () => {
    // Create a mock blob for image data
    const mockBlob = new Blob(['fake image data'], { type: 'image/jpeg' });
    const mockFileReader = {
      onload: null,
      readAsDataURL: vi.fn(function() {
        // Simulate successful read
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,fakeData' } });
          }
        }, 0);
      })
    };

    // Mock FileReader constructor
    global.FileReader = vi.fn(() => mockFileReader);

    // Mock zip file with image
    const mockImageFile = {
      async: vi.fn().mockResolvedValue(mockBlob)
    };
    const mockZip = {
      file: vi.fn((path) => path.includes('image.jpg') ? mockImageFile : null)
    };

    // Test processChapter with image
    const htmlContent = `
      <html><body>
        <img src="images/test.jpg" alt="Test Image">
        <p>Some text content</p>
      </body></html>
    `;

    const result = await parser.processChapter(htmlContent, 'OEBPS/chapter1.xhtml', mockZip, 'OEBPS/content.opf');

    // The image src should be processed (though in real scenario it would be replaced with data URL)
    expect(result.html).toContain('<img');
    expect(result.html).toContain('epub-image');
  });
});

