import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { auditFindings, comparePublished, notificationBody, notifyFindings, allPages } from './security-monitor.mjs';

const config = JSON.parse(readFileSync(new URL('../monitoring/config.json', import.meta.url)));
const lock = { packages: { 'node_modules/braces': { version: '3.0.3' } } };
const audit = () => ({ metadata: { vulnerabilities: { high: 5 } }, vulnerabilities: {
  braces: { nodes: ['node_modules/braces'], via: [{ name: 'braces', url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm', severity: 'high', range: '<=3.0.3' }] },
  tailwindcss: { nodes: ['node_modules/tailwindcss'], via: ['braces'] },
} });
const sample = { type: 'dependency', id: 'GHSA-example-0000', message: '新しい確認事項があります。' };
const options = { contact: config.contact, runUrl: 'https://github.com/example/actions/runs/1' };

test('既知の同条件の警告と波及警告は通知しない', () => {
  assert.deepEqual(auditFindings(audit(), lock, config.reviewed), []);
});
test('危険度の変化・新しい警告・確認外のバージョンを黙殺しない', () => {
  const changed = audit(); changed.vulnerabilities.braces.via[0].severity = 'critical';
  assert.equal(auditFindings(changed, lock, config.reviewed).length, 1);
  const fresh = audit(); fresh.vulnerabilities.braces.via[0].url = 'https://github.com/advisories/GHSA-example-0000';
  assert.equal(auditFindings(fresh, lock, config.reviewed).length, 1);
  assert.equal(auditFindings(audit(), { packages: { 'node_modules/braces': { version: '3.0.2' } } }, config.reviewed).length, 1);
});
test('診断に失敗した結果を正常扱いしない', () => {
  assert.throws(() => auditFindings({ error: { message: 'offline' } }, lock, config.reviewed));
});
test('Service Workerのビルド時刻だけを許容し、コード変更は検出する', () => {
  assert.equal(comparePublished('sw.js', Buffer.from("const CACHE_VERSION = '123';\nself.skipWaiting();"), Buffer.from("const CACHE_VERSION = '456';\nself.skipWaiting();")), true);
  assert.equal(comparePublished('sw.js', Buffer.from("const CACHE_VERSION = '123';\nself.skipWaiting();"), Buffer.from("const CACHE_VERSION = '456';\nmalicious();")), false);
  assert.equal(comparePublished('data/site-config.json', Buffer.from('{"price":700}'), Buffer.from('{"price":1}')), false);
});
test('日本語の通知に管理者とそのまま送れる依頼文がある', () => {
  const body = notificationBody(sample, options);
  assert.ok(body.includes('@tetsujinkujira'));
  assert.ok(body.includes('現在の更新運用を変えずに修正・テストしてください'));
  assert.ok(body.includes('侵入・改ざんを確認したと断定するものではありません'));
});
test('正常時は通知API自体を呼ばない', async () => {
  await notifyFindings([], config, { ...options, request: () => { throw new Error('通知してはいけない'); } });
});
test('新しい異常だけ通知し、同一実行内でも重複送信しない', async () => {
  const calls = [];
  await notifyFindings([sample, sample], config, { ...options, request: async (path, init) => {
    calls.push({ path, init });
    if (init.method === 'POST') return { data: { number: 1, html_url: 'https://github.com/issues/1' } };
    return { data: [], link: '' };
  } });
  assert.equal(calls.filter(call => call.init.method === 'POST').length, 1);
});
test('未解決の同じ警告は毎週通知しない', async () => {
  const calls = [];
  const result = await notifyFindings([sample], config, { ...options, request: async (path, init) => {
    calls.push(init.method);
    return { data: [{ state: 'open', user: { login: 'github-actions[bot]' }, body: notificationBody(sample, options) }], link: '' };
  } });
  assert.deepEqual(result, []);
  assert.equal(calls.length, 1);
});
test('閉じた異常の再発は新しいIssueを乱立せず再通知する', async () => {
  const calls = [];
  await notifyFindings([sample], config, { ...options, request: async (path, init) => {
    calls.push({ path, method: init.method });
    if (init.method === 'PATCH') return { data: { html_url: 'https://github.com/issues/7' } };
    return { data: [{ number: 7, state: 'closed', user: { login: 'github-actions[bot]' }, body: notificationBody(sample, options) }], link: '' };
  } });
  assert.equal(calls[1].method, 'PATCH');
  assert.ok(calls[1].path.endsWith('/issues/7'));
});
test('第三者が似せたIssueで通知を抑止できない', async () => {
  let sent = false;
  await notifyFindings([sample], config, { ...options, request: async (path, init) => {
    if (init.method === 'POST') { sent = true; return { data: { html_url: 'https://github.com/issues/1' } }; }
    return { data: [{ state: 'open', user: { login: 'other-user' }, body: notificationBody(sample, options) }], link: '' };
  } });
  assert.equal(sent, true);
});
test('既存Issueの2ページ目以降も確認して重複通知を避ける', async () => {
  const result = await allPages('/repos/example/issues?state=all', {}, async path => new URL(path, 'https://api.github.com').searchParams.get('page') === '1' ? { data: [1], link: '<next>; rel="next"' } : { data: [2], link: '' });
  assert.deepEqual(result, [1, 2]);
});


test('停止予防の書き込み権限は外部コードを実行しない独立ジョブに限定する', () => {
  const workflow = readFileSync(new URL('../.github/workflows/security-monitor.yml', import.meta.url), 'utf8');
  const keepalive = workflow.split('  keepalive:')[1].split('  check:')[0];
  const check = workflow.split('  check:')[1];
  assert.match(keepalive, /actions: write/);
  assert.match(keepalive, /security-monitor\.yml\/enable/);
  assert.doesNotMatch(keepalive, /uses:|contents:|pages:|id-token:|npm |git push|git commit/);
  assert.doesNotMatch(check, /actions: write|contents: write|pages: write|id-token: write/);
  assert.match(check, /needs: keepalive/);
  assert.match(check, /needs\.keepalive\.result != 'success'/);
});
