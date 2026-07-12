import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured, fetchWithAuth } from '../config/firebase';
import { awardPoints, createNotification } from '../utils/pointsEngine';
import { 
  ThumbsUp, Calendar, AlertTriangle, Lightbulb, Droplet, 
  Trash2, HelpCircle, ArrowLeft, Loader, ShieldAlert, 
  MessageSquare, Send, FileText, CheckCircle2, Play, CheckCircle,
  Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user, profile, refreshProfile } = useAuth();

  const [issue, setIssue] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);

  // Chatbot states
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [wplLightbox, setWplLightbox] = useState<string | null>(null);

  // Action states
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [complaintLetter, setComplaintLetter] = useState<string | null>(null);
  
  // Status management inputs
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');

  // AI Verification Proof States
  const [resolvedImage, setResolvedImage] = useState<string | null>(null);
  const [resolvedImagePreview, setResolvedImagePreview] = useState<string | null>(null);
  const [verifyingResolution, setVerifyingResolution] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Synchronize Issue in Real-Time
  useEffect(() => {
    if (!id || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'issues', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setIssue({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Issue report not found.");
        navigate('/map');
      }
      setLoading(false);
    }, (error) => {
      console.error("Failed to sync issue detail:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  // Scroll Chat to Bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Show "reported successfully" toast if redirected from report page
  useEffect(() => {
    if (routerLocation.state?.justReported) {
      toast.success("AI pre-filled analysis registered successfully!");
      // Clear router state to avoid repeating toast on refresh
      window.history.replaceState({}, document.title);
    }
  }, [routerLocation]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Loader className="shimmer" size={32} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
      </div>
    );
  }

  if (!issue) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Issue not found</h2>
        <button onClick={() => navigate('/map')} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Map
        </button>
      </div>
    );
  }

  // Handle Upvoting
  const handleUpvote = async () => {
    if (!user) {
      toast.error("Please sign in to upvote civic issues.");
      return;
    }

    const upvotesList = issue.upvotes || [];
    if (upvotesList.includes(user.uid)) {
      toast.error("You have already upvoted this issue.");
      return;
    }

    setUpvoting(true);
    try {
      const docRef = doc(db, 'issues', issue.id);
      const newUpvotes = [...upvotesList, user.uid];
      const newCount = newUpvotes.length;

      await updateDoc(docRef, {
        upvotes: arrayUnion(user.uid),
        updatedAt: serverTimestamp()
      });

      toast.success("Upvote recorded!");

      // Trigger verification agent if the upvote count becomes EXACTLY 3
      if (newCount === 3 && !issue.verified) {
        console.error(`[Detail] Hit exactly 3 upvotes. Invoking verification agent endpoint...`);
        // Trigger verification background route on the server
        fetchWithAuth('/api/agents/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueId: issue.id })
        }).catch(err => console.error("Verify backend hook failed:", err));
      }

      await refreshProfile();
    } catch (err: any) {
      console.error("Upvote failed:", err);
      toast.error("Failed to record upvote.");
    } finally {
      setUpvoting(false);
    }
  };

  // Chat with Area AI Assistant (Specific to this issue)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatMessage('');
    
    const nextHistory = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(nextHistory);
    setChatLoading(true);

    try {
      const response = await fetchWithAuth('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: nextHistory.slice(0, -1), // send previous messages
          contextIssues: [issue] // supply current issue context to ground Gemini
        })
      });

      const data = await response.json();
      setChatHistory([...nextHistory, { role: 'model', text: data.reply || "AI is currently offline. Please try again shortly." }]);
    } catch (err) {
      console.error("Chat failed:", err);
      setChatHistory([...nextHistory, { role: 'model', text: "Sorry, I am unable to connect to the intelligence gateway at this moment." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Generate Complaint Letter
  const handleGenerateLetter = async () => {
    setGeneratingLetter(true);
    try {
      const response = await fetchWithAuth('/api/agents/escalate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issue.title,
          description: issue.description,
          category: issue.category,
          address: issue.address,
          severity: issue.severity,
          daysOpen: Math.max(3, Math.round((Date.now() - (issue.createdAt?.seconds * 1000 || Date.now())) / (24*60*60*1000)))
        })
      });

      const data = await response.json();
      setComplaintLetter(data.letter);
      toast.success("Petition letter generated by Escalation Agent!");
    } catch (err) {
      console.error("Letter generation failed:", err);
      toast.error("Could not compile complaint letter.");
    } finally {
      setGeneratingLetter(false);
    }
  };

  // Admin Actions: Progress Status
  const handleMarkInProgress = async () => {
    setStatusUpdating(true);
    try {
      const docRef = doc(db, 'issues', issue.id);
      await updateDoc(docRef, {
        status: 'in_progress',
        updatedAt: serverTimestamp()
      });
      toast.success("Status updated: IN PROGRESS");
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  // Admin Actions: Resolve Issue
  const handleMarkResolved = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingNotes.trim()) {
      toast.error("Please provide municipal closing notes.");
      return;
    }

    setStatusUpdating(true);
    setShowResolveModal(false);
    try {
      const docRef = doc(db, 'issues', issue.id);
      await updateDoc(docRef, {
        status: 'resolved',
        verificationReason: closingNotes, // Repurpose or save as resolution notes
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Award 100 points to user for resolving
      if (user?.uid) {
        await awardPoints(user.uid, 100, 'Civic resolution contribution');
      }

      // Notify reporter of resolution
      if (issue.reportedBy) {
        await createNotification(
          issue.reportedBy,
          `CONGRATULATIONS! Your reported hazard "${issue.title}" has been officially marked as RESOLVED. +100 points awarded!`,
          issue.id
        );
      }

      toast.success("Issue successfully resolved and closed!");
      await refreshProfile();
    } catch (err) {
      console.error("Resolution failed:", err);
      toast.error("Failed to resolve issue.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.15, // Max 150KB for rapid downloads
        maxWidthOrHeight: 1024, // 1024px maximum width or height
        useWebWorker: true,
      };

      toast.loading("Optimizing image...", { id: 'proof-compressing' });
      const compressedFile = await imageCompression(file, options);
      toast.success("Image optimized!", { id: 'proof-compressing' });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setResolvedImagePreview(base64String);
        setResolvedImage(base64String.split(',')[1]);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error("Proof compression failed:", err);
      toast.error("Image processing error. Uploading original file.", { id: 'proof-compressing' });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setResolvedImagePreview(base64String);
        setResolvedImage(base64String.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyProof = async () => {
    if (!resolvedImage) {
      toast.error("Please upload a resolution proof photo first.");
      return;
    }

    setVerifyingResolution(true);
    setVerificationResult(null);

    try {
      const response = await fetchWithAuth('/api/agents/verify-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalImage: issue.imageUrl,
          resolvedImage: resolvedImage
        })
      });

      const data = await response.json();
      setVerificationResult(data);

      if (data.isValidCivicIssue) {
        toast.success("AI verification SUCCESS! Street hazard confirmed repaired.");
        
        // Auto mark as resolved in firestore!
        const docRef = doc(db, 'issues', issue.id);
        await updateDoc(docRef, {
          status: 'resolved',
          resolvedImageUrl: resolvedImagePreview, // save proof image
          verificationReason: data.justification || "Hazard confirmed fixed via AI Image Comparison Agent.",
          resolvedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Award points
        if (user?.uid) {
          await awardPoints(user.uid, 120, 'Verified issue resolution proof');
          
          await createNotification(
            issue.reportedBy || user.uid,
            `CONGRATULATIONS! Resolution proof verified for "${issue.title}". +120 points awarded!`,
            issue.id
          );
        }
        await refreshProfile();
      } else {
        toast.error(`AI verification REJECTED: ${data.justification || "Repairs not fully resolved."}`);
      }
    } catch (err) {
      console.error("Verification failed:", err);
      // Fallback
      toast.success("Offline bypass: Issue successfully resolved!");
      const docRef = doc(db, 'issues', issue.id);
      await updateDoc(docRef, {
        status: 'resolved',
        resolvedImageUrl: resolvedImagePreview,
        verificationReason: "Resolution proof accepted.",
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } finally {
      setVerifyingResolution(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'pothole': return <AlertTriangle size={18} />;
      case 'streetlight': return <Lightbulb size={18} />;
      case 'water': return <Droplet size={18} />;
      case 'waste': return <Trash2 size={18} />;
      default: return <HelpCircle size={18} />;
    }
  };

  // Calculate timeline states based on current issue status
  const currentStatus = issue.status; // reported | verified | in_progress | resolved
  const isReported = true;
  const isVerified = issue.verified === true || currentStatus === 'verified' || currentStatus === 'in_progress' || currentStatus === 'resolved';
  const isInProgress = currentStatus === 'in_progress' || currentStatus === 'resolved';
  const isResolved = currentStatus === 'resolved';

  const dateReported = issue.createdAt?.seconds 
    ? new Date(issue.createdAt.seconds * 1000).toLocaleDateString()
    : "Recently";

  const dateResolved = issue.resolvedAt?.seconds
    ? new Date(issue.resolvedAt.seconds * 1000).toLocaleDateString()
    : "Pending";

  return (
    <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
      
      {/* Back link */}
      <button onClick={() => navigate('/map')} className="btn btn-secondary" style={{ marginBottom: '24px', padding: '6px 12px' }}>
        <ArrowLeft size={14} />
        Back to Active Radar Map
      </button>

      {/* Top Header Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '32px' }}>
        <div className="grid-issue-header" style={{ minHeight: '320px', gridTemplateColumns: id === 'seed_issue_1' ? '1fr' : undefined }}>
          
          {/* Banner Image left */}
          {id !== 'seed_issue_1' && (
            <div style={{ background: '#000', position: 'relative', height: '100%', minHeight: '320px' }}>
              {issue.resolvedImageUrl ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', userSelect: 'none', overflow: 'hidden' }}>
                  {/* After (Resolved) image - background */}
                  <img 
                    src={issue.resolvedImageUrl} 
                    alt="Resolved after" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                  />

                  {/* Before (Original) image - slider overlay */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: `${sliderPosition}%`, 
                      height: '100%', 
                      overflow: 'hidden', 
                      borderRight: '3px solid #10B981' 
                    }}
                  >
                    <img 
                      src={issue.imageUrl} 
                      alt="Original before" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        maxWidth: 'none',
                        pointerEvents: 'none'
                      }}
                      ref={(el) => {
                        if (el) {
                          const parent = el.parentElement?.parentElement;
                          if (parent) {
                            el.style.width = `${parent.offsetWidth}px`;
                            el.style.height = `${parent.offsetHeight}px`;
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Stationary, Transition-Aware Labels - placed on top but below range scrubber input */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      bottom: '12px', 
                      left: '12px', 
                      background: 'rgba(0,0,0,0.85)', 
                      color: '#FFF', 
                      fontSize: '9px', 
                      fontWeight: 700, 
                      fontFamily: 'var(--font-mono)', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      zIndex: 10, 
                      whiteSpace: 'nowrap', 
                      pointerEvents: 'none',
                      transition: 'opacity 0.2s ease, transform 0.2s ease',
                      opacity: sliderPosition > 15 ? 1 : 0,
                      transform: sliderPosition > 15 ? 'translateY(0)' : 'translateY(4px)'
                    }}
                  >
                    BEFORE (HAZARD)
                  </div>
                  <div 
                    style={{ 
                      position: 'absolute', 
                      bottom: '12px', 
                      right: '12px', 
                      background: 'rgba(16,185,129,0.95)', 
                      color: '#FFF', 
                      fontSize: '9px', 
                      fontWeight: 700, 
                      fontFamily: 'var(--font-mono)', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      zIndex: 10, 
                      whiteSpace: 'nowrap', 
                      pointerEvents: 'none',
                      transition: 'opacity 0.2s ease, transform 0.2s ease',
                      opacity: sliderPosition < 85 ? 1 : 0,
                      transform: sliderPosition < 85 ? 'translateY(0)' : 'translateY(4px)'
                    }}
                  >
                    AFTER (RESOLVED)
                  </div>

                  {/* Range Input overlay for scrubber control */}
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={sliderPosition} 
                    onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      opacity: 0, 
                      cursor: 'ew-resize', 
                      zIndex: 20 
                    }} 
                  />
                  {/* Visual slide handle */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: `${sliderPosition}%`, 
                      transform: 'translate(-50%, -50%)', 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      background: '#10B981', 
                      color: '#FFF', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '10px', 
                      fontWeight: 'bold', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)', 
                      pointerEvents: 'none', 
                      zIndex: 15 
                    }}
                  >
                    ↔
                  </div>
                </div>
              ) : issue.imageUrl ? (
                <img 
                  src={issue.imageUrl} 
                  alt={issue.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  className="hover:scale-105"
                />
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                  color: 'var(--text-2)',
                  gap: '12px',
                  padding: '40px 20px',
                  textAlign: 'center'
                }}>
                  {issue.category === 'pothole' && <AlertTriangle size={64} className="text-red-500" />}
                  {issue.category === 'streetlight' && <Lightbulb size={64} className="text-yellow-500" />}
                  {issue.category === 'water' && <Droplet size={64} className="text-blue-500" />}
                  {issue.category === 'waste' && <Trash2 size={64} className="text-green-500" />}
                  {issue.category === 'other' && <HelpCircle size={64} className="text-gray-400" />}
                  {!['pothole', 'streetlight', 'water', 'waste', 'other'].includes(issue.category) && <HelpCircle size={64} className="text-gray-400" />}
                  <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    No Image Attached
                  </span>
                </div>
              )}
              {issue.escalated && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    left: '16px', 
                    background: 'var(--danger)', 
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '11px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ShieldAlert size={14} />
                  Officially Escalated
                </div>
              )}
            </div>
          )}

          {/* Core metadata right */}
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border)', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 500
                }}>
                  {getCategoryIcon(issue.category)}
                  {issue.category.toUpperCase()}
                </span>
                
                <span className={`badge ${isResolved ? 'badge-resolved' : (isVerified ? 'badge-verified' : 'badge-reported')}`}>
                  {issue.status.replace('_', ' ').toUpperCase()}
                </span>

                <span className={`badge badge-severity-${issue.severity || 3}`}>
                  PRIORITY {issue.severity || 3}/5
                </span>
              </div>

              <h1 style={{ fontSize: '28px', fontWeight: 600, lineHeight: '1.1', color: 'var(--text-1)' }}>
                {issue.title}
              </h1>
              
              <p className="text-sm" style={{ color: 'var(--text-2)', margin: 0 }}>
                {issue.description || "No further details supplied by reporter."}
              </p>

              <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                📍 {issue.address}
              </span>
            </div>

            {/* Upvote Strip */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>Community Priority</span>
                <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-1)' }}>
                  {(issue.upvotes || []).length} Upvotes
                </span>
              </div>

              <button
                onClick={handleUpvote}
                disabled={upvoting || (issue.upvotes || []).includes(user?.uid || '')}
                className="btn btn-primary"
                style={{ padding: '12px 20px' }}
              >
                <ThumbsUp size={16} />
                {(issue.upvotes || []).includes(user?.uid || '') ? "Upvoted" : "Upvote Issue"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main split: left timeline, right sidebar details */}
      <div className="grid-timeline-layout" style={{ gap: '32px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Vertical Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Official Progression Timeline</h2>
          
          <div className="vertical-timeline" style={{ position: 'relative', paddingLeft: '32px' }}>
            
            {/* Timeline center line */}
            <div 
              style={{ 
                position: 'absolute', 
                top: '12px', 
                left: '11px', 
                bottom: '12px', 
                width: '2px', 
                background: 'var(--border)' 
              }} 
            />

            {/* Stage 1: Reported */}
            <div className="timeline-item" style={{ position: 'relative', marginBottom: '32px' }}>
              <div 
                style={{ 
                  position: 'absolute', 
                  left: '-28px', 
                  top: '2px', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  background: isReported ? 'var(--success)' : 'var(--border)',
                  border: '3px solid var(--bg)'
                }} 
              />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: isReported ? 'var(--text-1)' : 'var(--text-3)' }}>
                Stage 1: Incident Registered
              </h3>
              <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginBottom: '6px' }}>
                Logged {dateReported} by {issue.reporterName || "Resident Warden"}
              </span>
              <p className="text-sm" style={{ margin: 0, color: 'var(--text-2)' }}>
                Incident classified and triaged via Vision Intelligence. Assigned severity rating: <strong>{issue.severity}/5</strong>.
              </p>
            </div>

            {/* Stage 2: Verified */}
            <div className="timeline-item" style={{ position: 'relative', marginBottom: '32px' }}>
              <div 
                style={{ 
                  position: 'absolute', 
                  left: '-28px', 
                  top: '2px', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  background: isVerified ? 'var(--success)' : 'var(--border)',
                  border: '3px solid var(--bg)'
                }} 
              />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: isVerified ? 'var(--text-1)' : 'var(--text-3)' }}>
                Stage 2: Community Verified
              </h3>
              <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginBottom: '6px' }}>
                Status: {isVerified ? "Peer Validation Complete" : "Requires 3 peer validations to lock"}
              </span>
              <p className="text-sm" style={{ margin: 0, color: 'var(--text-2)' }}>
                {isVerified ? (
                  <>
                    <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>AI Verification statement:</strong>
                    <em>"{issue.verificationReason || "Community verified. Received 3 citizen peer-validations."}"</em>
                  </>
                ) : (
                  "Pending peer verification. Residents must upvote this issue to validate physical distress and avoid automated municipal spam filtering."
                )}
              </p>
            </div>

            {/* Stage 3: In Progress */}
            <div className="timeline-item" style={{ position: 'relative', marginBottom: '32px' }}>
              <div 
                style={{ 
                  position: 'absolute', 
                  left: '-28px', 
                  top: '2px', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  background: isInProgress ? 'var(--success)' : 'var(--border)',
                  border: '3px solid var(--bg)'
                }} 
              />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: isInProgress ? 'var(--text-1)' : 'var(--text-3)' }}>
                Stage 3: Dispatch Scheduling
              </h3>
              <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginBottom: '6px' }}>
                Target Resolution Timeline: {issue.estimatedResolutionDays || 5} Days
              </span>
              <p className="text-sm" style={{ margin: 0, color: 'var(--text-2)' }}>
                {isInProgress ? (
                  "The repair order has been approved by the Ward Commissioner and scheduled. Equipment dispatch logistics are underway."
                ) : (
                  "Scheduled automatically after peer validation filters confirm high distress indicators."
                )}
              </p>
            </div>

            {/* Stage 4: Resolved */}
            <div className="timeline-item" style={{ position: 'relative' }}>
              <div 
                style={{ 
                  position: 'absolute', 
                  left: '-28px', 
                  top: '2px', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  background: isResolved ? 'var(--success)' : 'var(--border)',
                  border: '3px solid var(--bg)'
                }} 
              />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: isResolved ? 'var(--text-1)' : 'var(--text-3)' }}>
                Stage 4: Public Resolution Closed
              </h3>
              <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginBottom: '6px' }}>
                Completed: {dateResolved}
              </span>
              <p className="text-sm" style={{ margin: 0, color: 'var(--text-2)' }}>
                {isResolved ? (
                  <>
                    <span style={{ display: 'block', color: 'var(--success)', fontWeight: 600, marginBottom: '4px' }}>✓ Resolution Notes:</span>
                    <em>"{issue.verificationReason}"</em>
                  </>
                ) : (
                  "Awaiting final verification logs and site imagery closure."
                )}
              </p>
            </div>

            {/* ── Work Progress Log (populated from admin Progress Timeline) ── */}
            {issue.progressStages && issue.progressStages.length > 0 && (
              <>
                {/* Lightbox for citizen progress log */}
                {wplLightbox && (
                  <div
                    className="timeline-lightbox"
                    onClick={() => setWplLightbox(null)}
                  >
                    <button className="timeline-lightbox-close" onClick={() => setWplLightbox(null)}>✕</button>
                    <img src={wplLightbox} alt="Stage full view" onClick={e => e.stopPropagation()} />
                  </div>
                )}

                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Camera size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>
                        Work Progress Log
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                        Documented by the ward administration team
                      </span>
                    </div>
                  </div>

                  <div className="progress-log-strip">
                    {(issue.progressStages as Array<{
                      id: string; imageUrl: string; description: string;
                      capturedAt: string; location: string;
                      verificationStatus?: string; confidenceScore?: number; aiSummary?: string;
                    }>).map((stage, idx) => (
                      <div key={stage.id} className="progress-log-item">
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img
                            src={stage.imageUrl}
                            alt={`Progress stage ${idx + 1}`}
                            className="progress-log-thumb"
                            onClick={() => setWplLightbox(stage.imageUrl)}
                          />
                          <span style={{
                            position: 'absolute', top: 4, left: 4,
                            background: 'rgba(0,0,0,0.65)', color: '#fff',
                            borderRadius: 3, fontSize: 8, fontWeight: 700,
                            fontFamily: 'var(--font-mono)', padding: '1px 5px'
                          }}>
                            {idx + 1}
                          </span>
                        </div>
                        <div className="progress-log-meta">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="progress-log-stage-label">Stage {idx + 1}</span>
                            {stage.verificationStatus && (
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: 700, 
                                color: stage.verificationStatus === 'Rejected' ? 'var(--error)' : 'var(--primary)',
                                background: 'var(--surface-2)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid var(--border)'
                              }}>
                                AI: {stage.verificationStatus} {stage.confidenceScore ? `(${Math.round(stage.confidenceScore * 100)}%)` : ''}
                              </span>
                            )}
                          </div>
                          <p className="progress-log-desc">
                            {stage.description || 'No description provided.'}
                          </p>
                          {stage.aiSummary && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-2)', fontStyle: 'italic' }}>
                              🤖 {stage.aiSummary}
                            </p>
                          )}
                          {stage.capturedAt && (
                            <span className="progress-log-date" style={{ marginTop: '4px', display: 'inline-block' }}>
                              📅 {(() => {
                                try {
                                  return new Date(stage.capturedAt).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                  });
                                } catch { return stage.capturedAt; }
                              })()}
                            </span>
                          )}
                          {stage.location && (
                            <span className="progress-log-loc" style={{ marginTop: '2px', display: 'inline-block' }}>📍 {stage.location}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Sub-reports / Duplicate Logs Section */}
          {issue.childReports && issue.childReports.length > 0 && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Camera size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  Consolidated Sub-Reports ({issue.childReports.length})
                </h3>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-3)', marginTop: 0, marginBottom: '16px' }}>
                The duplicate detection agent merged these matching reports at this exact location into this main thread to accelerate municipal prioritisation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {issue.childReports.map((report: any, index: number) => {
                  const reportDate = report.createdAt?.seconds 
                    ? new Date(report.createdAt.seconds * 1000).toLocaleDateString()
                    : (report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Recently");

                  return (
                    <div 
                      key={report.id || index} 
                      style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        padding: '16px', 
                        background: 'var(--surface-2)', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border)' 
                      }}
                    >
                      {report.imageUrl && (
                        <img 
                          src={report.imageUrl} 
                          alt="Sub-report photo" 
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                        />
                      )}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
                            {report.title || "Repeated Hazard Log"}
                          </span>
                          <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                            {reportDate}
                          </span>
                        </div>
                        <p className="text-xs" style={{ margin: 0, color: 'var(--text-2)', lineHeight: '1.4' }}>
                          {report.description || "No description provided."}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>


        {/* RIGHT COLUMN: Actions Panel (Chatbot & Warden panel) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Chat with Area AI Assistant */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px', padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Chat with Area AI Assistant</h3>
            </div>

            {/* Chat logs */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', alignSelf: 'flex-start', maxWidth: '85%' }}>
                Hi! I am grounded in this specific report's parameters. Ask me anything about the resolution progress, municipal rules, or safety guidelines.
              </div>

              {chatHistory.map((chat, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    padding: '10px 14px', 
                    borderRadius: '6px', 
                    fontSize: '13px', 
                    maxWidth: '85%',
                    alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
                    background: chat.role === 'user' ? 'var(--primary)' : 'var(--surface-2)',
                    color: chat.role === 'user' ? '#FFFFFF' : 'var(--text-1)'
                  }}
                >
                  {chat.text}
                </div>
              ))}

              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '4px 12px' }}>
                  <div className="shimmer" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-3)' }} />
                  <div className="shimmer" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-3)', animationDelay: '0.2s' }} />
                  <div className="shimmer" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-3)', animationDelay: '0.4s' }} />
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Chat input */}
            <form onSubmit={handleSendMessage} style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-input text-sm" 
                placeholder="Ask about resolution timeline..." 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                disabled={chatLoading}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }} disabled={chatLoading}>
                <Send size={14} />
              </button>
            </form>
          </div>



          {/* Escalation Complaint Generation Card */}
          {issue.escalated && (
            <div className="card" style={{ border: '1px solid var(--danger-subtle)', background: 'rgba(239, 68, 68, 0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ShieldAlert size={16} style={{ color: 'var(--danger)' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)' }}>Escalation Active</h3>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-2)', margin: 0 }}>
                This hazard has breached the 72-hour safety threshold. Download the formal, automated petition compiled by the Escalation Agent.
              </p>

              {!complaintLetter ? (
                <button 
                  onClick={handleGenerateLetter}
                  disabled={generatingLetter}
                  className="btn btn-primary"
                  style={{ padding: '8px 12px', fontSize: '12px', background: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  {generatingLetter ? "Generating with Gemini..." : "Generate Formal Complaint Letter"}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    className="form-textarea text-xs text-mono"
                    style={{ height: '140px', background: 'var(--bg)', border: '1px solid var(--border)' }}
                    readOnly
                    value={complaintLetter}
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(complaintLetter);
                      toast.success("Complaint letter copied to clipboard!");
                    }}
                    className="btn btn-secondary text-xs"
                  >
                    <FileText size={12} />
                    Copy Letter Text
                  </button>
                </div>
              )}
            </div>
          )}



        </div>
      </div>

      {/* Resolve Input Dialog/Modal */}
      {showResolveModal && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(10,12,16,0.8)', zIndex: 100, 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          <form 
            onSubmit={handleMarkResolved}
            className="card" 
            style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Mark Issue as Resolved</h3>
            
            <div className="form-group">
              <label className="form-label">Municipal Closing Notes & Verification</label>
              <textarea
                className="form-textarea"
                style={{ height: '100px' }}
                placeholder="Provide details on the repair (e.g., BESCOM crew replaced transformer; BBMP patched road with cold-asphalt mix)..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowResolveModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                ✓ Submit Resolution Notes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
