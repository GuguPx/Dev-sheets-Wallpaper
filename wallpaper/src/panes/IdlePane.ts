import { h, clear } from '@/core/dom';
import { appStore } from '@/stores/AppStore';
import { settingsStore } from '@/stores/SettingsStore';
import { t as tr } from '@/i18n';
import { displayWidth } from '@/utils/format';

/**
 * Aba "tty": tela de descanso que **esconde os cheat sheets**. Roda uma sessão
 * de terminal fictícia em loop — nada aqui lê o sistema nem executa comandos,
 * é pura decoração (daí o rótulo "saída fictícia" no título do painel).
 *
 * Respeita `reducedMotion` (mostra um quadro estático, sem digitação) e a pausa
 * por `visible` (aba oculta / Wallpaper Engine em pausa), como o resto da app.
 */

type Step =
  | { t: 'cmd'; text: string }
  | { t: 'out'; text: string; cls?: string; cell?: number }
  | { t: 'wait'; ms: number };

const TYPE_MIN = 26; // ms por caractere digitado
const TYPE_JITTER = 42; // variação para não soar mecânico
const OUT_STEP = 80; // ms entre linhas de saída
const AFTER_CMD = 260; // pausa entre o Enter e a saída
const SCENE_GAP = 1500; // pausa entre cenas
const MAX_LINES = 120; // teto de linhas por coluna (rola como um terminal real)
const STATIC_LINES = 60; // linhas do quadro estático (movimento reduzido)
/**
 * Largura de uma coluna em caracteres: a cena mais larga (`kubectl get pods`,
 * 71 colunas) mais uma folga. Medido em `ch` reais e não em px fixos porque a
 * fonte escala com `fontScale`/`uiScale` — um px fixo quebraria as tabelas.
 */
const COL_CHARS = 74;
const COL_SEPARATOR_PX = 48; // gap + padding da borda entre colunas
const MAX_COLS = 3;

/**
 * Moldura alinhada por construção (evita contar colunas na mão). A largura usa
 * colunas de terminal — CJK/hangul ocupam 2 — para a borda fechar em qualquer
 * idioma; textos longos alargam a moldura.
 */
function banner(): Step[] {
  const lines = ['devsheet · tty', tr('idle.banner')];
  const w = Math.max(46, ...lines.map((l) => displayWidth(l) + 4));
  const rule = '─'.repeat(w - 2);
  // A célula interna tem largura fixa em `ch` (ver pushLine): mesmo que a fonte
  // de fallback desenhe CJK um pouco mais estreito que 2 colunas, a borda direita
  // continua alinhada com os cantos.
  const row = (s: string): Step => ({ t: 'out', text: s, cls: 'idle-banner', cell: w - 4 });
  return [
    { t: 'out', text: `╭${rule}╮`, cls: 'idle-banner' },
    ...lines.map(row),
    { t: 'out', text: `╰${rule}╯`, cls: 'idle-banner' },
  ];
}

const out = (text: string, cls?: string): Step => ({ t: 'out', text, cls });
const cmd = (text: string): Step => ({ t: 'cmd', text });

/**
 * Cenas do loop. Toda a saída é **inventada** — não reflete a máquina real.
 * A ordem é sorteada a cada volta para não ficar repetitivo rodando o dia todo.
 */
