import { useState, useMemo, useEffect } from 'react';

const THEMES = {
  minimal: {
    bg: '#ffffff',
    empty: '#ebedf0',
    colors: ['#9be9a8', '#40c463', '#30a14e', '#216e39'],
    cellShape: 'rect',
    cellRadius: 2,
    labelColor: '#94a3b8',
    lineColor: '#e2e8f0',
  },
  tree_wood: {
    bg: '#e8f5e9',
    empty: '#c8e6c9',
    colors: ['#86efac', '#22c55e', '#16a34a', '#14532d'],
    cellShape: 'circle',
    labelColor: '#166534',
    lineColor: '#bbf7d0',
    trunkColor: '#92400e',
  },
  space: {
    bg: '#0f0f1a',
    empty: '#2a3040',
    colors: [
      '#6b7f96',
      '#8fa5ba',
      '#b4cad8',
      '#d8eaf4',
    ],
    cellShape: 'circle',
    cellRadius: 3,
    labelColor: '#818cf8',
    lineColor: '#2d2d44',
  },
  pixel: {
    bg: '#0d0d0d',
    empty: '#0a1a0a',
    colors: ['#1a4d1a', '#00aa33', '#00ff41', '#ccff00'],
    cellShape: 'rect',
    cellRadius: 0,
    labelColor: '#00ff41',
    lineColor: '#0a2a0a',
  },
};

function getSizeScale(commits) {
  if (commits === 0)   return 0.25;
  if (commits <= 50)   return 0.30;
  if (commits <= 100)  return 0.40;
  if (commits <= 500)  return 0.60;
  if (commits <= 1000) return 0.80;
  if (commits <= 3000) return 1.00;
  return 1.20;
}

function getTreeMessage(commits) {
  if (commits === 1)    return '?';
  if (commits <= 100)  return '나뭇잎이 곧 떨어지겠어요..';
  if (commits <= 500)  return '나무가 점점 커지고 있어요!';
  if (commits <= 1000) return '나무가 가득 차 보여요!';
  if (commits <= 3000) return '나무가 거대해요..!';
  return '최대 크기 나무에요!';
}

function getMoonMessage(commits) {
  if (commits === 0)   return '?';
  if (commits <= 100)  return '달이 너무 작아요..';
  if (commits <= 500)  return '달이 보여요..!';
  if (commits <= 1000) return '달이 눈부시게 빛나요!';
  if (commits <= 3000) return '이정도면 보름달 아닌가요?';
  return '완벽한 보름달이에요!';
}

function getPixelMessage(commits) {
  if (commits === 0)   return '?';
  if (commits <= 100)  return 'LEVEL 2  BABO';
  if (commits <= 500)  return 'LEVEL 3  CHOBO';
  if (commits <= 1000) return 'LEVEL 4  GOSU';
  if (commits <= 3000) return 'LEVEL 5  MASTER';
  return 'LEGEND.';
}

const MOON_R      = 110;
const MOON_CELL_R = 3.2;
const MOON_GAP    = MOON_CELL_R * 2.6;

const SUN_X = 432;
const SUN_Y = 48;

