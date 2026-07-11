/**
 * ProgressTimeline.tsx
 *
 * Admin-facing multi-stage progress image upload component.
 * - Extracts date + GPS location from photo EXIF metadata (via exifr)
 * - Compresses images client-side via Canvas API before upload
 * - Uploads immediately per stage to Firebase Storage
 * - Persists progressStages[] to Firestore on every save/delete
 * - Locks into read-only mode when issue is resolved
 * - One stage minimum to confirm resolution (no maximum)
 */

import React, { useState, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, isFirebaseConfigured, fetchWithAuth } from '../../config/firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Camera, Trash2, Check, Lock, ChevronDown, ChevronUp,
  MapPin, Calendar, X, Loader, Plus, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface ProgressStage {
  id: string;
  imageUrl: string;
  description: string;
  capturedAt: string;   // ISO string, from EXIF or current time
  location: string;     // from EXIF GPS or issue address
  savedAt: string;
  aiSummary?: string;
  confidenceScore?: number;
  verificationStatus?: string;
  qualityAcceptable?: boolean;
  locationMatch?: boolean;
  fraudDetected?: boolean;
}

interface ProgressTimelineProps {
  issueId: string;
  issueAddress: string;
  issueCategory: string;
  originalImageUrl?: string;
  existingStages: ProgressStage[];
  isLocked: boolean;
  onConfirmResolution: (stages: ProgressStage[], closingNotes: string) => Promise<void>;
}

// ── Helper: compress image via Canvas API ─────────────────────────────────────
async function compressImage(dataUrl: string, maxPx = 1280, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback: use original
    img.src = dataUrl;
  });
}