const SCENES: (() => Step[])[] = [
  () => [
    cmd('uptime && free -h'),
    out(' 09:14:22  up 12 days,  4:18,  1 user,  load average: 0.14, 0.09, 0.05', 'idle-dim'),
    out('               total        used        free      shared   available', 'idle-head'),
    out('Mem:            31Gi       9.4Gi        18Gi       412Mi         21Gi'),
    out('Swap:          8.0Gi          0B       8.0Gi'),
  ],

  () => [
    cmd('docker compose ps'),
    out('NAME        IMAGE                STATUS        PORTS', 'idle-head'),
    out('api         devsheet/api:2.4.1   Up 3 days     0.0.0.0:8080->8080/tcp'),
    out('worker      devsheet/api:2.4.1   Up 3 days     —'),
    out('scheduler   devsheet/api:2.4.1   Up 3 days     —'),
    out('postgres    postgres:16-alpine   Up 3 days     5432/tcp'),
    out('redis       redis:7-alpine       Up 3 days     6379/tcp'),
    out('nginx       nginx:1.27-alpine    Up 3 days     0.0.0.0:443->443/tcp'),
    { t: 'wait', ms: 1400 },
    cmd('docker stats --no-stream'),
    out('CONTAINER   CPU %    MEM USAGE / LIMIT     MEM %    NET I/O', 'idle-head'),
    out('api         2.41%    412MiB / 2GiB         20.1%    1.2GB / 840MB'),
    out('worker      0.87%    268MiB / 2GiB         13.1%    340MB / 120MB'),
    out('postgres    1.12%    1.1GiB / 4GiB         27.5%    2.8GB / 4.1GB'),
    out('redis       0.34%     94MiB / 512MiB       18.4%    620MB / 510MB'),
  ],

  () => [
    cmd('tail -f /var/log/app/api.log'),
    out('INFO   GET  /api/health            200     4ms', 'idle-ok'),
    { t: 'wait', ms: 480 },
    out('INFO   POST /api/sessions          201    38ms', 'idle-ok'),
    { t: 'wait', ms: 620 },
    out('WARN   cache miss: sessions:list', 'idle-warn'),
    { t: 'wait', ms: 400 },
    out('INFO   GET  /api/sessions          200    12ms', 'idle-ok'),
    { t: 'wait', ms: 540 },
    out('INFO   PUT  /api/sessions/8f2a     200    21ms', 'idle-ok'),
    { t: 'wait', ms: 700 },
    out('ERROR  upstream timeout: billing (2000ms)', 'idle-err'),
    { t: 'wait', ms: 380 },
    out('INFO   retry 1/3 → billing', 'idle-dim'),
    { t: 'wait', ms: 620 },
    out('INFO   POST /api/invoices          201   142ms', 'idle-ok'),
    { t: 'wait', ms: 500 },
    out('INFO   GET  /api/metrics           200     7ms', 'idle-ok'),
    { t: 'wait', ms: 800 },
    out('^C', 'idle-dim'),
  ],

  () => [
    cmd('git status --short --branch'),
    out('## main...origin/main [ahead 2]', 'idle-head'),
    out(' M wallpaper/src/styles/layout.css'),
    out(' M wallpaper/src/terminal/TerminalShell.ts'),
    out('?? wallpaper/src/panes/IdlePane.ts'),
    { t: 'wait', ms: 1300 },
    cmd('git log --oneline --graph -8'),
    out('* 7c1e9ab  feat(tty): tela de descanso em loop', 'idle-dim'),
    out('* a1f2c9d  feat: margens laterais configuráveis', 'idle-dim'),
    out('* 3b8d4e2  fix: scroll da roda no CEF', 'idle-dim'),
    out('*   9f0c115  Merge branch feat/bento-grid', 'idle-dim'),
    out('|\\', 'idle-dim'),
    out('| * 2d7a883  refactor: cards por categoria', 'idle-dim'),
    out('| * 5e41c07  style: grade masonry', 'idle-dim'),
    out('|/', 'idle-dim'),
    out('* 08b6f9e  chore: bump vite 5.4', 'idle-dim'),
  ],

  () => [
    cmd('npm run build && npm test'),
    out('> vite build', 'idle-dim'),
    { t: 'wait', ms: 560 },
    out('transforming...', 'idle-dim'),
    { t: 'wait', ms: 640 },
    out('✓ 70 modules transformed', 'idle-ok'),
    out('  dist/index.html   283.77 kB │ gzip: 73.03 kB', 'idle-dim'),
    out('✓ built in 589ms', 'idle-ok'),
    { t: 'wait', ms: 900 },
    out('> vitest run', 'idle-dim'),
    { t: 'wait', ms: 520 },
    out(' ✓ tests/parser.test.ts    (7 tests)', 'idle-ok'),
    out(' ✓ tests/keyboard.test.ts  (7 tests)', 'idle-ok'),
    out(' ✓ tests/search.test.ts    (6 tests)', 'idle-ok'),
    out(' ✓ tests/schemas.test.ts   (9 tests)', 'idle-ok'),
    out(' ✓ tests/storage.test.ts   (6 tests)', 'idle-ok'),
    out(' ✓ tests/modes.test.ts     (5 tests)', 'idle-ok'),
    out(' Test Files  6 passed (6)', 'idle-ok'),
    out('      Tests  40 passed (40)', 'idle-ok'),
  ],

  () => [
    cmd('df -h && ss -tulpn'),
    out('Filesystem       Size  Used Avail Use%  Mounted on', 'idle-head'),
    out('/dev/nvme0n1p2   931G  412G  472G  47%  /'),
    out('/dev/nvme0n1p1   511M   52M  460M  11%  /boot/efi'),
    out('/dev/sdb1        1.8T  1.1T  680G  62%  /mnt/backup'),
    { t: 'wait', ms: 1200 },
    out('Netid  State    Local Address:Port     Process', 'idle-head'),
    out('tcp    LISTEN   0.0.0.0:443           nginx'),
    out('tcp    LISTEN   0.0.0.0:8080          node'),
    out('tcp    LISTEN   127.0.0.1:5432        postgres'),
    out('tcp    LISTEN   127.0.0.1:6379        redis-server'),
    out('udp    UNCONN   127.0.0.53:53         systemd-resolve'),
  ],

  () => [
    cmd('kubectl get pods -o wide'),
    out('NAME                      READY   STATUS      RESTARTS   AGE    NODE', 'idle-head'),
    out('api-7d9f8c6b4-2xk9p       1/1     Running     0          3d     node-01'),
    out('api-7d9f8c6b4-8vqz2       1/1     Running     0          3d     node-02'),
    out('worker-5c8b7d94f-mn4tq    1/1     Running     1          3d     node-02'),
    out('postgres-0                1/1     Running     0          12d    node-03'),
    out('redis-0                   1/1     Running     0          12d    node-03'),
    out('migrate-28x4h             0/1     Completed   0          3d     node-01', 'idle-dim'),
    { t: 'wait', ms: 1300 },
    cmd('kubectl top nodes'),
    out('NAME      CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%', 'idle-head'),
    out('node-01   412m         10%    3894Mi          49%'),
    out('node-02   688m         17%    5122Mi          64%'),
    out('node-03   241m          6%    2810Mi          35%'),
  ],

  () => [
    cmd('ps aux --sort=-%mem | head -8'),
    out('USER      PID   %CPU  %MEM     RSS  COMMAND', 'idle-head'),
    out('postgres  1284   1.1  14.2  1.1GiB  postgres: writer process'),
    out('node      2041   2.4   5.3   412MiB  node dist/server.js'),
    out('node      2088   0.9   3.4   268MiB  node dist/worker.js'),
    out('redis     1533   0.3   1.2    94MiB  redis-server *:6379'),
    out('root       842   0.1   0.8    62MiB  /usr/sbin/nginx'),
    out('root         1   0.0   0.2    14MiB  /sbin/init'),
    { t: 'wait', ms: 1200 },
    cmd('systemctl is-active nginx postgresql redis'),
    out('active', 'idle-ok'),
    out('active', 'idle-ok'),
    out('active', 'idle-ok'),
  ],
];

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Uma volta do loop: todas as cenas em ordem sorteada. Nada limpa a tela — ela
 * vai enchendo e rolando como um terminal de verdade (a moldura, quando entra,
 * é adicionada pela coluna; ver `Feed.start`).
 */
