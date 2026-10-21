import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {here,convert,priceTargets} from './text-content.mjs';
const root=path.resolve(here,'..');
const site=JSON.parse(fs.readFileSync(path.join(root,'content/templates/site-config.json'))),menu=JSON.parse(fs.readFileSync(path.join(root,'content/templates/menu.json')));
const source=Object.fromEntries(['お知らせ.txt','日替わり.txt','商品価格.txt'].map(f=>[f,fs.readFileSync(path.join(root,'tests/fixtures/text-content',f),'utf8')]));
const run=(input=source)=>convert(input,site,menu);
test('全データが現行サイトと一致し元データを変更しない',()=>{assert.deepEqual(run(),{site,menu});assert.equal(priceTargets(menu).length,44);});
test('３種類の変更・全角数字・改行・記号を保持し日替わり価格を同期',()=>{const input={...source,'お知らせ.txt':source['お知らせ.txt'].replace(site.news.title,'試作のお知らせ').replace(site.news.body,'一行目「引用」, 記号\n二行目'),'日替わり.txt':source['日替わり.txt'].replace('月：10','月：１１').replace('鶏天&おろしハンバーグ','試作料理'),'商品価格.txt':source['商品価格.txt'].replace('桜桃：700','桜桃：７５０円').replace('グレート竜田：1000','グレート竜田：1,050')};const r=run(input);assert.equal(r.site.news.title,'試作のお知らせ');assert.equal(r.site.news.body,'一行目「引用」, 記号\n二行目');assert.equal(r.site.daily.month,'11月');assert.equal(r.site.daily.schedule[0].items[0],'試作料理');assert.equal(r.site.daily.price,750);assert.equal(r.menu.items.find(i=>i.isDaily).price,750);assert.equal(r.menu.items[0].price,1050);});
for(const [label,file,change]of [
 ['存在しない日付','お知らせ.txt',s=>s.replace('2026-10-19','2026-02-30')],
 ['本文なし','お知らせ.txt',s=>s.slice(0,s.indexOf('本文：'))],
 ['曜日重複','日替わり.txt',s=>s+'\n【月曜日】\n料理'],
 ['曜日不足','日替わり.txt',s=>s.slice(0,s.indexOf('【土曜日】'))],
 ['月不正','日替わり.txt',s=>s.replace('月：10','月：13')],
 ['価格漏れ','商品価格.txt',s=>s.split('\n').slice(1).join('\n')],
 ['商品重複','商品価格.txt',s=>s+'桜桃：700\n'],
 ['知らない商品','商品価格.txt',s=>s+'知らない商品：800\n'],
 ['負の価格','商品価格.txt',s=>s.replace('桜桃：700','桜桃：-700')],
 ['小数価格','商品価格.txt',s=>s.replace('桜桃：700','桜桃：700.5')],
 ['不正な桁区切り','商品価格.txt',s=>s.replace('桜桃：700','桜桃：7,00')],
])test(label+'を日本語で拒否',()=>assert.throws(()=>run({...source,[file]:change(source[file])}),new RegExp(file)));
test('Windows改行・BOM・半角コロンを許容',()=>assert.deepEqual(run(Object.fromEntries(Object.entries(source).map(([k,v])=>[k,'\uFEFF'+v.replaceAll('：',':').replaceAll('\n','\r\n')]))),{site,menu}));
