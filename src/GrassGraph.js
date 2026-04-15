import { useState, useMemo } from 'react';

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
    empty: '#d1fae5',
    colors: ['#86efac', '#22c55e', '#16a34a', '#14532d'],
    cellShape: 'circle',
    labelColor: '#166534',
    lineColor: '#bbf7d0',
    trunkColor: '#92400e',
  },
  space: {
    bg: '#0f0f1a',
    empty: '#2d2d44',
    colors: ['#818cf8', '#6366f1', '#4f46e5', '#c7d2fe'],
    cellShape: 'rect',
    cellRadius: 1,
    labelColor: '#6366f1',
    lineColor: '#2d2d44',
  },
  ocean: {
    bg: '#f0f9ff',
    empty: '#e0f2fe',
    colors: ['#7dd3fc', '#38bdf8', '#0284c7', '#0c4a6e'],
    cellShape: 'rect',
    cellRadius: 3,
    labelColor: '#0284c7',
    lineColor: '#bae6fd',
  },
};

function GrassGraph({ contributions, theme = 'minimal' }) {
  const [tooltip, setTooltip] = useState(null);
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
      .sort((a, b) => a.date < b.date ? -1 : 1);
  }, [contributions]);

  // totalCommits 계산 추가
  const totalCommits = useMemo(() => {
    return recentDays.reduce((sum, day) => sum + day.count, 0);
  }, [recentDays]);

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

  const leafPositions = useMemo(() => {
    if (theme !== 'tree_wood') return [];

    const activeDays = recentDays.filter(d => d.count > 0);
    const sizeScale = Math.min(Math.max(activeDays.length / 200, 0.4), 1.8);

    const rx = 115 * sizeScale;
    const ry = 85  * sizeScale;
    const spacing = 11;

    const gridPositions = [];
    for (let row = -Math.ceil(ry / spacing); row <= Math.ceil(ry / spacing); row++) {
      for (let col = -Math.ceil(rx / spacing); col <= Math.ceil(rx / spacing); col++) {
        const x = col * spacing + (row % 2 === 0 ? 0 : spacing / 2);
        const y = row * spacing;
        if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) {
          gridPositions.push({ x, y });
        }
      }
    }

    return activeDays.slice(0, gridPositions.length).map((day, i) => ({
      ...day,
      x: gridPositions[i].x,
      y: gridPositions[i].y,
      scale: sizeScale,
    }));
  }, [recentDays, theme]);

  if (!recentDays || recentDays.length === 0) {
    return (
      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>
        잔디 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  // ===== 나무 테마 렌더링 =====
  if (theme === 'tree_wood') {
    const activeDays   = recentDays.filter(d => d.count > 0);
    const hasCommits   = activeDays.length > 0;
    const sizeScale    = leafPositions[0]?.scale ?? 0.4;
    const W            = 500;
    const H            = 420;
    const cx           = W / 2;
    const crownCY      = 170;
    const trunkW       = Math.round(18 + sizeScale * 6);
    const trunkH       = Math.round(70 + sizeScale * 20);
    const trunkTop     = crownCY + Math.round(75 * sizeScale);
    const groundY      = trunkTop + trunkH;
    const groundH      = H - groundY;

    return (
      <div style={{ backgroundColor: '#e8f5e9', borderRadius: '12px', padding: '16px', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', maxWidth: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 하늘 */}
          <rect x={0} y={0} width={W} height={groundY} fill="#dbeafe" />

          {/* 구름 */}
          <ellipse cx={80}  cy={50} rx={38} ry={18} fill="white" opacity="0.7" />
          <ellipse cx={110} cy={42} rx={28} ry={16} fill="white" opacity="0.7" />
          <ellipse cx={400} cy={65} rx={32} ry={15} fill="white" opacity="0.6" />
          <ellipse cx={428} cy={57} rx={22} ry={13} fill="white" opacity="0.6" />

          {/* 땅 */}
          <rect x={0} y={groundY}     width={W} height={groundH} fill="#86efac" />
          <rect x={0} y={groundY}     width={W} height={5}       fill="#4ade80" />
          <rect x={0} y={groundY + 5} width={W} height={4}       fill="#22c55e" opacity="0.5" />

          {/* 기둥 그림자 */}
          <rect x={cx - trunkW / 2 + 3} y={trunkTop + 4} width={trunkW} height={trunkH} rx={4} fill="#000" opacity="0.08" />
          {/* 나무 기둥 */}
          <rect x={cx - trunkW / 2} y={trunkTop} width={trunkW} height={trunkH} rx={4} fill="#92400e" />
          {/* 기둥 하이라이트 */}
          <rect x={cx - trunkW / 2 + 4} y={trunkTop + 10} width={Math.max(trunkW / 4, 4)} height={trunkH - 20} rx={2} fill="#fbbf24" opacity="0.25" />

          {/* 커밋 없을 때 메시지 */}
          {!hasCommits && (
            <text
              x={cx}
              y={crownCY}
              fontSize="13"
              fill="#94a3b8"
              fontWeight="500"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
            >
              잔디가 부족해요..
            </text>
          )}

          {/* 잎 그림자 */}
          {leafPositions.map((day, i) => (
            <circle key={`shadow-${i}`} cx={cx + day.x + 2} cy={crownCY + day.y + 2} r={5} fill="#000" opacity="0.06" />
          ))}

          {/* 잎사귀 */}
          {leafPositions.map((day, i) => (
            <circle
              key={`leaf-${i}`}
              cx={cx + day.x}
              cy={crownCY + day.y}
              r={5}
              fill={getColor(day.count)}
              opacity={0.92}
              onMouseEnter={(e) => setTooltip({ day, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}

          {/* 총 커밋 텍스트 */}
          <text
            x={cx}
            y={groundY + 22}
            fontSize="10"
            fill="#166534"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
          >
            총 {totalCommits.toLocaleString()}커밋
          </text>

          {/* 하단 문구 */}
          <text
            x={cx}
            y={H - 8}
            fontSize="10.5"
            fill="#166534"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
          >
            잔디를 많이 모을수록 나무가 더 커져요!
          </text>
        </svg>

        {tooltip && (
          <div style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top:  tooltip.y - 36,
            backgroundColor: '#1e293b',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '500',
            pointerEvents: 'none',
            zIndex: 50,
            whiteSpace: 'nowrap',
          }}>
            {tooltip.day.date} · {tooltip.day.count}커밋
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', fontSize: '11px', color: '#166534', fontWeight: '500' }}>
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
      </div>
    );
  }

  // ===== 기본 테마들 렌더링 =====
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
    return <rect key={`${weekIdx}-${dayIdx}`} {...commonProps} x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} rx={themeConfig.cellRadius} />;
  };

  return (
    <div style={{ backgroundColor: themeConfig.bg, borderRadius: '8px', padding: '16px', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        style={{ display: 'block', maxWidth: '100%' }}
        preserveAspectRatio="xMinYMid meet"
      >
        {theme === 'space' && [...Array(30)].map((_, i) => (
          <circle
            key={`star-${i}`}
            className="star-twinkle"
            cx={(i * 37 + 11) % svgW}
            cy={(i * 53 + 7)  % svgH}
            r={i % 3 === 0 ? 1.2 : 0.7}
            fill="white"
            style={{
              animationDuration: `${1.5 + (i % 5) * 0.4}s`,
              animationDelay:    `${(i % 7) * 0.2}s`,
            }}
          />
        ))}

        {monthLabels.map(({ weekIdx, text, isYear }) => {
          const x = weekIdx * CELL_GAP + 10;
          return (
            <g key={`label-${weekIdx}`}>
              <line
                x1={x} y1={LABEL_HEIGHT - 2}
                x2={x} y2={svgH - 4}
                stroke={themeConfig.lineColor}
                strokeWidth="0.8"
              />
              <text
                x={x + 3}
                y={LABEL_HEIGHT - 5}
                fontSize="7"
                fill={themeConfig.labelColor}
                fontWeight={isYear ? '700' : '400'}
                fontFamily="system-ui, sans-serif"
              >
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
          position:        'fixed',
          left:            tooltip.x + 12,
          top:             tooltip.y - 36,
          backgroundColor: theme === 'space' ? '#1e1e2e' : '#1e293b',
          color:           theme === 'space' ? '#a5b4fc' : '#fff',
          border:          theme === 'space' ? '1px solid #6366f1' : 'none',
          padding:         '6px 10px',
          borderRadius:    '6px',
          fontSize:        '11px',
          fontWeight:      '500',
          pointerEvents:   'none',
          zIndex:          50,
          whiteSpace:      'nowrap',
        }}>
          {tooltip.day.date} · {tooltip.day.count}커밋
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', color: themeConfig.labelColor }}>
        <span>현생</span>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {[themeConfig.empty, ...themeConfig.colors].map((c, i) => (
            themeConfig.cellShape === 'circle' ? (
              <svg key={i} width="10" height="10">
                <circle cx="5" cy="5" r="4" fill={c} />
              </svg>
            ) : (
              <div key={i} style={{
                width:           '10px',
                height:          '10px',
                backgroundColor: c,
                borderRadius:    themeConfig.cellRadius,
              }} />
            )
          ))}
        </div>
        <span>갓생</span>
      </div>
    </div>
  );
}

export default GrassGraph;