function script(): Step[] {
  const steps: Step[] = [];
  for (const scene of shuffled(SCENES)) {
    // linha em branco antes da pausa: assim o passo seguinte ao `wait` é o
    // `cmd` da próxima cena e o prompt já espera piscando (ver run()).
    steps.push(...scene(), out(''), { t: 'wait', ms: SCENE_GAP });
  }
  return steps;
}

/**
 * Uma coluna: sessão independente, com roteiro, timer, cursor e rolagem
 * próprios. Várias delas lado a lado enchem a largura da tela.
 */
class Feed {
  readonly el = h('div', { class: 'idle-col' });

  private steps: Step[] = [];
  private step = 0;
  private timer = 0;
  private prompt = '';
  private running = false;

  /** Linha "viva": prompt + cursor piscando, onde a digitação acontece. */
  private tail: { row: HTMLElement; out: HTMLElement } | null = null;
  private typed = 0;

  start(prompt: string, delay: number, withBanner: boolean): void {
    this.prompt = prompt;
    this.steps = withBanner ? [...banner(), { t: 'wait', ms: 900 }, ...script()] : script();
    this.step = 0;
    this.tail = null;
    this.running = true;
    clear(this.el);

    // Sem movimento: um quadro estático, sem timers.
    if (settingsStore.getState().reducedMotion) {
      this.renderStatic();
      return;
    }
    this.schedule(delay);
  }

