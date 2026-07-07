import { store } from '../store';
import { sendRequest } from '../api';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const SUBTABS = ['params', 'headers', 'body', 'auth'];

function svg(path: string, size = 16): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">${path}</svg>`;
}

function kvsEditor(
  id: string,
  items: { key: string; value: string }[],
  keyPlaceholder: string,
  valPlaceholder: string,
): string {
  return `
    <div id="${id}">
      ${items
        .map(
          (item, i) => `
        <div class="kv-row flex gap-2 mb-1.5" data-index="${i}">
          <input class="kv-key flex-1 px-2 py-1.5 text-xs bg-surface-800 border border-surface-700 rounded text-surface-200 font-mono placeholder-surface-500 focus:outline-none focus:border-brand-500/50" value="${item.key}" placeholder="${keyPlaceholder}" />
          <input class="kv-val flex-[2] px-2 py-1.5 text-xs bg-surface-800 border border-surface-700 rounded text-surface-200 font-mono placeholder-surface-500 focus:outline-none focus:border-brand-500/50" value="${item.value}" placeholder="${valPlaceholder}" />
          <button class="kv-remove text-surface-500 hover:text-red-400 transition-colors p-1" title="Remove">${svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 13)}</button>
        </div>
      `,
        )
        .join('')}
      <button class="kv-add text-xs text-brand-400 hover:text-brand-300 transition-colors mt-1 flex items-center gap-1">
        ${svg('<path d="M5 12h14"/><path d="M12 5v14"/>', 12)} Add
      </button>
    </div>
  `;
}

function bindKvEditor(
  container: HTMLElement,
  id: string,
  getItems: () => { key: string; value: string }[],
  setItems: (items: { key: string; value: string }[]) => void,
): void {
  const el = container.querySelector(`#${id}`);
  if (!el) return;

  function readItems(): { key: string; value: string }[] {
    const rows = el.querySelectorAll('.kv-row');
    return Array.from(rows).map((row) => ({
      key: (row.querySelector('.kv-key') as HTMLInputElement)?.value || '',
      value: (row.querySelector('.kv-val') as HTMLInputElement)?.value || '',
    }));
  }

  el.addEventListener('input', () => {
    setItems(readItems());
  });

  el.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.kv-remove')) {
      const row = target.closest('.kv-row') as HTMLElement;
      if (row) {
        const items = readItems();
        const idx = Number(row.dataset.index);
        items.splice(idx, 1);
        setItems(items);
        renderKvRows(el as HTMLElement, id, items, keyPlaceholder(id), valPlaceholder(id));
      }
    }
    if (target.closest('.kv-add')) {
      const items = [...getItems(), { key: '', value: '' }];
      setItems(items);
      renderKvRows(el as HTMLElement, id, items, keyPlaceholder(id), valPlaceholder(id));
    }
  });
}

function keyPlaceholder(id: string): string {
  return id === 'req-headers-editor' ? 'Header name' : 'Param name';
}
function valPlaceholder(id: string): string {
  return id === 'req-headers-editor' ? 'Value' : 'Value';
}

function renderKvRows(
  el: HTMLElement,
  id: string,
  items: { key: string; value: string }[],
  kp: string,
  vp: string,
): void {
  el.innerHTML = kvsEditor(id, items, kp, vp);
}

