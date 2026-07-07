import { store } from './store';
import { sendRequest, checkBackendConnection } from './api';
import { initSidebar } from './components/sidebar';
import { initRequestPanel } from './components/request-panel';
import { initResponsePanel } from './components/response-panel';
import { initTestRunner } from './components/test-runner';
import { initDocsViewer } from './components/docs-viewer';
import { initLogsViewer } from './components/logs-viewer';
import { initConnectionStatus } from './components/connection-status';

const TAB_VIEWS: Record<string, string> = {
  request: 'request-view',
  tests: 'tests-view',
  docs: 'docs-view',
  logs: 'logs-view',
};

const cleanups: (() => void)[] = [];

function showTab(tabId: string): void {
  // Update store
  store.set({ activeTab: tabId });

  // Show/hide views
  const views = document.querySelectorAll<HTMLElement>('[data-view]');
  views.forEach((view) => {
    const isActive = view.dataset.view === TAB_VIEWS[tabId];
    view.classList.toggle('hidden', !isActive);
  });

  // Update tab buttons
  const tabs = document.querySelectorAll<HTMLElement>('[data-tab]');
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabId;
    tab.classList.toggle('text-brand-500', isActive);
    tab.classList.toggle('border-brand-500', isActive);
    tab.classList.toggle('text-surface-400', !isActive);
    tab.classList.toggle('border-transparent', !isActive);
  });
}

function initTabs(): void {
  const tabBar = document.getElementById('tab-bar');
  if (!tabBar) return;

  tabBar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]');
    if (!btn) return;
    const tabId = btn.dataset.tab;
    if (tabId) showTab(tabId);
  });
}

function initSidebarToggle(): void {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    const isOpen = !store.get('sidebarOpen');
    store.set({ sidebarOpen: isOpen });
    sidebar.classList.toggle('w-0', !isOpen);
    sidebar.classList.toggle('w-[280px]', isOpen);
    sidebar.classList.toggle('overflow-hidden', !isOpen);
    sidebar.classList.toggle('border-r', isOpen);
    sidebar.classList.toggle('border-surface-700', isOpen);
  });
}

function initSendButton(): void {
  const sendBtn = document.getElementById('send-btn');
  if (!sendBtn) return;

  sendBtn.addEventListener('click', () => {
    void sendRequest();
  });

  // Keyboard shortcut: Ctrl+Enter to send
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const active = store.get('activeTab');
      if (active === 'request') {
        e.preventDefault();
        void sendRequest();
      }
    }
  });
}

function initConnectionCheck(): void {
  // Auto-check on load
  void checkBackendConnection();

  // Re-check every 30 seconds
  setInterval(() => {
    void checkBackendConnection();
  }, 30_000);
}

async function init(): Promise<void> {
  // Initialize all components
  const sidebarEl = document.getElementById('sidebar');
  if (sidebarEl) {
    cleanups.push(initSidebar(sidebarEl));
  }

  const requestPanelEl = document.getElementById('request-panel');
  if (requestPanelEl) {
    cleanups.push(initRequestPanel(requestPanelEl));
  }

  const responsePanelEl = document.getElementById('response-panel');
  if (responsePanelEl) {
    cleanups.push(initResponsePanel(responsePanelEl));
  }

  const testRunnerEl = document.getElementById('test-runner');
  if (testRunnerEl) {
    cleanups.push(initTestRunner(testRunnerEl));
  }

  const docsViewerEl = document.getElementById('docs-viewer');
  if (docsViewerEl) {
    cleanups.push(initDocsViewer(docsViewerEl));
  }

  const logsViewerEl = document.getElementById('logs-viewer');
  if (logsViewerEl) {
    cleanups.push(initLogsViewer(logsViewerEl));
  }

  const connectionStatusEl = document.getElementById('connection-status');
  if (connectionStatusEl) {
    cleanups.push(initConnectionStatus(connectionStatusEl));
  }

  // Init tabs, sidebar toggle, send button
  initTabs();
  initSidebarToggle();
  initSendButton();
  initConnectionCheck();

  // Show initial tab
  showTab(store.get('activeTab'));
}

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { void init(); });
} else {
  void init();
}
