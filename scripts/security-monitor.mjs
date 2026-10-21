import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const digest = value => createHash('sha256').update(value).digest('hex');
export const findingKey = finding => digest(JSON.stringify(finding));
const normalizeRange = value => value.replace(/\s/g, '');

export function auditFindings(audit, lock, reviewed) {
  if (!audit?.metadata?.vulnerabilities || !audit.vulnerabilities || audit.error) throw new Error('依存関係の診断結果を取得できません');
  const results = new Map();
  for (const vulnerability of Object.values(audit.vulnerabilities)) {
    if (!Array.isArray(vulnerability.via)) throw new Error('依存関係の診断形式が変わりました');
    for (const via of vulnerability.via) {
      if (typeof via === 'string') continue; // 根本のアドバイザリに集約する。
      const id = via.url?.match(/GHSA-[\w-]+/)?.[0];
      if (!id) throw new Error('識別できない脆弱性情報があります');
      const nodes = vulnerability.nodes || [];
      const versions = [...new Set(nodes.map(node => lock.packages[node]?.version))].sort();
      if (!versions.length || versions.includes(undefined)) throw new Error('診断対象のバージョンを特定できません');
      const known = reviewed.find(entry => entry.id === id && entry.package === via.name && entry.severity === via.severity && normalizeRange(entry.range) === normalizeRange(via.range) && JSON.stringify(entry.versions) === JSON.stringify(versions));
      if (!known) results.set(`${id}:${via.name}`, {
        type: 'dependency', id, package: via.name, versions, severity: via.severity, range: normalizeRange(via.range),
        message: `${via.name} に未確認の脆弱性情報があります。公開サイトへの影響は調査が必要です。`,
        url: via.url,
      });
    }
  }
  return [...results.values()];
}

export function comparePublished(path, expected, actual) {
  // Service Workerのビルド時刻だけは毎回変わる。その他の差分は許容しない。
  const normalize = value => path === 'sw.js' ? value.toString().replace(/const CACHE_VERSION = '[^']+';/, "const CACHE_VERSION = '__BUILD_TIMESTAMP__';") : value;
  return digest(normalize(expected)) === digest(normalize(actual));
}

