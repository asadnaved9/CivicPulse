import React from 'react';
import { Bell, Info, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

const AdminNotificationsPage: React.FC = () => {
  const notifications = [
    {
      id: 1,
      title: "New Civic Issue Reported",
      message: "A citizen reported 'Severe Road Potholes on 80 Feet Road' in Ward 63 (Park Street). AI has auto-classified severity to Level 5.",
      time: "2 mins ago",
      type: "alert",
      icon: <ShieldAlert size={16} color="#EF4444" />
    },
    {
      id: 2,
      title: "Auto-escalation warning triggered",
      message: "Exposed High-Voltage Overhead Cables in Ward 108 is approaching its SLA threshold (4 days remaining). Preparing BBMP letter draft.",
      time: "1 hour ago",
      type: "warning",
      icon: <Clock size={16} color="#F59E0B" />
    },
    {
      id: 3,
      title: "Dispatch confirmed",
      message: "KMC Water Supply team dispatched to 'Broken Water Pipe Gushing Clean Water' at Residential Lane 12.",
      time: "4 hours ago",
      type: "info",
      icon: <Info size={16} color="#3B82F6" />
    },
    {
      id: 4,
      title: "Complaint resolved successfully",
      message: "Pothole repair at Park Street Sector 2 marked resolved. +100 points awarded to reporter.",
      time: "1 day ago",
      type: "success",
      icon: <CheckCircle size={16} color="#10B981" />
    }
  ];

  return (
    <div style={{ maxWidth: 800 }}>
      
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          SYSTEM EVENTS
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-1)', marginTop: 4 }}>
          Municipal Alert System
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: 4 }}>
          Live feed of critical alerts, citizen reports, and AI dispatch triggers.
        </p>
      </div>

      {/* Notifications list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notifications.map(notif => (
          <div
            key={notif.id}
            style={{
              display: 'flex',
              gap: 14,
              padding: 16,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              alignItems: 'flex-start'
            }}
          >
            <div style={{
              background: 'var(--surface-2)',
              padding: 8,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {notif.icon}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{notif.title}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{notif.time}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: 4, lineHeight: 1.5, margin: '4px 0 0 0' }}>{notif.message}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AdminNotificationsPage;