  stop(): void {
    this.running = false;
    this.clearTimer();
    this.tail = null;
  }

  pause(): void {
    this.clearTimer();
  }

  resume(): void {
    if (this.running && !this.timer) this.schedule(300);
  }

  private clearTimer(): void {
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = 0;
  }

  private schedule(ms: number): void {
    this.clearTimer();
    this.timer = window.setTimeout(() => this.run(), ms);
  }

  private run(): void {
    this.timer = 0; // consumido; resume() usa isso para saber que está parada
    if (!this.running || !appStore.getState().visible) return;

    const step = this.steps[this.step];
    if (!step) {
      // Nova volta com as cenas em outra ordem. Sem limpar: a coluna continua
      // rolando, então a tela fica cheia o tempo todo depois do primeiro fôlego.
      this.steps = script();
      this.step = 0;
      this.schedule(SCENE_GAP);
      return;
    }

    switch (step.t) {
      case 'cmd':
        this.typeCommand(step.text);
        return;
      case 'out':
        this.pushLine(step.text, step.cls, step.cell);
        this.step++;
        this.schedule(OUT_STEP);
        return;
      case 'wait': {
        // Se um comando vem a seguir, o prompt já espera piscando.
        const next = this.steps[this.step + 1];
        if (next?.t === 'cmd') this.ensureTail();
        this.step++;
        this.schedule(step.ms);
        return;
      }
    }
  }

  /** Cria (ou reaproveita) a linha de prompt com cursor no fim da coluna. */
  private ensureTail(): { row: HTMLElement; out: HTMLElement } {
    if (!this.tail) {
      const row = h('div', { class: 'idle-line' });
      row.appendChild(h('span', { class: 'idle-prompt', text: this.prompt }));
      const out = h('span', { class: 'idle-cmd' });
      row.appendChild(out);
      row.appendChild(h('span', { class: 'idle-cursor', text: '▮' }));
      this.append(row);
      this.tail = { row, out };
      this.typed = 0;
    }
    return this.tail;
  }

  /** Digita o comando caractere a caractere na linha viva. */
  private typeCommand(text: string): void {
    const t = this.ensureTail();
    if (this.typed < text.length) {
      this.typed += 1;
      t.out.textContent = text.slice(0, this.typed);
      this.schedule(TYPE_MIN + Math.random() * TYPE_JITTER);
      return;
    }

    // Enter: o cursor sai e a saída do comando toma a linha seguinte.
    t.row.querySelector('.idle-cursor')?.remove();
    this.tail = null;
    this.step++;
    this.schedule(AFTER_CMD);
  }

  private pushLine(text: string, cls?: string, cell?: number): void {
    if (cell === undefined) {
      this.append(h('div', { class: ['idle-line', cls], text }));
      return;
    }
    // Linha de moldura: "│ " + célula de largura fixa + " │".
    this.append(
      h(
        'div',
        { class: ['idle-line', cls] },
        '│ ',
        h('span', { class: 'idle-cell', style: { width: `${cell}ch` }, text }),
        ' │',
      ),
    );
  }

  private append(row: HTMLElement): void {
    this.el.appendChild(row);
    while (this.el.childElementCount > MAX_LINES) {
      this.el.removeChild(this.el.firstChild as ChildNode);
    }
    this.el.scrollTop = this.el.scrollHeight;
  }

  /** Movimento reduzido: enche a coluna de uma vez, sem animação. */
  private renderStatic(): void {
    for (const s of this.steps) {
      if (this.el.childElementCount >= STATIC_LINES) break;
      if (s.t === 'out') this.pushLine(s.text, s.cls, s.cell);
      else if (s.t === 'cmd') {
        const row = h('div', { class: 'idle-line' });
        row.appendChild(h('span', { class: 'idle-prompt', text: this.prompt }));
        row.appendChild(h('span', { class: 'idle-cmd', text: s.text }));
        this.append(row);
      }
    }
  }
}