export function initRequestPanel(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  function render(): void {
    const method = store.get('method');
    const url = store.get('url');
    const subTab = store.get('requestSubTab');
    const body = store.get('body');
    const bodyType = store.get('bodyType');
    const headers = store.get('headers');
    const params = store.get('params');
    const authToken = store.get('authToken');
    const isLoading = store.get('isLoading');
    const error = store.get('error');

    container.innerHTML = `
      <div class="bg-surface-900 rounded-lg border border-surface-700 overflow-hidden">
        <!-- URL bar -->
        <div class="flex items-center gap-2 p-3 border-b border-surface-700">
          <select id="req-method" class="method-select bg-surface-800 border border-surface-700 rounded px-2 py-1.5 text-xs font-mono font-bold text-surface-200 focus:outline-none focus:border-brand-500/50">
            ${METHODS.map((m) => `<option value="${m}" ${m === method ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
          <input id="req-url" type="text" value="${url}" placeholder="/api/v1/health" class="flex-1 bg-surface-800 border border-surface-700 rounded px-3 py-1.5 text-xs font-mono text-surface-200 placeholder-surface-500 focus:outline-none focus:border-brand-500/50" />
          <button id="send-btn" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded transition-colors disabled:opacity-50" ${isLoading ? 'disabled' : ''}>
            ${isLoading ? svg('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>', 14) : svg('<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/>', 14)}
            ${isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>

        <!-- Sub-tabs -->
        <div class="flex gap-0 px-3 border-b border-surface-700">
          ${SUBTABS.map(
            (st) => `
            <button class="req-subtab px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              subTab === st ? 'text-brand-500 border-brand-500' : 'text-surface-400 border-transparent hover:text-surface-200'
            }" data-subtab="${st}">
              ${st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          `,
          ).join('')}
        </div>

        <!-- Tab content -->
        <div class="p-3">
          <!-- Params -->
          <div class="subtab-content ${subTab === 'params' ? '' : 'hidden'}">
            ${kvsEditor('req-params-editor', params, 'Key', 'Value')}
          </div>

          <!-- Headers -->
          <div class="subtab-content ${subTab === 'headers' ? '' : 'hidden'}">
            ${kvsEditor('req-headers-editor', headers, 'Header name', 'Value')}
          </div>

          <!-- Body -->
          <div class="subtab-content ${subTab === 'body' ? '' : 'hidden'}">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs text-surface-400">Content-Type:</span>
              <select id="req-body-type" class="bg-surface-800 border border-surface-700 rounded px-2 py-1 text-xs text-surface-200 focus:outline-none focus:border-brand-500/50">
                <option value="none" ${bodyType === 'none' ? 'selected' : ''}>None</option>
                <option value="json" ${bodyType === 'json' ? 'selected' : ''}>application/json</option>
                <option value="form" ${bodyType === 'form' ? 'selected' : ''}>application/x-www-form-urlencoded</option>
                <option value="text" ${bodyType === 'text' ? 'selected' : ''}>text/plain</option>
              </select>
            </div>
            <textarea id="req-body" class="w-full bg-surface-800 border border-surface-700 rounded px-3 py-2 text-xs font-mono text-surface-200 placeholder-surface-500 focus:outline-none focus:border-brand-500/50 resize-y" placeholder='{ "key": "value" }' rows="10" ${bodyType === 'none' ? 'disabled' : ''}>${body}</textarea>
          </div>

          <!-- Auth -->
          <div class="subtab-content ${subTab === 'auth' ? '' : 'hidden'}">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs text-surface-400">Type:</span>
              <span class="text-xs font-medium text-surface-200 bg-surface-800 px-2 py-1 rounded">Bearer Token</span>
            </div>
            <div class="flex gap-2">
              <input id="req-auth-token" type="password" value="${authToken || ''}" placeholder="eyJhbGciOiJIUzI1NiIs..." class="flex-1 bg-surface-800 border border-surface-700 rounded px-3 py-1.5 text-xs font-mono text-surface-200 placeholder-surface-500 focus:outline-none focus:border-brand-500/50" />
              <button id="req-auth-apply" class="px-3 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded transition-colors">Apply</button>
              <button id="req-auth-clear" class="px-3 py-1.5 text-xs font-medium text-surface-400 hover:text-surface-200 border border-surface-700 rounded transition-colors">Clear</button>
            </div>
            ${authToken ? '<p class="text-xs text-green-400 mt-2 flex items-center gap-1">' + svg('<path d="M20 6 9 17l-5-5"/>', 12) + ' Token set</p>' : ''}
          </div>
        </div>

        <!-- Error banner -->
        ${error ? `<div class="mx-3 mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 flex items-center gap-2">${svg('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>', 14)} ${error}</div>` : ''}
      </div>
    `;

    // Bind method select
    const methodSel = container.querySelector<HTMLSelectElement>('#req-method');
    methodSel?.addEventListener('change', () => {
      store.set({ method: methodSel.value });
    });

    // Bind URL input
    const urlInput = container.querySelector<HTMLInputElement>('#req-url');
    urlInput?.addEventListener('input', () => {
      store.set({ url: urlInput.value });
    });

    // Bind send button
    const sendBtn = container.querySelector('#send-btn');
    sendBtn?.addEventListener('click', () => {
      void sendRequest();
    });

    // Bind sub-tabs
    container.querySelectorAll('.req-subtab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.subtab || 'params';
        store.set({ requestSubTab: tab });
      });
    });

    // Bind KV editors
    bindKvEditor(container, 'req-params-editor',
      () => store.get('params'),
      (items) => store.set({ params: items }),
    );
    bindKvEditor(container, 'req-headers-editor',
      () => store.get('headers'),
      (items) => store.set({ headers: items }),
    );

    // Bind body
    const bodyEl = container.querySelector<HTMLTextAreaElement>('#req-body');
    bodyEl?.addEventListener('input', () => {
      store.set({ body: bodyEl.value });
    });
    const bodyTypeEl = container.querySelector<HTMLSelectElement>('#req-body-type');
    bodyTypeEl?.addEventListener('change', () => {
      store.set({ bodyType: bodyTypeEl.value });
      render();
    });

    // Bind auth
    const authTokenInput = container.querySelector<HTMLInputElement>('#req-auth-token');
    const authApply = container.querySelector('#req-auth-apply');
    authApply?.addEventListener('click', () => {
      store.set({ authToken: authTokenInput?.value || null });
    });
    const authClear = container.querySelector('#req-auth-clear');
    authClear?.addEventListener('click', () => {
      store.set({ authToken: null });
      if (authTokenInput) authTokenInput.value = '';
    });
  }

  // Subscribe to relevant state changes
  const subs = ['method', 'url', 'requestSubTab', 'body', 'bodyType', 'authToken', 'isLoading', 'error', 'headers', 'params']
    .map((k) => store.subscribe(k as any, render));
  cleanups.push(...subs);
  cleanups.push(() => { container.innerHTML = ''; });

  render();
  return () => cleanups.forEach((fn) => fn());
}
