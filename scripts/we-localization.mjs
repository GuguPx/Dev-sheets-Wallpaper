/**
 * Gera a tradução do painel de propriedades do Wallpaper Engine.
 *
 *   node scripts/we-localization.mjs
 *
 * O WE traduz os rótulos de `wallpaper/project.json` sozinho, conforme o idioma
 * escolhido na aba Geral das configurações dele: cada `text`/`label` vira uma
 * chave `ui_*` e o bloco `general.localization` traz o texto por locale
 * (códigos da pasta `locale/` da instalação: pt-br, en-us, zh-chs…).
 *
 * Este script é a fonte dessas traduções: edite a tabela abaixo e rode-o para
 * reescrever `text`/`label` das propriedades, as opções do seletor de idioma e
 * o bloco `localization`. Propriedades não listadas não são tocadas.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const projectPath = resolve(here, '../wallpaper/project.json');

/** Ordem das colunas de cada linha da tabela. */
const LOCALES = ['pt-br', 'en-us', 'es-es', 'fr-fr', 'de-de', 'it-it', 'ru-ru', 'zh-chs', 'ja-jp', 'ko-kr'];

/** Idiomas do app (code do i18n + nome nativo), na ordem do seletor. */
const APP_LANGUAGES = [
  ['pt-BR', 'Português (Brasil)'],
  ['en', 'English'],
  ['es', 'Español'],
  ['fr', 'Français'],
  ['de', 'Deutsch'],
  ['it', 'Italiano'],
  ['ru', 'Русский'],
  ['zh-CN', '简体中文'],
  ['ja', '日本語'],
  ['ko', '한국어'],
];

