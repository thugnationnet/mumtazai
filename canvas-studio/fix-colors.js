const fs = require('fs');
const path = require('path');
const walk = (d) => {
  let list = [];
  fs.readdirSync(d).forEach(f => {
    const full = path.join(d, f);
    if(fs.statSync(full).isDirectory()) {
      if(f!=='node_modules' && f!=='dist') list = list.concat(walk(full));
    } else if(f.endsWith('.tsx') || f.endsWith('.ts')) list.push(full);
  });
  return list;
};
const rules = [
  [/([ \`'"\{\(])(text-white)(?![a-zA-Z0-9_-])/g, '$1text-slate-900 dark:text-white'],
  [/([ \`'"\{\(])(text-slate-200)(?![a-zA-Z0-9_-])/g, '$1text-slate-800 dark:text-slate-200'],
  [/([ \`'"\{\(])(text-slate-300)(?![a-zA-Z0-9_-])/g, '$1text-slate-700 dark:text-slate-300'],
  [/([ \`'"\{\(])(text-slate-400)(?![a-zA-Z0-9_-])/g, '$1text-slate-600 dark:text-slate-400'],
  [/([ \`'"\{\(])(bg-\\[#0a0a0a\\])(?![a-zA-Z0-9_-])/g, '$1bg-white dark:bg-[#0a0a0a]'],
  [/([ \`'"\{\(])(bg-\\[#0a0a0a\\]\\/80)(?![a-zA-Z0-9_-])/g, '$1bg-white/80 dark:bg-[#0a0a0a]/80'],
  [/([ \`'"\{\(])(bg-\\[#0a0a0a\\]\\/95)(?![a-zA-Z0-9_-])/g, '$1bg-white/95 dark:bg-[#0a0a0a]/95'],
  [/([ \`'"\{\(])(bg-\\[#0d0d0d\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-50 dark:bg-[#0d0d0d]'],
  [/([ \`'"\{\(])(bg-\\[#0d0d0d\\]\\/95)(?![a-zA-Z0-9_-])/g, '$1bg-slate-50/95 dark:bg-[#0d0d0d]/95'],
  [/([ \`'"\{\(])(bg-\\[#111\\])(?![a-zA-Z0-9_-])/g, '$1bg-white dark:bg-[#111]'],
  [/([ \`'"\{\(])(bg-\\[#111\\]\\/90)(?![a-zA-Z0-9_-])/g, '$1bg-white/90 dark:bg-[#111]/90'],
  [/([ \`'"\{\(])(bg-\\[#1a1a1a\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-100 dark:bg-[#1a1a1a]'],
  [/([ \`'"\{\(])(bg-\\[#1a1a1d\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-50 dark:bg-[#1a1a1d]'],
  [/([ \`'"\{\(])(bg-\\[#1a1a2e\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-50 dark:bg-[#1a1a2e]'],
  [/([ \`'"\{\(])(bg-\\[#1e1e2e\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-100 dark:bg-[#1e1e2e]'],
  [/([ \`'"\{\(])(bg-\\[#222\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-100 dark:bg-[#222]'],
  [/([ \`'"\{\(])(border-\\[#222\\])(?![a-zA-Z0-9_-])/g, '$1border-slate-200 dark:border-[#222]'],
  [/([ \`'"\{\(])(border-\\[#333\\])(?![a-zA-Z0-9_-])/g, '$1border-slate-300 dark:border-[#333]'],
  [/([ \`'"\{\(])(bg-white\\/\\[0\\.02\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-50 dark:bg-white/[0.02]'],
  [/([ \`'"\{\(])(bg-white\\/\\[0\\.03\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-100 dark:bg-white/[0.03]'],
  [/([ \`'"\{\(])(bg-white\\/\\[0\\.04\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-100 dark:bg-white/[0.04]'],
  [/([ \`'"\{\(])(bg-white\\/\\[0\\.05\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-100 dark:bg-white/[0.05]'],
  [/([ \`'"\{\(])(bg-white\\/\\[0\\.06\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-200 dark:bg-white/[0.06]'],
  [/([ \`'"\{\(])(bg-white\\/\\[0\\.08\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-200 dark:bg-white/[0.08]'],
  [/([ \`'"\{\(])(bg-white\\/\\[0\\.10\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-200 dark:bg-white/[0.10]'],
  [/([ \`'"\{\(])(bg-white\\/5)(?![a-zA-Z0-9_-])/g, '$1bg-slate-100 dark:bg-white/5'],
  [/([ \`'"\{\(])(bg-white\\/10)(?![a-zA-Z0-9_-])/g, '$1bg-slate-200 dark:bg-white/10'],
  [/([ \`'"\{\(])(bg-white\\/20)(?![a-zA-Z0-9_-])/g, '$1bg-slate-300 dark:bg-white/20'],
  [/([ \`'"\{\(])(border-white\\/\\[0\\.06\\])(?![a-zA-Z0-9_-])/g, '$1border-slate-200 dark:border-white/[0.06]'],
  [/([ \`'"\{\(])(border-white\\/\\[0\\.08\\])(?![a-zA-Z0-9_-])/g, '$1border-slate-200 dark:border-white/[0.08]'],
  [/([ \`'"\{\(])(border-white\\/\\[0\\.10\\])(?![a-zA-Z0-9_-])/g, '$1border-slate-200 dark:border-white/[0.10]'],
  [/([ \`'"\{\(])(border-white\\/\\[0\\.1\\])(?![a-zA-Z0-9_-])/g, '$1border-slate-200 dark:border-white/[0.1]'],
  [/([ \`'"\{\(])(border-white\\/5)(?![a-zA-Z0-9_-])/g, '$1border-slate-200 dark:border-white/5'],
  [/([ \`'"\{\(])(border-white\\/10)(?![a-zA-Z0-9_-])/g, '$1border-slate-300 dark:border-white/10'],
  [/([ \`'"\{\(])(hover:bg-white\\/\\[0\\.03\\])(?![a-zA-Z0-9_-])/g, '$1hover:bg-slate-100 dark:hover:bg-white/[0.03]'],
  [/([ \`'"\{\(])(hover:bg-white\\/\\[0\\.05\\])(?![a-zA-Z0-9_-])/g, '$1hover:bg-slate-100 dark:hover:bg-white/[0.05]'],
  [/([ \`'"\{\(])(hover:bg-white\\/\\[0\\.08\\])(?![a-zA-Z0-9_-])/g, '$1hover:bg-slate-200 dark:hover:bg-white/[0.08]'],
  [/([ \`'"\{\(])(hover:bg-white\\/5)(?![a-zA-Z0-9_-])/g, '$1hover:bg-slate-100 dark:hover:bg-white/5'],
  [/([ \`'"\{\(])(hover:bg-white\\/10)(?![a-zA-Z0-9_-])/g, '$1hover:bg-slate-200 dark:hover:bg-white/10'],
  [/([ \`'"\{\(])(hover:text-white)(?![a-zA-Z0-9_-])/g, '$1hover:text-slate-900 dark:hover:text-white'],
  [/([ \`'"\{\(])(hover:text-slate-200)(?![a-zA-Z0-9_-])/g, '$1hover:text-slate-800 dark:hover:text-slate-200'],
  [/([ \`'"\{\(])(hover:text-slate-300)(?![a-zA-Z0-9_-])/g, '$1hover:text-slate-700 dark:hover:text-slate-300'],
  [/([ \`'"\{\(])(hover:text-slate-400)(?![a-zA-Z0-9_-])/g, '$1hover:text-slate-600 dark:hover:text-slate-400'],
  [/([ \`'"\{\(])(bg-black\\/20)(?![a-zA-Z0-9_-])/g, '$1bg-slate-200 dark:bg-black/20'],
  [/([ \`'"\{\(])(bg-black\\/40)(?![a-zA-Z0-9_-])/g, '$1bg-slate-300 dark:bg-black/40'],
  [/([ \`'"\{\(])(bg-black\\/50)(?![a-zA-Z0-9_-])/g, '$1bg-slate-400 dark:bg-black/50'],
  [/([ \`'"\{\(])(bg-black\\/60)(?![a-zA-Z0-9_-])/g, '$1bg-slate-400 dark:bg-black/60'],
  [/([ \`'"\{\(])(bg-black\\/70)(?![a-zA-Z0-9_-])/g, '$1bg-slate-500 dark:bg-black/70'],
  [/([ \`'"\{\(])(bg-white\\/\\[0\\.05\\])(?![a-zA-Z0-9_-])/g, '$1bg-slate-100 dark:bg-white/[0.05]'],
  [/([ \`'"\{\(])(border-white\\/\\[0\\.05\\])(?![a-zA-Z0-9_-])/g, '$1border-slate-200 dark:border-white/[0.05]'],
  [/([ \`'"\{\(])(text-\\[#888\\])(?![a-zA-Z0-9_-])/g, '$1text-slate-500 dark:text-[#888]'],
];
let c=0;
walk('.').forEach(f => {
  let text = fs.readFileSync(f, 'utf8'); let o = text;
  rules.forEach(([re, r]) => text = text.replace(re, r));
  if(text !== o) { fs.writeFileSync(f, text); c++; console.log(f); }
});
console.log('Fixed', c, 'files');