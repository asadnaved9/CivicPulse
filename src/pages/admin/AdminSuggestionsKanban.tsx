import React from 'react';
import { Lightbulb, ThumbsUp, MapPin, Building2, Flame } from 'lucide-react';
import { DevelopmentSuggestion } from './AdminSuggestionsPage';

interface SuggestionsKanbanProps {
  suggestions: DevelopmentSuggestion[];
  onSelectSuggestion: (suggestion: DevelopmentSuggestion) => void;
}

export const AdminSuggestionsKanban: React.FC<SuggestionsKanbanProps> = ({
  suggestions,
  onSelectSuggestion,
}) => {
  const columns: { id: DevelopmentSuggestion['status']; title: string; color: string; bg: string }[] = [
    { id: 'suggested', title: 'Suggested', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    { id: 'under_review', title: 'Under Review', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    { id: 'in_planning', title: 'In Planning', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    { id: 'approved', title: 'Approved', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    { id: 'completed', title: 'Completed', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
    { id: 'rejected', title: 'Rejected', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  ];

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case 'critical':
        return { label: 'CRITICAL', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
      case 'high':
        return { label: 'HIGH', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' };
      case 'medium':
        return { label: 'MEDIUM', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
      default:
        return { label: 'LOW', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '20px',
        height: '100%',
        minHeight: '480px',
      }}
    >
      {columns.map((col) => {
        const colSuggestions = suggestions.filter((s) => {
          if (!s.status && col.id === 'suggested') return true;
          return s.status === col.id;
        });

        return (
          <div
            key={col.id}
            style={{
              flex: '0 0 320px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--surface-2)',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            {/* Column Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: col.color,
                  }}
                />
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-1)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    margin: 0,
                  }}
                >
                  {col.title}
                </h3>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'var(--surface)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  color: 'var(--text-2)',
                  border: '1px solid var(--border)',
                }}
              >
                {colSuggestions.length}
              </span>
            </div>

            {/* Suggestions Cards Scrollable List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflowY: 'auto',
                flex: 1,
                paddingRight: '4px',
              }}
            >
              {colSuggestions.length === 0 ? (
                <div
                  style={{
                    padding: '30px 16px',
                    textAlign: 'center',
                    color: 'var(--text-3)',
                    fontSize: '12px',
                    border: '1px dashed var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                  }}
                >
                  No proposals in this phase
                </div>
              ) : (
                colSuggestions.map((sug) => {
                  const urgencyStyle = getUrgencyBadge(sug.urgency);
                  const upvoteCount = sug.upvotes?.length || (sug as any).citizenCount || 0;

                  return (
                    <div
                      key={sug.id}
                      onClick={() => onSelectSuggestion(sug)}
                      style={{
                        background: 'var(--surface)',
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      {/* Top Chips: ID & Urgency */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--text-3)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {sug.id}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: urgencyStyle.color,
                            background: urgencyStyle.bg,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          {sug.urgency === 'critical' && <Flame size={10} />}
                          {urgencyStyle.label}
                        </span>
                      </div>

                      {/* Proposal Title */}
                      <h4
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          lineHeight: '1.35',
                          margin: 0,
                          color: 'var(--text-1)',
                        }}
                      >
                        {sug.title}
                      </h4>

                      {/* Category & SubCategory */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'var(--surface-2)',
                            color: 'var(--text-2)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          🏷️ {sug.category || 'General'}
                        </span>
                        {sug.subCategory && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-3)',
                              padding: '2px 4px',
                            }}
                          >
                            • {sug.subCategory}
                          </span>
                        )}
                      </div>

                      {/* Location / Ward */}
                      {(sug.ward || sug.address) && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          <MapPin size={11} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sug.ward || sug.address}
                          </span>
                        </div>
                      )}

                      {/* Footer: Assigned Dept & Citizen Demand Counter */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border)',
                          marginTop: '2px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--text-2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            maxWidth: '190px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={sug.assignedDepartment || sug.department}
                        >
                          <Building2 size={11} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sug.assignedDepartment || sug.department || 'Unassigned'}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: upvoteCount > 0 ? 'var(--primary)' : 'var(--text-3)',
                            background: upvoteCount > 0 ? 'var(--primary-subtle)' : 'transparent',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          <ThumbsUp size={11} />
                          <span>{upvoteCount}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
