import { store } from '../store';

function svg(path: string, size = 16): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">${path}</svg>`;
}

function levelBadge(level: string): string {
  const colors: Record<string, string> = {
    error: 'bg-red-500/20 text-red-400',
    warn: 'bg-yellow-500/20 text-yellow-400',
    info: 'bg-blue-500/20 text-blue-400',
    debug: 'bg-surface-500/20 text-surface-400',
    verbose: 'bg-surface-500/20 text-surface-400',
  };
  const cls = colors[level.toLowerCase()] || 'bg-surface-500/20 text-surface-400';
  return `<span class="inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded ${cls}">${level}</span>`;
}

export function initLogsViewer(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  let filterLevel = 'all';
  let filterService = 'all';

  function getServices(): string[] {
    const logs = store.get('logs');
    return Array.from(new Set(logs.map((l) => l.service)));
  }

  function render(): void {
    const logs = store.get('logs');
    const connected = store.get('logsConnected');
    const services = getServices();

    const filtered = logs.filter((l) => {
      if (filterLevel !== 'all' && l.level !== filterLevel) return false;
      if (filterService !== 'all' && l.service !== filterService) return false;
      return true;
    });

    container.innerHTML = `
      <div class="bg-surface-900 rounded-lg border border-surface-700 overflow-hidden flex flex-col h-full">
        <!-- Header -->
        <div class="flex items-center justify-between px-3 py-2 border-b border-surface-700">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-surface-300">Server Logs</span>
            ${connected
              ? '<span class="flex items-center gap-1 text-[10px] text-green-400">' + svg('<circle cx="12" cy="12" r="10"/>', 8) + ' Live</span>'
              : '<span class="flex items-center gap-1 text-[10px] text-surface-500">' + svg('<circle cx="12" cy="12" r="10"/>', 8) + ' Disconnected</span>'
            }
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-surface-500">${filtered.length} entries</span>
            <button id="clear-logs-btn" class="text-surface-500 hover:text-surface-300 transition-colors" title="Clear logs">
              ${svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 13)}
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-2 px-3 py-2 border-b border-surface-700">
          <span class="text-xs text-surface-500 w-10">Level:</span>
          <select id="log-level-filter" class="flex-1 bg-surface-800 border border-surface-700 rounded px-2 py-1 text-xs text-surface-200 focus:outline-none focus:border-brand-500/50">
            <option value="all" ${filterLevel === 'all' ? 'selected' : ''}>All</option>
            <option value="error" ${filterLevel === 'error' ? 'selected' : ''}>Error</option>
            <option value="warn" ${filterLevel === 'warn' ? 'selected' : ''}>Warn</option>
            <option value="info" ${filterLevel === 'info' ? 'selected' : ''}>Info</option>
            <option value="debug" ${filterLevel === 'debug' ? 'selected' : ''}>Debug</option>
          </select>
          <span class="text-xs text-surface-500 w-12">Service:</span>
          <select id="log-service-filter" class="flex-1 bg-surface-800 border border-surface-700 rounded px-2 py-1 text-xs text-surface-200 focus:outline-none focus:border-brand-500/50">
            <option value="all" ${filterService === 'all' ? 'selected' : ''}>All</option>
            ${services.map((s) => `<option value="${s}" ${filterService === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>

        <!-- Log entries -->
        <div class="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed divide-y divide-surface-800/50">
          ${filtered.length === 0
            ? '<div class="flex items-center justify-center h-24 text-surface-500 text-xs">No log entries</div>'
            : filtered
                .map(
                  (l) => `
            <div class="px-3 py-1.5 hover:bg-surface-800/30 transition-colors">
              <div class="flex items-center gap-2 mb-0.5">
                ${levelBadge(l.level)}
                <span class="text-surface-500 text-[10px]">${l.timestamp || ''}</span>
                <span class="text-surface-400 text-[10px]">${l.service}</span>
              </div>
              <div class="text-surface-200 pl-1" style="word-break:break-word">${escapeHtml(l.message)}</div>
            </div>
          `,
                )
                .join('')
          }
        </div>
      </div>
    `;

    // Bind clear
    container.querySelector('#clear-logs-btn')?.addEventListener('click', () => {
      store.set({ logs: [] });
    });

    // Bind filters
    const levelFilter = container.querySelector<HTMLSelectElement>('#log-level-filter');
    levelFilter?.addEventListener('change', () => {
      filterLevel = levelFilter.value;
      render();
    });

    const serviceFilter = container.querySelector<HTMLSelectElement>('#log-service-filter');
    serviceFilter?.addEventListener('change', () => {
      filterService = serviceFilter.value;
      render();
    });
  }

  const subs = ['logs', 'logsConnected']
    .map((k) => store.subscribe(k as any, render));
  cleanups.push(...subs);
  cleanups.push(() => { container.innerHTML = ''; });

  render();
  return () => cleanups.forEach((fn) => fn());
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