export class IdlePane {
  readonly el = h('div', { class: 'pane pane-idle' });

  private readonly screen = h('div', { class: 'idle-screen' });
  private feeds: Feed[] = [];
  private running = false;
  private cols = 0;
  private resizeTimer = 0;
  /** Guardado em campo: um ResizeObserver sem referência pode ser coletado. */
  private readonly ro: ResizeObserver;
  private readonly titleEl = h('span', { text: tr('idle.title') });
  private readonly sideEl = h('span', { class: 'pane-title-side', text: tr('idle.fictional') });

  /** Re-traduz o título (chamado pela shell em cada render). */
  private syncTitle(): void {
    this.titleEl.textContent = tr('idle.title');
    this.sideEl.textContent = tr('idle.fictional');
  }

  constructor() {
    this.el.appendChild(
      h(
        'div',
        { class: 'pane-title' },
        h(
          'div',
          { class: 'pane-title-main' },
          h('span', { class: 'pane-ic pane-ic-tty', text: '▮' }),
          this.titleEl,
        ),
        this.sideEl,
      ),
    );
    this.el.appendChild(this.screen);

    // Congela junto com o resto da app quando a janela some (seção 28).
    appStore.select(
      (s) => s.visible,
      (visible) => {
        if (!this.running) return;
        for (const f of this.feeds)
          if (visible) f.resume();
          else f.pause();
      },
    );

    // Refaz as colunas quando o número muda. Três gatilhos de propósito: a
    // caixa do painel (resolução do WE, painel de detalhes), o resize da janela
    // e as settings (fontScale não altera a caixa). `recheck` é idempotente —
    // só reconstrói se a conta mudou — então sobrepor gatilhos não custa nada.
    this.ro = new ResizeObserver(() => this.recheck());
    this.ro.observe(this.screen);
    window.addEventListener('resize', () => this.recheck());
    settingsStore.subscribe(() => this.recheck());
  }

  start(): void {
    this.syncTitle();
    // Já rodando: não reinicia a animação, mas revalida as colunas — este é o
    // caminho que sempre funciona, mesmo se nenhum evento de resize chegar.
    if (this.running) {
      this.recheck();
      return;
    }
    this.running = true;
    this.build();
  }

  stop(): void {
    this.running = false;
    for (const f of this.feeds) f.stop();
  }

  /** Reavalia o número de colunas (debounced) e reconstrói só se mudou. */
  private recheck(): void {
    if (!this.running) return;
    if (this.resizeTimer) window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      if (this.colCount() !== this.cols) this.build();
    }, 400);
  }

  /** Largura de um caractere na fonte atual (monoespaçada). */
  private charWidth(): number {
    const probe = h('span', {
      text: 'M'.repeat(20),
      style: { position: 'absolute', visibility: 'hidden', whiteSpace: 'pre' },
    });
    this.screen.appendChild(probe);
    const w = probe.getBoundingClientRect().width / 20;
    probe.remove();
    return w || 9;
  }

  /** Quantas colunas cabem sem quebrar a linha mais larga das cenas. */
  private colCount(): number {
    const w = this.screen.clientWidth || this.el.clientWidth || window.innerWidth;
    const need = COL_CHARS * this.charWidth() + COL_SEPARATOR_PX;
    return Math.max(1, Math.min(MAX_COLS, Math.floor(w / need)));
  }

  private build(): void {
    for (const f of this.feeds) f.stop();
    clear(this.screen);

    this.cols = this.colCount();
    this.screen.style.gridTemplateColumns = `repeat(${this.cols}, minmax(0, 1fr))`;

    const prompt = `${settingsStore.getState().username}@devsheet:~$`;
    this.feeds = [];
    for (let i = 0; i < this.cols; i++) {
      const feed = new Feed();
      this.screen.appendChild(feed.el);
      // atraso escalonado: as colunas não digitam em uníssono
      feed.start(prompt, 450 + i * 1900, i === 0);
      this.feeds.push(feed);
    }
  }
}
