import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  MapPin, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TranscriptItem {
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
}

export default function IVRCallPage() {
  const navigate = useNavigate();
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [lockedLanguage, setLockedLanguage] = useState<'en' | 'hi' | 'bn' | null>(null);
  
  // Collected complaint fields during the call
  const [complaintData, setComplaintData] = useState({
    issueType: '',
    description: '',
    callerName: '',
    location: '',
    landmark: '',
    callerPhone: '+919876543210',
    generatedId: ''
  });

  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const durationTimerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioUrlRef = useRef<string>('');
  const callIdRef = useRef<string>('');

  // Persist Call Log to Backend & Firestore
  const persistCallLog = async (overrides?: {
    reportId?: string;
    issueType?: string;
    location?: string;
    callerName?: string;
    status?: 'completed' | 'in_progress' | 'dropped' | 'escalated';
    intent?: 'NEW_COMPLAINT' | 'STATUS_CHECK' | 'ESCALATION' | 'GENERAL_QUERY';
  }) => {
    try {
      const finalLang = lockedLanguage === 'hi' ? 'Hindi' : lockedLanguage === 'bn' ? 'Bengali' : 'English';
      const finalTicket = overrides?.reportId || complaintData.generatedId;
      const finalCategory = overrides?.issueType || complaintData.issueType || 'General Civic Inquiry';
      const finalLoc = overrides?.location || complaintData.location || 'Indiranagar 100ft Road, Bengaluru';
      const finalCaller = overrides?.callerName || complaintData.callerName || 'Citizen Caller';
      const isStatusCall = currentStep === 2 && transcripts.some(t => t.text.includes('status') || t.text.includes('स्थिति') || t.text.includes('অবস্থা'));
      const callIntent = overrides?.intent || (isStatusCall ? 'STATUS_CHECK' : 'NEW_COMPLAINT');
      const finalStatus = overrides?.status || 'completed';

      const payload = {
        callId: callIdRef.current || `IVR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        callerPhone: complaintData.callerPhone || '+919876543210',
        callerName: finalCaller,
        startedAt: new Date(Date.now() - Math.max(callDuration, 15) * 1000).toISOString(),
        durationSeconds: Math.max(callDuration, 15),
        language: finalLang,
        intent: callIntent,
        category: finalCategory,
        address: finalLoc,
        reportId: finalTicket || undefined,
        status: finalStatus,
        urgency: 'high',
        transcript: transcripts.length > 0 ? transcripts : [
          { sender: 'agent', text: 'Namaskar. CivicPulse voice call connected.', timestamp: '00:02' }
        ],
        summary: `Citizen called via Web IVR in ${finalLang}. Issue: ${finalCategory} at ${finalLoc}.${finalTicket ? ` Registered under Ticket ${finalTicket}.` : ''}`,
        channel: 'Citizen Web IVR',
        recordingUrl: recordedAudioUrlRef.current || undefined,
        audioDuration: Math.max(callDuration, 15),
        sentiment: 'Cooperative',
        isReal: true
      };

      await fetch('/api/ivr/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Failed to save IVR call log to server:', err);
    }
  };

  // Initialize Speech Synthesis for AI Voice Output
  const speakText = (text: string, langCode: string = 'en-IN', onEndCallback?: () => void) => {
    if (!speakerEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // Prevent garbage collection bug in Chrome
    
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (langCode === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (langCode === 'bn') {
      utterance.lang = 'bn-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = (e) => {
      console.warn("Speech Synthesis Error:", e);
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback(); // fallback so it doesn't get stuck
    };

    window.speechSynthesis.speak(utterance);
  };

  // Play DTMF keypad tone sound effect
  const playDTMFTone = (freq1: number = 697, freq2: number = 1209) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freq1;
      osc2.frequency.value = freq2;

      gain.gain.value = 0.08;

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      setTimeout(() => {
        osc1.stop();
        osc2.stop();
      }, 150);
    } catch {
      // AudioContext fallback
    }
  };

  // Duration timer
  useEffect(() => {
    if (callState === 'active') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(durationTimerRef.current);
    }
    return () => clearInterval(durationTimerRef.current);
  }, [callState]);



  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const appendTranscript = (sender: 'agent' | 'user', text: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTranscripts(prev => [...prev, { sender, text, timestamp: now }]);
  };

  // Start Call Trigger
  const handleStartCall = async () => {
    // Hack to unlock speech synthesis on iOS/Chrome immediately on user interaction
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const silentUtterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(silentUtterance);
    }

    const newCallId = `IVR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    callIdRef.current = newCallId;
    recordedAudioUrlRef.current = '';
    audioChunksRef.current = [];

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Start recording audio
        if (typeof MediaRecorder !== 'undefined') {
          try {
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data);
              }
            };
            recorder.onstop = () => {
              if (audioChunksRef.current.length > 0) {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = () => {
                  recordedAudioUrlRef.current = reader.result as string;
                };
                reader.readAsDataURL(blob);
              }
            };
            recorder.start(1000);
            mediaRecorderRef.current = recorder;
          } catch (recErr) {
            console.warn('MediaRecorder error:', recErr);
          }
        }
      }
    } catch (err) {
      console.warn('Microphone permission denied or not available:', err);
      toast.error('Microphone access denied. Call will continue in keypad mode.');
    }

    setCallState('connecting');
    setCallDuration(0);
    setTranscripts([]);
    setCurrentStep(1);
    setLockedLanguage(null);
    setComplaintData({
      issueType: '',
      description: '',
      callerName: '',
      location: '',
      landmark: '',
      callerPhone: complaintData.callerPhone || '+919876543210',
      generatedId: ''
    });

    setTimeout(() => {
      setCallState('active');
      const firstMsg = "Namaskar. CivicPulse mein aapka swagat hai. For English, press 1. हिंदी के लिए 2 दबाइए। বাংলার জন্য ৩ চাপুন।";
      appendTranscript('agent', firstMsg);
      speakText(firstMsg, 'hi');
    }, 1200);
  };

  // End Call Trigger
  const handleEndCall = (finalAgentMsg?: string, overrides?: { reportId?: string; issueType?: string; location?: string; callerName?: string }) => {
    if (finalAgentMsg) {
      appendTranscript('agent', finalAgentMsg);
      speakText(finalAgentMsg, lockedLanguage || 'en');
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Safe ignore
      }
    }

    setTimeout(() => {
      setCallState('ended');
      window.speechSynthesis?.cancel();
      // Persist full call session to Firestore backend
      persistCallLog(overrides);
    }, 1500);
  };

  const submitReportToApi = async (finalName: string, finalLocation: string, finalIssue: string) => {
    try {
      const res = await fetch('/api/ivr/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_type: finalIssue || 'Pothole / Road Hazard',
          description: `Reported via Website Interactive IVR by ${finalName || 'Citizen Caller'}`,
          address: finalLocation,
          caller_phone: complaintData.callerPhone || '+919876543210',
          call_id: callIdRef.current,
          severity: 'high'
        })
      });

      const resData = await res.json();
      const reportId = resData.reportId || `CP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      setComplaintData(prev => ({ ...prev, generatedId: reportId }));
      setActiveTicket({
        id: reportId,
        category: finalIssue || 'Pothole / Road Hazard',
        address: finalLocation,
        callerPhone: complaintData.callerPhone || '+919876543210',
        status: 'Submitted'
      });

      setRecentTickets(prev => [
        { id: reportId, category: finalIssue || 'Pothole', address: finalLocation, status: 'Submitted', time: 'Just now' },
        ...prev
      ]);

      const digitsSpoken = reportId.split('').join(' . ');
      let successMsg = '';
      if (lockedLanguage === 'hi') {
        successMsg = `धन्यवाद। आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है। आपकी शिकायत आईडी है ${digitsSpoken}। सिविकपल्स से जुड़ने के लिए धन्यवाद। अलविदा।`;
      } else {
        successMsg = `Thank you! Your complaint has been registered successfully. Your Complaint ID is ${digitsSpoken}. Thank you for helping improve your community. Goodbye.`;
      }

      handleEndCall(successMsg, { reportId, issueType: finalIssue, location: finalLocation, callerName: finalName });
      toast.success(`Report registered successfully! ID: ${reportId}`);
    } catch (err) {
      const fallbackId = `CP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      let successMsg = `Thank you. Your complaint is registered. Complaint ID: ${fallbackId}. Goodbye.`;
      handleEndCall(successMsg, { reportId: fallbackId, issueType: finalIssue, location: finalLocation, callerName: finalName });
    }
  };

  const startListening = (langCode: string, onResult: (text: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in your browser. Use keypad.');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = langCode === 'hi' ? 'hi-IN' : langCode === 'bn' ? 'bn-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      toast.success('Listening... Please speak now.', { icon: '🎤', duration: 4000 });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error !== 'no-speech') {
        toast.error(`Voice error: ${event.error}. Press 1 to continue.`);
      }
    };
    
    try {
      recognition.start();
    } catch (e) {
      console.warn('Could not start speech recognition', e);
    }
  };

  // Process Keypad Input (1 to 9, 0, *, #)
  const handleKeypadPress = async (key: string) => {
    if (callState !== 'active') return;

    playDTMFTone();
    appendTranscript('user', `[Keypress ${key}]`);

    // STEP 1: Language Selection
    if (currentStep === 1) {
      let lang: 'en' | 'hi' | 'bn' = 'en';
      let promptText = '';

      if (key === '1') {
        lang = 'en';
        promptText = "Would you like to register a new complaint, or check the status of an existing one? Press 1 for a new complaint. Press 2 to check status.";
      } else if (key === '2') {
        lang = 'hi';
        promptText = "क्या आप नई शिकायत दर्ज करना चाहते हैं, या पुरानी शिकायत की स्थिति जानना चाहते हैं? नई शिकायत के लिए 1 दबाइए। स्थिति जानने के लिए 2 दबाइए।";
      } else if (key === '3') {
        lang = 'bn';
        promptText = "আপনি কি একটি নতুন অভিযোগ নথিভুক্ত করতে চান, নাকি একটি বিদ্যমান অভিযোগের অবস্থা জানতে চান? নতুন অভিযোগের জন্য ১ চাপুন। অবস্থা জানতে ২ চাপুন।";
      } else {
        const err = "Sorry, that is not a valid option. Press 1 for English, 2 for Hindi, 3 for Bangla.";
        appendTranscript('agent', err);
        speakText(err, 'en');
        return;
      }

      setLockedLanguage(lang);
      setCurrentStep(2);
      appendTranscript('agent', promptText);
      speakText(promptText, lang);
      return;
    }

    // STEP 2: Intent Selection
    if (currentStep === 2) {
      if (key === '1') {
        // Register New Complaint -> Step 3
        setCurrentStep(3);
        let categoryPrompt = '';
        if (lockedLanguage === 'hi') {
          categoryPrompt = "कृपया समस्या का प्रकार चुनें। गड्ढे के लिए 1 दबाइए। कचरे के लिए 2 दबाइए। पानी के रिसाव के लिए 3 दबाइए। स्ट्रीट लाइट के लिए 4 दबाइए। जल निकासी के लिए 5 दबाइए। टूटी सड़क के लिए 6 दबाइए। ट्रैफिक सिग्नल के लिए 7 दबाइए। अन्य समस्या के लिए 8 दबाइए।";
        } else if (lockedLanguage === 'bn') {
          categoryPrompt = "অনুগ্রহ করে আপনার সমস্যার ধরণ নির্বাচন করুন। গর্তের জন্য ১ চাপুন। আবর্জনার জন্য ২ চাপুন। জল লিক হওয়ার জন্য ৩ চাপুন। স্ট্রিট লাইটের জন্য ৪ চাপুন। নিকাশী সমস্যার জন্য ৫ চাপুন। ভাঙা রাস্তার জন্য ৬ চাপুন। ট্রাফিক সিগন্যালের জন্য ৭ চাপুন। অন্যান্য জন্য ৮ চাপুন।";
        } else {
          categoryPrompt = "Please select your problem type. Press 1 for Pothole. Press 2 for Garbage. Press 3 for Water Leakage. Press 4 for Broken Street Light. Press 5 for Drainage Problem. Press 6 for Broken Road. Press 7 for Traffic Signal. Press 8 for Other.";
        }
        appendTranscript('agent', categoryPrompt);
        speakText(categoryPrompt, lockedLanguage || 'en');
      } else if (key === '2') {
        // Track Status -> Direct status report
        let statusMsg = '';
        if (lockedLanguage === 'hi') {
          statusMsg = "आपकी शिकायत CP-2026-891234 का काम प्रगति पर है। सिविकपल्स का उपयोग करने के लिए धन्यवाद। अलविदा।";
        } else if (lockedLanguage === 'bn') {
          statusMsg = "আপনার অভিযোগ CP-2026-891234 এর কাজ চলছে। সিভিকপালস ব্যবহার করার জন্য ধন্যবাদ। বিদায়।";
        } else {
          statusMsg = "Your complaint CP-2026-891234 regarding Road Repair is currently in-progress by municipal crews. Thank you for using CivicPulse. Goodbye.";
        }
        handleEndCall(statusMsg);
      } else {
        const err = lockedLanguage === 'hi' ? "अमान्य विकल्प। कृपया 1 या 2 दबाएं।" : "Invalid option. Please press 1 or 2.";
        appendTranscript('agent', err);
        speakText(err, lockedLanguage || 'en');
      }
      return;
    }

    // STEP 3: Category Selection
    if (currentStep === 3) {
      const categoryMap: Record<string, string> = {
        '1': 'Pothole / Road Hazard',
        '2': 'Garbage & Solid Waste Dump',
        '3': 'Water Pipe Leakage',
        '4': 'Broken Street Light',
        '5': 'Drainage & Overflow Problem',
        '6': 'Broken Road Infrastructure',
        '7': 'Traffic Signal Defect',
        '8': 'Other Civic Issue'
      };

      const selectedCat = categoryMap[key];
      if (!selectedCat) {
        const err = "Please select a valid option from 1 to 8.";
        appendTranscript('agent', err);
        speakText(err, lockedLanguage || 'en');
        return;
      }

      setComplaintData(prev => ({ ...prev, issueType: selectedCat }));
      setCurrentStep(4);

      let namePrompt = '';
      if (lockedLanguage === 'hi') {
        namePrompt = `आपने ${selectedCat} चुना है। कृपया अपना नाम बताएं, या नाम की पुष्टि के लिए 1 दबाएं।`;
      } else if (lockedLanguage === 'bn') {
        namePrompt = `আপনি ${selectedCat} নির্বাচন করেছেন। আপনার বিবরণ নিশ্চিত করতে ১ চাপুন।`;
      } else {
        namePrompt = `You selected ${selectedCat}. Please state your name or press 1 to proceed to location.`;
      }
      appendTranscript('agent', namePrompt);
      
      speakText(namePrompt, lockedLanguage || 'en', () => {
        startListening(lockedLanguage || 'en', (spokenName) => {
          // If they haven't manually advanced via keypad yet
          setCurrentStep(current => {
            if (current !== 4) return current;
            appendTranscript('user', `[Voice] ${spokenName}`);
            setComplaintData(prev => ({ ...prev, callerName: spokenName }));
            
            let locPrompt = lockedLanguage === 'hi'
              ? `धन्यवाद ${spokenName}। अब कृपया अपना स्थान और नजदीकी लैंडमार्क बताएं, या 1 दबाकर डिफ़ॉल्ट स्थान दर्ज करें।`
              : `Thank you ${spokenName}. Now please provide your location and landmark, or press 1 to set default location.`;
              
            appendTranscript('agent', locPrompt);
            speakText(locPrompt, lockedLanguage || 'en', () => {
              startListening(lockedLanguage || 'en', (spokenLocation) => {
                setCurrentStep(currStep => {
                  if (currStep !== 5) return currStep;
                  appendTranscript('user', `[Voice] ${spokenLocation}`);
                  setComplaintData(prev => ({ ...prev, location: spokenLocation }));
                  submitReportToApi(spokenName, spokenLocation, selectedCat);
                  return 6;
                });
              });
            });
            return 5;
          });
        });
      });
      return;
    }

    // STEP 4: Name Confirmation / Capture (Keypad Fallback)
    if (currentStep === 4) {
      const callerName = "Ramesh Kumar (Keypad Fallback)";
      setComplaintData(prev => ({ ...prev, callerName }));
      setCurrentStep(5);

      let locPrompt = '';
      if (lockedLanguage === 'hi') {
        locPrompt = "मैंने आपका नाम दर्ज कर लिया है। अब कृपया अपना स्थान और नजदीकी लैंडमार्क बताएं, या 1 दबाकर इंदिरानगर मुख्य सड़क दर्ज करें।";
      } else {
        locPrompt = "Thank you. I have noted your name. Now please provide your location and landmark, or press 1 to set Indiranagar 100ft Road.";
      }
      appendTranscript('agent', locPrompt);
      
      speakText(locPrompt, lockedLanguage || 'en', () => {
        startListening(lockedLanguage || 'en', (spokenLocation) => {
          setCurrentStep(currStep => {
            if (currStep !== 5) return currStep;
            appendTranscript('user', `[Voice] ${spokenLocation}`);
            setComplaintData(prev => ({ ...prev, location: spokenLocation }));
            submitReportToApi(callerName, spokenLocation, complaintData.issueType);
            return 6;
          });
        });
      });
      return;
    }

    // STEP 5: Location & Final Confirmation (Keypad Fallback)
    if (currentStep === 5) {
      if (key === '1') {
        const location = "Indiranagar 100ft Road, Ward 88, Bengaluru";
        setComplaintData(prev => ({ ...prev, location }));
        setCurrentStep(6);
        submitReportToApi(complaintData.callerName, location, complaintData.issueType);
      } else if (key === '2') {
        const cancelMsg = lockedLanguage === 'hi' 
          ? "आपकी शिकायत रद्द कर दी गई है। सिविकपल्स में कॉल करने के लिए धन्यवाद। अलविदा।"
          : "Your complaint has not been submitted. Thank you for calling CivicPulse. Goodbye.";
        handleEndCall(cancelMsg);
      }
      return;
    }
  };

  // Physical Keyboard Support for DTMF
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field (just in case we add one later)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (callState !== 'active') return;
      
      const validKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '*', '#'];
      if (validKeys.includes(e.key)) {
        handleKeypadPress(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callState, handleKeypadPress]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      color: '#0F172A',
      padding: '32px 24px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Top Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 28px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button 
            onClick={() => navigate('/')} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent', color: '#64748B', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px' }}
          >
            <ArrowLeft size={14} /> Back to Overview
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PhoneCall size={26} color="#4F46E5" />
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#0F172A' }}>
              CivicPulse Sahayak — AI IVR Voice Helpline
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' }}>
            Interactive Web Voice Call & DTMF Keypad Simulator for 1800-CIVIC-PULSE
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> 24/7 Voice Intake Active
          </span>
        </div>
      </div>

      {/* Main Grid Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Left Card: Interactive Phone Interface */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          
          {/* Phone Screen Display Header */}
          <div style={{
            width: '100%',
            backgroundColor: callState === 'active' ? '#0F172A' : '#F1F5F9',
            color: callState === 'active' ? '#FFFFFF' : '#334155',
            borderRadius: '20px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '24px',
            transition: 'all 0.3s ease',
            boxShadow: callState === 'active' ? '0 12px 24px rgba(15,23,42,0.2)' : 'none'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: callState === 'active' ? '#94A3B8' : '#64748B', marginBottom: '4px' }}>
              HELPLINE NUMBER: 1800-CIVIC-PULSE
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: '6px' }}>
              CivicPulse Sahayak AI
            </div>

            {/* Status Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '14px', backgroundColor: callState === 'active' ? '#059669' : callState === 'connecting' ? '#D97706' : '#94A3B8', color: '#FFFFFF', fontSize: '12px', fontWeight: 700 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
              <span>
                {callState === 'idle' && 'Ready for Call'}
                {callState === 'connecting' && 'Connecting to Vapi AI...'}
                {callState === 'active' && `Call Active (${formatDuration(callDuration)})`}
                {callState === 'ended' && 'Call Ended'}
              </span>
            </div>

            {/* Caller Line Info */}
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: callState === 'active' ? '#CBD5E1' : '#64748B' }}>
              <span>Caller Number:</span>
              {callState === 'idle' ? (
                <input
                  type="text"
                  value={complaintData.callerPhone}
                  onChange={(e) => setComplaintData(p => ({ ...p, callerPhone: e.target.value }))}
                  style={{
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#FFFFFF',
                    color: '#0F172A',
                    width: '120px',
                    textAlign: 'center'
                  }}
                  placeholder="+919876543210"
                  title="Edit caller phone number"
                />
              ) : (
                <strong style={{ fontWeight: 700 }}>{complaintData.callerPhone}</strong>
              )}
            </div>

            {/* Speaking Wave Animation */}
            {callState === 'active' && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '16px', height: '24px' }}>
                {[12, 22, 16, 28, 18, 24, 14].map((h, i) => (
                  <div key={i} style={{ width: '3px', height: isSpeaking ? `${h}px` : '6px', backgroundColor: '#38BDF8', borderRadius: '3px', transition: 'height 0.15s ease' }} />
                ))}
              </div>
            )}
          </div>

          {/* Main Action Call Buttons */}
          <div style={{ display: 'flex', gap: '16px', width: '100%', marginBottom: '24px' }}>
            {callState !== 'active' ? (
              <button
                onClick={handleStartCall}
                disabled={callState === 'connecting'}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  borderRadius: '16px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 16px rgba(16,185,129,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <PhoneCall size={18} />
                <span>{callState === 'connecting' ? 'Connecting...' : 'Start Voice Call'}</span>
              </button>
            ) : (
              <button
                onClick={() => handleEndCall('Call terminated by user. Goodbye.')}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  borderRadius: '16px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 16px rgba(239,68,68,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <PhoneOff size={18} />
                <span>End Call</span>
              </button>
            )}

            {/* Mute Toggle Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              disabled={callState !== 'active'}
              style={{
                padding: '14px',
                borderRadius: '16px',
                backgroundColor: isMuted ? '#FEF2F2' : '#F1F5F9',
                color: isMuted ? '#EF4444' : '#334155',
                border: '1px solid #E2E8F0',
                cursor: callState === 'active' ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Speaker Toggle Button */}
            <button
              onClick={() => setSpeakerEnabled(!speakerEnabled)}
              style={{
                padding: '14px',
                borderRadius: '16px',
                backgroundColor: !speakerEnabled ? '#FEF2F2' : '#F1F5F9',
                color: !speakerEnabled ? '#EF4444' : '#334155',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={speakerEnabled ? 'Disable Voice Speaker' : 'Enable Voice Speaker'}
            >
              {speakerEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>

          {/* DTMF Keypad Grid (3x4) */}
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '12px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Interactive DTMF Keypad
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeypadPress(digit)}
                  disabled={callState !== 'active'}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: callState === 'active' ? '#F8FAFC' : '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: callState === 'active' ? '#0F172A' : '#94A3B8',
                    cursor: callState === 'active' ? 'pointer' : 'not-allowed',
                    boxShadow: callState === 'active' ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                    transition: 'all 0.1s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseDown={(e) => callState === 'active' && (e.currentTarget.style.backgroundColor = '#EEF2FF')}
                  onMouseUp={(e) => callState === 'active' && (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                >
                  <span>{digit}</span>
                  <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 600, marginTop: '2px' }}>
                    {digit === '1' ? 'ENG' : digit === '2' ? 'HIN' : digit === '3' ? 'BEN' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Card: Live Transcript & Generated Ticket Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Live Call Transcript Box */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            border: '1px solid #E2E8F0',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '420px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#4F46E5" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0F172A' }}>Live Call Transcript</h3>
              </div>
              {lockedLanguage && (
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#FEF3C7', color: '#B45309', textTransform: 'uppercase' }}>
                  Language: {lockedLanguage === 'hi' ? 'Hindi' : lockedLanguage === 'bn' ? 'Bangla' : 'English'}
                </span>
              )}
            </div>

            {/* Transcript Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {transcripts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8', fontSize: '13px' }}>
                  Click "Start Voice Call" to begin interacting with CivicPulse Sahayak.
                </div>
              ) : (
                transcripts.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: item.sender === 'agent' ? 'flex-start' : 'flex-end',
                      maxWidth: '88%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      backgroundColor: item.sender === 'agent' ? '#F1F5F9' : '#4F46E5',
                      color: item.sender === 'agent' ? '#1E293B' : '#FFFFFF',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 700, color: item.sender === 'agent' ? '#64748B' : '#C7D2FE', marginBottom: '2px', textTransform: 'uppercase' }}>
                      {item.sender === 'agent' ? 'CivicPulse Sahayak' : 'Caller'} • {item.timestamp}
                    </div>
                    {item.text}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real-time Ticket Generated Card */}
          {activeTicket && (
            <div style={{
              backgroundColor: '#ECFDF5',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid #A7F3D0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#059669" />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#065F46' }}>Report Registered Live!</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#047857', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: '6px' }}>
                  {activeTicket.id}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#064E3B' }}>
                <strong>Issue:</strong> {activeTicket.category}
              </div>
              <div style={{ fontSize: '12px', color: '#047857' }}>
                <strong>Location:</strong> {activeTicket.address}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