// chave ui_*: [pt-br, en-us, es-es, fr-fr, de-de, it-it, ru-ru, zh-chs, ja-jp, ko-kr]
const T = {
  ui_username: ['Usuário do prompt', 'Prompt user name', 'Usuario del prompt', "Nom d'utilisateur du prompt", 'Benutzername im Prompt', 'Utente del prompt', 'Имя пользователя в приглашении', '提示符用户名', 'プロンプトのユーザー名', '프롬프트 사용자 이름'],
  ui_theme: ['Tema', 'Theme', 'Tema', 'Thème', 'Design', 'Tema', 'Тема', '主题', 'テーマ', '테마'],
  ui_theme_caderno: ['Caderno (claro)', 'Notebook (light)', 'Cuaderno (claro)', 'Cahier (clair)', 'Notizbuch (hell)', 'Quaderno (chiaro)', 'Тетрадь (светлая)', '笔记本（浅色）', 'ノート（ライト）', '노트(라이트)'],
  ui_language: ['Idioma', 'Language', 'Idioma', 'Langue', 'Sprache', 'Lingua', 'Язык', '语言', '言語', '언어'],
  ui_language_auto: ['Automático (idioma do sistema)', 'Automatic (system language)', 'Automático (idioma del sistema)', 'Automatique (langue du système)', 'Automatisch (Systemsprache)', 'Automatica (lingua di sistema)', 'Автоматически (язык системы)', '自动（系统语言）', '自動（システムの言語）', '자동(시스템 언어)'],
  ui_initial_technology: ['Tecnologia inicial', 'Initial technology', 'Tecnología inicial', 'Technologie initiale', 'Start-Technologie', 'Tecnologia iniziale', 'Начальная технология', '初始技术', '初期テクノロジー', '시작 기술'],
  ui_font_family: ['Fonte monoespaçada (vazio = padrão)', 'Monospace font (empty = default)', 'Fuente monoespaciada (vacío = predeterminada)', 'Police à chasse fixe (vide = par défaut)', 'Monospace-Schrift (leer = Standard)', 'Font monospazio (vuoto = predefinito)', 'Моноширинный шрифт (пусто = по умолчанию)', '等宽字体（留空 = 默认）', '等幅フォント（空欄 = 既定）', '고정폭 글꼴(비우면 기본값)'],
  ui_font_scale: ['Tamanho da fonte', 'Font size', 'Tamaño de fuente', 'Taille de police', 'Schriftgröße', 'Dimensione carattere', 'Размер шрифта', '字体大小', 'フォントサイズ', '글꼴 크기'],
  ui_ui_scale: ['Escala da interface', 'Interface scale', 'Escala de la interfaz', "Échelle de l'interface", 'Oberflächenskalierung', 'Scala interfaccia', 'Масштаб интерфейса', '界面缩放', 'UIの拡大率', '인터페이스 배율'],
  ui_safe_bottom: ['Margem da barra de tarefas (px)', 'Taskbar margin (px)', 'Margen de la barra de tareas (px)', 'Marge de la barre des tâches (px)', 'Taskleisten-Abstand (px)', 'Margine barra delle applicazioni (px)', 'Отступ панели задач (px)', '任务栏边距（px）', 'タスクバーの余白（px）', '작업 표시줄 여백(px)'],
  ui_safe_left: ['Margem esquerda — ícones da área de trabalho (px)', 'Left margin — desktop icons (px)', 'Margen izquierdo — iconos del escritorio (px)', 'Marge gauche — icônes du bureau (px)', 'Linker Rand — Desktop-Symbole (px)', 'Margine sinistro — icone del desktop (px)', 'Левый отступ — значки рабочего стола (px)', '左边距 — 桌面图标（px）', '左余白 — デスクトップアイコン（px）', '왼쪽 여백 — 바탕 화면 아이콘(px)'],
  ui_safe_right: ['Margem direita — ícones da área de trabalho (px)', 'Right margin — desktop icons (px)', 'Margen derecho — iconos del escritorio (px)', 'Marge droite — icônes du bureau (px)', 'Rechter Rand — Desktop-Symbole (px)', 'Margine destro — icone del desktop (px)', 'Правый отступ — значки рабочего стола (px)', '右边距 — 桌面图标（px）', '右余白 — デスクトップアイコン（px）', '오른쪽 여백 — 바탕 화면 아이콘(px)'],
  ui_idle_timeout: ['Tela de descanso após (min sem interação, 0 = desligada)', 'Idle screen after (min without input, 0 = off)', 'Pantalla de reposo tras (min sin interacción, 0 = desactivada)', "Écran de veille après (min d'inactivité, 0 = désactivé)", 'Ruhebildschirm nach (Min. ohne Eingabe, 0 = aus)', 'Schermata di riposo dopo (min di inattività, 0 = disattivata)', 'Экран простоя через (мин без действий, 0 = выкл.)', '闲置屏幕延迟（无操作分钟数，0 = 关闭）', 'アイドル画面までの時間（無操作の分数、0 = オフ）', '대기 화면 전환(입력 없음 분, 0 = 끔)'],
  ui_crt_level: ['Qualidade do efeito CRT', 'CRT effect quality', 'Calidad del efecto CRT', "Qualité de l'effet CRT", 'Qualität des CRT-Effekts', 'Qualità effetto CRT', 'Качество эффекта ЭЛТ', 'CRT 效果质量', 'CRTエフェクトの品質', 'CRT 효과 품질'],
  ui_crt_off: ['Desligado', 'Off', 'Desactivado', 'Désactivé', 'Aus', 'Disattivato', 'Выкл.', '关闭', 'オフ', '끔'],
  ui_crt_low: ['Baixo', 'Low', 'Bajo', 'Faible', 'Niedrig', 'Basso', 'Низкое', '低', '低', '낮음'],
  ui_crt_balanced: ['Balanceado', 'Balanced', 'Equilibrado', 'Équilibré', 'Ausgewogen', 'Bilanciato', 'Сбалансированное', '均衡', 'バランス', '균형'],
  ui_crt_high: ['Alto', 'High', 'Alto', 'Élevé', 'Hoch', 'Alto', 'Высокое', '高', '高', '높음'],
  ui_scanlines: ['Scanlines', 'Scanlines', 'Líneas de barrido', 'Lignes de balayage', 'Scanlines', 'Linee di scansione', 'Линии развёртки', '扫描线', '走査線', '스캔라인'],
  ui_flicker: ['Flicker', 'Flicker', 'Parpadeo', 'Scintillement', 'Flimmern', 'Sfarfallio', 'Мерцание', '闪烁', 'ちらつき', '깜빡임'],
  ui_glow: ['Glow', 'Glow', 'Resplandor', 'Lueur', 'Leuchten', 'Bagliore', 'Свечение', '辉光', 'グロー', '글로우'],
  ui_noise: ['Ruído', 'Noise', 'Ruido', 'Bruit', 'Rauschen', 'Rumore', 'Шум', '噪点', 'ノイズ', '노이즈'],
  ui_vignette: ['Vinheta', 'Vignette', 'Viñeta', 'Vignettage', 'Vignette', 'Vignettatura', 'Виньетка', '暗角', 'ビネット', '비네팅'],
  ui_chromatic: ['Aberração cromática', 'Chromatic aberration', 'Aberración cromática', 'Aberration chromatique', 'Chromatische Aberration', 'Aberrazione cromatica', 'Хроматическая аберрация', '色差', '色収差', '색수차'],
  ui_curvature: ['Curvatura', 'Curvature', 'Curvatura', 'Courbure', 'Krümmung', 'Curvatura', 'Кривизна экрана', '屏幕曲率', '画面の湾曲', '화면 곡률'],
  ui_boot_animation: ['Animação inicial', 'Boot animation', 'Animación de inicio', 'Animation de démarrage', 'Start-Animation', 'Animazione di avvio', 'Анимация загрузки', '启动动画', '起動アニメーション', '부팅 애니메이션'],
  ui_show_clock: ['Mostrar relógio', 'Show clock', 'Mostrar reloj', "Afficher l'horloge", 'Uhr anzeigen', 'Mostra orologio', 'Показывать часы', '显示时钟', '時計を表示', '시계 표시'],
  ui_clock_24h: ['Relógio 24h', '24-hour clock', 'Reloj de 24 h', 'Horloge 24 h', '24-Stunden-Uhr', 'Orologio 24 ore', '24-часовой формат', '24 小时制', '24時間表示', '24시간제'],
  ui_show_tabs: ['Barra de tecnologias', 'Technology bar', 'Barra de tecnologías', 'Barre des technologies', 'Technologie-Leiste', 'Barra delle tecnologie', 'Панель технологий', '技术栏', 'テクノロジーバー', '기술 바'],
  ui_show_category_pane: ['Painel de categorias', 'Categories pane', 'Panel de categorías', 'Panneau des catégories', 'Kategorien-Bereich', 'Pannello categorie', 'Панель категорий', '分类面板', 'カテゴリパネル', '카테고리 패널'],
  ui_show_details_pane: ['Painel de detalhes', 'Details pane', 'Panel de detalles', 'Panneau des détails', 'Detail-Bereich', 'Pannello dettagli', 'Панель подробностей', '详情面板', '詳細パネル', '세부 정보 패널'],
  ui_show_command_line: ['Linha de comando', 'Command line', 'Línea de comandos', 'Ligne de commande', 'Befehlszeile', 'Riga di comando', 'Командная строка', '命令行', 'コマンドライン', '명령줄'],
  ui_show_status_bar: ['Barra de estado', 'Status bar', 'Barra de estado', "Barre d'état", 'Statusleiste', 'Barra di stato', 'Строка состояния', '状态栏', 'ステータスバー', '상태 표시줄'],
  ui_enable_history: ['Registrar histórico', 'Record history', 'Registrar historial', "Enregistrer l'historique", 'Verlauf speichern', 'Registra cronologia', 'Сохранять историю', '记录历史', '履歴を記録', '기록 저장'],
  ui_show_favorites: ['Mostrar favoritos', 'Show favorites', 'Mostrar favoritos', 'Afficher les favoris', 'Favoriten anzeigen', 'Mostra preferiti', 'Показывать избранное', '显示收藏', 'お気に入りを表示', '즐겨찾기 표시'],
  ui_lines: ['Quantidade de linhas (0 = automático)', 'Number of lines (0 = automatic)', 'Cantidad de líneas (0 = automático)', 'Nombre de lignes (0 = automatique)', 'Anzahl der Zeilen (0 = automatisch)', 'Numero di righe (0 = automatico)', 'Количество строк (0 = авто)', '行数（0 = 自动）', '行数（0 = 自動）', '줄 수(0 = 자동)'],
  ui_density: ['Densidade', 'Density', 'Densidad', 'Densité', 'Dichte', 'Densità', 'Плотность', '密度', '密度', '밀도'],
  ui_density_compact: ['Compacta', 'Compact', 'Compacta', 'Compacte', 'Kompakt', 'Compatta', 'Компактная', '紧凑', 'コンパクト', '조밀'],
  ui_density_normal: ['Normal', 'Normal', 'Normal', 'Normale', 'Normal', 'Normale', 'Обычная', '正常', '標準', '보통'],
  ui_density_relaxed: ['Relaxada', 'Relaxed', 'Holgada', 'Aérée', 'Locker', 'Ampia', 'Свободная', '宽松', 'ゆったり', '여유'],
  ui_max_fps: ['FPS máximo', 'Max FPS', 'FPS máximos', 'FPS maximum', 'Max. FPS', 'FPS massimi', 'Макс. FPS', '最大 FPS', '最大FPS', '최대 FPS'],
  ui_reduced_motion: ['Reduzir movimento', 'Reduce motion', 'Reducir movimiento', 'Réduire les animations', 'Bewegung reduzieren', 'Riduci movimento', 'Уменьшить анимацию', '减少动态效果', '動きを減らす', '움직임 줄이기'],
  ui_keyboard_shortcuts: ['Atalhos de teclado', 'Keyboard shortcuts', 'Atajos de teclado', 'Raccourcis clavier', 'Tastenkürzel', 'Scorciatoie da tastiera', 'Сочетания клавиш', '键盘快捷键', 'キーボードショートカット', '키보드 단축키'],
  ui_syntax_highlight: ['Realce de sintaxe (cores nos comandos)', 'Syntax highlighting (colored commands)', 'Resaltado de sintaxis (comandos en color)', 'Coloration syntaxique (commandes en couleur)', 'Syntaxhervorhebung (farbige Befehle)', 'Evidenziazione sintassi (comandi colorati)', 'Подсветка синтаксиса (цветные команды)', '语法高亮（彩色命令）', 'シンタックスハイライト（コマンドを色付け）', '구문 강조(명령어 색상)'],
};

