/**
 * Sistema de Debug Profissional para Upload de Comprovante
 * Rastreia cada etapa do processo com timestamps e contexto detalhado
 */

class DebugLogger {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.logs = [];
    this.startTime = Date.now();
    this.isDebugMode = process.env.NODE_ENV === 'development' || localStorage.getItem('debug_upload') === 'true';
    
    if (this.isDebugMode) {
      console.log(`🔍 [DEBUG] Sessão de debug iniciada: ${this.sessionId}`);
    }
  }

  generateSessionId() {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  log(level, step, message, data = null) {
    const timestamp = Date.now();
    const elapsed = timestamp - this.startTime;
    
    const logEntry = {
      sessionId: this.sessionId,
      timestamp,
      elapsed,
      level,
      step,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : null
    };

    this.logs.push(logEntry);

    if (this.isDebugMode) {
      const emoji = this.getEmojiForLevel(level);
      const timeStr = `+${elapsed}ms`;
      
      console.group(`${emoji} [${level.toUpperCase()}] ${step} (${timeStr})`);
      console.log(`📝 ${message}`);
      
      if (data) {
        console.log('📊 Dados:', data);
      }
      
      console.groupEnd();
    }
  }

  getEmojiForLevel(level) {
    const emojis = {
      info: '📘',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    };
    return emojis[level] || '📝';
  }

  info(step, message, data) {
    this.log('info', step, message, data);
  }

  success(step, message, data) {
    this.log('success', step, message, data);
  }

  warning(step, message, data) {
    this.log('warning', step, message, data);
  }

  error(step, message, data) {
    this.log('error', step, message, data);
  }

  debug(step, message, data) {
    this.log('debug', step, message, data);
  }

  // Método para capturar erros de rede detalhados
  captureNetworkError(response, requestData) {
    return {
      status: response?.status,
      statusText: response?.statusText,
      url: response?.url,
      headers: response?.headers ? Object.fromEntries(response.headers.entries()) : null,
      requestData: {
        method: requestData?.method,
        url: requestData?.url,
        headers: requestData?.headers,
        bodySize: requestData?.body ? requestData.body.length : 0
      },
      timestamp: new Date().toISOString()
    };
  }

  // Método para capturar informações do arquivo
  captureFileInfo(file) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      sizeFormatted: this.formatFileSize(file.size)
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Método para gerar relatório completo
  generateReport() {
    const report = {
      sessionId: this.sessionId,
      startTime: new Date(this.startTime).toISOString(),
      totalDuration: Date.now() - this.startTime,
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(log => log.level === 'error').length,
      warningCount: this.logs.filter(log => log.level === 'warning').length,
      logs: this.logs,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    if (this.isDebugMode) {
      console.group('📋 RELATÓRIO COMPLETO DE DEBUG');
      console.log('🆔 Session ID:', report.sessionId);
      console.log('⏱️ Duração Total:', `${report.totalDuration}ms`);
      console.log('📊 Total de Logs:', report.totalLogs);
      console.log('❌ Erros:', report.errorCount);
      console.log('⚠️ Avisos:', report.warningCount);
      console.log('📄 Relatório Completo:', report);
      console.groupEnd();
    }

    return report;
  }

  // Método para exportar logs para análise
  exportLogs() {
    const report = this.generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug_upload_${this.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.info('EXPORT', 'Logs exportados com sucesso', { filename: a.download });
  }

  // Método para limpar logs
  clear() {
    this.logs = [];
    this.startTime = Date.now();
    this.info('SYSTEM', 'Logs limpos e sessão reiniciada');
  }
}

// Instância global do logger
export const uploadDebugger = new DebugLogger();

// Função para ativar/desativar debug mode
export const toggleDebugMode = (enabled) => {
  if (enabled) {
    localStorage.setItem('debug_upload', 'true');
  } else {
    localStorage.removeItem('debug_upload');
  }
  window.location.reload();
};

// Função para adicionar controles de debug na interface
export const addDebugControls = () => {
  if (process.env.NODE_ENV === 'development') {
    const debugPanel = document.createElement('div');
    debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      font-family: monospace;
      font-size: 12px;
    `;
    
    debugPanel.innerHTML = `
      <div>🔍 Debug Upload</div>
      <button onclick="window.uploadDebugger.exportLogs()" style="margin: 5px; padding: 5px;">Export Logs</button>
      <button onclick="window.uploadDebugger.clear()" style="margin: 5px; padding: 5px;">Clear Logs</button>
      <button onclick="window.toggleDebugMode(!window.uploadDebugger.isDebugMode)" style="margin: 5px; padding: 5px;">
        ${uploadDebugger.isDebugMode ? 'Disable' : 'Enable'} Debug
      </button>
    `;
    
    document.body.appendChild(debugPanel);
    
    // Expor no window para acesso global
    window.uploadDebugger = uploadDebugger;
    window.toggleDebugMode = toggleDebugMode;
  }
};

export default DebugLogger;