export async function github(path, { token, method = 'GET', body } = {}) {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('不正なGitHub APIパスです');
  const response = await fetch(`https://api.github.com${path}`, {
    method, signal: AbortSignal.timeout(30000),
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`GitHub APIの確認に失敗しました (${response.status})`);
  return { data: response.status === 204 ? null : await response.json(), link: response.headers.get('link') || '' };
}

export async function allPages(path, options, request = github) {
  const results = [];
  for (let page = 1; page <= 30; page++) {
    const result = await request(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`, options);
    if (!Array.isArray(result.data)) throw new Error('GitHubの一覧データ形式が変わりました');
    results.push(...result.data);
    if (!result.link.includes('rel="next"')) return results;
  }
  throw new Error('確認対象が多すぎるため、監視設定の点検が必要です');
}

export function notificationBody(finding, { contact, runUrl }) {
  return `@${contact}\n\n**サイトの点検・調査を依頼してください。管理者ご自身でコードを変更する必要はありません。**\n\n` +
    `これは確認が必要になった通知です。侵入・改ざんを確認したと断定するものではありません。\n\n` +
    `対象：手作り弁当喰楽部 鉄人\n\n検出内容：${finding.message}\n\n` +
    (finding.url ? `確認情報：${finding.url}\n\n` : '') +
    `監視結果：${runUrl}\n\n` +
    `対応：このIssueのURLを保守担当者に渡し、以下の文面で調査を依頼してください。\n\n` +
    `> 鉄人サイトのセキュリティ監視から通知が届きました。このIssueの内容を調査し、対応が必要であれば、現在の更新運用を変えずに修正・テストしてください。本番反映前に結果を報告してください。\n\n` +
    `未解決の同じ問題を毎週繰り返し通知することはありません。修正または技術担当者による対応不要の設定が完了してから、このIssueを閉じてください。解消前に閉じた場合や解消後に同じ問題が再発した場合は再通知します。\n\n` +
    `<!-- tetsujin-security-monitor:${findingKey(finding)} -->`;
}

export async function notifyFindings(findings, config, { token, runUrl, request = github }) {
  if (!findings.length) return [];
  const issues = await allPages(`/repos/${config.repository}/issues?state=all&creator=github-actions%5Bbot%5D&sort=created&direction=desc`, { token }, request);
  const created = [];
  for (const finding of findings) {
    const marker = `<!-- tetsujin-security-monitor:${findingKey(finding)} -->`;
    const existing = issues.find(issue => !issue.pull_request && issue.user?.login === 'github-actions[bot]' && issue.body?.includes(marker));
    if (existing?.state === 'open') continue;
    if (existing) {
      const result = await request(`/repos/${config.repository}/issues/${existing.number}`, { token, method: 'PATCH', body: { state: 'open', body: notificationBody(finding, { contact: config.contact, runUrl }) } });
      created.push(result.data.html_url);
      existing.state = 'open';
      continue;
    }
    const result = await request(`/repos/${config.repository}/issues`, {
      token, method: 'POST', body: {
        title: `[サイト点検の依頼] ${finding.type === 'monitor' ? '監視が正常に完了しませんでした' : finding.type === 'integrity' ? '公開内容の確認が必要です' : '使用ライブラリの確認が必要です'}`,
        body: notificationBody(finding, { contact: config.contact, runUrl }),
      },
    });
    created.push(result.data.html_url);
    issues.push({ ...result.data, state: 'open', user: { login: 'github-actions[bot]' }, body: notificationBody(finding, { contact: config.contact, runUrl }) });
  }
  return created;
}

async function main() {
  const config = JSON.parse(readFileSync('monitoring/config.json', 'utf8'));
  if (config.repository !== 'tetsujinkujira/tetsujin-bento' || !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/.test(config.contact)) throw new Error('監視対象または通知先の設定を確認してください');
  const token = process.env.GITHUB_TOKEN;
  const findings = [];
  const problem = component => findings.push({ type: 'monitor', component, message: `${component}の確認が完了しませんでした。監視が停止していないか、保守担当者へ点検を依頼してください。` });
  const step = async (name, run) => {
    try { await run(); } catch (error) { console.error(`${name}: ${error.message}`); problem(name); }
  };
  if (process.env.MONITOR_PRECHECK_FAILED === 'true') problem('監視プログラムのテストまたはビルド');
  await step('依存ライブラリの診断', async () => {
    let output;
    try { output = execFileSync('npm', ['audit', '--package-lock-only', '--ignore-scripts', '--json'], { encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024 }); }
    catch (error) { if (error.status !== 1 || !error.stdout) throw error; output = error.stdout; }
    findings.push(...auditFindings(JSON.parse(output), JSON.parse(readFileSync('package-lock.json')), config.reviewed));
  });
  await step('確認済み警告の修正版', async () => {
    const locked = JSON.parse(readFileSync('package-lock.json')).packages;
    for (const known of config.reviewed) {
      if (!Object.entries(locked).some(([path, pkg]) => (path.endsWith(`/node_modules/${known.package}`) || path === `node_modules/${known.package}`) && known.versions.includes(pkg.version))) continue;
      const { data } = await github(`/advisories/${known.id}`, { token });
      if (data.withdrawn_at) continue;
      const entry = data.vulnerabilities.find(value => value.package.ecosystem === 'npm' && value.package.name === known.package);
      if (!entry) throw new Error('確認済みの警告の情報を特定できません');
      if (entry.first_patched_version !== known.firstPatchedVersion && entry.first_patched_version) findings.push({
        type: 'dependency', id: known.id, package: known.package, patchedVersion: entry.first_patched_version,
        message: `${known.package} の確認済み警告に修正版 ${entry.first_patched_version} が公表されました。更新の要否を調査してください。`, url: data.html_url,
      });
    }
  });
  await step('公開サイトと正規ビルドの比較', async () => {
    if (process.env.GITHUB_SHA) {
      const branch = await github(`/repos/${config.repository}/branches/main`, { token });
      if (branch.data.commit.sha !== process.env.GITHUB_SHA) {
        console.log('点検中に正規の更新があったため、公開内容の比較は次回に行います。');
        return;
      }
      const { data } = await github(`/repos/${config.repository}/actions/workflows/deploy.yml/runs?branch=main&head_sha=${process.env.GITHUB_SHA}&per_page=1`, { token });
      if (data.workflow_runs?.some(run => run.status !== 'completed')) {
        console.log('正規の公開処理が進行中のため、公開内容の比較は次回に行います。');
        return;
      }
    }
    if (!existsSync('dist/index.html')) throw new Error('正規ビルドの比較元がありません');
    const paths = readdirSync('dist', { recursive: true }).map(String).filter(path => /\.(html|js|css|json)$/.test(path));
    const changed = [];
    for (const path of paths) {
      const response = await fetch(`${config.site}/${path.split('/').map(encodeURIComponent).join('/')}`, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(20000) });
      if (!response.ok) { changed.push(path); continue; }
      if (!comparePublished(path, readFileSync(`dist/${path}`), Buffer.from(await response.arrayBuffer()))) changed.push(path);
    }
    const admin = await fetch(`${config.site}/admin/`, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
    if (admin.status !== 404) changed.push('admin/');
    if (changed.length) findings.push({
      type: 'integrity', paths: changed.sort(),
      message: `公開サイトが正規のビルド結果と一致しません（${changed.join('、')}）。更新の公開失敗・反映待ち・不正変更のいずれかを調査してください。`,
    });
  });
  await step('GitHub Actionsの脆弱性', async () => {
    const pins = new Map();
    for (const path of readdirSync('.github/workflows').filter(path => /\.ya?ml$/.test(path))) {
      const text = readFileSync(`.github/workflows/${path}`, 'utf8');
      for (const match of text.matchAll(/uses:\s+(actions\/[a-z-]+)@([a-f0-9]{40})/g)) pins.set(`${match[1]}@${match[2]}`, { name: match[1], sha: match[2] });
    }
    for (const { name, sha } of pins.values()) {
      const tags = await allPages(`/repos/${name}/tags`, { token });
      const tag = tags.find(tag => /^v\d+\.\d+\.\d+$/.test(tag.name) && tag.commit.sha === sha);
      if (!tag) throw new Error(`${name}の固定コミットに対応する版を確認できません`);
      const entries = await allPages(`/advisories?ecosystem=actions&affects=${encodeURIComponent(`${name}@${tag.name.slice(1)}`)}`, { token });
      for (const advisory of entries.filter(entry => !entry.withdrawn_at)) findings.push({
        type: 'dependency', package: name, version: tag.name, id: advisory.ghsa_id, severity: advisory.severity,
        message: `自動公開に使う ${name} ${tag.name} に脆弱性情報があります。公開処理への影響を調査してください。`, url: advisory.html_url,
      });
    }
  });
  const runUrl = process.env.GITHUB_RUN_ID ? `https://github.com/${config.repository}/actions/runs/${process.env.GITHUB_RUN_ID}` : 'ローカルでの動作確認（本番通知なし）';
  const summary = `# セキュリティ監視\n\n${findings.length ? `確認が必要な項目：${findings.length}件` : '新たな対応事項なし。管理者への通知なし。'}\n\n` + findings.map(finding => `- ${finding.message}`).join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  if (process.argv.includes('--notify')) {
    if (!token || process.env.GITHUB_REPOSITORY !== config.repository) throw new Error('本番通知は対象リポジトリのGitHub Actions内だけで実行できます');
    if (findings.length) console.log('新規通知:', await notifyFindings(findings, config, { token, runUrl }));
  } else console.log('動作確認モード：Issue・通知・更新・公開は行っていません。');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
