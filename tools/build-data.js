// からだパズルのデータを作る。data/items.txt → app/data/body.json、図の SVG を app/data/ にコピー。
// 骨・関節の点は、骨格図の上でその骨に乗っているかを headless Chrome で確かめ、外れていれば骨の上へずらす(research/snap.html)。
// 実行: node tools/build-data.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const R = p => path.join(ROOT, 'research', p);
const grade = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kanji-grade.json'), 'utf8'));
const EASY = new Set((grade[1] + grade[2] + grade[3] + grade[4]).split(''));
const errors = [], notes = [];

const lines = fs.readFileSync(path.join(ROOT, 'data/items.txt'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'));
const items = lines.map((l, n) => {
  const p = l.split('|'), [cat, lvs, name, pos, region] = p, hint = p.slice(5).join('|');
  if (!hint) errors.push('列が足りない: ' + l);
  const segs = name.split('/').map(s => {
    const [t, y] = s.split(':');
    if (!y) return { t };
    const hard = y.endsWith('!'), r = y.replace('!', '');
    // 小学生レベル: 4年生までに習わない漢字があればふりがな。! は難読(どのレベルでもふりがな)
    const needRuby = [...t].some(ch => /[\u4e00-\u9fff]/.test(ch) && !EASY.has(ch));
    return hard ? { t, r, hard: 1 } : needRuby ? { t, r } : { t };
  });
  const [xy, group] = pos.split('@');
  const [x, y] = xy.split(',').map(Number);
  return { key: n, cat, lvs: lvs.split('').map(Number), segs, name: segs.map(s => s.t).join(''), x, y, group: group || '', region, hint };
});

// 小学生レベルの文に、ふりがなのない「4年生までに習わない漢字」が残っていないか
for (const it of items.filter(i => i.lvs.includes(1))) {
  const plain = it.hint.replace(/\{[^|}]+\|[^}]+\}/g, '');
  const hard = [...plain].filter(ch => /[\u4e00-\u9fff]/.test(ch) && !EASY.has(ch));
  if (hard.length) notes.push('ふりがなが必要: ' + it.name + ' … ' + [...new Set(hard)].join(''));
  for (const s of it.segs) if ([...s.t].some(ch => /[\u4e00-\u9fff]/.test(ch) && !EASY.has(ch)) && !s.r) notes.push('名前にふりがなが必要: ' + it.name);
}

// 骨格図の上で、点が骨に乗っているか
const skel = items.filter(i => i.cat !== 'muscle');
fs.writeFileSync(R('snap-req.json'), JSON.stringify(skel.map(i => ({ key: i.key, x: i.x, y: i.y, group: i.group }))));
const CH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=8000', '--window-size=600,900', '--dump-dom', 'file:///' + R('snap.html').replace(/\\/g, '/')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const res = JSON.parse((dom.match(/<pre id="out">([^<]*)<\/pre>/) || [])[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<'));
for (const r of res) {
  const it = items.find(i => i.key === r.key);
  if (r.snapped) { notes.push(`位置を骨の上へ: ${it.name} (${r.x},${r.y}) → (${r.snapped})`); [it.x, it.y] = r.snapped; }
  else if (r.group && r.group !== '-' && r.snapped === null) errors.push(`骨の上に乗せられない: ${it.name} ${r.group}`);
  it.hitGroup = r.hitGroup;
}
// 同じ図の中で、番号どうしが近すぎないか(同じレベルに同時に出るものだけ)
for (const L of [1, 2, 3]) for (const map of ['skel', 'muscle']) {
  const its = items.filter(i => i.lvs.includes(L) && (map === 'muscle') === (i.cat === 'muscle'));
  for (let a = 0; a < its.length; a++) for (let b = a + 1; b < its.length; b++) {
    if (its[a].cat !== its[b].cat) continue;
    const d = Math.hypot(its[a].x - its[b].x, its[a].y - its[b].y);
    if (d < (map === 'muscle' ? 6 : 12)) notes.push(`近すぎる(L${L}): ${its[a].name} と ${its[b].name} ${d.toFixed(1)}`);
  }
}

const out = {
  maps: {
    skel: { src: 'data/skeleton.svg', w: 435.687, h: 841.89, credit: 'Mariana Ruiz Villarreal (LadyofHats), Mikael Häggström / Public domain' },
    muscle: { src: 'data/muscles.svg', w: 406.99026, h: 354.43411, credit: 'OpenStax, Tomáš Kebert & umimeto.org / CC BY-SA 4.0' },
  },
  items: items.map(i => ({ id: i.cat + '-' + i.key, cat: i.cat, lvs: i.lvs, segs: i.segs, x: +i.x.toFixed(1), y: +i.y.toFixed(1), map: i.cat === 'muscle' ? 'muscle' : 'skel', region: i.region, hint: i.hint })),
};
fs.mkdirSync(path.join(ROOT, 'app/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'app/data/body.json'), JSON.stringify(out));
fs.copyFileSync(R('raw/skel-front-nolabel.svg'), path.join(ROOT, 'app/data/skeleton.svg'));
fs.copyFileSync(R('raw/muscles.svg'), path.join(ROOT, 'app/data/muscles.svg'));
for (const L of [1, 2, 3]) console.log('L' + L, ['bone', 'joint', 'muscle'].map(c => c + ' ' + items.filter(i => i.cat === c && i.lvs.includes(L)).length).join('  '));
console.log(res.filter(r => r.group === '-').map(r => items.find(i => i.key === r.key).name + '→' + (r.hitGroup || r.hitTag)).join('\n'));
if (notes.length) console.log('\n' + notes.join('\n'));
if (errors.length) { console.log('\nERRORS:\n' + errors.join('\n')); process.exit(1); }
