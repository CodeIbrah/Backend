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
  const cls = `method-badge method-${method.toLowerCase()}`;
  return `<span class="${cls}">${method}</span>`;
}

export function initSidebar(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  let searchQuery = '';

  function render(): void {
    const isOpen = store.get('sidebarOpen');
    const selected = store.get('selectedEndpoint');
    const groups = searchQuery
      ? endpointGroups
          .map((g) => ({
            ...g,
            endpoints: g.endpoints.filter(
              (e) =>
                e.path.toLowerCase().includes(searchQuery) ||
                e.summary.toLowerCase().includes(searchQuery),
            ),
          }))
          .filter((g) => g.endpoints.length > 0)
      : endpointGroups;

    container.innerHTML = `
      <div class="flex items-center justify-between px-4 py-3 border-b border-surface-700">
        <span class="text-xs font-semibold text-surface-400 uppercase tracking-wider">Endpoints</span>
        <button id="sidebar-toggle-btn" class="text-surface-500 hover:text-surface-300 p-1 rounded transition-colors" title="Toggle sidebar">
          ${svg('<path d="m6 9 6 6 6-6"/>', 14)}
        </button>
      </div>
      <div class="px-3 py-2">
        <div class="relative">
          ${svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', 13)}
          <input
            id="sidebar-search"
            type="text"
            placeholder="Search endpoints..."
            value="${searchQuery}"
            class="w-full bg-surface-800 border border-surface-700 rounded pl-7 pr-2 py-1.5 text-xs text-surface-200 placeholder-surface-500 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>
      </div>
      <div class="flex-1 overflow-y-auto px-2 pb-4 space-y-1 sidebar-list">
        ${groups
          .map(
            (group) => `
          <div class="mb-2">
            <div class="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">
              ${svg(ICONS[group.icon] || ICONS.Box, 12)}
              ${group.name}
            </div>
            <div class="space-y-0.5">
              ${group.endpoints
                .map(
                  (ep) => `
                <button
                  class="sidebar-ep w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors hover:bg-surface-800/60 text-left ${
                    selected === ep.path ? 'bg-brand-500/10 text-brand-400' : 'text-surface-300'
                  }"
                  data-method="${ep.method}"
                  data-path="${ep.path}"
                >
                  ${methodBadge(ep.method)}
                  <span class="font-mono truncate flex-1">${ep.path.replace('/api/v1/', '')}</span>
                </button>
              `,
                )
                .join('')}
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
    `;

    // Re-bind events
    const toggle = container.querySelector('#sidebar-toggle-btn');
    toggle?.addEventListener('click', () => {
      store.set({ sidebarOpen: false });
    });

    const searchInput = container.querySelector<HTMLInputElement>('#sidebar-search');
    searchInput?.addEventListener('input', (e) => {
      searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
      render();
    });

    container.querySelectorAll('.sidebar-ep').forEach((btn) => {
      btn.addEventListener('click', () => {
        const method = (btn as HTMLElement).dataset.method || 'GET';
        const path = (btn as HTMLElement).dataset.path || '';
        store.set({ method, url: path, selectedEndpoint: path });

        // Find endpoint doc and load body/headers
        for (const group of endpointGroups) {
          const ep = group.endpoints.find((e) => e.path === path && e.method === method);
          if (ep) {
            if (ep.body && ['POST', 'PATCH', 'PUT'].includes(ep.method)) {
              store.set({ body: ep.body.example, bodyType: 'json' });
            } else {
              store.set({ body: '{}', bodyType: 'none' });
            }
            const hdrs = (ep.headers || []).map((h) => ({ key: h.name, value: h.value }));
            store.set({ headers: hdrs, params: [] });
            break;
          }
        }
      });
    });
  }

  const unsub1 = store.subscribe('sidebarOpen', render);
  const unsub2 = store.subscribe('selectedEndpoint', render);
  cleanups.push(unsub1, unsub2);
  cleanups.push(() => { container.innerHTML = ''; });

  render();
  return () => cleanups.forEach((fn) => fn());
}