// ── Helper: extract EXIF date + GPS ──────────────────────────────────────────
async function extractExifData(file: File): Promise<{ capturedAt: string; location: string }> {
  try {
    // Dynamic import — exifr is only loaded when needed
    const exifr = await import('exifr');
    const parsed = await exifr.default.parse(file, {
      pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude'],
    });
    if (!parsed) return { capturedAt: new Date().toISOString(), location: '' };

    let capturedAt = new Date().toISOString();
    if (parsed.DateTimeOriginal) {
      const d = new Date(parsed.DateTimeOriginal);
      if (!isNaN(d.getTime())) capturedAt = d.toISOString();
    }

    let location = '';
    if (parsed.GPSLatitude != null && parsed.GPSLongitude != null) {
      const lat = parsed.GPSLatitude as number;
      const lon = parsed.GPSLongitude as number;
      // Reverse-geocode using OSM Nominatim (lightweight, no API key)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const geo = await res.json();
        location =
          geo?.address?.road ||
          geo?.address?.suburb ||
          geo?.address?.town ||
          geo?.display_name?.split(',')[0] ||
          `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      } catch {
        location = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    }

    return { capturedAt, location };
  } catch {
    return { capturedAt: new Date().toISOString(), location: '' };
  }
}

// ── Helper: format ISO date for display ──────────────────────────────────────
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ═════════════════════════════════════════════════════════════════════════════

interface DraftStage {
  id: string;
  localPreview: string;    // base64 compressed preview
  description: string;
  capturedAt: string;
  location: string;
  uploading: boolean;
  savedUrl: string | null; // null until uploaded to Storage
}

const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
  issueId,
  issueAddress,
  issueCategory,
  originalImageUrl,
  existingStages,
  isLocked,
  onConfirmResolution,
}) => {
  const { t } = useLanguage();

  // Local editable copies of already-saved stages
  const [savedStages, setSavedStages] = useState<ProgressStage[]>(existingStages);
  // Drafts that are being edited/uploaded
  const [drafts, setDrafts] = useState<DraftStage[]>([]);
  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  // Confirmation form
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  // Extraction status
  const [extractingId, setExtractingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Persist savedStages back to Firestore ───────────────────────────────
  const persistStages = async (stages: ProgressStage[]) => {
    if (isFirebaseConfigured && auth.currentUser) {
      try {
        const docRef = doc(db, 'issues', issueId);
        await updateDoc(docRef, {
          progressStages: stages,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('[ProgressTimeline] Firestore persist error:', err);
      }
    }
  };

  // ── Pick a file → EXIF extract → compress → create draft ────────────────
  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so re-picking same file triggers onChange
    e.target.value = '';

    const draftId = `stage_${Date.now()}`;
    setExtractingId(draftId);

    // 1. Read file to base64
    const raw: string = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    // 2. Extract EXIF metadata
    const { capturedAt, location } = await extractExifData(file);
    setExtractingId(null);

    // 3. Compress
    const compressed = await compressImage(raw);

    const newDraft: DraftStage = {
      id: draftId,
      localPreview: compressed,
      description: '',
      capturedAt,
      location: location || issueAddress,
      uploading: false,
      savedUrl: null,
    };

    setDrafts(prev => [...prev, newDraft]);
  };

  // ── Update a draft field ─────────────────────────────────────────────────
  const updateDraft = (id: string, field: keyof DraftStage, value: string) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  // ── Save (upload) a draft stage → Firestore ─────────────────────────────
  const handleSaveDraft = async (draft: DraftStage) => {
    setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, uploading: true } : d));

    try {
      toast.loading('Verifying with AI...', { id: `upload-${draft.id}` });

      let aiResult;
      try {
        const verifyRes = await fetchWithAuth('/api/agents/verify-resolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            afterImage: draft.localPreview,
            originalImage: originalImageUrl,
            category: issueCategory
          })
        });
        aiResult = await verifyRes.json();
      } catch (aiErr) {
        console.error('AI Verification failed:', aiErr);
        throw new Error('AI Verification service unavailable');
      }

      if (!aiResult.verified) {
        toast.error(`Verification Failed: ${aiResult.reason}`, { id: `upload-${draft.id}`, duration: 5000 });
        setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, uploading: false } : d));
        return; // Reject upload
      }

      toast.loading('Uploading stage...', { id: `upload-${draft.id}` });

      let imageUrl = draft.localPreview;
      try {
        const imgRef = storageRef(storage, `progress_stages/${issueId}/${draft.id}.jpg`);
        await uploadString(imgRef, draft.localPreview, 'data_url');
        imageUrl = await getDownloadURL(imgRef);
      } catch (uploadErr) {
        console.warn('[ProgressTimeline] Storage upload failed, using base64 fallback:', uploadErr);
        // Use base64 preview as fallback (for demo/offline mode)
        imageUrl = draft.localPreview;
      }

      const saved: ProgressStage = {
        id: draft.id,
        imageUrl,
        description: draft.description,
        capturedAt: draft.capturedAt,
        location: draft.location,
        savedAt: new Date().toISOString(),
        aiSummary: aiResult.reason,
        confidenceScore: aiResult.confidence,
        verificationStatus: aiResult.status,
        qualityAcceptable: aiResult.qualityAcceptable,
        locationMatch: aiResult.locationMatch,
        fraudDetected: aiResult.fraudDetected
      };

      const newSaved = [...savedStages, saved];
      setSavedStages(newSaved);
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
      await persistStages(newSaved);

      toast.success('Stage verified and saved!', { id: `upload-${draft.id}` });
    } catch (err: any) {
      console.error('[ProgressTimeline] Save failed:', err);
      toast.error(err.message || 'Failed to save stage.', { id: `upload-${draft.id}` });
      setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, uploading: false } : d));
    }
  };

  // ── Delete a saved stage ─────────────────────────────────────────────────
  const handleDeleteSaved = async (id: string) => {
    const updated = savedStages.filter(s => s.id !== id);
    setSavedStages(updated);
    await persistStages(updated);
    toast.success('Stage removed.');
  };

  // ── Edit a saved stage description in-place ──────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState('');

  const startEdit = (stage: ProgressStage) => {
    setEditingId(stage.id);
    setEditingDesc(stage.description);
  };

  const saveEdit = async (id: string) => {
    const updated = savedStages.map(s =>
      s.id === id ? { ...s, description: editingDesc, savedAt: new Date().toISOString() } : s
    );
    setSavedStages(updated);
    setEditingId(null);
    await persistStages(updated);
    toast.success('Stage updated.');
  };

  // ── Confirm final resolution ─────────────────────────────────────────────
  const handleConfirm = async () => {
    if (savedStages.length === 0) {
      toast.error(t('admin.timeline.minOne'));
      return;
    }
    
    // AI Verification: Block resolution if the last stage isn't Fully Resolved with high confidence
    const finalStage = savedStages[savedStages.length - 1];
    if (finalStage.verificationStatus && finalStage.verificationStatus !== "Fully Resolved") {
      toast.error('Cannot resolve: Final stage must be "Fully Resolved" by AI.');
      return;
    }
    if (finalStage.confidenceScore && finalStage.confidenceScore < 0.90) {
      toast.error(`Cannot resolve: AI confidence is only ${Math.round(finalStage.confidenceScore * 100)}% (needs 90%+).`);
      return;
    }

    if (!closingNotes.trim()) {
      toast.error('Please enter closing notes before confirming.');
      return;
    }
    setConfirming(true);
    try {
      await onConfirmResolution(savedStages, closingNotes.trim());
      setShowConfirmForm(false);
    } catch (err) {
      console.error('[ProgressTimeline] Confirm resolution error:', err);
      toast.error('Failed to confirm resolution.');
    } finally {
      setConfirming(false);
    }
  };

  const totalStages = savedStages.length + drafts.length;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── Lightbox ── */}
      {lightboxUrl && (
        <div className="timeline-lightbox" onClick={() => setLightboxUrl(null)}>
          <button className="timeline-lightbox-close" onClick={() => setLightboxUrl(null)}>
            <X size={18} />
          </button>
          <img src={lightboxUrl} alt="Stage full view" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ── Panel container ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '12px', fontWeight: 700, color: 'var(--text-2)',
            display: 'flex', alignItems: 'center', gap: 6,
            textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)'
          }}>
            <Camera size={13} color="var(--primary)" />
            {t('admin.timeline.title')}
            {totalStages > 0 && (
              <span style={{
                background: 'var(--primary)', color: 'var(--bg)',
                borderRadius: 10, fontSize: 9, fontWeight: 700,
                padding: '1px 6px', marginLeft: 2
              }}>
                {savedStages.length}
              </span>
            )}
          </span>

          {!isLocked && (
            <button
              id="progress-timeline-add-stage-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!extractingId}
              style={{
                background: 'var(--primary)', color: 'var(--bg)',
                border: 'none', borderRadius: 5,
                padding: '5px 10px', fontSize: '11px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                opacity: extractingId ? 0.6 : 1,
                transition: 'opacity 0.15s'
              }}
            >
              {extractingId ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={12} />}
              {extractingId ? t('admin.timeline.exifExtracting') : t('admin.timeline.addStage')}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePickFile}
          />
        </div>

        {/* Locked badge */}
        {isLocked && (
          <div className="timeline-locked-badge">
            <Lock size={12} />
            {t('admin.timeline.locked')}
          </div>
        )}

        {/* Empty state */}
        {savedStages.length === 0 && drafts.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '20px 12px',
            border: '1.5px dashed var(--border)', borderRadius: 8,
            color: 'var(--text-3)', fontSize: '11px', lineHeight: 1.5
          }}>
            <Camera size={24} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
            {t('admin.timeline.noStages')}
          </div>
        )}

        {/* Vertical timeline list */}
        {(savedStages.length > 0 || drafts.length > 0) && (
          <div style={{ position: 'relative', paddingLeft: 36 }}>
            
            {/* Connector line */}
            <div
              className={`progress-timeline-connector${savedStages.length > 0 ? ' filled' : ''}`}
              style={{ bottom: drafts.length > 0 ? '60px' : '0' }}
            />

            {/* Saved stages */}
            {savedStages.map((stage, idx) => (
              <div key={stage.id} style={{ marginBottom: 12, position: 'relative' }}>
                {/* Badge */}
                <div
                  className="stage-badge saved"
                  style={{ position: 'absolute', left: -36, top: 10 }}
                >
                  {idx + 1}
                </div>

                <div className={`stage-card${isLocked ? ' locked' : ''}`}>
                  {/* Thumbnail */}
                  <img
                    src={stage.imageUrl}
                    alt={`Stage ${idx + 1}`}
                    className="stage-thumbnail"
                    onClick={() => !isLocked && setLightboxUrl(stage.imageUrl)}
                  />

                  {/* Meta row */}
                  <div className="stage-meta-row">
                    <div>
                      <span className="stage-meta-label">
                        <Calendar size={9} style={{ display: 'inline', marginRight: 3 }} />
                        {t('admin.timeline.capturedAt')}
                      </span>
                      <input
                        className="stage-meta-input"
                        type="text"
                        readOnly
                        value={fmtDate(stage.capturedAt)}
                        title={stage.capturedAt}
                      />
                    </div>
                    <div>
                      <span className="stage-meta-label">
                        <MapPin size={9} style={{ display: 'inline', marginRight: 3 }} />
                        {t('admin.timeline.location')}
                      </span>
                      <input
                        className="stage-meta-input"
                        type="text"
                        readOnly
                        value={stage.location}
                        title={stage.location}
                      />
                    </div>
                  </div>

                  {/* Description - editable inline */}
                  {editingId === stage.id ? (
                    <>
                      <textarea
                        rows={2}
                        className="stage-desc-textarea"
                        value={editingDesc}
                        onChange={e => setEditingDesc(e.target.value)}
                        placeholder={t('admin.timeline.description')}
                        autoFocus
                      />
                      <div className="stage-actions-row">
                        <button
                          onClick={() => saveEdit(stage.id)}
                          style={{
                            flex: 1, background: '#10B981', color: '#fff',
                            border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700,
                            cursor: 'pointer', padding: '5px 0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                          }}
                        >
                          <Check size={11} /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            background: 'var(--surface)', color: 'var(--text-3)',
                            border: '1px solid var(--border)', borderRadius: 4,
                            fontSize: 11, cursor: 'pointer', padding: '5px 10px'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{
                        fontSize: 11, color: stage.description ? 'var(--text-1)' : 'var(--text-3)',
                        margin: 0, lineHeight: 1.45, fontStyle: stage.description ? 'normal' : 'italic'
                      }}>
                        {stage.description || 'No description added.'}
                      </p>
                      
                      {/* AI Verification Results Display */}
                      {stage.verificationStatus && (
                        <div style={{
                          marginTop: 8, padding: '8px', borderRadius: '6px',
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
                          fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: stage.verificationStatus === 'Rejected' ? 'var(--error)' : 'var(--primary)' }}>
                              {stage.verificationStatus}
                            </span>
                            {stage.confidenceScore !== undefined && (
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                                {Math.round(stage.confidenceScore * 100)}% Confidence
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, color: 'var(--text-2)', lineHeight: 1.4 }}>
                            {stage.aiSummary}
                          </p>
                        </div>
                      )}



                      {!isLocked && (
                        <div className="stage-actions-row">
                          <button
                            onClick={() => startEdit(stage)}
                            style={{
                              flex: 1, background: 'var(--surface)', color: 'var(--text-2)',
                              border: '1px solid var(--border)', borderRadius: 4,
                              fontSize: 11, fontWeight: 500, cursor: 'pointer', padding: '4px 0'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSaved(stage.id)}
                            title={t('admin.timeline.deleteStage')}
                            style={{
                              background: 'transparent', color: 'var(--text-3)',
                              border: '1px solid var(--border)', borderRadius: 4,
                              cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* "Resolution proof" badge on last stage */}
                  {isLocked && idx === savedStages.length - 1 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 10, color: '#10B981', fontWeight: 600,
                      borderTop: '1px solid rgba(16,185,129,0.2)', paddingTop: 6, marginTop: 2
                    }}>
                      <Check size={10} /> Resolution proof image
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Draft stages (uploaded but not yet saved) */}
            {drafts.map((draft, idx) => (
              <div key={draft.id} style={{ marginBottom: 12, position: 'relative' }}>
                <div
                  className={`stage-badge${draft.uploading ? ' uploading' : ''}`}
                  style={{ position: 'absolute', left: -36, top: 10 }}
                >
                  {savedStages.length + idx + 1}
                </div>

                <div className="stage-card">
                  {/* Thumbnail */}
                  <img
                    src={draft.localPreview}
                    alt={`Draft ${idx + 1}`}
                    className="stage-thumbnail"
                    onClick={() => setLightboxUrl(draft.localPreview)}
                  />

                  {/* Meta row */}
                  <div className="stage-meta-row">
                    <div>
                      <span className="stage-meta-label">
                        <Calendar size={9} style={{ display: 'inline', marginRight: 3 }} />
                        {t('admin.timeline.capturedAt')}
                      </span>
                      <input
                        className="stage-meta-input"
                        type="datetime-local"
                        value={draft.capturedAt.slice(0, 16)}
                        onChange={e => updateDraft(draft.id, 'capturedAt', new Date(e.target.value).toISOString())}
                      />
                    </div>
                    <div>
                      <span className="stage-meta-label">
                        <MapPin size={9} style={{ display: 'inline', marginRight: 3 }} />
                        {t('admin.timeline.location')}
                      </span>
                      <input
                        className="stage-meta-input"
                        type="text"
                        value={draft.location}
                        onChange={e => updateDraft(draft.id, 'location', e.target.value)}
                        placeholder="Location"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <textarea
                    rows={2}
                    className="stage-desc-textarea"
                    placeholder={t('admin.timeline.description')}
                    value={draft.description}
                    onChange={e => updateDraft(draft.id, 'description', e.target.value)}
                  />

                  {/* Actions */}
                  <div className="stage-actions-row">
                    <button
                      onClick={() => handleSaveDraft(draft)}
                      disabled={draft.uploading}
                      style={{
                        flex: 1, background: 'var(--primary)', color: 'var(--bg)',
                        border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        cursor: draft.uploading ? 'not-allowed' : 'pointer', padding: '5px 0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        opacity: draft.uploading ? 0.7 : 1
                      }}
                    >
                      {draft.uploading
                        ? <><Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> {t('admin.timeline.uploading')}</>
                        : <><Check size={11} /> {t('admin.timeline.saveStage')}</>
                      }
                    </button>
                    <button
                      onClick={() => setDrafts(prev => prev.filter(d => d.id !== draft.id))}
                      disabled={draft.uploading}
                      title="Discard"
                      style={{
                        background: 'transparent', color: 'var(--text-3)',
                        border: '1px solid var(--border)', borderRadius: 4,
                        cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Confirm Final Resolution ── */}
        {!isLocked && (
          <div className="timeline-confirm-panel">
            {savedStages.length === 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 10, color: 'var(--text-3)', fontStyle: 'italic'
              }}>
                <AlertTriangle size={11} color="var(--warning)" />
                {t('admin.timeline.minOne')}
              </div>
            )}

            {!showConfirmForm ? (
              <button
                id="progress-timeline-confirm-btn"
                disabled={savedStages.length === 0 || drafts.length > 0}
                onClick={() => setShowConfirmForm(true)}
                style={{
                  width: '100%',
                  background: savedStages.length > 0 && drafts.length === 0 ? '#10B981' : 'var(--surface-2)',
                  color: savedStages.length > 0 && drafts.length === 0 ? '#fff' : 'var(--text-3)',
                  border: '1px solid ' + (savedStages.length > 0 && drafts.length === 0 ? '#10B981' : 'var(--border)'),
                  borderRadius: 6,
                  padding: '9px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: savedStages.length > 0 && drafts.length === 0 ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.2s ease',
                  opacity: drafts.length > 0 ? 0.5 : 1
                }}
              >
                <Check size={14} />
                {t('admin.timeline.confirmResolution')}
                {savedStages.length > 0 && (
                  <span style={{ fontSize: 10, opacity: 0.8 }}>({savedStages.length} stage{savedStages.length > 1 ? 's' : ''})</span>
                )}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>
                  {t('admin.timeline.closingNotes')}
                </label>
                <textarea
                  rows={3}
                  className="stage-desc-textarea"
                  placeholder={t('admin.timeline.closingPlaceholder')}
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={handleConfirm}
                    disabled={confirming || !closingNotes.trim()}
                    style={{
                      flex: 1, background: '#10B981', color: '#fff',
                      border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700,
                      cursor: confirming || !closingNotes.trim() ? 'not-allowed' : 'pointer',
                      padding: '8px 0', opacity: !closingNotes.trim() ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                    }}
                  >
                    {confirming
                      ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Confirming...</>
                      : <><Check size={13} /> Submit &amp; Close Issue</>
                    }
                  </button>
                  <button
                    onClick={() => setShowConfirmForm(false)}
                    style={{
                      background: 'var(--surface)', color: 'var(--text-3)',
                      border: '1px solid var(--border)', borderRadius: 5,
                      fontSize: 11, cursor: 'pointer', padding: '8px 12px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ProgressTimeline;
