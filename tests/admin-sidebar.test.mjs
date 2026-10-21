import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

async function loadShell({ storage = new Map(), storageBlocked = false } = {}) {
  const state = [];
  const refs = [];
  const effects = [];
  const events = new Map();
  let stateCursor = 0;
  let refCursor = 0;
  let effectCursor = 0;
  let pathname = '/admin/customer';
  const context = vm.createContext({
    window: {
      localStorage: {
        getItem(key) {
          if (storageBlocked) throw new Error('Storage disabled');
          return storage.get(key) ?? null;
        },
        setItem(key, value) {
          if (storageBlocked) throw new Error('Storage disabled');
          storage.set(key, value);
        },
      },
      addEventListener: (type, callback) => events.set(type, callback),
      removeEventListener: (type, callback) => {
        if (events.get(type) === callback) events.delete(type);
      },
    },
  });
  const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [name, value] of Object.entries(values)) this.setExport(name, value);
  }, { context });
  const source = await readFile(new URL('../src/components/admin/AdminShell.js', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: 'component.jsx',
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const module = new vm.SourceTextModule(outputText, { context });
  await module.link(specifier => {
    if (specifier === 'react/jsx-runtime') {
      const jsx = (type, props) => ({ type, props });
      return mock({ jsx, jsxs: jsx });
    }
    if (specifier === 'react') return mock({
      useState: initial => {
        const index = stateCursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
      },
      useRef: initial => {
        const index = refCursor++;
        return refs[index] ?? (refs[index] = { current: initial });
      },
      useEffect: (callback, dependencies) => {
        const index = effectCursor++;
        const previous = effects[index];
        if (previous && dependencies.every((value, i) => Object.is(value, previous.dependencies[i]))) return;
        effects[index] = { callback, dependencies, previousCleanup: previous?.cleanup, pending: true };
      },
    });
    if (specifier === 'next/navigation') return mock({ usePathname: () => pathname });
    if (specifier === 'lucide-react') return mock({ Menu: 'Menu', X: 'X', PanelLeftClose: 'PanelLeftClose', PanelLeftOpen: 'PanelLeftOpen' });
    if (specifier === '@/layout/sidebar') return mock({ default: 'Sidebar' });
    if (specifier.endsWith('.module.css')) return mock({ default: new Proxy({}, { get: (_, name) => name }) });
    throw new Error(`Unexpected import ${specifier}`);
  });
  await module.evaluate();
  const render = () => {
    stateCursor = 0;
    refCursor = 0;
    effectCursor = 0;
    const tree = module.namespace.default({ children: 'Customer content' });
    for (const effect of effects) {
      if (!effect.pending) continue;
      effect.previousCleanup?.();
      effect.cleanup = effect.callback();
      effect.pending = false;
    }
    return tree;
  };
  const find = predicate => nodes(render()).find(predicate);
  // Simulate mount, then the render caused by restoring the saved preference.
  render();
  return {
    render,
    find,
    storage,
    events,
    navigate: nextPathname => { pathname = nextPathname; render(); },
    sidebar: () => find(node => node.type === 'Sidebar'),
    desktopToggle: () => find(node => node.type === 'button' && node.props.className.includes('xl:inline-flex')),
    mobileToggle: () => find(node => node.type === 'button' && node.props['aria-controls'] && node.props.className.includes('xl:hidden')),
  };
}

test('desktop sidebar toggles content state and restores the browser preference after remount', async () => {
  const app = await loadShell();
  assert.equal(app.desktopToggle().props['aria-expanded'], true);
  app.desktopToggle().props.onClick();
  assert.equal(app.sidebar().props.desktopCollapsed, true);
  assert.equal(app.render().props['data-sidebar-collapsed'], true);
  assert.equal(app.desktopToggle().props['aria-expanded'], false);
  assert.equal(app.storage.get('admin-sidebar-collapsed'), 'true');

  const reopened = await loadShell({ storage: app.storage });
  assert.equal(reopened.sidebar().props.desktopCollapsed, true);
  reopened.desktopToggle().props.onClick();
  assert.equal(reopened.sidebar().props.desktopCollapsed, false);
  assert.equal(reopened.storage.get('admin-sidebar-collapsed'), 'false');
});

test('sidebar controls still work if browser storage is unavailable', async () => {
  const app = await loadShell({ storageBlocked: true });
  app.desktopToggle().props.onClick();
  assert.equal(app.sidebar().props.desktopCollapsed, true);
  app.desktopToggle().props.onClick();
  assert.equal(app.sidebar().props.desktopCollapsed, false);
});

test('mobile sidebar closes with Escape, backdrop, navigation and menu links without changing desktop preference', async () => {
  const app = await loadShell({ storage: new Map([['admin-sidebar-collapsed', 'true']]) });
  app.mobileToggle().props.onClick();
  assert.equal(app.sidebar().props.mobileOpen, true);
  app.events.get('keydown')({ key: 'Escape' });
  assert.equal(app.sidebar().props.mobileOpen, false);
  assert.equal(app.events.has('keydown'), false);

  app.mobileToggle().props.onClick();
  app.find(node => node.props?.className === 'overlay').props.onClick();
  assert.equal(app.sidebar().props.mobileOpen, false);
  app.mobileToggle().props.onClick();
  app.navigate('/admin/list');
  assert.equal(app.sidebar().props.mobileOpen, false);
  app.mobileToggle().props.onClick();
  app.sidebar().props.onMobileClose();
  assert.equal(app.sidebar().props.mobileOpen, false);
  assert.equal(app.sidebar().props.desktopCollapsed, true);
});
