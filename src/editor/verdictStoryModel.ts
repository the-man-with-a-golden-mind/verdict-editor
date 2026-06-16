export interface StoryStep {
  id: string;
  title: string;
  detail: string;
  kind: 'input' | 'process' | 'external' | 'storage' | 'notify';
}

export interface StoryDecision {
  id: string;
  question: string;
  yes: string;
  no: string;
}

export interface StoryConsequence {
  id: string;
  label: string;
  detail: string;
  tone: 'positive' | 'negative' | 'warning' | 'neutral';
}

export interface StoryLink {
  source: string;
  target: string;
  value: number;
  label: string;
}

export interface VerdictStoryModel {
  title: string;
  summary: string;
  steps: StoryStep[];
  decisions: StoryDecision[];
  consequences: StoryConsequence[];
  links: StoryLink[];
}

const FN_LABELS: Record<string, { title: string; detail: string; kind?: StoryStep['kind'] }> = {
  fetchPriceCents: {
    title: 'Fetch live price from Binance',
    detail: 'Calls httpGet against the Binance ticker API for each asset symbol.',
    kind: 'external',
  },
  binancePriceUrl: {
    title: 'Build Binance API URL',
    detail: 'Maps friendly symbols (BTCUSD) to Binance spot pairs (BTCUSDT).',
    kind: 'process',
  },
  score: {
    title: 'Calculate trading score',
    detail: 'Combines trend (fast vs slow average), momentum, and your position bias into one number.',
    kind: 'process',
  },
  decisionFromScore: {
    title: 'Turn score into action',
    detail: 'Compares the score with your threshold and returns BUY, SELL, or HOLD.',
    kind: 'process',
  },
  decisionForAsset: {
    title: 'Build decision for one asset',
    detail: 'Packages symbol, price, score, and final decision for the current asset.',
    kind: 'process',
  },
  persistSignal: {
    title: 'Save decision to database',
    detail: 'Stores each decision in the FinVM database so history can be queried later.',
    kind: 'storage',
  },
  isActionable: {
    title: 'Check if alert is needed',
    detail: 'Only BUY and SELL are treated as actionable events.',
    kind: 'process',
  },
  notifyTelegram: {
    title: 'Send Telegram notification',
    detail: 'Posts BUY/SELL alerts to your configured Telegram chat.',
    kind: 'notify',
  },
};

function plainIfLine(line: string): StoryDecision | null {
  const m = line.match(/^\s*if\s+(.+?)\s+then\s+(.+?)(?:\s+else\s+(.+))?$/);
  if (!m) return null;
  const [, cond, yesRaw, noRaw] = m;
  const yes = yesRaw.replace(/^"(.*)"$/, '$1').trim();
  const no = (noRaw ?? 'continue').replace(/^"(.*)"$/, '$1').trim();
  const question = humanizeCondition(cond);
  return {
    id: `decision-${question.slice(0, 24).replace(/\W+/g, '-').toLowerCase()}`,
    question,
    yes: humanizeOutcome(yes),
    no: humanizeOutcome(no),
  };
}

function humanizeCondition(cond: string): string {
  return cond
    .replace(/\bs\b/g, 'score')
    .replace(/\bthreshold\b/g, 'signal threshold')
    .replace(/\brow\.decision\b/g, 'decision')
    .replace(/\bstrLength\(token\)\s*<\s*10\b/g, 'Telegram bot token is missing')
    .replace(/\bstrLength\(chatId\)\s*<\s*3\b/g, 'Telegram chat id is missing')
    .replace(/\bshouldNotify\b/g, 'decision is actionable')
    .replace(/\bcross\s*>\s*0\b/g, 'fast average is above slow average')
    .replace(/\bcross\s*<\s*0\b/g, 'fast average is below slow average')
    .replace(/\bmom\s*>\s*0\b/g, 'price momentum is positive')
    .replace(/\bmom\s*<\s*0\b/g, 'price momentum is negative')
    .replace(/\(0\s*-\s*threshold\)/g, 'negative threshold')
    .replace(/\s+/g, ' ')
    .trim();
}

function humanizeOutcome(raw: string): string {
  if (raw === 'True') return 'Proceed';
  if (raw === 'False') return 'Skip';
  if (raw === 'no-alert') return 'No notification sent';
  if (raw.startsWith('telegram:skip')) return 'Skip Telegram (missing config)';
  if (raw === 'BUY' || raw === 'SELL' || raw === 'HOLD') return raw;
  return raw.replace(/^"(.*)"$/, '$1');
}

function extractDefinitions(source: string): Array<{ name: string; body: string }> {
  const lines = source.split('\n');
  const out: Array<{ name: string; body: string }> = [];
  for (let i = 0; i < lines.length; i += 1) {
    const def = lines[i].match(/^([a-z][A-Za-z0-9_]*)(?:\s+[A-Za-z0-9_]+)*\s*=\s*(.*)$/);
    if (!def) continue;
    const name = def[1];
    const bodyLines = [def[2] ?? ''];
    let j = i + 1;
    while (j < lines.length) {
      const n = lines[j];
      if (/^[a-z][A-Za-z0-9_]*(?:\s+[A-Za-z0-9_]+)*\s*=/.test(n) || /^[a-z][A-Za-z0-9_]*\s*:/.test(n)) break;
      bodyLines.push(n);
      j += 1;
    }
    out.push({ name, body: bodyLines.join('\n') });
  }
  return out;
}