/** propriedade -> chave do `text`. */
const PROPERTY_TEXT = {
  username: 'ui_username',
  theme: 'ui_theme',
  language: 'ui_language',
  initialTechnology: 'ui_initial_technology',
  fontFamily: 'ui_font_family',
  fontScale: 'ui_font_scale',
  uiScale: 'ui_ui_scale',
  safeBottom: 'ui_safe_bottom',
  safeLeft: 'ui_safe_left',
  safeRight: 'ui_safe_right',
  idleTimeout: 'ui_idle_timeout',
  crtLevel: 'ui_crt_level',
  scanlines: 'ui_scanlines',
  flicker: 'ui_flicker',
  glow: 'ui_glow',
  noise: 'ui_noise',
  vignette: 'ui_vignette',
  chromatic: 'ui_chromatic',
  curvature: 'ui_curvature',
  bootAnimation: 'ui_boot_animation',
  showClock: 'ui_show_clock',
  clock24h: 'ui_clock_24h',
  showTabs: 'ui_show_tabs',
  showCategoryPane: 'ui_show_category_pane',
  showDetailsPane: 'ui_show_details_pane',
  showCommandLine: 'ui_show_command_line',
  showStatusBar: 'ui_show_status_bar',
  enableHistory: 'ui_enable_history',
  showFavorites: 'ui_show_favorites',
  lines: 'ui_lines',
  density: 'ui_density',
  maxFps: 'ui_max_fps',
  reducedMotion: 'ui_reduced_motion',
  keyboardShortcuts: 'ui_keyboard_shortcuts',
  syntaxHighlight: 'ui_syntax_highlight',
};