function GrassGraph({ contributions, theme = 'minimal', totalCommits = 0, username = '', forExport = false }) {
  const [tooltip, setTooltip] = useState(null);

  // ─── 달 테마: 무작위 위치에서 별이 나타났다 사라지는 동적 별 ──────────────
  const [liveStars, setLiveStars] = useState([]);

  useEffect(() => {
    if (theme !== 'space') {
      setLiveStars([]);
      return;
    }

    const spawnStar = () => ({
      id: `${Date.now()}-${Math.random()}`,
      x: 6 + Math.random() * 488,
      y: 6 + Math.random() * 374,
      r: Math.random() > 0.72 ? 1.5 : Math.random() > 0.44 ? 1.0 : 0.6,
      dur: 1.4 + Math.random() * 2.8,
    });

    setLiveStars(Array.from({ length: 55 }, spawnStar));

    const interval = setInterval(() => {
      setLiveStars(prev => {
        const next = [...prev];
        const count = Math.floor(Math.random() * 6) + 3;
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * next.length);
          next[idx] = spawnStar();
        }
        return next;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [theme]);

  const themeConfig = THEMES[theme] || THEMES.minimal;

  const recentDays = useMemo(() => {
    if (!contributions || !contributions.contributions) return [];
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    return contributions.contributions
      .filter(day => {
        const d = new Date(day.date);
        return d >= oneYearAgo && d <= today;
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [contributions]);

  const yearCommits = useMemo(() => {
    if (!contributions || !contributions.total) return 0;
    return contributions.total[new Date().getFullYear()] || 0;
  }, [contributions]);

  const sizeScale = useMemo(() => getSizeScale(yearCommits), [yearCommits]);

  const getColor = (count) => {
    if (count === 0) return themeConfig.empty;
    if (count < 3)  return themeConfig.colors[0];
    if (count < 6)  return themeConfig.colors[1];
    if (count < 9)  return themeConfig.colors[2];
    return themeConfig.colors[3];
  };

  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < recentDays.length; i += 7) {
      w.push(recentDays.slice(i, i + 7));
    }
    return w;
  }, [recentDays]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = null;
    let lastYear  = null;
    weeks.forEach((week, weekIdx) => {
      if (!week[0]) return;
      const d     = new Date(week[0].date);
      const month = d.getMonth();
      const year  = d.getFullYear();
      if (month !== lastMonth) {
        const isFirst      = lastMonth === null;
        const isYearChange = year !== lastYear;
        let text;
        if (isFirst)           text = `${year}.${month + 1}`;
        else if (isYearChange) text = `${year}`;
        else                   text = `${month + 1}월`;
        labels.push({ weekIdx, text, isYear: isFirst || isYearChange });
        lastMonth = month;
        lastYear  = year;
      }
    });
    return labels;
  }, [weeks]);

  // ─── 나무 테마: 잎 위치 계산 ───────────────────────────────────────────
  const leafPositions = useMemo(() => {
    if (theme !== 'tree_wood') return [];
    const activeDays = recentDays.filter(d => d.count > 0);
    const r       = 85 * sizeScale;
    const spacing = 9.3;
    const gridPositions = [];
    for (let row = -Math.ceil(r / spacing); row <= Math.ceil(r / spacing); row++) {
      for (let col = -Math.ceil(r / spacing); col <= Math.ceil(r / spacing); col++) {
        const x = col * spacing + (row % 2 === 0 ? 0 : spacing / 2);
        const y = row * spacing;
        if (x * x + y * y <= r * r) gridPositions.push({ x, y });
      }
    }
    gridPositions.sort((a, b) => (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y));
    return activeDays.slice(0, gridPositions.length).map((day, i) => ({
      ...day,
      x: gridPositions[i].x,
      y: gridPositions[i].y,
    }));
  }, [recentDays, theme, sizeScale]);

  // ─── 달 테마: 셀 위치 + 잔디 데이터 매핑 ──────────────────────────────
  const moonCells = useMemo(() => {
    if (theme !== 'space') return [];

    const positions = [];
    for (let row = -Math.ceil(MOON_R / MOON_GAP); row <= Math.ceil(MOON_R / MOON_GAP); row++) {
      for (let col = -Math.ceil(MOON_R / MOON_GAP); col <= Math.ceil(MOON_R / MOON_GAP); col++) {
        const x = col * MOON_GAP;
        const y = row * MOON_GAP;
        if (x * x + y * y <= (MOON_R - MOON_CELL_R) * (MOON_R - MOON_CELL_R)) {
          positions.push({ x, y });
        }
      }
    }

    positions.sort((a, b) => (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y));

    const activeDays = recentDays.filter(d => d.count > 0);
    const sliced = positions.slice(0, activeDays.length);

    return sliced.map((pos, i) => ({
      ...pos,
      day: activeDays[i],
    }));
  }, [theme, recentDays]);

  // ─── 픽셀 테마: 인베이더 실루엣 격자 계산 ──────────────────────────────
  const pixelCells = useMemo(() => {
    if (theme !== 'pixel') return { filled: [], empty: [] };

    // 19×14 픽셀 맵 (1=셀, 0=배경)
    const MAP = [
      [0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
      [0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0],
      [0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1],
      [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0],
      [0,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,0],
      [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    ];

    const STEP = 14;
    const allPos = [];

    for (let row = 0; row < MAP.length; row++) {
      for (let col = 0; col < MAP[row].length; col++) {
        if (MAP[row][col] === 1) {
          allPos.push({ px: col * STEP, py: row * STEP });
        }
      }
    }
    const activeDays = recentDays.filter(d => d.count > 0);
    const fillCount  = Math.min(activeDays.length, allPos.length);

    return {
      filled: allPos.slice(0, fillCount).map((pos, i) => ({ ...pos, day: activeDays[i] })),
      empty:  allPos.slice(fillCount),
    };
  }, [theme, recentDays]);

  if (!recentDays || recentDays.length === 0) {
    return (
      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>
        잔디 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  // ===== 나무 테마 렌더링 ====================================================
  if (theme === 'tree_wood') {
    const activeDays = recentDays.filter(d => d.count > 0);
    const hasCommits = activeDays.length > 0;
    const message    = getTreeMessage(yearCommits);

    const W      = 500;
    const H      = 420;
    const cx     = W / 2;
    const crownR = 85 * sizeScale;

    const minTopMargin = 65;
    const crownCY  = Math.max(minTopMargin + crownR, 190) + crownR * 0.5;
    const trunkW   = Math.round(14 + sizeScale * 6);
    const trunkH   = Math.round(60 + sizeScale * 12);
    const trunkTop = Math.round(crownCY + crownR) - 12;
    const groundY  = trunkTop + trunkH;
    const groundH  = H - groundY;

    return (
      <div style={{ backgroundColor: '#e8f5e9', borderRadius: '12px', padding: '16px', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', maxWidth: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect x={0} y={0} width={W} height={groundY} fill="#dbeafe" />

          {/* 태양: 심플 pulse */}
          <circle cx={SUN_X} cy={SUN_Y} r={18} fill="#fde68a" opacity="0.18">
            <animate attributeName="r" values="16;22;16" dur="3.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.14;0.28;0.14" dur="3.5s" repeatCount="indefinite" />
          </circle>
          <circle cx={SUN_X} cy={SUN_Y} r={13} fill="#fbbf24" />

          <text x={14} y={24} fontSize="11" fill="#334155" fontWeight="700" fontFamily="system-ui, sans-serif">
            {username}님의 GitHub
          </text>

          {message !== '' && (
            <text x={cx} y={42} fontSize="12" fill="#166534" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">
              {message}
            </text>
          )}

          {/* 구름 */}
          <ellipse cx={75}  cy={78} rx={36} ry={16} fill="white" opacity="0.75" />
          <ellipse cx={105} cy={70} rx={26} ry={14} fill="white" opacity="0.75" />
          <ellipse cx={300} cy={88} rx={30} ry={14} fill="white" opacity="0.60" />
          <ellipse cx={326} cy={80} rx={20} ry={12} fill="white" opacity="0.60" />

          <rect x={0} y={groundY}     width={W} height={groundH} fill="#86efac" />
          <rect x={0} y={groundY}     width={W} height={5}       fill="#4ade80" />
          <rect x={0} y={groundY + 5} width={W} height={4}       fill="#22c55e" opacity="0.5" />

          {/* 나무 기둥 */}
          <rect x={cx - trunkW / 2 + 3} y={trunkTop + 4} width={trunkW} height={trunkH} rx={4} fill="#000" opacity="0.08" />
          <rect x={cx - trunkW / 2}     y={trunkTop}     width={trunkW} height={trunkH} rx={4} fill="#92400e" />
          <rect x={cx - trunkW / 2 + 4} y={trunkTop + 10} width={Math.max(Math.floor(trunkW / 4), 3)} height={trunkH - 20} rx={2} fill="#fbbf24" opacity="0.25" />

          {!hasCommits && (
            <text x={cx} y={crownCY} fontSize="13" fill="#94a3b8" fontWeight="500" textAnchor="middle" fontFamily="system-ui, sans-serif">
              잔디가 부족해요..
            </text>
          )}

          {yearCommits > 0 && leafPositions.map((day, i) => (
            <circle key={`shadow-${i}`} cx={cx + day.x + 2} cy={crownCY + day.y + 2} r={4} fill="#000" opacity="0.06" />
          ))}
          {yearCommits > 0 && leafPositions.map((day, i) => (
            <circle
              key={`leaf-${i}`}
              cx={cx + day.x} cy={crownCY + day.y}
              r={4} fill={getColor(day.count)} opacity={0.92}
              onMouseEnter={(e) => setTooltip({ day, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}

          <text x={cx} y={groundY + 20} fontSize="10" fill="#166534" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
            올해 {yearCommits.toLocaleString()}커밋
          </text>

        </svg>

        {tooltip && (
          <div style={{
            position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 36,
            backgroundColor: '#1e293b', color: '#fff',
            padding: '6px 10px', borderRadius: '6px',
            fontSize: '11px', fontWeight: '500',
            pointerEvents: 'none', zIndex: 50, whiteSpace: 'nowrap',
          }}>
            {tooltip.day.date} · {tooltip.day.count}커밋
          </div>
        )}

        {!forExport && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', marginTop: '8px',
            fontSize: '11px', color: '#166534', fontWeight: '500',
          }}>
            <span>현생</span>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {[themeConfig.empty, ...themeConfig.colors].map((c, i) => (
                <svg key={i} width="10" height="10">
                  <circle cx="5" cy="5" r="4" fill={c} />
                </svg>
              ))}
            </div>
            <span>갓생</span>
          </div>
        )}
      </div>
    );
  }

  // ===== 달 테마 렌더링 ======================================================
  if (theme === 'space') {
    const W       = 500;
    const H       = 420;
    const cx      = W / 2;
    const cy      = H / 2 + 10;
    const message = getMoonMessage(yearCommits);

    return (
      <div style={{ backgroundColor: '#0f0f1a', borderRadius: '12px', padding: '16px', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', maxWidth: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect x={0} y={0} width={W} height={H} fill="#0f0f1a" />

          {/* 무작위 위치에서 나타났다 사라지는 별 */}
          {liveStars.map((s) => (
            <circle
              key={s.id}
              className="star-twinkle"
              cx={s.x} cy={s.y} r={s.r}
              fill="white"
              style={{ animationDuration: `${s.dur}s` }}
            />
          ))}

          <text x={14} y={22} fontSize="12" fill="#818cf8" fontWeight="700" fontFamily="system-ui, sans-serif">
            {username}님의 GitHub
          </text>

          {message !== '' && (
            <text x={cx} y={44} fontSize="11" fill="#a5b4fc" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
              {message}
            </text>
          )}

          {yearCommits > 0 && moonCells.map(({ x, y, day }, i) => (
            <circle
              key={`cell-${i}`}
              cx={cx + x} cy={cy + y}
              r={MOON_CELL_R}
              fill={getColor(day.count)}
              opacity={0.92}
              onMouseEnter={day.date ? (e) => setTooltip({ day, x: e.clientX, y: e.clientY }) : undefined}
              onMouseLeave={day.date ? () => setTooltip(null) : undefined}
              style={{ cursor: day.date ? 'pointer' : 'default' }}
            />
          ))}

          <text x={cx} y={H - 16} fontSize="10" fill="#a78bfa" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
            올해 {yearCommits.toLocaleString()}커밋
          </text>
        </svg>

        {tooltip && (
          <div style={{
            position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 36,
            backgroundColor: '#1e1e2e', color: '#a5b4fc',
            border: '1px solid #6366f1',
            padding: '6px 10px', borderRadius: '6px',
            fontSize: '11px', fontWeight: '500',
            pointerEvents: 'none', zIndex: 50, whiteSpace: 'nowrap',
          }}>
            {tooltip.day.date} · {tooltip.day.count}커밋
          </div>
        )}

        {!forExport && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', marginTop: '8px',
            fontSize: '11px', color: '#818cf8', fontWeight: '500',
          }}>
            <span>현생</span>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {[themeConfig.empty, ...themeConfig.colors].map((c, i) => (
                <svg key={i} width="10" height="10">
                  <circle cx="5" cy="5" r="4" fill={c} />
                </svg>
              ))}
            </div>
            <span>갓생</span>
          </div>
        )}
      </div>
    );
  }

  // ===== 픽셀 테마 렌더링 ====================================================
  if (theme === 'pixel') {
    const message  = getPixelMessage(yearCommits);
    const W        = 500;
    const H        = 420;
    const CELL     = 12;
    const STEP     = 14;
    const INV_COLS = 19;
    const invW   = INV_COLS * STEP;
    const startX = Math.round((W - invW) / 2);
    const startY   = 100;

    return (
      <div style={{
        backgroundColor: '#0d0d0d',
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
      }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', maxWidth: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect x={0} y={0} width={W} height={H} fill="#0d0d0d" />

          {/* 스캔라인 */}
          {Array.from({ length: Math.ceil(H / 4) }, (_, i) => (
            <line key={`sl-${i}`} x1={0} y1={i * 4} x2={W} y2={i * 4}
              stroke="rgba(0,255,65,0.02)" strokeWidth="1.5" />
          ))}

          <text x={14} y={22} fontSize="11" fill="#00ff41" fontWeight="700" fontFamily="system-ui, sans-serif">
            {username}님의 GitHub
          </text>

          <text x={W / 2} y={46} fontSize={yearCommits === 0 ? '16' : '10'} fill="#00aa33" fontWeight="600"
            textAnchor="middle" fontFamily='"Courier New", Courier, monospace' letterSpacing="0.12em">
            {message}
          </text>

          {/* 빈 인베이더 셀 (어두운 실루엣) — 커밋 있을 때만 표시 */}
          {yearCommits > 0 && pixelCells.empty.map(({ px, py }, i) => (
            <rect key={`pe-${i}`}
              x={startX + px} y={startY + py}
              width={CELL} height={CELL}
              fill="#0d2a0d" rx={1}
            />
          ))}

          {/* 채워진 인베이더 셀 (커밋 데이터) — 커밋 있을 때만 표시 */}
          {yearCommits > 0 && pixelCells.filled.map(({ px, py, day }, i) => (
            <rect key={`pf-${i}`}
              x={startX + px} y={startY + py}
              width={CELL} height={CELL}
              fill={getColor(day.count)} rx={1}
              onMouseEnter={(e) => setTooltip({ day, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}

          {/* 총 커밋 */}
          <text x={W / 2} y={H - 16} fontSize="10" fill="#00ff41" fontWeight="600"
            textAnchor="middle" fontFamily="system-ui, sans-serif">
            올해 {yearCommits.toLocaleString()}커밋
          </text>
        </svg>

        {tooltip && (
          <div style={{
            position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 36,
            backgroundColor: '#0a1a0a', color: '#00ff41',
            border: '1px solid #00ff41',
            padding: '6px 10px', borderRadius: '3px',
            fontSize: '11px', fontWeight: '500',
            fontFamily: '"Courier New", Courier, monospace',
            pointerEvents: 'none', zIndex: 50, whiteSpace: 'nowrap',
          }}>
            {tooltip.day.date} · {tooltip.day.count}커밋
          </div>
        )}

        {!forExport && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', marginTop: '8px',
            fontSize: '11px', color: '#00ff41', fontWeight: '500',
          }}>
            <span>현생</span>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {[themeConfig.empty, ...themeConfig.colors].map((c, i) => (
                <div key={i} style={{ width: '10px', height: '10px', backgroundColor: c, borderRadius: '1px' }} />
              ))}
            </div>
            <span>갓생</span>
          </div>
        )}
      </div>
    );
  }

  // ===== 기본 테마 렌더링 ====================================================
  const LABEL_HEIGHT = 18;
  const CELL_GAP     = 14;
  const CELL_SIZE    = 12;
  const svgW = weeks.length * CELL_GAP + 20;
  const svgH = 7 * CELL_GAP + LABEL_HEIGHT + 10;

  const renderCell = (day, weekIdx, dayIdx) => {
    const x = weekIdx * CELL_GAP + 10;
    const y = dayIdx  * CELL_GAP + LABEL_HEIGHT + 4;
    const color = getColor(day.count);
    const commonProps = {
      fill: color,
      onMouseEnter: (e) => setTooltip({ day, x: e.clientX, y: e.clientY }),
      onMouseLeave: () => setTooltip(null),
      style: { cursor: 'pointer' },
    };
    if (themeConfig.cellShape === 'circle') {
      return <circle key={`${weekIdx}-${dayIdx}`} {...commonProps} cx={x + 6} cy={y + 6} r={5} />;
    }
    return (
      <rect key={`${weekIdx}-${dayIdx}`} {...commonProps} x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} rx={themeConfig.cellRadius} />
    );
  };

  return (
    <div style={{ backgroundColor: themeConfig.bg, borderRadius: '8px', padding: '16px', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        style={{ display: 'block', maxWidth: '100%' }}
        preserveAspectRatio="xMinYMid meet"
      >
        {monthLabels.map(({ weekIdx, text, isYear }) => {
          const x = weekIdx * CELL_GAP + 10;
          return (
            <g key={`label-${weekIdx}`}>
              <line x1={x} y1={LABEL_HEIGHT - 2} x2={x} y2={svgH - 4} stroke={themeConfig.lineColor} strokeWidth="0.8" />
              <text x={x + 3} y={LABEL_HEIGHT - 5} fontSize="9" fill={themeConfig.labelColor} fontWeight={isYear ? '700' : '400'} fontFamily="system-ui, sans-serif">
                {text}
              </text>
            </g>
          );
        })}

        {weeks.map((week, weekIdx) =>
          week.map((day, dayIdx) => renderCell(day, weekIdx, dayIdx))
        )}
      </svg>

      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 36,
          backgroundColor: '#1e293b', color: '#fff',
          padding: '6px 10px', borderRadius: '6px',
          fontSize: '11px', fontWeight: '500',
          pointerEvents: 'none', zIndex: 50, whiteSpace: 'nowrap',
        }}>
          {tooltip.day.date} · {tooltip.day.count}커밋
        </div>
      )}

      {!forExport && (
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '6px', marginTop: '10px',
          fontSize: '11px', color: themeConfig.labelColor,
        }}>
          <span>현생</span>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {[themeConfig.empty, ...themeConfig.colors].map((c, i) => (
              themeConfig.cellShape === 'circle' ? (
                <svg key={i} width="10" height="10"><circle cx="5" cy="5" r="4" fill={c} /></svg>
              ) : (
                <div key={i} style={{ width: '10px', height: '10px', backgroundColor: c, borderRadius: themeConfig.cellRadius }} />
              )
            ))}
          </div>
          <span>갓생</span>
        </div>
      )}
    </div>
  );
}

export default GrassGraph;
