import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadMiddleware({ user, sessionToken = 'session', cookieToken, apiError = false }) {
    const calls = [];
    const context = vm.createContext({
        URL, process: { env: { NEXT_PUBLIC_API_URL: 'https://api.example.test', NEXTAUTH_SECRET: 'test' } },
        fetch: async (url, options) => {
            calls.push({ url, ...options });
            if (apiError) throw new Error('Unavailable');
            return { ok: Boolean(user), json: async () => user };
        },
    });
    const roles = new vm.SourceTextModule(await readFile(new URL('../src/lib/roles.js', import.meta.url), 'utf8'), { context });
    const next = new vm.SyntheticModule(['NextResponse'], function () {
        this.setExport('NextResponse', { redirect: url => ({ redirect: url.pathname + url.search }), next: () => ({ allowed: true }) });
    }, { context });
    const jwt = new vm.SyntheticModule(['getToken'], function () {
        // Deliberately stale token role: middleware must rely on the database response.
        this.setExport('getToken', async () => sessionToken ? { sessionToken, role: 'admin' } : null);
    }, { context });
    const module = new vm.SourceTextModule(await readFile(new URL('../src/middleware.js', import.meta.url), 'utf8'), { context });
    await module.link(specifier => {
        if (specifier === 'next/server') return next;
        if (specifier === 'next-auth/jwt') return jwt;
        if (specifier === './lib/roles') return roles;
        throw new Error(`Unexpected import ${specifier}`);
    });
    await module.evaluate();
    return {
        calls,
        request: path => module.namespace.middleware({
            url: `https://app.example.test${path}`,
            nextUrl: new URL(`https://app.example.test${path}`),
            cookies: { get: () => cookieToken ? { value: cookieToken } : undefined },
        }),
    };
}

test('ordinary users cannot open reseller or admin pages despite stale admin token claims', async () => {
    const app = await loadMiddleware({ user: { role: 'user', isUser: 1 } });
    for (const path of ['/reseller/dashboard', '/reseller/customer', '/reseller/brand', '/admin/customer']) {
        assert.equal((await app.request(path)).redirect, '/forms');
    }
    assert.equal((await app.request('/forms')).allowed, true);
    assert.ok(app.calls.every(call => call.cache === 'no-store'));
});

test('reseller dashboard redirect and admin denial come from live database role', async () => {
    const app = await loadMiddleware({ user: { role: 'reseller', isUser: 1 } });
    assert.equal((await app.request('/forms')).redirect, '/reseller/dashboard');
    assert.equal((await app.request('/admin/dashboard')).redirect, '/reseller/dashboard');
    assert.equal((await app.request('/reseller/customer')).allowed, true);
});

test('admin Google login reaches admin while existing password staff remain supported', async () => {
    const admin = await loadMiddleware({ user: { role: 'admin', isUser: 0 } });
    assert.equal((await admin.request('/forms')).redirect, '/admin/dashboard');
    assert.equal((await admin.request('/admin/customer')).allowed, true);
    assert.equal((await admin.request('/reseller/dashboard')).redirect, '/admin/dashboard');
    const staff = await loadMiddleware({ user: { role: 'user', isUser: 0 }, sessionToken: null, cookieToken: 'signed-cookie' });
    assert.equal((await staff.request('/admin/list')).allowed, true);
    assert.equal(staff.calls[0].headers.Cookie, 'token=signed-cookie');
});

test('missing, expired and unavailable authentication fail closed', async () => {
    for (const options of [{ sessionToken: null }, {}, { apiError: true }]) {
        const app = await loadMiddleware(options);
        assert.equal((await app.request('/reseller/customer')).redirect, '/?error=SessionExpired');
        assert.equal((await app.request('/admin/customer')).redirect, '/login');
    }
});
