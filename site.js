const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 自动测量固定导航和页脚，屏高随窗口大小变化；不裁切展开后的内容。
const updateScreenMetrics=()=>{
 const root=document.documentElement;
 root.style.setProperty('--screen-header-height',`${document.querySelector('header').getBoundingClientRect().height}px`);
 root.style.setProperty('--screen-footer-height',`${document.querySelector('footer').getBoundingClientRect().height}px`);
};
const screenObserver=new ResizeObserver(updateScreenMetrics);
screenObserver.observe(document.querySelector('header'));
screenObserver.observe(document.querySelector('footer'));
updateScreenMetrics();
fetch('data/bio.txt').then(r=>r.text()).then(t=>document.querySelector('#full-bio').textContent=t.replace(/^Bio\s*/,''));
function paperHTML(p,index,numbered=true){return `<article class="paper"><div class="year">${p.year}${numbered?`<span class="paper-number">[${index}]</span>`:''}</div><div><h3><a href="${escapeHTML(p.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(p.title)}</a></h3><p class="authors">${p.authors.map(a=>a==='Xiangxinyue Meng'?`<strong>${escapeHTML(a)}</strong>`:escapeHTML(a)).join('; ')}.</p><p class="journal">${escapeHTML(p.journal)}${p.volume?`, ${escapeHTML(p.volume)}`:''}${p.issue?` (${escapeHTML(p.issue)})`:''}${p.pages?`, ${escapeHTML(p.pages)}`:''} · ${p.year}</p></div><a href="${escapeHTML(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open publication: ${escapeHTML(p.title)}">↗</a></article>`}
fetch('data/publications.json').then(r=>{if(!r.ok)throw Error('Publication data unavailable');return r.json()}).then(papers=>{papers.sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));document.querySelector('#paper-count').textContent=papers.length;document.querySelector('#total-label').textContent=papers.length;const selected=['10.5194/acp-24-2399-2024','10.1021/acs.est.0c05478'];document.querySelector('#selected-papers').innerHTML=papers.filter(p=>selected.includes(p.doi)&&p.authors[0]==='Xiangxinyue Meng').map(p=>paperHTML(p,0,false)).join('');const years=[...new Set(papers.map(p=>p.year))];document.querySelector('#year-filter').insertAdjacentHTML('beforeend',years.map(y=>`<option value="${y}">${y}</option>`).join(''));function render(){const q=document.querySelector('#paper-search').value.toLowerCase().trim(),y=document.querySelector('#year-filter').value;const visible=papers.filter(p=>(y==='all'||String(p.year)===y)&&[p.title,p.journal,...p.authors].join(' ').toLowerCase().includes(q));document.querySelector('#full-papers').innerHTML=visible.map(p=>paperHTML(p,papers.length-papers.indexOf(p))).join('')||'<p>No matching publications.</p>';document.querySelector('#result-count').textContent=`${visible.length} of ${papers.length} articles`;}document.querySelector('#paper-search').addEventListener('input',render);document.querySelector('#year-filter').addEventListener('change',render);render();}).catch(e=>{document.querySelector('#full-papers').textContent='The publication list could not be loaded. Please reload this page.';console.error(e)});

// 新闻排序：有年月时从新到旧；月份未知的记录按 yearHint 分组，但页面日期仍留空。
const newsOrderKey=item=>{
 if(item.date && /^\d{4}-\d{2}$/.test(item.date)) return item.date;
 const years=String(item.yearHint??'').match(/\d{4}/g);
 return years?.length ? `${years[years.length-1]}-00` : '0000-00';
};
// displayDate 非空时使用自定义日期文字；留空时从 date 自动生成，例如 SEP 2026。
const newsDateLabel=item=>{
 if(!item.date)return '';
 if(item.displayDate)return item.displayDate;
 const [year,month]=item.date.split('-').map(Number);
 return `${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][month-1]} ${year}`;
};
const newsRow=item=>`<article class="news-row">${item.date?`<time datetime="${escapeHTML(item.date)}">${escapeHTML(newsDateLabel(item))}</time>`:'<span class="date-empty" aria-label="Date to be added"></span>'}<p>${escapeHTML(item.text)}</p></article>`;
// 同时读取新闻和显示设置，再将最近 N 条与历史折叠区分别渲染。
Promise.all([
 fetch('data/news.json').then(r=>{if(!r.ok)throw Error('News unavailable');return r.json();}),
 fetch('data/site-settings.json').then(r=>{if(!r.ok)throw Error('Settings unavailable');return r.json();})
]).then(([items,settings])=>{
 const sorted=[...items].sort((a,b)=>newsOrderKey(b).localeCompare(newsOrderKey(a)));
 const limit=Number.isInteger(settings.visibleNewsCount)&&settings.visibleNewsCount>0?settings.visibleNewsCount:8;
 const recent=sorted.slice(0,limit),earlier=sorted.slice(limit);
 document.querySelector('#news-list').innerHTML=`<div class="recent-news">${recent.map(newsRow).join('')}</div>${earlier.length?`<details class="earlier-news"><summary>View earlier news (${earlier.length})</summary><div>${earlier.map(newsRow).join('')}</div></details>`:''}`;
}).catch(()=>{document.querySelector('#news-list').textContent='News could not be loaded. Please reload the page.';});
document.querySelectorAll('a[href="#under-review"]').forEach(a=>a.addEventListener('click',()=>{document.querySelector('#under-review').open=true;}));
