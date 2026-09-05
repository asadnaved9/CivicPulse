import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Map, 
  FileText, 
  Plus, 
  Gift, 
  User, 
  CheckCircle, 
  Truck, 
  Zap, 
  Droplets, 
  AlertTriangle, 
  ShieldCheck,
  Wifi,
  Signal
} from 'lucide-react';

export const MobileMapMockup: React.FC = () => {
  const [activeFix, setActiveFix] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Live real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Battery API lookup if supported by environment
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }
  }, []);

  // Cycle current active fix status based on truck loop interval
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFix((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fixes = [
    {
      title: 'Pothole Resurfacing',
      location: 'Koramangala 5th Block',
      type: 'Road Damage',
      icon: AlertTriangle,
      color: '#ef4444',
      status: 'Repairing Pothole...',
      progress: '92%'
    },
    {
      title: 'Water Main Pipe Seal',
      location: 'Park Road Ward 17',
      type: 'Water Leak',
      icon: Droplets,
      color: '#3b82f6',
      status: 'Sealing Pipe Leak...',
      progress: '85%'
    },
    {
      title: 'Smart Power Grid Fix',
      location: 'Main Boulevard Grid',
      type: 'Electrical',
      icon: Zap,
      color: '#eab308',
      status: 'Restoring Power...',
      progress: '100%'
    }
  ];

  const displayBattery = batteryLevel !== null ? batteryLevel : 100;

  return (
    <div style={{
      width: '100%',
      maxWidth: '340px',
      height: '670px',
      background: '#0d0f12',
      borderRadius: '40px',
      border: '8px solid #22252e',
      boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.08) inset',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      margin: '0 auto',
      fontFamily: 'var(--font-sans)',
      zIndex: 10
    }}>

      {/* 1. TOP DEVICE STATUS BAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px 4px 24px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#ffffff',
        zIndex: 30,
        background: '#0d0f12'
      }}>
        <span>{currentTime}</span>

        {/* Dynamic Battery & Signal Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Signal size={12} style={{ color: '#ffffff' }} />
          <Wifi size={12} style={{ color: '#ffffff' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
              {displayBattery}%
            </span>
            <div style={{ 
              width: '20px', 
              height: '11px', 
              border: '1px solid rgba(255,255,255,0.8)', 
              borderRadius: '3px', 
              padding: '1px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{ 
                width: `${displayBattery}%`, 
                height: '100%', 
                background: displayBattery > 20 ? '#10b981' : '#ef4444', 
                borderRadius: '1px' 
              }} />
              <div style={{ 
                position: 'absolute', 
                right: '-3px', 
                top: '2px', 
                width: '2px', 
                height: '5px', 
                background: 'rgba(255,255,255,0.8)', 
                borderRadius: '0 1px 1px 0' 
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CIVICPULSE APP HEADER */}
      <div style={{ 
        padding: '12px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        zIndex: 30,
        background: '#0d0f12',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '9px', 
            height: '9px', 
            borderRadius: '50%', 
            background: '#10b981', 
            boxShadow: '0 0 10px #10b981',
            animation: 'pulse 1.5s infinite' 
          }} />
          <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
            CivicPulse
          </h2>
        </div>

        {/* Notification Bell with Badge */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={19} color="#e4e4e7" />
          <span style={{ 
            position: 'absolute', 
            top: '-3px', 
            right: '-4px', 
            width: '14px', 
            height: '14px', 
            borderRadius: '50%', 
            background: '#ef4444', 
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #0d0f12'
          }}>
            3
          </span>
        </div>
      </div>

      {/* 3. INTERACTIVE 2D MAP AREA */}
      <div style={{ flex: 1, position: 'relative', background: '#12141a', overflow: 'hidden' }}>
        
        {/* Map Grid Background */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          opacity: 0.14, 
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', 
          backgroundSize: '32px 32px' 
        }} />
        
        {/* 4. "WARD 17 • LIVE DISPATCH" BADGE */}
        <div style={{ 
          position: 'absolute', 
          top: '12px', 
          left: '12px', 
          background: 'rgba(0,0,0,0.85)', 
          backdropFilter: 'blur(6px)',
          padding: '5px 12px', 
          borderRadius: '16px', 
          fontSize: '10px', 
          color: '#10b981', 
          fontWeight: 700, 
          fontFamily: 'var(--font-mono)', 
          border: '1px solid rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 15,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
          WARD 17 • LIVE DISPATCH
        </div>

        {/* 2D Road SVG Overlay */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.65 }}>
          <path 
            d="M 60 70 L 130 110 L 220 180 L 90 260 Z" 
            fill="none" 
            stroke="#2a2e3b" 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M 60 70 L 130 110 L 220 180 L 90 260 Z" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="2" 
            strokeDasharray="6 6" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>

        {/* HAZARD NODE 1: Pothole (Top-Left) */}
        <div style={{ position: 'absolute', top: '95px', left: '115px', transform: 'translate(-50%, -50%)', zIndex: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: activeFix === 0 ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 16px ${activeFix === 0 ? '#10b981' : '#ef4444'}`,
            transition: 'background 0.4s ease'
          }}>
            {activeFix === 0 ? <CheckCircle size={14} color="#fff" /> : <AlertTriangle size={12} color="#fff" />}
          </div>
          <span style={{ fontSize: '9px', fontWeight: 700, color: activeFix === 0 ? '#34d399' : '#fca5a5', background: 'rgba(0,0,0,0.85)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.1)' }}>
            {activeFix === 0 ? 'FIXED Pothole' : 'Pothole Hazard'}
          </span>
        </div>

        {/* HAZARD NODE 2: Water Leak (Center-Right) */}
        <div style={{ position: 'absolute', top: '175px', left: '225px', transform: 'translate(-50%, -50%)', zIndex: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: activeFix === 1 ? '#10b981' : '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 16px ${activeFix === 1 ? '#10b981' : '#3b82f6'}`,
            transition: 'background 0.4s ease'
          }}>
            {activeFix === 1 ? <CheckCircle size={14} color="#fff" /> : <Droplets size={12} color="#fff" />}
          </div>
          <span style={{ fontSize: '9px', fontWeight: 700, color: activeFix === 1 ? '#34d399' : '#93c5fd', background: 'rgba(0,0,0,0.85)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.1)' }}>
            {activeFix === 1 ? 'FIXED Pipe Leak' : 'Water Leak'}
          </span>
        </div>

        {/* HAZARD NODE 3: Power Outage (Bottom-Left) */}
        <div style={{ position: 'absolute', top: '255px', left: '100px', transform: 'translate(-50%, -50%)', zIndex: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: activeFix === 2 ? '#10b981' : '#eab308',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 16px ${activeFix === 2 ? '#10b981' : '#eab308'}`,
            transition: 'background 0.4s ease'
          }}>
            {activeFix === 2 ? <CheckCircle size={14} color="#fff" /> : <Zap size={12} color="#fff" />}
          </div>
          <span style={{ fontSize: '9px', fontWeight: 700, color: activeFix === 2 ? '#34d399' : '#fef08a', background: 'rgba(0,0,0,0.85)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.1)' }}>
            {activeFix === 2 ? 'FIXED Power Grid' : 'Power Outage'}
          </span>
        </div>

        {/* 2D ANIMATED SERVICE TRUCK */}
        <div 
          style={{
            position: 'absolute',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '2px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px #10b981',
            zIndex: 14,
            animation: 'driveTruckLoop 12s infinite ease-in-out'
          }}
        >
          <Truck size={15} color="#000000" />
        </div>

        {/* 5. BOTTOM INFORMATION CARD - PROPERLY STACKED ABOVE FOOTER */}
        <div style={{ 
          position: 'absolute', 
          bottom: '12px', 
          left: '12px', 
          right: '12px', 
          background: '#191c24', 
          borderRadius: '14px', 
          padding: '12px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          zIndex: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>
              <ShieldCheck size={13} /> {fixes[activeFix].status}
            </div>
            <span style={{ fontSize: '9px', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '8px', fontWeight: 700, border: '1px solid rgba(16,185,129,0.3)' }}>
              CREW #4 ON SITE
            </span>
          </div>
          
          <h3 style={{ margin: '2px 0', fontSize: '14px', color: '#ffffff', fontWeight: 700 }}>
            {fixes[activeFix].title}
          </h3>
          <p style={{ margin: 0, fontSize: '11px', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px' }}>
            📍 {fixes[activeFix].location}
          </p>

          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#a1a1aa', marginBottom: '4px' }}>
              <span>Repair Progress</span>
              <strong style={{ color: '#10b981', fontWeight: 700 }}>{fixes[activeFix].progress}</strong>
            </div>
            <div style={{ height: '5px', background: '#2c303d', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: fixes[activeFix].progress, height: '100%', background: '#10b981', borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>

      </div>

      {/* 6. MOBILE BOTTOM 5-ITEM NAVIGATION FOOTER */}
      <div style={{ 
        height: '66px', 
        background: '#0d0f12', 
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justify: 'space-around',
        alignItems: 'center',
        padding: '0 4px env(safe-area-inset-bottom, 4px)',
        zIndex: 30,
        position: 'relative'
      }}>
        {/* 1. Map Tab (Active) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#10b981', cursor: 'pointer', width: '56px' }}>
          <Map size={18} />
          <span style={{ fontSize: '10px', fontWeight: 700 }}>Map</span>
        </div>

        {/* 2. Reports Tab */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#71717a', cursor: 'pointer', width: '56px' }}>
          <FileText size={18} />
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Reports</span>
        </div>

        {/* 3. Central Prominent Report Action Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', width: '56px', marginTop: '-12px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '50%', 
            background: '#10b981', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 4px 14px rgba(16,185,129,0.5)',
            border: '2px solid #0d0f12'
          }}>
            <Plus size={22} color="#ffffff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>Report</span>
        </div>

        {/* 4. Rewards Tab */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#71717a', cursor: 'pointer', width: '56px' }}>
          <Gift size={18} />
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Rewards</span>
        </div>

        {/* 5. Profile Tab */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#71717a', cursor: 'pointer', width: '56px' }}>
          <User size={18} />
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Profile</span>
        </div>
      </div>

      {/* Embedded Truck Loop Keyframes */}
      <style>
        {`
          @keyframes driveTruckLoop {
            0% { top: 60px; left: 50px; transform: rotate(25deg); }
            30% { top: 90px; left: 110px; transform: rotate(40deg); }
            35% { top: 90px; left: 110px; transform: rotate(40deg); }
            60% { top: 170px; left: 210px; transform: rotate(135deg); }
            65% { top: 170px; left: 210px; transform: rotate(135deg); }
            90% { top: 250px; left: 95px; transform: rotate(225deg); }
            95% { top: 250px; left: 95px; transform: rotate(225deg); }
            100% { top: 60px; left: 50px; transform: rotate(25deg); }
          }
        `}
      </style>
    </div>
  );
};
