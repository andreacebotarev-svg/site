/**
 * @fileoverview DropZone Component - Drag & Drop file upload
 */

export class DropZone {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      accept: ['.txt', '.fb2', '.epub'],
      maxSize: 50 * 1024 * 1024, // 50MB
      multiple: true,
      onUpload: null,
      onError: null,
      ...options
    };
    
    this.state = 'idle'; // idle, dragover, uploading, error
    this.render();
    this.attachEvents();
  }

  render() {
    const formats = this.options.accept.map(ext => ext.replace('.', '')).join(', ');
    
    this.container.innerHTML = `
      <div class="dropzone" role="button" tabindex="0" aria-label="Upload books">
        <input 
          type="file" 
          class="dropzone-input" 
          accept="${this.options.accept.join(',')}"
          ${this.options.multiple ? 'multiple' : ''}
          style="display: none;"
          aria-hidden="true"
        />
        
        <div class="dropzone-content">
          <div class="dropzone-icon">📚</div>
          <div class="dropzone-title">Drop books here</div>
          <div class="dropzone-subtitle">or click to browse</div>
          <div class="dropzone-formats">
            ${this.options.accept.map(ext => 
              `<span class="dropzone-format">${ext.replace('.', '')}</span>`
            ).join('')}
          </div>
        </div>
      </div>
    `;

    this.dropzone = this.container.querySelector('.dropzone');
    this.input = this.container.querySelector('.dropzone-input');
  }

  attachEvents() {
    // Click to browse
    this.dropzone.addEventListener('click', () => this.input.click());
    
    // Keyboard support
    this.dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.input.click();
      }
    });

    // File input change
    this.input.addEventListener('change', (e) => {
      this.handleFiles(Array.from(e.target.files));
      e.target.value = ''; // Reset
    });

    // Drag & Drop
    this.dropzone.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    this.dropzone.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.dropzone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.dropzone.addEventListener('drop', (e) => this.handleDrop(e));

    // Prevent default drag behavior on document
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
      document.addEventListener(event, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
  }

  handleDragEnter(e) {
    e.preventDefault();
    this.setState('dragover');
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  handleDragLeave(e) {
    e.preventDefault();
    // Only remove dragover if leaving the dropzone itself
    if (!this.dropzone.contains(e.relatedTarget)) {
      this.setState('idle');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    this.setState('idle');

    const files = Array.from(e.dataTransfer.files);
    this.handleFiles(files);
  }

  async handleFiles(files) {
    // Validate files
    const errors = [];
    const validFiles = [];

    for (const file of files) {
      // Check extension
      const ext = `.${file.name.split('.').pop().toLowerCase()}`;
      if (!this.options.accept.includes(ext)) {
        errors.push(`${file.name}: Invalid format. Supported: ${this.options.accept.join(', ')}`);
        continue;
      }

      // Check size
      if (file.size > this.options.maxSize) {
        const maxSizeMB = (this.options.maxSize / (1024 * 1024)).toFixed(0);
        errors.push(`${file.name}: File too large. Max ${maxSizeMB}MB`);
        continue;
      }

      validFiles.push(file);
    }

    // Show errors
    if (errors.length > 0) {
      this.showError(errors.join('\n'));
      this.options.onError?.(errors);
      return;
    }

    // Upload files
    if (validFiles.length > 0) {
      await this.uploadFiles(validFiles);
    }
  }

  async uploadFiles(files) {
    this.setState('uploading');
    this.showProgress(`Uploading ${files.length} file(s)...`);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.updateProgress(`Processing ${file.name}...`, i + 1, files.length);
        
        await this.options.onUpload?.(file, i, files.length);
      }

      this.setState('idle');
      this.render(); // Reset view
      this.attachEvents();
    } catch (error) {
      this.showError(`Upload failed: ${error.message}`);
      this.options.onError?.([error.message]);
      
      // Reset after 3 seconds
      setTimeout(() => {
        this.setState('idle');
        this.render();
        this.attachEvents();
      }, 3000);
    }
  }

  setState(state) {
    this.state = state;
    this.dropzone.classList.remove('dragover', 'dropzone-error');
    
    if (state === 'dragover') {
      this.dropzone.classList.add('dragover');
    } else if (state === 'error') {
      this.dropzone.classList.add('dropzone-error');
    }
  }

  showProgress(message, current, total) {
    const progressHtml = `
      <div class="dropzone-progress" role="status" aria-live="polite">
        <div class="dropzone-spinner"></div>
        <div class="dropzone-progress-text">${this.escapeHtml(message)}</div>
        ${current && total ? `
          <div class="dropzone-progress-detail">${current} of ${total}</div>
        ` : ''}
      </div>
    `;

    const existing = this.dropzone.querySelector('.dropzone-progress');
    if (existing) {
      existing.remove();
    }

    this.dropzone.insertAdjacentHTML('beforeend', progressHtml);
  }

  updateProgress(message, current, total) {
    const textEl = this.dropzone.querySelector('.dropzone-progress-text');
    const detailEl = this.dropzone.querySelector('.dropzone-progress-detail');
    
    if (textEl) textEl.textContent = message;
    if (detailEl && current && total) {
      detailEl.textContent = `${current} of ${total}`;
    }
  }

  showError(message) {
    this.setState('error');
    
    const errorHtml = `
      <div class="dropzone-progress" role="alert">
        <div class="dropzone-error-icon">⚠️</div>
        <div class="dropzone-error-message">${this.escapeHtml(message)}</div>
      </div>
    `;

    const existing = this.dropzone.querySelector('.dropzone-progress');
    if (existing) {
      existing.remove();
    }

    this.dropzone.insertAdjacentHTML('beforeend', errorHtml);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    this.dropzone.remove();
  }
}

