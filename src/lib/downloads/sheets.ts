// CSV (UTF-8 with BOM, so Excel opens accents right) and XLSX (exceljs) of the
// tabular downloads. Both are built from tables.ts rows.

import ExcelJS from 'exceljs';
import type { RouteLocale } from '@/lib/routes';
import { downloadCopy } from './copy';
import { KIT } from './kit';
import type { Download } from './resolve';
import { COLS, matchTable, stickerSections } from './tables';
import { zoneLegend } from './zones';

export interface Sheet {
  name: string;
  header: string[];
  rows: (string | number)[][];
  notes: string[];
}

export function sheetsFor(d: Download, l: RouteLocale, pageUrl: string): Sheet[] {
  const c = COLS[l];
  const copy = downloadCopy(d, l);
  const credit = `${l === 'pt' ? 'Feito com Golify' : l === 'en' ? 'Made with Golify' : 'Hecho con Golify'} · ${pageUrl}`;
  const t = matchTable(d, l);
  if (d.kind === 'quiniela' && t) {
    return [
      {
        name: copy.short.slice(0, 31),
        header: [c.date, ...t.zones.map((z) => z.short), c.home, c.away, '1', c.draw, '2', c.score, c.venue],
        rows: t.rows.map((r) => [r.date, ...r.times, r.home, r.away, '', '', '', '', r.venue]),
        notes: [copy.h1, zoneLegend(t.zones, l), credit],
      },
    ];
  }
  if (d.kind === 'calendar' && t) {
    return [
      {
        name: copy.short.slice(0, 31),
        header: [c.date, ...t.zones.map((z) => z.short), c.comp, c.home, c.away, c.side, c.result, c.venue],
        rows: t.rows.map((r) => [r.date, ...r.times, r.context ?? '', r.home, r.away, r.side === 'home' ? c.homeSide : c.awaySide, r.result, r.venue]),
        notes: [copy.h1, zoneLegend(t.zones, l), credit],
      },
    ];
  }
  if (d.kind === 'checklist' && d.stickers) {
    const rows: (string | number)[][] = [];
    for (const [country, list] of stickerSections(d.stickers)) for (const s of list) rows.push([s.sticker_id, country, s.number, s.name, '']);
    return [{ name: 'Checklist', header: ['ID', l === 'en' ? 'Team' : l === 'pt' ? 'Seleção' : 'Selección', '#', c.name, '✓'], rows, notes: [copy.h1, credit] }];
  }
  if (d.kind === 'kit') {
    const k = KIT[l];
    return [
      { name: k.pointsTitle.slice(0, 31), header: [k.pointsHeader[0], k.pointsHeader[1]], rows: k.points.map((p) => [p[0], p[1]]), notes: [copy.h1, credit] },
      {
        name: k.sheetTitle.slice(0, 31),
        header: [c.name, ...Array.from({ length: 10 }, (_, i) => `${k.matchWord} ${i + 1}`), c.points],
        rows: Array.from({ length: 20 }, () => Array(12).fill('')),
        notes: [k.sheetHint, credit],
      },
    ];
  }
  return [];
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(sheet: Sheet): string {
  const lines = [sheet.header, ...sheet.rows].map((r) => r.map(csvCell).join(','));
  return '﻿' + lines.join('\r\n') + '\r\n';
}

export async function toXlsx(sheets: Sheet[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Golify';
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name.replace(/[\\/?*[\]:]/g, ' '));
    for (const n of s.notes) ws.addRow([n]).font = { italic: true, color: { argb: 'FF5C5C7A' } };
    ws.addRow([]);
    const head = ws.addRow(s.header);
    head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    head.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00A040' } };
    });
    for (const r of s.rows) {
      const row = ws.addRow(r);
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E2EA' } } };
      });
    }
    s.header.forEach((h, i) => {
      const longest = Math.max(h.length, ...s.rows.map((r) => String(r[i] ?? '').length));
      ws.getColumn(i + 1).width = Math.min(Math.max(longest + 2, 6), 40);
    });
    ws.views = [{ state: 'frozen', ySplit: s.notes.length + 2 }];
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
