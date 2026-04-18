import { useState, useRef } from 'react';
import GrassGraph from './GrassGraph';
import html2canvas from 'html2canvas';

function App() {
  const [username, setUsername]           = useState('');
  const [loading, setLoading]             = useState(false);
  const [data, setData]                   = useState(null);
  const [error, setError]                 = useState('');
  const [theme, setTheme]                 = useState(null);
  const [showGraph, setShowGraph]         = useState(false);
  const [graphTheme, setGraphTheme]       = useState('minimal');
  const [searchedUsername, setSearchedUsername] = useState('');
  const exportRef = useRef(null); // 이미지 저장 전용 (숨겨진) ref

  const fetchGitHubData = async () => {
    if (!username.trim()) { setError('GitHub 아이디를 입력해 주세요!'); return; }
    setLoading(true); setError(''); setData(null); setTheme(null); setShowGraph(false); setGraphTheme('minimal');
    try {
      const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);
      if (!response.ok) throw new Error('사용자를 찾을 수 없습니다');
      const result = await response.json();
      setData(result);
      setSearchedUsername(username.trim());
      setShowGraph(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = `${searchedUsername}-github-grass.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDecorate = () => {
    setGraphTheme(theme);
  };

  const themes = [
    { key: 'tree_wood', label: '잔디 나무', desc: '나뭇잎에 당신의 잔디를 심어요' },
    { key: 'space',     label: '달',        desc: '잔디로 가득 찬 달을 만들어요' },
    { key: 'pixel',     label: '픽셀',      desc: '레트로 감성으로 잔디를 채워요' },
  ];

  const totalCommits = data ? Object.values(data.total).reduce((a, b) => a + b, 0) : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '48px 24px', boxSizing: 'border-box', width: '100vw' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', width: '100%' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.3px' }}>
            잔꾸
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            나만의 잔디를 색다르게 꾸며보세요!
          </p>
        </div>

        {/* 입력 폼 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
          <input
            type="text"
            placeholder="GitHub 아이디를 입력해 주세요!"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchGitHubData()}
            onMouseEnter={(e) => e.target.style.borderColor = '#3b82f6'}
            onMouseLeave={(e) => e.target.style.borderColor = '#e2e8f0'}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            style={{
              flex: 1, padding: '11px 16px',
              border: '1.5px solid #e2e8f0', borderRadius: '8px',
              fontSize: '14px', outline: 'none',
              backgroundColor: '#fff', color: '#0f172a',
              transition: 'border-color 0.15s', minWidth: 0,
            }}
          />
          <button
            onClick={fetchGitHubData}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
            style={{
              padding: '11px 22px',
              backgroundColor: loading ? '#94a3b8' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {loading ? '불러오는 중...' : '검색하기'}
          </button>
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '-28px', marginBottom: '24px' }}>
            {error}
          </p>
        )}

        {/* 결과 */}
        {data && (
          <div style={{ width: '100%' }}>

            {/* 프로필 카드 */}
            <div style={{
              backgroundColor: '#fff', border: '1.5px solid #e2e8f0',
              borderRadius: '10px', padding: '18px 24px', marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <img
                  src={`https://github.com/${searchedUsername}.png?size=56`}
                  alt={searchedUsername}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e2e8f0' }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div style={{
                  display: 'none', width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '600', color: '#64748b', flexShrink: 0,
                }}>
                  {searchedUsername.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{searchedUsername}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '6px' }}>GitHub</span>
                </div>
              </div>

              <div style={{ display: 'flex', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                {[
                  { value: totalCommits.toLocaleString(), label: '전체 커밋' },
                  { value: (data.total[new Date().getFullYear()] || 0).toLocaleString(), label: '올해 커밋' },
                  { value: `${Object.keys(data.total).length}년`, label: '잡힌 지' },
                ].map(({ value, label }, i, arr) => (
                  <div key={label} style={{
                    flex: 1, textAlign: 'center',
                    borderRight: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 화면에 표시되는 그래프 (레전드 포함) */}
            {showGraph && (
              <div style={{
                backgroundColor: '#fff', border: '1.5px solid #e2e8f0',
                borderRadius: '12px', padding: '24px', marginBottom: '24px',
                width: '100%', boxSizing: 'border-box',
              }}>
                <GrassGraph
                  username={searchedUsername}
                  contributions={data}
                  theme={graphTheme}
                  totalCommits={totalCommits}
                  forExport={false}
                />
              </div>
            )}

            {/* 이미지 저장 전용 (숨겨진 렌더링) — 레전드/하단문구 없음 */}
            {showGraph && (
              <div
                ref={exportRef}
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  top: 0,
                  width: '712px', // 760px - padding 48px
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '24px',
                  boxSizing: 'border-box',
                }}
              >
                <GrassGraph
                  username={searchedUsername}
                  contributions={data}
                  theme={graphTheme}
                  totalCommits={totalCommits}
                  forExport={true}
                />
              </div>
            )}

            {/* 테마 선택 */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                테마 선택
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {themes.map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(theme === key ? null : key)}
                    style={{
                      flex: 1, padding: '14px 12px', borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor:     theme === key ? '#2563eb' : '#e2e8f0',
                      backgroundColor: theme === key ? '#eff6ff' : '#fff',
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '3px', color: theme === key ? '#2563eb' : '#1e293b' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '11px', color: theme === key ? '#60a5fa' : '#64748b' }}>
                      {desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 잔디 꾸미기 버튼 */}
            <button
              onClick={handleDecorate}
              disabled={!theme}
              onMouseEnter={(e) => theme && (e.target.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => theme && (e.target.style.backgroundColor = '#2563eb')}
              style={{
                width: '100%', padding: '12px',
                backgroundColor: theme ? '#2563eb' : '#e2e8f0',
                color: theme ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600',
                cursor: theme ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s',
                marginBottom: '16px', boxSizing: 'border-box',
              }}
            >
              잔디 꾸미기
            </button>

            {/* 이미지 저장 */}
            <button
              onClick={downloadImage}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
              style={{
                width: '100%', padding: '12px',
                backgroundColor: '#fff', color: '#374151',
                border: '1.5px solid #e2e8f0', borderRadius: '8px',
                fontSize: '14px', fontWeight: '500',
                cursor: 'pointer', transition: 'background-color 0.15s',
                boxSizing: 'border-box',
              }}
            >
              이미지 저장
            </button>

          </div>
        )}
      </div>
    </div>
  );
}

export default App;
