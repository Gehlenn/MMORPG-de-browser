// Logger - Sistema centralizado de logs
class Logger {
  static info(...args) {
    console.log('[INFO]', ...args);
  }

  static warn(...args) {
    console.warn('[WARN]', ...args);
  }

  static error(...args) {
    console.error('[ERROR]', ...args);
  }

  static debug(...args) {
    if (typeof Config !== 'undefined' && Config.DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  }

  static game(...args) {
    console.log('[GAME]', ...args);
  }

  static network(...args) {
    console.log('[NETWORK]', ...args);
  }

  static auth(...args) {
    console.log('[AUTH]', ...args);
  }

  static ui(...args) {
    console.log('[UI]', ...args);
  }

  static performance(...args) {
    console.log('[PERF]', ...args);
  }

  // Método para criar timestamps
  static timestamp() {
    return new Date().toISOString();
  }

  // Método para logs estruturados
  static structured(level, category, message, data = {}) {
    const logEntry = {
      timestamp: this.timestamp(),
      level: level.toUpperCase(),
      category: category.toUpperCase(),
      message: message,
      data: data
    };

    switch (level) {
      case 'error':
        console.error('[STRUCTURED]', logEntry);
        break;
      case 'warn':
        console.warn('[STRUCTURED]', logEntry);
        break;
      default:
        console.log('[STRUCTURED]', logEntry);
    }
  }

  // Método para medir performance
  static time(label) {
    console.time(`[PERF] ${label}`);
  }

  static timeEnd(label) {
    console.timeEnd(`[PERF] ${label}`);
  }

  // Método para grupo de logs
  static group(label) {
    console.group(`[GROUP] ${label}`);
  }

  static groupEnd() {
    console.groupEnd();
  }

  // Método para tabela de dados
  static table(data, label = '') {
    if (label) {
      console.log(`[TABLE] ${label}`);
    }
    console.table(data);
  }
}

window.Logger = Logger;

export default Logger;
