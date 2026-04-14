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
    bg: 'linear-gradient(to bottom, #e0f2fe 0%, #f0fdf4 100%)',
    bgSolid: '#e0f2fe',
    empty: '#d1fae5',
    colors: ['#86efac', '#22c55e', '#16a34a', '#14532d'],
    trunkColor: '#78350f',
    groundColor: '#a16207',
    labelColor: '#16a34a',
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
  blossom: {
    bg: '#fff0f6',
    empty: '#fce7f3',
    colors: ['#fbcfe8', '#f472b6', '#ec4899', '#be185d'],
    cellShape: 'circle',
    cellRadius: 6,
    labelColor: '#f9a8d4',
    lineColor: '#fce7f3',
  },
};

function GrassGraph({ contributions, theme = 'minimal' }) {
  const [tooltip, setTooltip] = useState(null);
  const themeConfig = THEMES[theme] || THEMES.minimal;

  // ① 날짜 필터 + 정렬
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

  // ② 색상 결정
  const getColor = (count) => {
    if (count === 0) return themeConfig.empty;
    if (count < 3)  return themeConfig.colors[0];
    if (count < 6)  return themeConfig.colors[1];
    if (count < 9)  return themeConfig.colors[2];
    return themeConfig.colors[3];
  };

  // ③ 주 단위로 묶기
  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < recentDays.length; i += 7) {
      w.push(recentDays.slice(i, i + 7));
    }
    return w;
  }, [recentDays]);

  // ④ 월 라벨 계산
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
        if (isFirst) {
          text = `${year}.${month + 1}`;
        } else if (isYearChange) {
          text = `${year}`;
        } else {
          text = `${month + 1}월`;
        }

        labels.push({ weekIdx, text, isYear: isFirst || isYearChange });
        lastMonth = month;
        lastYear  = year;
      }
    });
    return labels;
  }, [weeks]);

  if (!recentDays || recentDays.length === 0) {
    return (
      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>
        잔디 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  // ===== 나무 테마 전용 렌더링 =====
  if (theme === 'tree_wood') {
    const svgW = 700;
    const svgH = 500;
    const centerX = svgW / 2;
    const centerY = 180;
    const leafRadius = 160;

    // 나뭇잎 영역에 원형으로 잔디 배치
    const leafPositions = recentDays.map((day, i) => {
      const angle = (i / recentDays.length) * Math.PI * 2;
      const r = Math.random() * leafRadius + 20; // 중심부터 퍼지는 효과
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r * 0.6; // 타원형
      return { ...day, x, y };
    });

    return (
      <div style={{
        background: themeConfig.bg,
        borderRadius: '8px',
        padding: '24px',
        position: 'relative',
      }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          style={{ display: 'block', maxWidth: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 하늘 배경 원 */}
          <circle cx={centerX} cy={centerY} r={leafRadius + 20} fill="#bae6fd" opacity="0.3" />

          {/* 나뭇잎 (잔디) */}
          {leafPositions.map((day, i) => (
            <circle
              key={i}
              cx={day.x}
              cy={day.y}
              r={6}
              fill={getColor(day.count)}
              onMouseEnter={(e) => setTooltip({ day, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}

          {/* 나무 기둥 */}
          <rect
            x={centerX - 15}
            y={centerY + leafRadius * 0.5}
            width={30}
            height={120}
            rx={5}
            fill={themeConfig.trunkColor}
          />

          {/* 땅 */}
          <ellipse
            cx={centerX}
            cy={svgH - 40}
            rx={180}
            ry={20}
            fill={themeConfig.groundColor}
          />

          {/* 제목 */}
          <text
            x={centerX}
            y={svgH - 10}
            fontSize="14"
            fill={themeConfig.labelColor}
            fontWeight="600"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
          >
            🌳 {recentDays.length}일의 잔디가 자라는 나무
          </text>
        </svg>

        {/* 툴팁 */}
        {tooltip && (
          <div style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y - 36,
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

        {/* 범례 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '16px',
          fontSize: '11px',
          color: themeConfig.labelColor,
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
      </div>
    );
  }

  // ===== 기본 테마들 렌더링 =====
  const LABEL_HEIGHT = 18;
  const CELL_GAP    = 14;
  const CELL_SIZE   = 12;
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
        {/* 우주 테마 별 */}
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

        {/* 월/년 라벨 + 세로 선 */}
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

        {/* 잔디 셀 */}
        {weeks.map((week, weekIdx) =>
          week.map((day, dayIdx) => renderCell(day, weekIdx, dayIdx))
        )}
      </svg>

      {/* 툴팁 */}
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

      {/* 범례 */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '6px',
        marginTop:  '10px',
        fontSize:   '11px',
        color:      themeConfig.labelColor,
      }}>
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
