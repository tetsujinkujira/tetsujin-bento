import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
function fail(file,line,message){throw new Error(`${file}${line?` ${line}行目`:''}：${message}`);}
function lines(text){return text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n');}
function pair(line,file,n){const match=line.match(/^([^：:]+)[：:]\s*(.*)$/);if(!match)fail(file,n,'「項目：内容」の形で記入してください。');return [match[1].trim(),match[2].trim()];}
function fields(rows,allowed,file){const result={};rows.forEach(([line,n])=>{if(!line.trim())return;const [key,value]=pair(line,file,n);if(!allowed.includes(key))fail(file,n,`「${key}」は使えない項目です。`);if(Object.hasOwn(result,key))fail(file,n,`「${key}」が重複しています。`);if(!value)fail(file,n,`「${key}」を記入してください。`);result[key]=value;});for(const key of allowed)if(!Object.hasOwn(result,key))fail(file,0,`「${key}」がありません。`);return result;}
function digits(value){return value.replace(/[０-９]/g,c=>String(c.charCodeAt(0)-0xff10)).trim();}
function integer(value,min,max,file,label){const v=digits(value);if(!/^\d+$/.test(v)||Number(v)<min||Number(v)>max)fail(file,0,`${label}は${min}〜${max}の整数で記入してください。`);return Number(v);}
export function priceTargets(menu){return [...menu.items.flatMap(i=>[i,...(i.toppings||[])]),...menu.sideMenus.categories.flatMap(c=>c.items),...Object.values(menu.options)];}
export function convert(input,baseSite,baseMenu){
 const site=structuredClone(baseSite),menu=structuredClone(baseMenu);
 const news=lines(input['お知らせ.txt']); const bodyIndex=news.findIndex(l=>/^本文[：:]\s*$/.test(l.trim()));
 if(bodyIndex<0)fail('お知らせ.txt',0,'「本文：」を単独の行に記入し、その下に文章を書いてください。');
 const n=fields(news.slice(0,bodyIndex).map((l,i)=>[l,i+1]),['日付','件名'],'お知らせ.txt');
 const date=digits(n['日付']);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)fail('お知らせ.txt',0,'日付は実在する日を「2026-10-22」の形で記入してください。');
 const body=news.slice(bodyIndex+1).join('\n').trim();if(!body)fail('お知らせ.txt',0,'本文が空です。');
 Object.assign(site.news,{date,title:n['件名'],body});
 const daily=lines(input['日替わり.txt']);let start=daily.findIndex(l=>/^【/.test(l.trim()));if(start<0)fail('日替わり.txt',0,'【月曜日】などの曜日見出しがありません。');
 const d=fields(daily.slice(0,start).map((l,i)=>[l,i+1]),['年','月','商品名','よみがな'],'日替わり.txt');
 const year=integer(d['年'],2000,2100,'日替わり.txt','年'),month=integer(d['月'].replace(/月$/,''),1,12,'日替わり.txt','月');
 const schedule=[];let current;
 daily.slice(start).forEach((raw,i)=>{const line=raw.trim(),num=start+i+1;if(!line)return;const heading=line.match(/^【([月火水木金土])曜日】$/);if(heading){if(schedule.some(s=>s.day===heading[1]))fail('日替わり.txt',num,'同じ曜日が重複しています。');current={day:heading[1],items:[]};schedule.push(current);}else if(/^【/.test(line)){fail('日替わり.txt',num,'曜日見出しは【月曜日】〜【土曜日】の形で記入してください。');}else if(/^備考[：:]/.test(line)){if(Object.hasOwn(current,'note'))fail('日替わり.txt',num,'備考が重複しています。');current.note=pair(line,'日替わり.txt',num)[1];if(!current.note)fail('日替わり.txt',num,'備考が空です。');}else current.items.push(line);});
 for(const day of '月火水木金土'){const entry=schedule.find(s=>s.day===day);if(!entry)fail('日替わり.txt',0,`【${day}曜日】がありません。`);if(!entry.items.length&&!entry.note)fail('日替わり.txt',0,`${day}曜日に料理か備考を記入してください。`);}
 const dailyProduct=menu.items.filter(i=>i.isDaily);if(dailyProduct.length!==1)throw new Error('日替わり商品の設定を技術担当者に確認してください。');
 if(d['商品名']!==dailyProduct[0].name||d['よみがな']!==dailyProduct[0].nameReading)fail('日替わり.txt',0,'商品名・よみがなの変更は商品設定と合わせた調整が必要です。技術担当者に依頼してください。');
 Object.assign(site.daily,{year:String(year),month:`${month}月`,menuName:d['商品名'],menuReading:d['よみがな'],schedule:[...'月火水木金土'].map(day=>schedule.find(s=>s.day===day))});
 const targets=priceTargets(menu);const names=targets.map(i=>i.name);if(new Set(names).size!==names.length)throw new Error('同名商品の区別を技術担当者に依頼してください。');
 const prices=fields(lines(input['商品価格.txt']).map((l,i)=>[l,i+1]),names,'商品価格.txt');
 for(const item of targets){const raw=digits(prices[item.name]).replace(/円$/,'').trim();if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(raw))fail('商品価格.txt',0,`「${item.name}」の価格は数字で記入してください。`);item.price=integer(raw.replaceAll(',',''),1,100000,'商品価格.txt',`${item.name}の価格`);}
 site.daily.price=dailyProduct[0].price;
 const oldExtra=baseMenu.options.oomori.price,newExtra=menu.options.oomori.price;
 for(const category of menu.categories)for(const key of ['description','note'])if(category[key])category[key]=category[key].replaceAll(`+¥${oldExtra}`,`+¥${newExtra}`);
 return {site,menu};
}
export function loadContent(inputDir=path.join(root,'更新データ')) {
 const input=Object.fromEntries(['お知らせ.txt','日替わり.txt','商品価格.txt'].map(f=>[f,fs.readFileSync(path.join(inputDir,f),'utf8')]));
 const baseSite=JSON.parse(fs.readFileSync(path.join(root,'content/templates/site-config.json')));
 const baseMenu=JSON.parse(fs.readFileSync(path.join(root,'content/templates/menu.json')));
 return convert(input,baseSite,baseMenu);
}
export function contentPlugin() {
 let content;
 const load=()=>{content=loadContent();return content;};
 return {
  name:'text-content',
  buildStart(){load();},
  transformIndexHtml(html,ctx){
   if(!content||ctx.server)load();
   if(!ctx.filename.endsWith('menu.html'))return html;
   const baseline=JSON.parse(fs.readFileSync(path.join(root,'content/templates/menu.json')));
   return html.replaceAll(`+¥${baseline.options.oomori.price}`,`+¥${content.menu.options.oomori.price}`);
  },
  writeBundle(){
   // Viteが静的ファイルをコピーした後、公開用データだけを出力する。
   for(const [file,value] of [['site-config.json',content.site],['menu.json',content.menu]]){
    const dest=path.join(root,'dist/data',file);fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.writeFileSync(dest,JSON.stringify(value,null,2)+'\n');
   }
  },
  configureServer(server){
   server.middlewares.use((req,res,next)=>{
    const file=req.url?.split('?')[0];if(!['/data/site-config.json','/data/menu.json'].includes(file))return next();
    try{const data=load();res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(file.includes('site-config')?data.site:data.menu));}
    catch(error){res.statusCode=500;res.end(JSON.stringify({error:error.message}));}
   });
  }
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{loadContent();console.log('テキスト入力チェック成功。公開用JSONを生成できます。');}
 catch(error){console.error(`更新を中止しました。\n${error.message}\n公開サイトは変更しません。`);process.exitCode=1;}
}