/** propriedade -> (valor da opção -> chave do `label`). */
const OPTION_LABELS = {
  theme: { caderno: 'ui_theme_caderno' },
  crtLevel: { off: 'ui_crt_off', low: 'ui_crt_low', balanced: 'ui_crt_balanced', high: 'ui_crt_high' },
  density: { compact: 'ui_density_compact', normal: 'ui_density_normal', relaxed: 'ui_density_relaxed' },
};

// ---------------------------------------------------------------------------

for (const [key, row] of Object.entries(T)) {
  if (row.length !== LOCALES.length) throw new Error(`${key}: ${row.length} colunas, esperado ${LOCALES.length}`);
}

const project = JSON.parse(readFileSync(projectPath, 'utf8'));
const props = project.general.properties;

for (const [prop, key] of Object.entries(PROPERTY_TEXT)) {
  if (!props[prop]) throw new Error(`propriedade inexistente no project.json: ${prop}`);
  props[prop].text = key;
}
for (const [prop, map] of Object.entries(OPTION_LABELS)) {
  for (const opt of props[prop].options) if (map[opt.value]) opt.label = map[opt.value];
}

// Seletor de idioma: automático + nomes nativos (não se traduz o nome de um idioma).
props.language.value = 'auto';
props.language.options = [
  { label: 'ui_language_auto', value: 'auto' },
  ...APP_LANGUAGES.map(([value, label]) => ({ label, value })),
];

const localization = {};
LOCALES.forEach((loc, i) => {
  localization[loc] = Object.fromEntries(Object.entries(T).map(([k, row]) => [k, row[i]]));
});

// `localization` fica ao lado de `properties`, como na documentação do WE.
project.general = { properties: props, localization };
writeFileSync(projectPath, JSON.stringify(project, null, 2) + '\n');
console.log(`✓ project.json: ${Object.keys(T).length} rótulos × ${LOCALES.length} idiomas`);