function extractAssets(source: string): string[] {
  const m = source.match(/assetsCsv|__INPUT_assetsCsv__/);
  if (m) return ['assets from assetsCsv input'];
  const symbols = [...source.matchAll(/\b([A-Z]{3,10}USD)\b/g)].map((x) => x[1]);
  return symbols.length > 0 ? Array.from(new Set(symbols)) : ['configured assets'];
}

export function buildVerdictStoryModel(source: string): VerdictStoryModel {
  const defs = extractDefinitions(source);
  const assets = extractAssets(source);
  const hasDb = /\bdbInsert\b/.test(source);
  const hasTelegram = /\bnotifyTelegram\b|\bhttpPost\b/.test(source);
  const hasThreshold = /\bsignalThreshold\b|threshold/.test(source);

  const hasHttpMarket = /\bhttpGet\b/.test(source) && /\bbinance\b/i.test(source);
  const steps: StoryStep[] = [
    {
      id: 'step-market',
      title: 'Read market data',
      detail: hasHttpMarket
        ? `Your code fetches live prices from Binance via httpGet for ${assets.join(', ')}.`
        : `Your code loads market data for ${assets.join(', ')} (see httpGet/fetch functions in the editor).`,
      kind: 'external',
    },
    {
      id: 'step-inputs',
      title: 'Apply your settings',
      detail: 'Uses Inputs tab values: assets list, signal threshold, position bias, and Telegram credentials.',
      kind: 'input',
    },
  ];

  for (const def of defs) {
    const meta = FN_LABELS[def.name];
    if (!meta) continue;
    steps.push({
      id: `step-${def.name}`,
      title: meta.title,
      detail: meta.detail,
      kind: meta.kind ?? 'process',
    });
  }

  if (/\bmain\b/.test(source)) {
    steps.push({
      id: 'step-main',
      title: 'Return final result',
      detail: 'Returns a readable result string with symbol, decision, and saved database id.',
      kind: 'process',
    });
  }

  const decisions: StoryDecision[] = [];
  for (const def of defs) {
    for (const line of def.body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('if ')) continue;
      const d = plainIfLine(trimmed);
      if (d) decisions.push(d);
    }
  }

  const consequences: StoryConsequence[] = [
    {
      id: 'cons-hold',
      label: 'HOLD keeps current position',
      detail: 'When score stays inside the threshold band, no trade action is recommended.',
      tone: 'neutral',
    },
    {
      id: 'cons-buy',
      label: 'BUY suggests entering/increasing exposure',
      detail: 'Triggered when score is above the configured threshold.',
      tone: 'positive',
    },
    {
      id: 'cons-sell',
      label: 'SELL suggests reducing/exiting exposure',
      detail: 'Triggered when score is below the negative threshold.',
      tone: 'negative',
    },
  ];

  if (hasDb) {
    consequences.push({
      id: 'cons-db',
      label: 'Every run is stored in FinVM DB',
      detail: 'Decisions are persisted in the signals table for audit and later analysis.',
      tone: 'warning',
    });
  }

  if (hasTelegram) {
    consequences.push({
      id: 'cons-telegram',
      label: 'Actionable decisions can trigger Telegram alerts',
      detail: 'BUY/SELL events can send a message to your Telegram chat when credentials are set.',
      tone: 'warning',
    });
  }

  const links: StoryLink[] = [
    { source: 'Market Data', target: 'Strategy Score', value: 6, label: 'price + averages' },
    { source: 'User Inputs', target: 'Strategy Score', value: 4, label: 'threshold + bias' },
    { source: 'Strategy Score', target: 'Decision', value: 7, label: 'BUY / SELL / HOLD' },
  ];

  if (hasDb) {
    links.push({ source: 'Decision', target: 'Database', value: 5, label: 'persistSignal' });
  }
  if (hasTelegram) {
    links.push({ source: 'Decision', target: 'Telegram', value: 4, label: 'notify on BUY/SELL' });
  }
  links.push({ source: 'Decision', target: 'Output', value: 3, label: 'return text result' });

  const summaryParts = [
    `This strategy watches ${assets.join(', ')}.`,
    hasThreshold ? 'It compares a computed score against your threshold.' : 'It evaluates market signals from the code.',
    hasDb ? 'Results are saved in the VM database.' : '',
    hasTelegram ? 'Important actions can notify Telegram.' : '',
  ].filter(Boolean);

  return {
    title: 'What this strategy does',
    summary: summaryParts.join(' '),
    steps,
    decisions: decisions.slice(0, 8),
    consequences,
    links,
  };
}
