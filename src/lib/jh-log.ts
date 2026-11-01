export type Row = Record<string,number>;
// Strict numeric CSV contract avoids silently treating missing or malformed readings as zero.
export function parseLog(text: string): {rows:Row[]; channels:string[]} {
 const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);if(lines.length<3)throw Error('Include a header and at least two data rows.');if(lines.length>50001)throw Error('Maximum 50,000 samples.');
 const headers=lines[0].split(',').map(v=>v.trim());if(headers[0]!=='time_s')throw Error('First column must be time_s (elapsed seconds).');if(headers.length<2||headers.length>17||new Set(headers).size!==headers.length||headers.some(h=>!h||! /^[A-Za-z][A-Za-z0-9_ ./%()°-]*$/.test(h)||h.length>64||['__proto__','constructor','prototype'].includes(h)))throw Error('Use 1–16 uniquely named channels, with units in each header.');
 const rows=lines.slice(1).map((line,i)=>{const cells=line.split(',').map(x=>x.trim());if(cells.length!==headers.length||cells.some(x=>!x||!Number.isFinite(Number(x))))throw Error(`Invalid numeric data on CSV line ${i+2}.`);return Object.fromEntries(headers.map((h,j)=>[h,Number(cells[j])])) as Row;});
 if(rows[0].time_s<0||rows.some((r,i)=>i>0&&r.time_s<=rows[i-1].time_s))throw Error('time_s must be nonnegative and strictly increasing.');return {rows,channels:headers.slice(1)};
}
