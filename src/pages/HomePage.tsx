import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { seedFirestoreIfEmpty } from '../utils/seedData';
import {
  Camera, Cpu, GitBranch, CheckSquare,
  TrendingUp, ShieldCheck, Code2,
  CheckCircle, ArrowRight, Terminal, Globe, BarChart3,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ─── WebGL Shader Sources ────────────────────────────────────────────────────
const VERT = `attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
const FRAG = `precision highp float;uniform float u_time;uniform vec2 u_resolution;varying vec2 v_uv;
float rnd(vec2 s){return fract(sin(dot(s,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 uv=v_uv;float n=sin(uv.x*4.+u_time*.5)*cos(uv.y*3.-u_time*.4);float n2=sin(uv.y*5.+u_time*.2)*.5;float mask=smoothstep(.4,.6,uv.y+n*.1+n2*.1);vec3 c=mix(vec3(0.),vec3(.05),mask);c+=(rnd(uv+u_time*.01)-.5)*.04;gl_FragColor=vec4(c,1.);}`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src); gl.compileShader(s); return s;
}

// ─── Scroll-fade hook ─────────────────────────────────────────────────────────
function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
      });
    }, { threshold });
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)';
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  const [issues,  setIssues]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ reported: 0, resolved: 0, verified: 0, activeThisWeek: 0 });
  const { t } = useLanguage();

  // Seeding
  useEffect(() => {
    if (isFirebaseConfigured) seedFirestoreIfEmpty().catch(() => {});
  }, []);

  // Real-time Firestore
  useEffect(() => {
    if (!isFirebaseConfigured) { setLoading(false); return; }
    const unsub = onSnapshot(collection(db, 'issues'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setIssues(list);
      setStats({
        reported:      list.length,
        resolved:      list.filter((i: any) => i.status === 'resolved').length,
        verified:      list.filter((i: any) => i.verified === true).length,
        activeThisWeek:list.filter((i: any) => i.status !== 'resolved').length,
      });
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  // WebGL Hero Shader
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function sync() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280, h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }
    const ro = new ResizeObserver(sync);
    ro.observe(canvas); sync();
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER,   VERT));
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes  = gl.getUniformLocation(prog, 'u_resolution');
    function render(t: number) {
      sync();
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes)  gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    }
    rafRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  // Fade-in refs
  const heroRef      = useFadeIn();
  const problemRef   = useFadeIn();
  const pipeRef      = useFadeIn();
  const bentoRef     = useFadeIn();
  const transRef     = useFadeIn();
  const coverageRef  = useFadeIn();

  // ─── Styles ─────────────────────────────────────────────────────────────
  const s = {
    // Typography
    displayLg: { fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,50px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 } as React.CSSProperties,
    headlineLg: { fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 700, letterSpacing: '-0.02em' } as React.CSSProperties,
    headlineMd: { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 } as React.CSSProperties,
    labelMd: { fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const },
    bodyLg: { fontFamily: 'var(--font-sans)', fontSize: '18px', lineHeight: 1.6 } as React.CSSProperties,
    bodyMd: { fontFamily: 'var(--font-sans)', fontSize: '15px', lineHeight: 1.6 } as React.CSSProperties,
    caption: { fontFamily: 'var(--font-sans)', fontSize: '12px', lineHeight: 1.5 } as React.CSSProperties,
    mono: { fontFamily: 'var(--font-mono)', fontSize: '11px' } as React.CSSProperties,
    // Buttons
    btnWhite: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 32px', background: '#FFFFFF', color: '#000000', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, transition: 'background .2s, transform .15s', lineHeight: 1 } as React.CSSProperties,
    btnOutlineWhite: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 32px', background: 'transparent', color: '#FFFFFF', border: '2px solid #FFFFFF', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, transition: 'all .2s', lineHeight: 1 } as React.CSSProperties,
    btnBlack: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 28px', background: '#000000', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, transition: 'opacity .2s, transform .15s', lineHeight: 1 } as React.CSSProperties,
    // Layout
    container: { maxWidth: 1200, margin: '0 auto', padding: '0 32px', width: '100%', boxSizing: 'border-box' as const },
    containerNarrow: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', boxSizing: 'border-box' as const },
  };

  // ─── Pipeline Steps ──────────────────────────────────────────────────────
  const pipelineSteps = [
    { Icon: Camera,     num: '01', title: t('home.pipeline.step1.title'), desc: t('home.pipeline.step1.desc'), route: '/report' },
    { Icon: Cpu,        num: '02', title: t('home.pipeline.step2.title'), desc: t('home.pipeline.step2.desc'), route: '/insights' },
    { Icon: GitBranch,  num: '03', title: t('home.pipeline.step3.title'), desc: t('home.pipeline.step3.desc'), route: '/map' },
    { Icon: CheckSquare,num: '04', title: t('home.pipeline.step4.title'), desc: t('home.pipeline.step4.desc'), route: '/community' },
  ];

  // ─── Bento Cards ─────────────────────────────────────────────────────────
  const bentoCards = [
    { title: t('home.bento.predictive.title'), desc: t('home.bento.predictive.desc'), Icon: TrendingUp, tag: 'System Active', wide: true },
    { title: t('home.bento.tamper.title'), desc: t('home.bento.tamper.desc'), Icon: ShieldCheck, tag: null, wide: false },
    { title: t('home.bento.api.title'), desc: t('home.bento.api.desc'), Icon: Code2, tag: null, wide: false },
  ];

  const fmtNum = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflowX: 'hidden', backgroundColor: '#fcf9f8' }}>
      <style>{`
        .responsive-grid { display: grid; gap: 56px; }
        .responsive-grid-2 { grid-template-columns: 1fr 1fr; }
        .responsive-grid-4 { grid-template-columns: repeat(4, 1fr); }
        .responsive-grid-6 { grid-template-columns: repeat(6, 1fr); }
        
        .bento-wide { grid-column: span 4; }
        .bento-tall { grid-column: span 2; grid-row: span 2; }
        .bento-small { grid-column: span 2; }
        
        .stats-bar { grid-template-columns: repeat(4, 1fr); }
        .stats-item { border-left: 1px solid #cfc4c5; }
        .stats-item:first-child { border-left: none; }
        
        .pipeline-step { border-right: 1px solid #000; }
        .pipeline-step:last-child { border-right: none; }
        
        @media (max-width: 900px) {
          .responsive-grid-2 { grid-template-columns: 1fr; gap: 32px; padding-top: 40px !important; padding-bottom: 40px !important; }
          .responsive-grid-6 { grid-template-columns: 1fr; }
          .bento-wide, .bento-tall, .bento-small { grid-column: span 1 !important; grid-row: auto !important; }
          .stats-bar { grid-template-columns: repeat(2, 1fr); }
          .stats-item:nth-child(3) { border-left: none; }
          .stats-item { border-bottom: 1px solid #cfc4c5; }
          .stats-item:nth-child(3), .stats-item:nth-child(4) { border-bottom: none; }
          .responsive-grid-4 { grid-template-columns: 1fr; }
          .pipeline-step { border-right: none !important; border-bottom: 1px solid #000; }
          .pipeline-step:last-child { border-bottom: none; }
          .mockup-container { justify-content: center !important; margin-top: 32px; }
        }
      `}</style>

      {/* ═══ 1. HERO ════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: 'calc(100vh - 56px)', backgroundColor: '#1b1b1b', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* WebGL Canvas */}
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.65 }} />

        {/* Content */}
        <div ref={heroRef as any} className="responsive-grid responsive-grid-2" style={{ ...s.container, position: 'relative', zIndex: 10, alignItems: 'center', padding: '72px 32px' }}>
          <div>
            <span style={{ ...s.labelMd, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 16 }}>
              {t('home.hero.eyebrow')}
            </span>
            <h1 style={{ ...s.displayLg, color: '#FFFFFF', marginBottom: 20 }}>
              {t('home.hero.h1')}
            </h1>
            <p style={{ ...s.bodyLg, color: 'rgba(255,255,255,0.72)', maxWidth: 520, marginBottom: 40 }}>
              {t('home.hero.subtitle')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <button
                style={s.btnWhite}
                onClick={() => navigate('/map')}
                onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <BarChart3 size={16} /> {t('home.hero.exploreMap')}
              </button>
              <button
                style={s.btnOutlineWhite}
                onClick={() => navigate('/report')}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#000000'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {t('home.hero.reportIssue')}
              </button>
            </div>
          </div>

          {/* 3D Phone Mockup — CivicPulse App UI, right-aligned */}
          <div className="mockup-container" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
            <div
              style={{
                transform: 'perspective(1000px) rotateY(-12deg) rotateX(4deg)',
                transition: 'transform 0.5s cubic-bezier(.16,1,.3,1)',
                width: 224, height: 468,
                background: '#0A0C10',
                border: '5px solid #1c2030',
                borderRadius: 38,
                overflow: 'hidden',
                boxShadow: '28px 28px 90px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                position: 'relative',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'perspective(1000px) rotateY(-4deg) rotateX(1deg)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'perspective(1000px) rotateY(-12deg) rotateX(4deg)'; }}
            >
              {/* Notch */}
              <div style={{ height: 22, width: 80, background: '#000', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', borderBottomLeftRadius: 14, borderBottomRightRadius: 14, zIndex: 30 }} />

              {/* ── Status Bar ── */}
              <div style={{ height: 24, background: '#0A0C10', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 14px 4px', fontSize: 8, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                <span>9:41</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    {[3,4,5,6].map((h,i) => <div key={i} style={{ width: 2, height: h, background: i < 3 ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)', borderRadius: 1 }} />)}
                  </div>
                  <div style={{ width: 16, height: 8, border: '1px solid rgba(255,255,255,0.4)', borderRadius: 2, padding: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '75%', height: '100%', background: '#10B981', borderRadius: 1 }} />
                  </div>
                </div>
              </div>

              {/* ── App Navbar ── */}
              <div style={{ background: '#11141B', borderBottom: '1px solid #1e2433', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ color: '#F3F4F6', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>CivicPulse</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {/* Notification bell */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                    </div>
                    <div style={{ position: 'absolute', top: -1, right: -1, width: 6, height: 6, background: '#10B981', borderRadius: '50%', border: '1px solid #11141B' }} />
                  </div>
                </div>
              </div>

              {/* ── Map Area ── */}
              <div style={{ flex: 1, background: '#161A23', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
                {/* Grid overlay */}
                <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.12 }}>
                  <pattern id="pg" width="22" height="22" patternUnits="userSpaceOnUse">
                    <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#10B981" strokeWidth="0.4"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#pg)"/>
                </svg>
                {/* Roads */}
                <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                  <line x1="0" y1="42%" x2="100%" y2="52%" stroke="#242B37" strokeWidth="5"/>
                  <line x1="38%" y1="0" x2="42%" y2="100%" stroke="#242B37" strokeWidth="4"/>
                  <line x1="63%" y1="0" x2="68%" y2="100%" stroke="#1e2433" strokeWidth="3"/>
                  <line x1="0" y1="70%" x2="100%" y2="75%" stroke="#1e2433" strokeWidth="2"/>
                </svg>
                {/* Issue pins */}
                {[
                  { x:'30%', y:'33%', color:'#EF4444', glow:true },
                  { x:'65%', y:'22%', color:'#F59E0B', glow:false },
                  { x:'75%', y:'62%', color:'#10B981', glow:false },
                  { x:'18%', y:'68%', color:'#EF4444', glow:false },
                  { x:'50%', y:'50%', color:'#F59E0B', glow:false },
                  { x:'82%', y:'40%', color:'#10B981', glow:false },
                ].map((p,i) => (
                  <div key={i} style={{ position:'absolute', left:p.x, top:p.y, transform:'translate(-50%,-50%)', zIndex:2 }}>
                    {p.glow && <div style={{ position:'absolute', inset:-5, borderRadius:'50%', border:`1.5px solid ${p.color}`, opacity:0.35, animation:'pulse 2s infinite' }} />}
                    <div style={{ width:9, height:9, borderRadius:'50%', background:p.color, border:'1.5px solid rgba(255,255,255,0.25)', boxShadow:`0 0 6px ${p.color}66` }} />
                  </div>
                ))}
                {/* Map badge */}
                <div style={{ position:'absolute', top:6, left:6, background:'rgba(10,12,16,0.88)', borderRadius:4, padding:'2px 7px', fontSize:6.5, color:'#10B981', fontFamily:'var(--font-mono)', border:'1px solid #242B37', letterSpacing:'0.06em' }}>WARD 17 · LIVE</div>
                {/* Zoom controls */}
                <div style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:2 }}>
                  {['+','−'].map(c => <div key={c} style={{ width:16, height:16, background:'rgba(17,20,27,0.9)', border:'1px solid #242B37', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#9CA3AF', cursor:'pointer' }}>{c}</div>)}
                </div>
              </div>

              {/* ── Active Issue Card ── */}
              <div style={{ background:'#11141B', borderTop:'1px solid #1e2433', padding:'8px 10px', flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <span style={{ fontSize:7, fontWeight:700, color:'#10B981', textTransform:'uppercase', letterSpacing:'0.07em', background:'rgba(16,185,129,0.1)', padding:'2px 6px', borderRadius:3, border:'1px solid rgba(16,185,129,0.2)' }}>✓ Verified</span>
                  <span style={{ fontSize:7, color:'#6B7280', fontFamily:'var(--font-mono)' }}>2h ago</span>
                </div>
                <div style={{ fontSize:9.5, fontWeight:600, color:'#F3F4F6', marginBottom:2 }}>Road Damage — MG Road</div>
                <div style={{ fontSize:7.5, color:'#6B7280', marginBottom:6 }}>📍 Koramangala, Ward 17</div>
                <div style={{ height:3, background:'#242B37', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:'65%', background:'linear-gradient(90deg,#10B981,#34D399)', borderRadius:2 }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:3, fontSize:7, color:'#6B7280' }}>
                  <span>SLA Progress</span><span>32h / 48h</span>
                </div>
              </div>

              {/* ── Bottom Tab Bar ── */}
              <div style={{ background:'#11141B', borderTop:'1px solid #1e2433', padding:'5px 4px 10px', display:'flex', justifyContent:'space-around', flexShrink:0 }}>
                {[
                  { label:'Map',     active:true,  svg:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><polygon points="3,6 3,20 10,17 17,20 21,17 21,3 14,6 7,3"/></svg> },
                  { label:'Reports', active:false, svg:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> },
                  { label:'Report',  active:false, special:true, svg:null },
                  { label:'Rewards', active:false, svg:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/></svg> },
                  { label:'Profile', active:false, svg:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                ].map(tab => (
                  <div key={tab.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                    {(tab as any).special ? (
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#10B981', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#000', fontWeight:700, lineHeight:1 }}>+</div>
                    ) : tab.svg}
                    <span style={{ fontSize:6, color:tab.active ? '#10B981' : '#6B7280', fontWeight:tab.active ? 600 : 400 }}>{tab.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative glow ring */}
            <div style={{ position:'absolute', width:'115%', height:'115%', border:'1px solid rgba(16,185,129,0.08)', borderRadius:'50%', pointerEvents:'none' }} />
          </div>
        </div>
      </section>

      {/* ═══ 2. INTEGRITY GAP ═══════════════════════════════════════════════ */}
      <section ref={problemRef as any} style={{ backgroundColor: '#ffffff', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '80px 32px' }}>
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div>
            <h2 style={{ ...s.headlineLg, color: '#000000', textTransform: 'uppercase', marginBottom: 12 }}>{t('home.integrity.h2')}</h2>
            <p style={{ ...s.bodyMd, color: '#5d5f5f', maxWidth: 380, margin: 0 }}>
              {t('home.integrity.body')}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { num: loading ? '—' : `${Math.round((stats.resolved / Math.max(stats.reported, 1)) * 100) || 70}%`, label: t('home.integrity.closedNoProof') },
              { num: '12B', label: t('home.integrity.annualLoss') },
            ].map(stat => (
              <div key={stat.label} style={{ border: '2px solid #000', padding: '32px 24px' }}>
                <div style={{ ...s.displayLg, color: '#000000', fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 8 }}>{stat.num}</div>
                <div style={{ ...s.labelMd, color: '#1c1b1b', lineHeight: 1.3 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3. LIVE STATS BAR ══════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#f6f3f2', borderBottom: '1px solid #cfc4c5', padding: '32px 32px' }}>
        <div className="responsive-grid stats-bar" style={{ ...s.container, gap: 0 }}>
          {[
            { label: t('home.stats.reported'), val: loading ? '…' : fmtNum(stats.reported), color: '#1c1b1b' },
            { label: t('home.stats.resolved'),  val: loading ? '…' : fmtNum(stats.resolved),  color: '#1c8c4e' },
            { label: t('home.stats.verified'),  val: loading ? '…' : fmtNum(stats.verified), color: '#000000' },
            { label: t('home.stats.active'),     val: loading ? '…' : fmtNum(stats.activeThisWeek), color: '#7e7576' },
          ].map((st, i) => (
            <div key={st.label} className="stats-item" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 24px', textAlign: 'center' }}>
              <span style={{ ...s.caption, color: '#5d5f5f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{st.label}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: st.color, lineHeight: 1 }}>{st.val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 4. VERIFICATION PIPELINE ═══════════════════════════════════════ */}
      <section ref={pipeRef as any} style={{ backgroundColor: '#fcf9f8', padding: '80px 32px' }}>
        <div style={s.container}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ ...s.headlineMd, color: '#000000', textTransform: 'uppercase', marginBottom: 8 }}>{t('home.pipeline.h2')}</h2>
            <div style={{ height: 4, width: 80, background: '#000000' }} />
          </div>

          <div className="responsive-grid responsive-grid-4" style={{ border: '2px solid #000', gap: 0 }}>
            {pipelineSteps.map((step, i) => {
              const { Icon, num, title, desc, route } = step;
              return (
                <div
                  key={num}
                  className="pipeline-step"
                  onClick={() => navigate(route)}
                  style={{
                    padding: '32px 24px',
                    cursor: 'pointer',
                    transition: 'background .2s, color .2s',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#000000'; e.currentTarget.style.color = '#ffffff'; (e.currentTarget.querySelector('.step-desc') as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1c1b1b'; (e.currentTarget.querySelector('.step-desc') as HTMLElement).style.color = '#5d5f5f'; }}
                >
                  <Icon size={36} />
                  <div style={{ ...s.labelMd, marginBottom: 4 }}>{num}. {title}</div>
                  <p className="step-desc" style={{ ...s.caption, color: '#5d5f5f', margin: 0, lineHeight: 1.6 }}>{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ 5. BENTO GRID ══════════════════════════════════════════════════ */}
      <section ref={bentoRef as any} style={{ backgroundColor: '#ffffff', padding: '80px 32px' }}>
        <div style={s.container}>
          <h2 style={{ ...s.headlineLg, color: '#000000', textTransform: 'uppercase', textAlign: 'center', marginBottom: 64 }}>
            {t('home.bento.h2')}
          </h2>

          <div className="responsive-grid responsive-grid-6" style={{ gridTemplateRows: 'auto auto', gap: 16 }}>
            {/* Wide card — Predictive Maintenance */}
            <div
              className="bento-wide"
              style={{ border: '2px solid #cfc4c5', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'border-color .2s, box-shadow .2s', cursor: 'default', minHeight: 200 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#000000'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px #000000'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#cfc4c5'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div>
                <div style={{ ...s.labelMd, color: '#000000', marginBottom: 8 }}>Predictive Maintenance</div>
                <p style={{ ...s.bodyMd, color: '#5d5f5f', maxWidth: 480 }}>
                  Advanced algorithms analyze historical decay patterns to forecast infrastructure failure points before they occur.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
                <TrendingUp size={28} color="#000" />
                <div style={{ ...s.labelMd, fontSize: 10, padding: '4px 10px', background: '#f0edec', color: '#1c1b1b' }}>SYSTEM ACTIVE</div>
              </div>
            </div>

            {/* Tall card — Civic DAO */}
            <div
              className="bento-tall"
              style={{ border: '2px solid #cfc4c5', padding: '32px', background: '#f6f3f2', display: 'flex', flexDirection: 'column', transition: 'border-color .2s, box-shadow .2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#000000'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px #000000'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#cfc4c5'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ ...s.labelMd, color: '#000000', marginBottom: 16 }}>Civic DAO Integration</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[100, 75, 83, 50].map((w, i) => (
                  <div key={i} style={{ height: 4, width: `${w}%`, background: '#000000', borderRadius: 2 }} />
                ))}
              </div>
              <p style={{ ...s.caption, color: '#5d5f5f', lineHeight: 1.6, flex: 1 }}>
                Direct democratic oversight of municipal budgets through a verifiable infrastructure ledger.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
                {[['VOTING POWER', '100%'], ['TREASURY', '4.2M']].map(([k, v]) => (
                  <div key={k} style={{ padding: '8px 10px', border: '1px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                    <span>{k}</span><span>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Small card — Tamper Proof */}
            <div
              className="bento-small"
              style={{ border: '2px solid #cfc4c5', padding: '28px 24px', transition: 'border-color .2s, box-shadow .2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#000000'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px #000000'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#cfc4c5'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ ...s.labelMd, color: '#000000', marginBottom: 6 }}>Tamper Proof</div>
              <p style={{ ...s.caption, color: '#5d5f5f', lineHeight: 1.6, margin: 0 }}>
                Every report is hashed onto a distributed ledger for permanent public record.
              </p>
              <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                {[1,1,0.2].map((o,i) => <div key={i} style={{ width: 8, height: 8, background: `rgba(0,0,0,${o})` }} />)}
              </div>
            </div>

            {/* Small card — API Economy */}
            <div
              className="bento-small"
              style={{ border: '2px solid #cfc4c5', padding: '28px 24px', transition: 'border-color .2s, box-shadow .2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#000000'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px #000000'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#cfc4c5'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ ...s.labelMd, color: '#000000', marginBottom: 6 }}>API Economy</div>
              <p style={{ ...s.caption, color: '#5d5f5f', lineHeight: 1.6, margin: '0 0 12px' }}>
                Expose granular data to third-party developers for smart city ecosystems.
              </p>
              <Code2 size={24} color="#000" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 6. RADICAL TRANSPARENCY (dark) ════════════════════════════════ */}
      <section ref={transRef as any} style={{ backgroundColor: '#000000', color: '#ffffff', padding: '80px 32px' }}>
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div>
            <h2 style={{ ...s.headlineLg, color: '#ffffff', marginBottom: 16, textTransform: 'uppercase' }}>
              {t('home.transparency.h2')}
            </h2>
            <p style={{ ...s.bodyLg, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
              {t('home.transparency.body')}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { title: t('home.transparency.sha'),   desc: t('home.transparency.sha.desc'),   icon: CheckCircle },
                { title: t('home.transparency.proof'), desc: t('home.transparency.proof.desc'), icon: ShieldCheck },
              ].map(({ title, desc, icon: Icon }) => (
                <li key={title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <Icon size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ ...s.labelMd, color: '#ffffff', marginBottom: 4 }}>{title}</div>
                    <div style={{ ...s.caption, color: 'rgba(255,255,255,0.5)' }}>{desc}</div>
                  </div>
                </li>
              ))}
            </ul>
            <button
              style={{ ...s.btnWhite, marginTop: 32 }}
              onClick={() => navigate('/insights')}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
            >
              {t('home.transparency.viewLogs')} <ArrowRight size={14} />
            </button>
          </div>

          {/* Terminal / Audit Log */}
          <div style={{ background: '#1b1b1b', border: '1px solid #4c4546', padding: 24, fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.7, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4c4546', paddingBottom: 10, marginBottom: 14, color: '#848484' }}>
              <span>LATEST_AUDIT_LOG</span>
              <span>{new Date().toLocaleTimeString('en-US', { hour12: false })} UTC</span>
            </div>
            <div style={{ color: '#848484' }}>[INFO] FETCHING REPORT_ID: #{loading ? '???' : `${stats.reported + 492}-X2`}</div>
            <div style={{ color: '#848484' }}>[INFO] VALIDATING GEOLOCATION: 28.6139° N, 77.2090° E</div>
            <div style={{ color: '#ffffff', fontWeight: 700 }}>[SUCCESS] HASH MATCH DETECTED: 8f9a2c...b31e</div>
            <div style={{ color: '#848484' }}>[INFO] NOTIFYING CONTRACTOR: PUBLIC_WORKS_DEP_04</div>
            <div style={{ color: '#848484' }}>[INFO] INITIATING SMART_CONTRACT PAYMENT_LOCK</div>
            <div style={{ color: '#848484' }}>[WAIT] AWAITING VISUAL_PROOF_OF_WORK...</div>
            {/* Pulse dot */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, width: 10, height: 10, background: '#ffffff', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
          </div>
        </div>
      </section>

      {/* ═══ 7. COVERAGE MAP ════════════════════════════════════════════════ */}
      <section ref={coverageRef as any} style={{ backgroundColor: '#ffffff', padding: '80px 32px', overflow: 'hidden' }}>
        <div style={{ ...s.container, textAlign: 'center' }}>
          <h2 style={{ ...s.headlineLg, color: '#000000', textTransform: 'uppercase', marginBottom: 8 }}>{t('home.coverage.h2')}</h2>
          <p style={{ ...s.bodyMd, color: '#5d5f5f', marginBottom: 48 }}>
            {t('home.coverage.body').replace('{count}', loading ? '42' : String(Math.max(42, Math.ceil(stats.reported / 10))))}
          </p>

          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#f0edec', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {/* Dot grid overlay */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWs3cpxzAsyNVDmoBzEtpywWKZuQO7EW5iEFpCiCIcjvKlgZGO_MxT0UdpUAxwm7uzPvVzbO_9TaEhi4YJvXmk_EFwftH3CjyeUcPzF5wNcIXYM3JixSb1jYKnoPDUEvF1ig6OAHmujvB-MMI9glOXOdJQsSD4MO0-NN0iZGb6SJWtuJflR8UlG-g9Dc4bwox4R93-uubNqG21o52O8ehLO-N2BXAatcX1Ty8EElY1qMPUY_LGERduWw"
              alt="India coverage map"
              style={{ maxHeight: '100%', objectFit: 'contain', mixBlendMode: 'multiply', transition: 'transform 0.7s ease', width: '100%' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />

            {/* Stat overlay card */}
            <div style={{ position: 'absolute', bottom: 24, left: 24, padding: '16px 20px', background: '#ffffff', border: '2px solid #000', textAlign: 'left' }}>
              <div style={{ ...s.caption, color: '#7e7576', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('home.coverage.activeNodes')}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#000', lineHeight: 1 }}>
                {loading ? '—' : `${(stats.reported * 12 + 1204).toLocaleString()}`}
              </div>
              <div style={{ marginTop: 8, height: 4, width: 160, background: '#e5e2e1', borderRadius: 2 }}>
                <div style={{ height: '100%', width: '66%', background: '#000', borderRadius: 2 }} />
              </div>
            </div>
          </div>

          {/* CTA below map */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 40 }}>
            <button
              style={s.btnBlack}
              onClick={() => navigate('/map')}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Globe size={15} /> {t('home.coverage.launchMap')}
            </button>
            <button
              style={{ ...s.btnBlack, background: 'transparent', color: '#000', border: '2px solid #000' }}
              onClick={() => navigate('/report')}
              onMouseEnter={e => { e.currentTarget.style.background = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000000'; }}
            >
              <Terminal size={15} /> {t('home.coverage.reportHazard')}
            </button>
          </div>
        </div>
      </section>

      {/* Pulse animation keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @media (max-width: 768px) {
          .pipeline-grid { grid-template-columns: 1fr 1fr !important; }
          .bento-grid { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
