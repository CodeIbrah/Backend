import { store } from '../store';
import { runSingleTest, runAllTests } from '../api';
import type { TestCase, TestResult } from '../store';

function svg(path: string, size = 16): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">${path}</svg>`;
}

function groupTests(tests: TestCase[]): Map<string, TestCase[]> {
  const groups = new Map<string, TestCase[]>();
  for (const t of tests) {
    const g = t.group || 'Other';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(t);
  }
  return groups;
}

function methodBadge(method: string): string {
  return `<span class="method-badge method-${method.toLowerCase()}">${method}</span>`;
}

export function initTestRunner(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  function render(): void {
    const tests = store.get('tests');
    const results = store.get('testResults');
    const testRunning = store.get('testRunning');
    const testStatus = store.get('testStatus');

    const groups = groupTests(tests);
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const total = tests.length;
    const completed = results.length;

    container.innerHTML = `
      <div class="bg-surface-900 rounded-lg border border-surface-700 overflow-hidden flex flex-col h-full">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-surface-700">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-surface-200">API Tests</span>
            <span class="text-xs text-surface-400">${completed}/${total}</span>
            ${testStatus === 'completed' ? `
              <span class="text-xs flex items-center gap-1 ${failed === 0 ? 'text-green-400' : 'text-red-400'}">
                ${svg(failed === 0 ? '<path d="M20 6 9 17l-5-5"/>' : '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>', 14)}
                ${passed} passed, ${failed} failed
              </span>
            ` : ''}
          </div>
          <button id="run-all-btn" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded transition-colors disabled:opacity-50" ${testRunning ? 'disabled' : ''}>
            ${testRunning ? svg('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>', 14) + ' Running...' : svg('<path d="M5 3l14 9-14 9V3z"/>', 12) + ' Run All'}
          </button>
        </div>

        <!-- Progress bar -->
        ${testRunning ? `
          <div class="h-1 bg-surface-800">
            <div class="h-1 bg-brand-500 transition-all duration-300" style="width:${(completed / total) * 100}%"></div>
          </div>
        ` : ''}

        <!-- Test groups -->
        <div class="flex-1 overflow-y-auto p-3 space-y-4">
          ${groups.size === 0 ? '<div class="text-center text-surface-500 text-xs py-8">No tests configured</div>' : ''}
          ${Array.from(groups.entries()).map(([groupName, groupTests]) => `
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-semibold text-surface-400 uppercase tracking-wider">${groupName}</span>
                <span class="text-[10px] text-surface-500">(${groupTests.length})</span>
              </div>
              <div class="space-y-1">
                ${groupTests.map((test) => {
                  const result = results.find((r) => r.testId === test.id);
                  const isRunning = testRunning;
                  return `
                    <div class="test-card rounded border transition-colors ${
                      result ? (result.passed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5') : 'border-surface-700 bg-surface-800/50 hover:bg-surface-800'
                    }" data-test-id="${test.id}">
                      <div class="flex items-center gap-2 px-3 py-2">
                        ${result
                          ? svg(result.passed ? '<path d="M20 6 9 17l-5-5"/>' : '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>', 14)
                          : svg('<circle cx="12" cy="12" r="10"/>', 14)
                        }
                        ${methodBadge(test.method)}
                        <span class="text-xs font-mono text-surface-300 flex-1 truncate">${test.path}</span>
                        <span class="text-[10px] text-surface-500">→ ${test.expectedStatus}</span>
                        <button class="run-single-btn text-xs text-brand-400 hover:text-brand-300 transition-colors px-2 py-0.5 rounded hover:bg-brand-500/10" ${isRunning ? 'disabled' : ''}>
                          ${result ? 'Re-run' : 'Run'}
                        </button>
                      </div>
                      ${result && !result.passed ? `
                        <div class="px-3 pb-2 text-[10px] font-mono text-red-400 space-y-0.5">
                          ${result.statusCode !== result.expectedStatus ? `<div>Expected ${result.expectedStatus}, got ${result.statusCode}</div>` : ''}
                          ${result.bodyChecks.filter((c) => !c.passed).map((c) => `<div>Body missing: ${c.check}</div>`).join('')}
                          ${result.error ? `<div>${result.error}</div>` : ''}
                        </div>
                      ` : ''}
                      ${result && result.responseTime ? `
                        <div class="px-3 pb-2 text-[10px] text-surface-500">${result.responseTime.toFixed(0)}ms</div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Run All
    container.querySelector('#run-all-btn')?.addEventListener('click', () => {
      void runAllTests();
    });

    // Run single
    container.querySelectorAll('.run-single-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = (btn as HTMLElement).closest('.test-card') as HTMLElement;
        if (card) {
          void runSingleTest(card.dataset.testId || '');
        }
      });
    });
  }

  const subs = ['tests', 'testResults', 'testRunning', 'testStatus']
    .map((k) => store.subscribe(k as any, render));
  cleanups.push(...subs);
  cleanups.push(() => { container.innerHTML = ''; });

  render();
  return () => cleanups.forEach((fn) => fn());
}
