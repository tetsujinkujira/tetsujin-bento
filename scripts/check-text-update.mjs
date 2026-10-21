// 技術担当向け：編集→ビルド→画面と、誤入力時の公開停止をローカルで確認する。
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {chromium} from '@playwright/test';
import {loadContent,priceTargets} from './text-content.mjs';
const root=path.resolve(import.meta.dirname,'..');
const directory=path.join(root,'更新データ');
const files=['お知らせ.txt','日替わり.txt','商品価格.txt'];
const saved=Object.fromEntries(files.map(f=>[f,fs.readFileSync(path.join(directory,f),'utf8')]));
const before=loadContent();
const runBuild=()=>spawnSync('npm',['run','build'],{cwd:root,encoding:'utf8'});
let server,browser;
try{
 fs.writeFileSync(path.join(directory,'お知らせ.txt'),saved['お知らせ.txt'].replace('件名：','件名：変換動作確認 '));
 fs.writeFileSync(path.join(directory,'日替わり.txt'),saved['日替わり.txt'].replace('【月曜日】','【月曜日】\n変換動作確認のおかず'));
 fs.writeFileSync(path.join(directory,'商品価格.txt'),saved['商品価格.txt'].replace(/[：:]\s*(\d+)/g,(_,n)=>`：${Number(n)+17}`));
 let result=runBuild();assert.equal(result.status,0,result.stdout+result.stderr);
 const expected=loadContent();const published=JSON.parse(fs.readFileSync(path.join(root,'dist/data/menu.json')));
 assert.deepEqual(published,expected.menu);
 priceTargets(published).forEach((item,i)=>assert.equal(item.price,priceTargets(before.menu)[i].price+17));
 server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4176','--strictPort'],{cwd:root,stdio:'ignore'});
 for(let i=0;i<50;i++){try{const r=await fetch('http://127.0.0.1:4176/');if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();
 for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),page=await context.newPage();
 await page.goto('http://127.0.0.1:4176/');await page.waitForFunction(()=>document.querySelector('#ticker-title')?.textContent.includes('変換動作確認'));
 assert.ok((await page.locator('#kanban-price').innerText()).includes((before.menu.items[0].price+17).toLocaleString('en-US')));
 await page.goto('http://127.0.0.1:4176/menu.html');await page.waitForFunction(()=>document.querySelector('#daily-schedule')?.textContent.includes('変換動作確認のおかず'));
 assert.ok((await page.locator('#daily-price').innerText()).includes(String(expected.site.daily.price)));
 const body=await page.locator('body').innerText();assert.ok(body.includes(`+¥${expected.menu.options.oomori.price}`));assert.ok(!body.includes(`+¥${before.menu.options.oomori.price}`));
 for(const item of priceTargets(published).filter(i=>i.name!==published.options.oomori.name))assert.ok(body.includes(`¥${item.price.toLocaleString('en-US')}`),item.name);
 await context.close();console.log(`${width}px：３テキスト・44価格の変換と画面反映を確認`);
 }
 const built=fs.readFileSync(path.join(root,'dist/data/menu.json'),'utf8');
 fs.writeFileSync(path.join(directory,'商品価格.txt'),'桜桃：間違い\n');result=runBuild();assert.notEqual(result.status,0);assert.match(result.stdout+result.stderr,/商品価格.txt/);assert.equal(fs.readFileSync(path.join(root,'dist/data/menu.json'),'utf8'),built);
 console.log('誤入力時はビルドを中止し、直前の成果物を変更しないことを確認');
}finally{
 if(browser)await browser.close();if(server)server.kill();for(const f of files)fs.writeFileSync(path.join(directory,f),saved[f]);
 const restored=runBuild();assert.equal(restored.status,0,restored.stdout+restored.stderr);
}
