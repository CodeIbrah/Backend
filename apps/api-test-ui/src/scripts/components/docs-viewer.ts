import { store } from '../store';
import { endpointGroups } from '../../config/endpoints';
import type { EndpointDoc, EndpointGroup } from '../../config/endpoints';

const ICONS: Record<string, string> = {
  Heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  Lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  Users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  ClipboardList: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  Gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  BarChart3: '<path d="M3 3v18h18"/><path d="M7 16v-3"/><path d="M12 16v-7"/><path d="M17 16V8"/>',
  Box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
};

function svg(path: string, size = 16): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">${path}</svg>`;
}

function methodBadge(method: string): string {
  return `<span class="method-badge method-${method.toLowerCase()}">${method}</span>`;
}

function authBadge(auth: string): string {
  if (auth === 'required') return '<span class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Auth Required</span>';
  if (auth === 'optional') return '<span class="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Auth Optional</span>';
  return '<span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-500/20 text-surface-400">No Auth</span>';
}

function renderEndpoint(ep: EndpointDoc): string {
  return `
    <div class="ep-doc border border-surface-700 rounded-lg overflow-hidden mb-4">
      <div class="flex items-center gap-2 px-3 py-2 bg-surface-800/50 border-b border-surface-700">
        ${methodBadge(ep.method)}
        <span class="text-sm font-mono font-semibold text-surface-200">${ep.path}</span>
        <span class="text-xs text-surface-400 flex-1">${ep.summary}</span>
        ${authBadge(ep.auth)}
      </div>

      <div class="p-3 space-y-3">
        <!-- Description -->
        <p class="text-xs text-surface-400 leading-relaxed">${ep.description}</p>

        <!-- Tags -->
        <div class="flex items-center gap-1">
          <span class="text-[10px] text-surface-500">Tags:</span>
          ${ep.tags.map((t) => `<span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-800 text-surface-400">${t}</span>`).join('')}
        </div>

        <!-- Path Params -->
        ${ep.params && ep.params.length > 0 ? `
          <div>
            <span class="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Path Parameters</span>
            <div class="mt-1 space-y-1">
              ${ep.params.map((p) => `
                <div class="flex items-center gap-2 text-xs">
                  <span class="font-mono text-surface-200 w-32">${p.name}</span>
                  <span class="text-surface-500 w-16">${p.type}${p.required ? ', required' : ', optional'}</span>
                  <span class="text-surface-400">${p.description}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Query Params -->
        ${ep.queryParams && ep.queryParams.length > 0 ? `
          <div>
            <span class="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Query Parameters</span>
            <div class="mt-1 space-y-1">
              ${ep.queryParams.map((p) => `
                <div class="flex items-center gap-2 text-xs">
                  <span class="font-mono text-surface-200 w-32">${p.name}</span>
                  <span class="text-surface-500 w-16">${p.type}${p.required ? ', required' : ', optional'}</span>
                  <span class="text-surface-400">${p.description}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Request Headers -->
        ${ep.headers && ep.headers.length > 0 ? `
          <div>
            <span class="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Request Headers</span>
            <div class="mt-1 space-y-1">
              ${ep.headers.map((h) => `
                <div class="flex items-center gap-2 text-xs">
                  <span class="font-mono text-surface-200 w-48">${h.name}: ${h.value}</span>
                  <span class="text-surface-400">${h.description}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Request Body -->
        ${ep.body ? `
          <div>
            <span class="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Request Body (${ep.body.contentType})</span>
            <pre class="mt-1 p-2 bg-surface-950 rounded text-[11px] font-mono text-surface-300 overflow-auto max-h-64"><code>${escapeHtml(ep.body.example)}</code></pre>
          </div>
        ` : ''}

        <!-- Responses -->
        ${ep.response && ep.response.length > 0 ? `
          <div>
            <span class="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Responses</span>
            ${ep.response.map((r) => `
              <div class="mt-2 border border-surface-700 rounded-lg overflow-hidden">
                <div class="flex items-center gap-2 px-2 py-1 bg-surface-800/50 border-b border-surface-700">
                  ${r.status < 300 ? '<span class="text-[10px] font-bold text-green-400">' + r.status + '</span>' : '<span class="text-[10px] font-bold text-red-400">' + r.status + '</span>'}
                  <span class="text-[11px] text-surface-400">${r.description}</span>
                </div>
                ${r.example ? `<pre class="p-2 text-[11px] font-mono text-surface-300 overflow-auto max-h-48"><code>${escapeHtml(r.example)}</code></pre>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Try it button -->
        <div class="pt-2">
          <button class="try-ep-btn flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors" data-method="${ep.method}" data-path="${ep.path}">
            ${svg('<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/>', 12)}
            Try in Request Panel
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initDocsViewer(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  let selectedGroup = 'all';

  function render(): void {
    const groups = selectedGroup === 'all'
      ? endpointGroups
      : endpointGroups.filter((g) => g.name === selectedGroup);

    container.innerHTML = `
      <div class="bg-surface-900 rounded-lg border border-surface-700 overflow-hidden flex flex-col h-full">
        <!-- Header -->
        <div class="px-4 py-3 border-b border-surface-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-surface-200">API Documentation</span>
            <span class="text-xs text-surface-400">${endpointGroups.reduce((a, g) => a + g.endpoints.length, 0)} endpoints</span>
          </div>
          <div class="flex items-center gap-1 overflow-x-auto pb-1">
            <button class="doc-group-btn px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
              selectedGroup === 'all' ? 'bg-brand-500/20 text-brand-400' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
            }" data-group="all">All</button>
            ${endpointGroups.map((g) => `
              <button class="doc-group-btn px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                selectedGroup === g.name ? 'bg-brand-500/20 text-brand-400' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              }" data-group="${g.name}">${g.name}</button>
            `).join('')}
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          ${groups.length === 0 ? '<div class="text-center text-surface-500 text-xs py-8">No documentation available</div>' : ''}
          ${groups.map((g) => `
            <div class="mb-6">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-surface-400">${svg(ICONS[g.icon] || ICONS.Box, 14)}</span>
                <h3 class="text-sm font-semibold text-surface-200">${g.name}</h3>
                <span class="text-xs text-surface-500">— ${g.description}</span>
              </div>
              ${g.endpoints.map(renderEndpoint).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Bind group filter
    container.querySelectorAll('.doc-group-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedGroup = (btn as HTMLElement).dataset.group || 'all';
        render();
      });
    });

    // Bind "Try it" buttons
    container.querySelectorAll('.try-ep-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const method = (btn as HTMLElement).dataset.method || 'GET';
        const path = (btn as HTMLElement).dataset.path || '';
        store.set({ method, url: path, selectedEndpoint: path, activeTab: 'request' });
      });
    });
  }

  const sub = store.subscribe('activeTab', render);
  cleanups.push(sub);
  cleanups.push(() => { container.innerHTML = ''; });

  render();
  return () => cleanups.forEach((fn) => fn());
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
