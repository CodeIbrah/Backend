import { store } from '../store';
import { checkBackendConnection } from '../api';

function svg(path: string, size = 16): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">${path}</svg>`;
}

export function initConnectionStatus(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  function render(): void {
    const connected = store.get('backendConnected');
    const checking = store.get('connectionChecking');
    const backendUrl = store.get('backendUrl');

    const dotColor = checking ? 'bg-yellow-400' : connected ? 'bg-green-400' : 'bg-red-400';
    const pulseColor = checking ? 'bg-yellow-400/30' : connected ? 'bg-green-400/30' : 'bg-red-400/30';
    const label = checking ? 'Checking...' : connected ? 'Connected' : 'Disconnected';

    container.innerHTML = `
      <div class="flex items-center gap-2 px-3 py-2 border-t border-surface-700 cursor-default" title="Backend: ${backendUrl || window.location.origin}">
        <div class="relative flex items-center justify-center w-3 h-3">
          <div class="absolute w-3 h-3 rounded-full ${pulseColor} ${checking ? 'animate-ping' : ''}"></div>
          <div class="relative w-2 h-2 rounded-full ${dotColor}"></div>
        </div>
        <span class="text-xs text-surface-400">${label}</span>
        <button id="retry-conn-btn" class="ml-auto text-surface-500 hover:text-surface-300 transition-colors p-0.5" title="Re-check connection">
          ${svg('<path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M21 3v6h-6"/>', 12)}
        </button>
      </div>
    `;

    container.querySelector('#retry-conn-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      void checkBackendConnection();
    });
  }

  const subs = ['backendConnected', 'connectionChecking']
    .map((k) => store.subscribe(k as any, render));
  cleanups.push(...subs);
  cleanups.push(() => { container.innerHTML = ''; });

  render();
  return () => cleanups.forEach((fn) => fn());
}
