/**
 * @fileoverview Image Storage Service
 * Provides unified interface for storing/retrieving book images
 * Uses OPFS (Origin Private File System) when available, falls back to IndexedDB
 */

class ImageStorage {
  constructor() {
    this.useOPFS = this.checkOPFSSupport();
    this.dbPromise = null;
    console.log(`[ImageStorage] Using ${this.useOPFS ? 'OPFS' : 'IndexedDB'} storage`);
  }

  /**
   * Check if OPFS is supported
   * @returns {boolean}
   */
  checkOPFSSupport() {
    return !!(navigator.storage && navigator.storage.getDirectory);
  }

  /**
   * Initialize storage (lazy initialization)
   */
  async init() {
    if (this.useOPFS) {
      // OPFS doesn't need initialization
      return;
    } else {
      // Initialize IndexedDB
      if (!this.dbPromise) {
        this.dbPromise = new Promise((resolve, reject) => {
          const request = indexedDB.open('ReaderDB', 1);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('imageBlobs')) {
              db.createObjectStore('imageBlobs');
            }
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
      await this.dbPromise;
    }
  }

  /**
   * Save image blob
   * @param {string} bookId
   * @param {string} imagePath
   * @param {Blob} blob
   */
  async saveImage(bookId, imagePath, blob) {
    await this.init();

    // 🔍 DEBUG: Log blob details before saving
    console.log(`💾 [ImageStorage] Saving image ${bookId}:${imagePath}`, {
      size: blob.size,
      type: blob.type,
      isBlob: blob instanceof Blob,
      firstBytes: await this.getBlobFirstBytes(blob, 16)
    });

    try {
      if (this.useOPFS) {
        await this.saveToOPFS(bookId, imagePath, blob);
      } else {
        await this.saveToIndexedDB(bookId, imagePath, blob);
      }
      console.log(`[ImageStorage] Saved ${bookId}/${imagePath} (${blob.size} bytes)`);
    } catch (error) {
      console.error(`[ImageStorage] Failed to save ${bookId}/${imagePath}:`, error);
      throw error;
    }
  }

  /**
   * Get image blob
   * @param {string} bookId
   * @param {string} imagePath
   * @returns {Blob|null}
   */
  async getImage(bookId, imagePath) {
    await this.init();

    try {
      let blob;
      if (this.useOPFS) {
        blob = await this.getFromOPFS(bookId, imagePath);
      } else {
        blob = await this.getFromIndexedDB(bookId, imagePath);
      }

      // 🔍 DEBUG: Log blob details when retrieved
      if (blob) {
        console.log(`📖 [ImageStorage] Retrieved image ${bookId}:${imagePath}`, {
          size: blob.size,
          type: blob.type,
          isBlob: blob instanceof Blob,
          firstBytes: await this.getBlobFirstBytes(blob, 16)
        });
      } else {
        console.warn(`📖 [ImageStorage] No blob found for ${bookId}:${imagePath}`);
      }

      return blob;
    } catch (error) {
      console.warn(`[ImageStorage] Failed to get ${bookId}/${imagePath}:`, error);
      return null;
    }
  }

  /**
   * Delete all images for a book
   * @param {string} bookId
   */
  async deleteBook(bookId) {
    await this.init();

    try {
      if (this.useOPFS) {
        await this.deleteBookFromOPFS(bookId);
      } else {
        await this.deleteBookFromIndexedDB(bookId);
      }
      console.log(`[ImageStorage] Deleted book: ${bookId}`);
    } catch (error) {
      console.error(`[ImageStorage] Failed to delete book ${bookId}:`, error);
      throw error;
    }
  }

  /**
   * Save to OPFS (Origin Private File System)
   */
  async saveToOPFS(bookId, imagePath, blob) {
    const root = await navigator.storage.getDirectory();
    const bookDir = await root.getDirectoryHandle(bookId, { create: true });

    // Create nested directories if needed
    const pathParts = imagePath.split('/');
    const fileName = pathParts.pop();
    let currentDir = bookDir;

    // Create intermediate directories
    for (const part of pathParts) {
      currentDir = await currentDir.getDirectoryHandle(part, { create: true });
    }

    // Create file
    const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  /**
   * Get from OPFS
   */
  async getFromOPFS(bookId, imagePath) {
    const root = await navigator.storage.getDirectory();
    const bookDir = await root.getDirectoryHandle(bookId);

    // Navigate to nested directories
    const pathParts = imagePath.split('/');
    const fileName = pathParts.pop();
    let currentDir = bookDir;

    for (const part of pathParts) {
      currentDir = await currentDir.getDirectoryHandle(part);
    }

    const fileHandle = await currentDir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file;
  }

  /**
   * Delete book from OPFS
   */
  async deleteBookFromOPFS(bookId) {
    const root = await navigator.storage.getDirectory();
    try {
      await root.removeEntry(bookId, { recursive: true });
    } catch (error) {
      // Ignore if directory doesn't exist
      if (error.name !== 'NotFoundError') {
        throw error;
      }
    }
  }

  /**
   * Save to IndexedDB (fallback)
   */
  async saveToIndexedDB(bookId, imagePath, blob) {
    const db = await this.dbPromise;
    const transaction = db.transaction(['imageBlobs'], 'readwrite');
    const store = transaction.objectStore('imageBlobs');
    await store.put(blob, `${bookId}:${imagePath}`);
  }

  /**
   * Get from IndexedDB (fallback)
   */
  async getFromIndexedDB(bookId, imagePath) {
    const db = await this.dbPromise;
    const transaction = db.transaction(['imageBlobs'], 'readonly');
    const store = transaction.objectStore('imageBlobs');
    const request = store.get(`${bookId}:${imagePath}`);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete book from IndexedDB (fallback)
   */
  async deleteBookFromIndexedDB(bookId) {
    const db = await this.dbPromise;
    const transaction = db.transaction(['imageBlobs'], 'readwrite');
    const store = transaction.objectStore('imageBlobs');

    // Get all keys for this book
    const keysRequest = store.getAllKeys();
    const keys = await new Promise((resolve, reject) => {
      keysRequest.onsuccess = () => resolve(keysRequest.result);
      keysRequest.onerror = () => reject(keysRequest.error);
    });

    // Delete keys that start with bookId:
    const bookKeys = keys.filter(key => key.startsWith(`${bookId}:`));
    await Promise.all(bookKeys.map(key => {
      return new Promise((resolve, reject) => {
        const deleteRequest = store.delete(key);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    }));
  }

  /**
   * Get first N bytes of a blob as hex string for debugging
   * @param {Blob} blob
   * @param {number} bytes
   * @returns {string}
   */
  async getBlobFirstBytes(blob, bytes = 16) {
    try {
      const arrayBuffer = await blob.slice(0, bytes).arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      return Array.from(uint8Array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
    } catch (error) {
      return `ERROR: ${error.message}`;
    }
  }
}

// Export singleton instance
export const imageStorage = new ImageStorage();
