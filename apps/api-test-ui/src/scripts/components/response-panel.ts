import { store } from '../store';

const SUBTABS = ['body', 'headers', 'timeline'];

function svg(path: string, size = 16): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">${path}</svg>`;
}

function statusBadge(status: number): string {
  const cls = status < 300 ? 'status-ok' : status < 400 ? 'status-redirect' : 'status-error';
  return `<span class="status-badge ${cls}">${status}</span>`;
}

function formatHeaders(hdrs: Record<string, string>): string {
  return Object.entries(hdrs)
    .map(([k, v]) => `<div class="text-xs font-mono py-0.5"><span class="text-surface-400">${k}:</span> <span class="text-surface-200">${v}</span></div>`)
    .join('');
}

export function initResponsePanel(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  function render(): void {
    const response = store.get('response');
    const isLoading = store.get('isLoading');
    const error = store.get('error');
    const subTab = store.get('responseSubTab');

    if (isLoading) {
      container.innerHTML = `
        <div class="bg-surface-900 rounded-lg border border-surface-700 p-8 flex flex-col items-center justify-center gap-3 text-surface-400">
          <div class="spinner w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
          <span class="text-sm">Request in progress...</span>
        </div>
      `;
      return;
    }

    if (!response) {
      container.innerHTML = `
        <div class="bg-surface-900 rounded-lg border border-surface-700 p-8 flex flex-col items-center justify-center gap-2 text-surface-500">
          ${svg('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>', 24)}
          <span class="text-sm">Send a request to see the response</span>
        </div>
      `;
      return;
    }

    const statusColor = response.status < 300 ? 'text-green-400' : response.status < 400 ? 'text-yellow-400' : 'text-red-400';
    let formattedBody = response.body;
    try {
      formattedBody = JSON.stringify(JSON.parse(response.body), null, 2);
    } catch {
      // keep raw
    }

    container.innerHTML = `
      <div class="bg-surface-900 rounded-lg border border-surface-700 overflow-hidden">
        <!-- Header bar -->
        <div class="flex items-center justify-between px-3 py-2 border-b border-surface-700">
          <div class="flex items-center gap-3">
            ${statusBadge(response.status)}
            <span class="text-xs text-surface-400 font-mono">${response.statusText}</span>
            <span class="text-xs text-surface-500">|</span>
            <span class="text-xs text-surface-400 flex items-center gap-1">
              ${svg('<path d="M17.5 8.5 12 14 6.5 8.5"/>', 12)}
              ${response.time}ms
            </span>
            <span class="text-xs text-surface-400 flex items-center gap-1">
              ${svg('<path d="M12 2v20M2 12h20"/>', 12)}
              ${response.size}
            </span>
          </div>
          <button id="clear-resp-btn" class="text-xs text-surface-500 hover:text-surface-300 transition-colors" title="Clear response">
            ${svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 13)}
          </button>
        </div>

        <!-- Response sub-tabs -->
        <div class="flex gap-0 px-3 border-b border-surface-700">
          ${SUBTABS.map(
            (st) => `
            <button class="resp-subtab px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              subTab === st ? 'text-brand-500 border-brand-500' : 'text-surface-400 border-transparent hover:text-surface-200'
            }" data-subtab="${st}">
              ${st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          `,
          ).join('')}
        </div>

        <!-- Tab content -->
        <div class="p-0">
          <div class="subtab-content ${subTab === 'body' ? '' : 'hidden'}">
            <pre class="text-xs font-mono text-surface-200 p-3 overflow-auto max-h-[500px] leading-relaxed"><code>${formattedBody}</code></pre>
            <div class="px-3 py-2 border-t border-surface-700 flex items-center justify-between">
              <span class="text-xs text-surface-500">${response.size} — ${formatBytes(response.body.length)}</span>
              <button id="copy-resp-btn" class="text-xs text-surface-400 hover:text-surface-200 transition-colors flex items-center gap-1">
                ${svg('<path d="M4 16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H6a2 2 0 0 0-2 2v12Z"/><path d="M8 16v2a2 2 0 0 0 2 2h8c1.1 0 2-.9 2-2v-8a2 2 0 0 0-2-2"/>', 12)}
                Copy
              </button>
            </div>
          </div>

          <div class="subtab-content ${subTab === 'headers' ? '' : 'hidden'} p-3">
            ${formatHeaders(response.headers)}
          </div>

          <div class="subtab-content ${subTab === 'timeline' ? '' : 'hidden'} p-3">
            <div class="text-xs text-surface-300">
              <div class="flex items-center gap-2 py-1">
                <span class="w-24 text-surface-500">Request Time:</span>
                <span class="font-mono">${response.time}ms</span>
              </div>
              <div class="flex items-center gap-2 py-1">
                <span class="w-24 text-surface-500">Status Code:</span>
                <span class="font-mono ${statusColor}">${response.status} ${response.statusText}</span>
              </div>
              <div class="flex items-center gap-2 py-1">
                <span class="w-24 text-surface-500">Content Size:</span>
                <span class="font-mono">${response.size}</span>
              </div>
              <div class="mt-3 pt-3 border-t border-surface-700">
                <div class="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
                  <div class="bg-brand-500 h-2 rounded-full transition-all duration-300" style="width:${Math.min((response.time / 2000) * 100, 100)}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind clear
    container.querySelector('#clear-resp-btn')?.addEventListener('click', () => {
      store.set({ response: null, error: null });
    });

    // Bind copy
    container.querySelector('#copy-resp-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(response.body).catch(() => {});
    });

    // Bind sub-tabs
    container.querySelectorAll('.resp-subtab').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.set({ responseSubTab: (btn as HTMLElement).dataset.subtab || 'body' });
      });
    });
  }

  const subs = ['response', 'isLoading', 'error', 'responseSubTab']
    .map((k) => store.subscribe(k as any, render));
  cleanups.push(...subs);
  cleanups.push(() => { container.innerHTML = ''; });

  render();
  return () => cleanups.forEach((fn) => fn());
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}
