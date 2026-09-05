/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage, fetchWithAuth } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, increment, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { awardPoints, createNotification } from '../utils/pointsEngine';
import { 
  Camera, MapPin, Loader, AlertTriangle, CheckCircle, 
  Lightbulb, Droplet, Trash2, HelpCircle, Mic, RefreshCw, Video, Eye,
  BookOpen, Heart, Landmark, Zap, Compass, Briefcase, Award, Trees, Globe, Sparkles, Check, ChevronRight, ChevronLeft, ShieldAlert
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ReportPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user, profile, refreshProfile } = useAuth();

  // Map and Marker Refs for OpenFreeMap
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to report a community issue.");
      navigate('/');
    }
  }, [user, navigate]);

  // Handle passed location state from Map right-click
  const passedLocation = routerLocation.state as { lat?: number; lng?: number } | null;

  // Dual submission mode: 'problem' or 'suggestion'
  const [mode, setMode] = useState<'problem' | 'suggestion'>(() => {
    const state = routerLocation.state as { mode?: 'problem' | 'suggestion' } | null;
    return state?.mode || 'suggestion';
  });

  useEffect(() => {
    const state = routerLocation.state as { mode?: 'problem' | 'suggestion' } | null;
    if (state?.mode) {
      setMode(state.mode);
    }
  }, [routerLocation.state]);

  // Progressive steps wizard
  const [currentStep, setCurrentStep] = useState(1);

  // Success screen state
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Form States
  const [image, setImage] = useState<string | null>(null); // base64 representation
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('pothole');
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState('');

  // Multilingual & Semantic Fields
  const [descriptionOriginal, setDescriptionOriginal] = useState('');
  const [descriptionEnglish, setDescriptionEnglish] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('English');
  const [aiCategory, setAiCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [theme, setTheme] = useState('');
  const [classificationTier, setClassificationTier] = useState<'edge' | 'cloud' | 'fallback' | null>(null);
  const [tierModel, setTierModel] = useState<string>('');

  // Live Scan States
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [liveClass, setLiveClass] = useState<string | null>(null);
  const [liveSeverity, setLiveSeverity] = useState<number | null>(null);
  const [liveConfidence, setLiveConfidence] = useState<number | null>(null);
  const [liveAnalyzing, setLiveAnalyzing] = useState(false);
  const [isCameraBlocked, setIsCameraBlocked] = useState(false);

  // Voice States
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceCleaning, setVoiceCleaning] = useState(false);
  const [showVoiceSimulation, setShowVoiceSimulation] = useState(false);
  const [customVoiceDraft, setCustomVoiceDraft] = useState('');
  
  // Location
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [gpsError, setGpsError] = useState(false);          // true = GPS blocked, but fallback is active
  const [gpsFallbackActive, setGpsFallbackActive] = useState(false); // true = fallback coords locked
  const [showPresetLocation, setShowPresetLocation] = useState(false);

  // Validation
  const [validationError, setValidationError] = useState<string | null>(null);
  const [aiAssessment, setAiAssessment] = useState<string | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [estDays, setEstDays] = useState(5);

  const PRESET_CHECKPOINTS = [
    { name: "Ward Center Crossing", lat: 12.9362, lng: 77.6255, address: "80 Feet Rd, Municipal Ward 151, City Center" },
    { name: "Metro Station Transit Hub", lat: 12.9718, lng: 77.6385, address: "100 Feet Rd, Stage 2, Municipal Ward 80" },
    { name: "Commercial IT Corridor", lat: 12.9698, lng: 77.7499, address: "Tech Park Main Rd, Municipal Ward 84" },
    { name: "Sector 2 Residential Ring", lat: 12.9112, lng: 77.6482, address: "Sector 2, Outer Ring Connection, Municipal Ward 174" }
  ];

  const MOCK_SPEECH_TEMPLATES = [
    {
      label: "Dangerous Pothole",
      text: "Yeah, there is a really deep and wide pothole right in the center of the main road crossing. It's filled with rainwater and multiple bikes have slipped on it already."
    },
    {
      label: "Burnt-out Streetlights",
      text: "The whole lane of streetlights near the public park has been completely dark for four nights. It's totally unsafe for female joggers and kids returning home."
    },
    {
      label: "Garbage Dump Block",
      text: "Some commercial trucks dumped a huge pile of unsegregated wet waste and trash on our walking sidewalk. Dogs are spreading it around and the smell is terrible."
    },
    {
      label: "Burst Water Pipe",
      text: "There is a massive water pipeline burst near the bus station. Fresh drinking water is spraying out and flooding the main avenue road for hours."
    }
  ];

  const SCAN_PRESETS = [
    {
      title: "Active Road Pothole",
      category: "pothole",
      desc: "Deep physical road distress and pothole causing severe hazard to vehicles.",
      severity: 5,
      url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
      icon: "🕳️"
    },
    {
      title: "Broken Streetlight Bulb",
      category: "streetlight",
      desc: "High priority dark spot - public streetlight has bulb failure.",
      severity: 3,
      url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=600",
      icon: "💡"
    },
    {
      title: "Uncollected Public Waste",
      category: "waste",
      desc: "Overflowing commercial wet waste pile blocking public walking pathway.",
      severity: 4,
      url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=600",
      icon: "🗑️"
    },
    {
      title: "Burst Drinking Water Line",
      category: "water",
      desc: "High pressure pipeline leakage flooding the municipal road layout.",
      severity: 3,
      url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600",
      icon: "💧"
    }
  ];

  // Suggestion specific presets
  const SUGGESTION_PRESETS = [
    {
      title: "Smart Classroom Upgrade",
      category: "Education",
      desc: "Proposal to upgrade the neighborhood primary school with modern digital boards and learning kits.",
      severity: 3,
      url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600",
      icon: "📚"
    },
    {
      title: "Community Clinic Addition",
      category: "Healthcare",
      desc: "A proposal to set up a primary health and maternity welfare clinic inside the local ward office grounds.",
      severity: 4,
      url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600",
      icon: "🏥"
    },
    {
      title: "Solar Grid Power Walkway",
      category: "Electricity",
      desc: "Installing high-efficiency solar panels above public walking walkways to generate renewable municipal grid power.",
      severity: 3,
      url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=600",
      icon: "☀️"
    }
  ];

  // Sync category default when mode changes
  useEffect(() => {
    if (mode === 'suggestion') {
      setCategory('Roads');
    } else {
      setCategory('pothole');
    }
  }, [mode]);

  // Helper for cleaning speech / raw text with translation
  const processCleanVoice = async (resultText: string) => {
    setVoiceCleaning(true);
    try {
      const res = await fetchWithAuth('/api/agents/clean-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: resultText, mode })
      });
      const data = await res.json();
      
      if (data.type === 'DEVELOPMENT_NEED' && mode === 'problem') {
        setMode('suggestion');
      } else if (data.type === 'CIVIC_ISSUE' && mode === 'suggestion') {
        setMode('problem');
      }

      setTitle(data.title || (mode === 'suggestion' ? "Suggested Opportunity" : "Reported Civic Hazard"));
      setDescription(data.description_english || data.description_original || resultText);
      setDescriptionOriginal(data.description_original || resultText);
      setDescriptionEnglish(data.description_english || resultText);
      setDetectedLanguage(data.detectedLanguage || 'English');
      setCategory(data.category || (mode === 'suggestion' ? 'Other' : 'pothole'));
      setAiCategory(data.category || '');
      setDepartment(data.department || '');
      setSeverity(data.priority || 3);
      setConfidence(data.confidence || 0.82);
      setKeywords(data.keywords || []);
      setTheme(data.theme || '');
      setAiTags(data.keywords || []);
      toast.success(`Voice transcript (${data.detectedLanguage || 'Multilingual'}) triaged as ${data.type || 'Civic Request'}!`);
    } catch (err) {
      console.error("Failed to clean voice input:", err);
      setDescription(resultText);
      setDescriptionOriginal(resultText);
      setDescriptionEnglish(resultText);
      toast.success("Raw description updated with transcript.");
    } finally {
      setVoiceCleaning(false);
      setShowVoiceSimulation(false);
    }
  };

  // Speech Recognition Handler
  const startVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition is restricted or unsupported. Opening Voice Simulator.");
      setShowVoiceSimulation(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setVoiceActive(true);
      setVoiceTranscript('Listening...');
      toast('Voice input active. Speak now...', { icon: '🎙️' });
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
      setVoiceActive(false);
      toast.error("Microphone blocked or not permitted in iframe. Opening Voice Simulator.");
      setShowVoiceSimulation(true);
    };

    recognition.onend = () => {
      setVoiceActive(false);
    };

    recognition.onresult = async (event: any) => {
      const resultText = event.results[0][0].transcript;
      setVoiceTranscript(resultText);
      processCleanVoice(resultText);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech:", err);
      setShowVoiceSimulation(true);
    }
  };

  // Camera Handlers
  const startCamera = async () => {
    setIsCameraBlocked(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("navigator.mediaDevices.getUserMedia is undefined");
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setCameraActive(true);
      toast.success("Live scan camera active!");
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraActive(true);
      setIsCameraBlocked(true);
      toast("Camera blocked inside iframe. Running high-fidelity AI simulation scanner.", { icon: '👁️' });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setIsCameraBlocked(false);
  };

  const handleSimulateScan = (preset: any) => {
    setAnalyzing(true);
    setImagePreview(preset.url);
    setImage(preset.url);
    setTimeout(() => {
      setTitle(preset.title);
      setDescription(preset.desc);
      setCategory(preset.category);
      setSeverity(preset.severity);
      
      // Seed pre-filled values
      setDescriptionOriginal(preset.desc);
      setDescriptionEnglish(preset.desc);
      setDetectedLanguage("English");
      setAiCategory(preset.category);
      setDepartment(mode === 'suggestion' ? "Department of Community Development" : "Municipal Public Works");
      setConfidence(0.95);
      setTheme(preset.category);
      setKeywords([preset.category, "community"]);
      
      setAiAssessment(`AI Automated Scan Successful. Located matching visual markers for: "${preset.category}".`);
      setEstDays(preset.category === 'pothole' ? 4 : preset.category === 'waste' ? 1 : 3);
      setAnalyzing(false);
      toast.success(`Detected: ${preset.title}! Click Next.`);
      stopCamera();
    }, 1500);
  };

  const captureFrame = () => {
    if (!cameraActive) return;

    if (!isCameraBlocked) {
      const video = document.getElementById('scan-video') as HTMLVideoElement;
      if (video && stream) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setImagePreview(dataUrl);
          const base64Data = dataUrl.split(',')[1];
          setImage(base64Data);
          triggerVisionAgent(base64Data);
        }
        stopCamera();
        return;
      }
    }

    // Fallback if camera completely blocked and capture clicked
    const activePresets = mode === 'suggestion' ? SUGGESTION_PRESETS : SCAN_PRESETS;
    const randomPreset = activePresets[Math.floor(Math.random() * activePresets.length)];
    handleSimulateScan(randomPreset);
  };

  useEffect(() => {
    if (!cameraActive || isCameraBlocked) return;

    const interval = setInterval(async () => {
      const video = document.getElementById('scan-video') as HTMLVideoElement;
      let frameBase64 = '';

      if (video && stream) {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frameBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
        }
      }

      if (frameBase64) {
        setLiveAnalyzing(true);
        try {
          const res = await fetchWithAuth('/api/agents/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: frameBase64, mode })
          });
          const data = await res.json();
          setLiveClass(data.category);
          setLiveSeverity(data.severity);
          setLiveConfidence(data.confidence || 0.88);
        } catch (err) {
          console.error("Live analysis failed:", err);
        } finally {
          setLiveAnalyzing(false);
        }
      } else {
        setLiveAnalyzing(true);
        setTimeout(() => {
          const problemCategories = ['pothole', 'streetlight', 'waste', 'water'];
          const suggestionCategories = ['Education', 'Healthcare', 'Roads', 'Water', 'Electricity'];
          const cats = mode === 'suggestion' ? suggestionCategories : problemCategories;
          setLiveClass(cats[Math.floor(Math.random() * cats.length)]);
          setLiveSeverity(Math.floor(Math.random() * 4) + 2);
          setLiveConfidence(parseFloat((0.75 + Math.random() * 0.2).toFixed(2)));
          setLiveAnalyzing(false);
        }, 1200);
      }
    }, 3500);

    return () => {
      clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive, stream, isCameraBlocked, mode]);

  // Geocoding helper
  const triggerReverseGeocode = async (latitude: number, longitude: number) => {
    setGeocoding(true);
    try {
      const res = await fetchWithAuth(`/api/geocode?lat=${latitude}&lng=${longitude}`);
      const data = await res.json();
      if (data.address) {
        setAddress(data.address);
      } else {
        setAddress(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      setAddress(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
    } finally {
      setGeocoding(false);
    }
  };

  // Helper to fetch geolocation based on IP address via server proxy
  const fetchIPLocation = async () => {
    setGeocoding(true);
    try {
      const response = await fetchWithAuth('/api/ip-location');
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          const latitude = Number(data.latitude);
          const longitude = Number(data.longitude);
          setLat(latitude);
          setLng(longitude);
          setGpsFallbackActive(true);
          setGpsError(false);
          
          let ipAddress = "";
          if (data.cityName) ipAddress += data.cityName;
          if (data.regionName) ipAddress += (ipAddress ? ", " : "") + data.regionName;
          if (data.countryName) ipAddress += (ipAddress ? ", " : "") + data.countryName;
          if (!ipAddress) ipAddress = "IP-based location";
          
          setAddress(ipAddress);
          await triggerReverseGeocode(latitude, longitude);
          setGeocoding(false);
          return true;
        }
      }
    } catch (err) {
      console.error("Server IP location fetch failed:", err);
    }
    setGeocoding(false);
    return false;
  };

  // Trigger Geocoding if lat/lng is preset, or fallback to default coordinates
  useEffect(() => {
    if (passedLocation?.lat && passedLocation?.lng) {
      setLat(passedLocation.lat);
      setLng(passedLocation.lng);
      triggerReverseGeocode(passedLocation.lat, passedLocation.lng);
    } else if (!lat && !lng) {
      setLat(12.9362);
      setLng(77.6255);
      setAddress("80 Feet Rd, Municipal Ward 151, City Center");
    }
  }, [passedLocation]);

  // Initialize and sync OpenFreeMap
  useEffect(() => {
    if (!lat || !lng || !mapContainerRef.current) {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error(e);
        }
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    if (!mapRef.current) {
      try {
        const mapInstance = new maplibregl.Map({
          container: mapContainerRef.current,
          style: {
            version: 8,
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: [
                  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors'
              }
            },
            layers: [
              {
                id: 'osm-tiles-layer',
                type: 'raster',
                source: 'osm-tiles',
                minzoom: 0,
                maxzoom: 19
              }
            ]
          } as any,
          center: [lng, lat],
          zoom: 14,
          pitch: 0,
          bearing: 0
        });

        mapRef.current = mapInstance;

        mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

        const markerColor = mode === 'suggestion' ? '#F59E0B' : '#E11D48';
        const marker = new maplibregl.Marker({ color: markerColor })
          .setLngLat([lng, lat])
          .addTo(mapInstance);
        markerRef.current = marker;

        mapInstance.on('click', (e) => {
          const { lat: clickLat, lng: clickLng } = e.lngLat;
          setLat(clickLat);
          setLng(clickLng);
          setGpsFallbackActive(false);
          setShowPresetLocation(false);
          triggerReverseGeocode(clickLat, clickLng);
        });
      } catch (err) {
        console.error("Failed to initialize OpenFreeMap:", err);
      }
    } else {
      try {
        mapRef.current.easeTo({
          center: [lng, lat],
          duration: 800
        });
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        }
      } catch (err) {
        console.error("Failed to update OpenFreeMap center:", err);
      }
    }
  }, [lat, lng, mode]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error(e);
        }
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Get current position
  const useMyLocation = () => {
    setGeocoding(true);
    setGpsError(false);
    setGpsFallbackActive(false);

    const applyFallback = async (blocked: boolean) => {
      const ipSuccess = await fetchIPLocation();
      if (ipSuccess) {
        setShowPresetLocation(false);
        toast.success("Approximate location locked successfully!");
        return;
      }

      setLat(12.9362);
      setLng(77.6255);
      setAddress("80 Feet Rd, Municipal Ward 151, City Center");
      setGpsError(false);
      setGpsFallbackActive(true);
      setShowPresetLocation(true);
      setGeocoding(false);
      if (blocked) {
        toast("GPS access blocked. Standard city center fallback coordinates locked successfully.", { icon: '📍' });
      } else {
        toast("GPS unavailable in this environment. Ward center fallback coordinates locked successfully.", { icon: '📍' });
      }
    };

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      applyFallback(false);
      return;
    }

    const tryGetPosition = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setLat(latitude);
          setLng(longitude);
          setGpsFallbackActive(false);
          setGpsError(false);
          setShowPresetLocation(false);
          triggerReverseGeocode(latitude, longitude);
          setGeocoding(false);
          toast.success("GPS Lock Established!");
        },
        (error) => {
          console.error(`Geolocation error (highAccuracy: ${highAccuracy}):`, error);
          if (highAccuracy && error.code === 3) {
            console.log("High-accuracy timed out. Retrying with standard accuracy...");
            tryGetPosition(false);
          } else {
            applyFallback(error.code === 1);
          }
        },
        { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 5000 : 8000, maximumAge: 30000 }
      );
    };

    tryGetPosition(true);
  };

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Process and convert file to Base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file (PNG/JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      
      const rawBase64 = base64String.split(',')[1];
      setImage(rawBase64);
      triggerVisionAgent(rawBase64);
    };
    reader.readAsDataURL(file);
  };

  // Call vision agent proxy route
  const triggerVisionAgent = async (base64Data: string) => {
    setAnalyzing(true);
    setValidationError(null);
    setAiAssessment(null);
    try {
      const response = await fetchWithAuth('/api/agents/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, mode })
      });
      const data = await response.json();

      if (!data.isValidCivicIssue) {
        setValidationError(data.invalidReason || "Verification failed. Please upload a clear photo of public property or infrastructure.");
        setImage(null);
        setImagePreview(null);
        toast.error("Vision Analysis Rejected: Non-civic context.");
      } else {
        setTitle(data.title || '');
        setCategory(data.category || (mode === 'suggestion' ? 'Roads' : 'pothole'));
        setSeverity(data.severity || 3);
        setAiAssessment(data.severityReason || '');
        setAiTags(data.tags || []);
        setEstDays(data.estimatedResolutionDays || 5);

        // Map multilingual semantic properties
        setDescriptionOriginal(data.description_original || data.description || description || '');
        setDescriptionEnglish(data.description_english || data.description || description || '');
        setDetectedLanguage(data.detectedLanguage || 'English');
        setAiCategory(data.category || '');
        setDepartment(data.department || '');
        setConfidence(data.confidence || 0.92);
        setKeywords(data.tags || []);
        setTheme(data.theme || '');
        
        toast.success("AI Triage & Verification Complete! Click 'Next Step'.");
      }
    } catch (error) {
      console.error("AI vision classification failed:", error);
      toast.error("AI triage unavailable. Fill details manually.");
      setTitle(mode === 'suggestion' ? "Suggested Public Project" : "Reported Civic Hazard");
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview || !lat || !lng || !address) {
      toast.error("Please complete the image verification and set a valid location.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = mode === 'suggestion' 
        ? "https://picsum.photos/seed/proposal/800/600" 
        : "https://picsum.photos/seed/reported/800/600";

      // 1. Upload photo to Firebase Storage if fully configured
      try {
        const imageId = `${mode === 'suggestion' ? 'suggestion' : 'issue'}_${Date.now()}`;
        const storageRef = ref(storage, `${mode === 'suggestion' ? 'suggestions' : 'issues'}/${imageId}.jpg`);
        await uploadString(storageRef, imagePreview, 'data_url');
        imageUrl = await getDownloadURL(storageRef);
      } catch (storageErr) {
        console.error("Storage upload failed (using fallback image URL):", storageErr);
      }

      // Pre-submit triage fallback if values are missing (e.g. manually typed, skipped vision)
      let finalTitle = title;
      let finalDescOriginal = descriptionOriginal || description;
      let finalDescEnglish = descriptionEnglish || description;
      let finalDetectedLanguage = detectedLanguage;
      let finalCategory = category;
      let finalAiCategory = aiCategory || category;
      let finalDepartment = department;
      let finalPriority = severity;
      let finalConfidence = confidence || 0.85;
      let finalKeywords = keywords.length > 0 ? keywords : aiTags;
      let finalTheme = theme;
      let usedTier: 'edge' | 'cloud' | 'fallback' = 'cloud';
      let usedModel = 'gemini-2.5-flash';

      // Always perform sovereign tiered classification (Edge Gemma 3n → Cloud Gemini → Deterministic)
      try {
        const tierRes = await fetch('/api/infer/tiered', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: description || title })
        });
        if (tierRes.ok) {
          const tierData = await tierRes.json();
          usedTier = tierData.tier;
          usedModel = tierData.model;
          setClassificationTier(tierData.tier);
          setTierModel(tierData.model);

          if (tierData.result?.cleanedDescription) {
            finalDescEnglish = tierData.result.cleanedDescription;
          }
          if (tierData.result?.category && !category) {
            finalCategory = tierData.result.category;
          }
          if (tierData.result?.urgency) {
            finalPriority = Math.min(5, Math.max(1, Math.round(tierData.result.urgency / 20)));
          }
        }
      } catch (tierErr) {
        console.warn("[ReportPage] Tiered inference check skipped:", tierErr);
      }

      if (!finalDepartment) {
        try {
          const res = await fetchWithAuth('/api/agents/clean-voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: description, mode })
          });
          if (res.ok) {
            const data = await res.json();
            finalTitle = title || data.title;
            finalDescOriginal = data.description_original || description;
            finalDescEnglish = data.description_english || description;
            finalDetectedLanguage = data.detectedLanguage || 'English';
            finalCategory = category || data.category;
            finalAiCategory = data.category;
            finalDepartment = data.department;
            finalPriority = data.priority || severity;
            finalConfidence = data.confidence || 0.85;
            finalKeywords = data.keywords || [];
            finalTheme = data.theme;
          }
        } catch (err) {
          console.error("Auto-triage on submit failed:", err);
        }
      }

      let docId = '';

      if (mode === 'suggestion') {
        // Write proposal to 'suggestions' collection
        const suggestionData = {
          type: 'DEVELOPMENT_NEED' as const,
          title: finalTitle,
          description_original: finalDescOriginal,
          description_english: finalDescEnglish,
          category: finalCategory,
          aiCategory: finalAiCategory,
          department: finalDepartment || "Department of Community Development",
          confidence: finalConfidence,
          priority: finalPriority,
          location: {
            lat,
            lng,
            address
          },
          lat,
          lng,
          address,
          images: [imageUrl],
          imageUrl,
          language: finalDetectedLanguage,
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          userId: user?.uid || 'anonymous',
          reporterName: profile?.displayName || 'Citizen Warden',
          upvotes: [],
          status: 'suggested'
        };

        const docRef = await addDoc(collection(db, 'suggestions'), suggestionData);
        docId = docRef.id;

        if (user?.uid) {
          await awardPoints(user.uid, 50, 'Suggested new development idea');
          
          // Increment suggestion counts on user profile
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentBadges = userData.badges || [];
            const currentCount = (userData.suggestionsSubmitted || 0) + 1;
            const updates: any = { suggestionsSubmitted: currentCount };
            
            if (!currentBadges.includes('Visionary Scholar')) {
              updates.badges = arrayUnion('Visionary Scholar');
              await awardPoints(user.uid, 50, 'Badge Unlocked: Visionary Scholar');
            }
            await updateDoc(userRef, updates);
          }

          await createNotification(
            user.uid,
            `Thank you for proposing "${finalTitle}"! +50 points awarded. Triage assigned to ${finalDepartment || 'Community Board'}.`,
            docRef.id
          );
        }

        setSubmittedData(suggestionData);
      } else {
        // Write report to 'issues' collection
        const issueData = {
          type: 'CIVIC_ISSUE' as const,
          title: finalTitle,
          description: finalDescEnglish,
          description_original: finalDescOriginal,
          description_english: finalDescEnglish,
          category: finalCategory,
          aiCategory: finalAiCategory,
          severity: finalPriority,
          severityReason: aiAssessment || "Manually reported community problem.",
          status: 'reported',
          lat,
          lng,
          address,
          imageUrl,
          reportedBy: user?.uid || 'anonymous',
          reporterName: profile?.displayName || 'Citizen Warden',
          upvotes: [],
          verified: false,
          verificationReason: '',
          aiTags: finalKeywords,
          estimatedResolutionDays: estDays,
          escalated: false,
          escalatedAt: null,
          resolvedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          language: finalDetectedLanguage,
          department: finalDepartment || "Municipal Public Works",
          confidence: finalConfidence,
          theme: finalTheme
        };

        const docRef = await addDoc(collection(db, 'issues'), issueData);
        docId = docRef.id;

        if (user?.uid) {
          await awardPoints(user.uid, 50, 'Reported new civic issue');
          
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentBadges = userData.badges || [];
            const currentReports = (userData.issuesReported || 0) + 1;
            const updates: any = { issuesReported: currentReports };
            
            if (!currentBadges.includes('First Report')) {
              updates.badges = arrayUnion('First Report');
              await awardPoints(user.uid, 50, 'Badge Unlocked: First Report');
            }
            await updateDoc(userRef, updates);
          }

          await createNotification(
            user.uid,
            `Thank you for reporting "${finalTitle}"! +50 points awarded. AI is triaging resolution timelines.`,
            docRef.id
          );
        }

        setSubmittedData(issueData);
      }

      await refreshProfile();
      toast.success(`${mode === 'suggestion' ? 'Development Proposal' : 'Civic Hazard Report'} submitted successfully!`);
      setSubmittedSuccess(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(err.message || "Failed to submit. Please check your network and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const problemCategories = [
    { id: 'pothole', label: 'Pothole / Road Distress', icon: <AlertTriangle size={16} /> },
    { id: 'streetlight', label: 'Streetlight Bulb Out', icon: <Lightbulb size={16} /> },
    { id: 'water', label: 'Water Leak / Burst', icon: <Droplet size={16} /> },
    { id: 'waste', label: 'Waste / Garbage Pile', icon: <Trash2 size={16} /> },
    { id: 'other', label: 'Other Active Hazard', icon: <HelpCircle size={16} /> }
  ];

  const suggestionCategoriesList = [
    { id: 'Education', label: 'Education / Schools', icon: <BookOpen size={16} /> },
    { id: 'Healthcare', label: 'Healthcare & Clinics', icon: <Heart size={16} /> },
    { id: 'Roads', label: 'Road Infrastructure & Paving', icon: <Compass size={16} /> },
    { id: 'Water', label: 'Water & Reservoirs', icon: <Droplet size={16} /> },
    { id: 'Electricity', label: 'Electricity & Solar', icon: <Zap size={16} /> },
    { id: 'Sanitation', label: 'Sanitation & Dustbins', icon: <Trash2 size={16} /> },
    { id: 'Public Transport', label: 'Public Transit / Bus Shelter', icon: <Briefcase size={16} /> },
    { id: 'Skill Development', label: 'Skill & Livelihood Center', icon: <Award size={16} /> },
    { id: 'Sports', label: 'Sports Arena / Playgrounds', icon: <Award size={16} /> },
    { id: 'Environment', label: 'Green Environment & Parks', icon: <Trees size={16} /> },
    { id: 'Safety', label: 'Public Safety & CCTV', icon: <ShieldAlert size={16} /> },
    { id: 'Other', label: 'Other Development Idea', icon: <HelpCircle size={16} /> }
  ];

  const activeCategories = mode === 'suggestion' ? suggestionCategoriesList : problemCategories;

  // Custom Success screen rendering
  if (submittedSuccess) {
    return (
      <div style={{ maxWidth: '750px', margin: '40px auto', padding: '0 24px' }}>
        <div className="card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
          
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10B981', borderRadius: '50%', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={48} style={{ color: '#10B981' }} />
          </div>

          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
              {mode === 'suggestion' ? 'Development Proposal Submitted!' : 'Civic Hazard Registered Successfully!'}
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '15px' }}>
              Thank you for contributing to your neighborhood ledger. AI background processes have triaged this entry.
            </p>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3B82F6', color: '#3B82F6', borderRadius: '24px', padding: '8px 20px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} />
            <span>+50 Citizen Warden Points Awarded!</span>
          </div>

          {/* Details Summary Grid */}
          <div style={{ width: '100%', textAlign: 'left', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                AI Semantic Triage Report
              </h3>
              <span 
                className="badge" 
                style={{ 
                  fontSize: '11px', 
                  padding: '4px 10px',
                  background: classificationTier === 'edge' ? 'rgba(16, 185, 129, 0.15)' : classificationTier === 'fallback' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: classificationTier === 'edge' ? '#34d399' : classificationTier === 'fallback' ? '#fbbf24' : '#60a5fa',
                  border: `1px solid ${classificationTier === 'edge' ? 'rgba(16, 185, 129, 0.3)' : classificationTier === 'fallback' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                }}
              >
                {classificationTier === 'edge' 
                  ? '🟢 Classified on-device (Gemma 3n via Ollama)' 
                  : classificationTier === 'fallback' 
                  ? '⚡ Classified offline (Zero-Cloud Deterministic)' 
                  : '☁️ Classified via Cloud (Gemini 2.5 Flash)'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13.5px' }}>
              <div>
                <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Triage Title</span>
                <strong style={{ color: 'var(--text-1)', fontSize: '15px' }}>{submittedData?.title || title}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Assigned Department</span>
                <strong style={{ color: 'var(--text-1)', fontSize: '15px' }}>{submittedData?.department || department || 'Municipal Administration'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Primary Category</span>
                <strong style={{ color: 'var(--text-1)', fontSize: '15px' }}>{submittedData?.category || category}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>AI Triage Priority</span>
                <strong style={{ color: 'var(--text-1)', fontSize: '15px' }}>Rating {submittedData?.priority || submittedData?.severity || severity || 3}/5</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Detected Language</span>
                <strong style={{ color: 'var(--text-1)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={13} style={{ color: 'var(--primary)' }} />
                  {submittedData?.language || detectedLanguage || 'English'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>AI Confidence Score</span>
                <strong style={{ color: '#10B981', fontSize: '15px' }}>
                  {submittedData?.confidence ? `${(submittedData.confidence * 100).toFixed(0)}%` : '88%'}
                </strong>
              </div>
            </div>

            {/* Language Translations if non-English */}
            {submittedData?.language && submittedData.language !== 'English' && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Original Voice / Transcript ({submittedData.language})</span>
                  <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', color: 'var(--text-2)' }}>"{submittedData.description_original}"</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>English Translation</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 500, color: 'var(--text-1)' }}>"{submittedData.description_english}"</p>
                </div>
              </div>
            )}

            {/* Theme & Keywords Tags */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(submittedData?.theme || theme) && (
                <div>
                  <span style={{ color: 'var(--text-3)', fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>AI Core Theme</span>
                  <span style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                    {submittedData?.theme || theme}
                  </span>
                </div>
              )}
              {((submittedData?.aiTags && submittedData.aiTags.length > 0) || keywords.length > 0) && (
                <div>
                  <span style={{ color: 'var(--text-3)', fontSize: '11px', display: 'block', textTransform: 'uppercase', marginBottom: '6px' }}>Extracted Keywords</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(submittedData?.aiTags || keywords).map((kw: string, i: number) => (
                      <span key={i} style={{ background: 'var(--surface-3)', color: 'var(--text-2)', padding: '3px 10px', borderRadius: '4px', fontSize: '11.5px' }}>
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Location Address */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '11px', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Verified Location Coordinates</span>
              <span style={{ color: 'var(--text-1)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} style={{ color: 'var(--danger)' }} />
                {address} ({lat?.toFixed(5)}, {lng?.toFixed(5)})
              </span>
            </div>

          </div>

          <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, padding: '12px' }}
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '12px' }}
              onClick={() => navigate('/map')}
            >
              View Map Layer
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '12px' }}
              onClick={() => {
                setSubmittedSuccess(false);
                setSubmittedData(null);
                setImage(null);
                setImagePreview(null);
                setTitle('');
                setCategory(mode === 'suggestion' ? 'Roads' : 'pothole');
                setSeverity(3);
                setDescription('');
                setDescriptionOriginal('');
                setDescriptionEnglish('');
                setDetectedLanguage('English');
                setAiCategory('');
                setDepartment('');
                setConfidence(null);
                setKeywords([]);
                setTheme('');
                setAiTags([]);
                setCurrentStep(1);
              }}
            >
              Propose Another
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* Header and Dual Mode Segmented Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px', fontSize: '28px', fontWeight: 800 }}>AI Constituency Submission Hub</h1>
        <p style={{ color: 'var(--text-2)', maxWidth: '650px', marginBottom: '24px', fontSize: '14.5px' }}>
          Help shape the future of your constituency. Submit a proactive <strong>Development Suggestion</strong> (primary flow) to recommend new physical infrastructure, or report active infrastructure problems as supporting evidence.
        </p>

        {/* Dual Mode Button Toggle */}
        <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '6px', borderRadius: '30px', border: '1px solid var(--border)', gap: '4px', width: '100%', maxWidth: '440px' }}>
          <button
            type="button"
            style={{
              flex: 1,
              borderRadius: '24px',
              border: 'none',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.25s',
              background: mode === 'problem' ? 'var(--primary)' : 'transparent',
              color: mode === 'problem' ? '#FFF' : 'var(--text-2)'
            }}
            onClick={() => {
              setMode('problem');
              setCurrentStep(1);
            }}
          >
            <AlertTriangle size={15} />
            Suggest
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              borderRadius: '24px',
              border: 'none',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.25s',
              background: mode === 'suggestion' ? '#F59E0B' : 'transparent',
              color: mode === 'suggestion' ? '#FFF' : 'var(--text-2)'
            }}
            onClick={() => {
              setMode('suggestion');
              setCurrentStep(1);
            }}
          >
            <Lightbulb size={15} />
            Suggest Development
          </button>
        </div>
      </div>

      {/* Progressive Step Indicator Stepper */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {[
          { num: 1, name: mode === 'suggestion' ? 'Propose & Verify' : 'Upload & Verify' },
          { num: 2, name: 'Map Pinpoint' },
          { num: 3, name: 'AI Triage & Review' }
        ].map((step) => {
          const isActive = currentStep === step.num;
          const isDone = currentStep > step.num;
          return (
            <div 
              key={step.num}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: (step.num < currentStep || (step.num === 2 && imagePreview)) ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (step.num === 1) setCurrentStep(1);
                if (step.num === 2 && imagePreview) setCurrentStep(2);
                if (step.num === 3 && imagePreview && lat && lng) setCurrentStep(3);
              }}
            >
              <div 
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: isActive 
                    ? 'var(--primary)' 
                    : (isDone ? 'var(--text-2)' : 'var(--surface-2)'),
                  color: (isActive || isDone) ? 'var(--bg)' : 'var(--text-3)',
                  transition: 'all 0.2s',
                  boxShadow: 'none'
                }}
              >
                {isDone ? <Check size={14} /> : step.num}
              </div>
              <span 
                style={{ 
                  fontSize: '13px', 
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--text-1)' : 'var(--text-3)'
                }}
              >
                {step.name}
              </span>
              {step.num < 3 && <div style={{ width: '20px', height: '1px', background: 'var(--border)' }} />}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* ================= STEP 1: MEDIA UPLOAD & VISION ================= */}
        {currentStep === 1 && (
          <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} style={{ color: 'var(--text-1)' }} />
                Upload Photographic Proof & Run AI Triage
              </h3>
              <p style={{ color: 'var(--text-2)', fontSize: '13px', margin: 0 }}>
                {mode === 'suggestion' 
                  ? 'Provide a photograph depicting the site, local neighborhood context, or current facilities to propose a community development project.'
                  : 'Capture or upload a clear, high-resolution photo of the public physical hazard. AI will verify that it constitutes valid public infrastructure.'}
              </p>

              {/* Drag Drop Area */}
              <div 
                className="card"
                style={{ 
                  padding: 0, 
                  overflow: 'hidden', 
                  aspectRatio: cameraActive ? undefined : '16/9', 
                  minHeight: cameraActive ? '360px' : undefined,
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  justifyContent: 'center',
                  borderStyle: (imagePreview || cameraActive) ? 'solid' : 'dashed',
                  borderWidth: '2px',
                  borderColor: validationError ? 'var(--danger)' : 'var(--border)',
                  background: 'var(--surface-2)'
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {cameraActive ? (
                  <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0c10', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
                    {isCameraBlocked ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center', width: '100%', height: '100%', justifyContent: 'center', zIndex: 10, padding: '12px' }}>
                        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '50%', padding: '12px' }}>
                          <Video size={24} style={{ color: 'var(--text-1)' }} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#FFF', display: 'block' }}>Iframe Camera Simulator Active</strong>
                          <span style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginTop: '4px' }}>
                            Hardware camera is restricted in preview sandbox. Click an AI simulated template to verify details:
                          </span>
                        </div>
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                            {(mode === 'suggestion' ? SUGGESTION_PRESETS : SCAN_PRESETS).map((preset, i) => (
                              <button
                                key={i}
                                type="button"
                                className="btn btn-secondary hover-card"
                                style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#FFF' }}
                                onClick={() => handleSimulateScan(preset)}
                              >
                                <span>{preset.icon}</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <video 
                        id="scan-video" 
                        autoPlay 
                        playsInline 
                        ref={(el) => { if (el && stream) el.srcObject = stream; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    
                    {!isCameraBlocked && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '2px solid var(--border)', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
                        <div style={{ background: 'rgba(10,12,16,0.85)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid var(--primary)', alignSelf: 'flex-start' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-1)', display: 'block', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>LIVE AI CIVIC RADAR SCANNING</span>
                          <span style={{ fontSize: '13px', color: '#FFF', fontWeight: 600 }}>
                            {liveClass ? `${liveClass.toUpperCase()}` : 'Searching for targets...'}
                          </span>
                          {liveConfidence !== null && (
                            <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                              Confidence: {(liveConfidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {liveAnalyzing && (
                          <div style={{ alignSelf: 'center', background: 'rgba(10,12,16,0.9)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={12} className="shimmer" style={{ color: 'var(--text-1)', animation: 'spin 1.5s linear infinite' }} />
                            <span style={{ fontSize: '10px', color: '#FFF', fontFamily: 'var(--font-mono)' }}>SCANNING FRAME...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Upload Preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <label 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '12px',
                      cursor: 'pointer',
                      height: '100%',
                      padding: '24px'
                    }}
                  >
                    <Camera size={36} style={{ color: 'var(--text-3)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)' }}>
                      Drag photos here or click to select image file
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      Supports PNG, JPG, or JPEG (Max 10MB)
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }}
                    />
                  </label>
                )}

                {/* Processing Overlay */}
                {analyzing && (
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: 0, left: 0, right: 0, bottom: 0, 
                      background: 'rgba(10,12,16,0.85)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '12px'
                    }}
                  >
                    <Loader className="shimmer" size={32} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFF' }}>
                      AI Computer Vision Classifying...
                    </span>
                  </div>
                )}
              </div>

              {/* Camera Activation Buttons */}
              {!imagePreview && !cameraActive && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderColor: 'var(--border)', color: 'var(--text-1)', fontWeight: 600 }}
                  onClick={startCamera}
                >
                  <Video size={16} />
                  Switch to Live Camera AI Scan
                </button>
              )}

              {cameraActive && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, background: 'var(--primary)', borderColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={captureFrame}
                  >
                    <Camera size={16} />
                    Capture & Verify Context
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={stopCamera}
                  >
                    Cancel Live Scan
                  </button>
                </div>
              )}

              {/* Validation Alert */}
              {validationError && (
                <div 
                  style={{ 
                    background: 'var(--danger-subtle)', 
                    color: 'var(--danger)', 
                    padding: '12px 16px', 
                    borderRadius: '6px',
                    display: 'flex',
                    gap: '12px',
                    fontSize: '13px'
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Verification Success Badge */}
              {aiAssessment && !validationError && (
                <div 
                  style={{ 
                    background: 'var(--success-subtle)', 
                    color: 'var(--success)', 
                    padding: '12px 16px', 
                    borderRadius: '6px',
                    display: 'flex',
                    gap: '12px',
                    fontSize: '13px'
                  }}
                >
                  <CheckCircle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>AI Image Classification Succeeded:</strong>
                    <span>{aiAssessment} Assigned Priority level: <strong>{severity}/5</strong>.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Next buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={!imagePreview}
                onClick={() => setCurrentStep(2)}
              >
                Proceed to Map Location
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: LOCATION & GPS ================= */}
        {currentStep === 2 && (
          <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} style={{ color: 'var(--text-1)' }} />
                Pinpoint Community Ward Location Coordinates
              </h3>
              <p style={{ color: 'var(--text-2)', fontSize: '13px', margin: 0 }}>
                Select a preset checkpoint, click directly on the interactive map block, or use your physical device GPS to pinpoint the exact municipal coordinate.
              </p>

              {/* GPS Selector Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={useMyLocation}
                  disabled={geocoding}
                >
                  <MapPin size={15} />
                  {geocoding ? "Detecting GPS..." : "Detect My Device GPS Location"}
                </button>
              </div>

              {/* District Preset Dropdown */}
              {(showPresetLocation || gpsError || gpsFallbackActive) && (
                <div style={{ padding: '12px', background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-1)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Municipal Ward Centers fallback:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {PRESET_CHECKPOINTS.map((cp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn btn-secondary text-left text-xs"
                        style={{ justifyContent: 'flex-start', padding: '8px', minHeight: 'auto', fontSize: '11px' }}
                        onClick={() => {
                          setLat(cp.lat);
                          setLng(cp.lng);
                          setAddress(cp.address);
                          setGpsError(false);
                          setGpsFallbackActive(true);
                          setShowPresetLocation(false);
                          toast.success(`Coordinates mapped to: ${cp.name}`);
                        }}
                      >
                        📍 <strong>{cp.name}</strong> ({cp.lat.toFixed(4)}, {cp.lng.toFixed(4)})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive map display */}
              {lat && lng ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div 
                    ref={mapContainerRef}
                    style={{ 
                      height: '240px', 
                      background: 'var(--bg)', 
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  />
                  <input 
                    type="text" 
                    className="form-input text-sm"
                    style={{ background: 'var(--bg)' }}
                    placeholder="Physical address descriptor or nearest crossroad landmark" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div style={{ height: '80px', border: '1px dashed var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                  No GPS coordinates locked yet. Use the buttons above to fetch.
                </div>
              )}
            </div>

            {/* Stepper Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setCurrentStep(1)}
              >
                <ChevronLeft size={16} />
                Back to Image Upload
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={!lat || !lng || !address}
                onClick={() => setCurrentStep(3)}
              >
                Proceed to Triage & Details
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: DETAILS & MULTILINGUAL AI TRIAGE ================= */}
        {currentStep === 3 && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--text-1)' }} />
                Verify Categorization & Multilingual Details
              </h3>

              {/* Title Input */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {mode === 'suggestion' ? 'Development Proposal Title' : 'Civic Problem Title'}
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder={mode === 'suggestion' ? "e.g. Setting up solar lights along commercial pathway" : "e.g. Deep flooding pothole near bakery corner"} 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Category selector based on mode */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Category Selection</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {activeCategories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      className={`btn ${category === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ 
                        padding: '10px 12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontSize: '12px',
                        background: category === cat.id ? 'var(--primary)' : undefined,
                        borderColor: category === cat.id ? 'var(--primary)' : undefined,
                        color: category === cat.id ? 'var(--bg)' : 'var(--text-1)'
                      }}
                      onClick={() => setCategory(cat.id)}
                    >
                      {cat.icon}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity / priority slider or grid */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {mode === 'suggestion' ? 'Community Impact & Urgency Level' : 'Hazard Priority & Severity'} ({severity}/5)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setSeverity(lvl)}
                      style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        background: severity === lvl ? 'var(--primary)' : 'var(--surface-2)',
                        color: severity === lvl ? 'var(--bg)' : 'var(--text-2)'
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description & Speech/Text Multilingual Pipeline */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                  <span>Conversational Description (Speak/Type in ANY Language)</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {showVoiceSimulation && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px', minHeight: 'auto' }}
                        onClick={() => setShowVoiceSimulation(false)}
                      >
                        Hide Simulator
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', minHeight: 'auto', background: voiceActive ? 'var(--danger-subtle)' : 'var(--surface-3)', borderColor: voiceActive ? 'var(--danger)' : 'var(--border)' }}
                      onClick={startVoiceRecording}
                      disabled={voiceCleaning}
                    >
                      <Mic size={12} style={{ color: voiceActive ? 'var(--danger)' : 'var(--text-1)' }} />
                      {voiceActive ? "Listening..." : (voiceCleaning ? "AI Processing..." : "Record Speech / Text")}
                    </button>
                  </div>
                </label>
                <textarea 
                  className="form-textarea"
                  style={{ minHeight: '120px' }}
                  placeholder="Describe your suggestion/report here. You can speak or write Kannada, Hindi, Spanish, or simple conversational speech. AI will detect, translate, and structure the data."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />

                {/* Simulated Speech presets fallback */}
                {showVoiceSimulation && (
                  <div style={{ marginTop: '10px', padding: '12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mic size={14} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)' }}>Iframe Voice Microphone Simulator</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                      Click one of these multilingual voice templates to simulate speaking into the browser. Let AI translate it:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {MOCK_SPEECH_TEMPLATES.map((tpl, i) => (
                        <button
                          key={i}
                          type="button"
                          className="btn btn-secondary text-xs"
                          style={{ padding: '6px 10px', fontSize: '11px', minHeight: 'auto' }}
                          onClick={() => {
                            setCustomVoiceDraft(tpl.text);
                            processCleanVoice(tpl.text);
                          }}
                          disabled={voiceCleaning}
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary text-xs"
                        style={{ padding: '6px 10px', fontSize: '11px', minHeight: 'auto' }}
                        onClick={() => {
                          const KannadaDemo = "ರಸ್ತೆಯಲ್ಲಿ ಒಂದು ದೊಡ್ಡ ಹಳ್ಳ ಬಿದ್ದಿದೆ, ವಾಹನಗಳು ಓಡಾಡಲು ತುಂಬಾ ತೊಂದರೆ ಆಗ್ತಿದೆ. ಮಳೆ ಬಂದ್ರೆ ಪೂರ್ತಿ ನೀರು ತುಂಬಿಕೊಳ್ಳುತ್ತೆ.";
                          setCustomVoiceDraft(KannadaDemo);
                          processCleanVoice(KannadaDemo);
                        }}
                        disabled={voiceCleaning}
                      >
                        🔊 Sim Kannada Voice (ರಸ್ತೆಯಲ್ಲಿ ಹಳ್ಳ...)
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary text-xs"
                        style={{ padding: '6px 10px', fontSize: '11px', minHeight: 'auto' }}
                        onClick={() => {
                          const HindiDemo = "हमारे कॉलोनी में स्कूल के पास कोई भी प्राथमिक चिकित्सा केंद्र यानी क्लिनिक नहीं है। हमें इलाज के लिए बहुत दूर जाना पड़ता है।";
                          setCustomVoiceDraft(HindiDemo);
                          processCleanVoice(HindiDemo);
                        }}
                        disabled={voiceCleaning}
                      >
                        🔊 Sim Hindi Voice (प्राथमिक क्लिनिक...)
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-2)' }}>Type raw conversational draft:</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input 
                          type="text" 
                          className="form-input text-xs" 
                          style={{ padding: '6px', height: '32px' }}
                          placeholder="e.g. hume yaha garden chahiye bacho ke khelne ke liye..."
                          value={customVoiceDraft}
                          onChange={(e) => setCustomVoiceDraft(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-primary text-xs"
                          style={{ padding: '0 12px', height: '32px', minHeight: 'auto' }}
                          onClick={() => processCleanVoice(customVoiceDraft)}
                          disabled={!customVoiceDraft || voiceCleaning}
                        >
                          Clean & Translate
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Translation Preview Box (Dynamic AI outputs) */}
              {descriptionOriginal && detectedLanguage !== 'English' && (
                <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' }}>
                    <Globe size={14} style={{ color: 'var(--primary)' }} />
                    <span>Multilingual Translation Core ({detectedLanguage} Detected)</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-3)', display: 'block' }}>Original input spoken:</span>
                    <p style={{ margin: '2px 0 0 0', fontStyle: 'italic', fontSize: '12.5px', color: 'var(--text-2)' }}>"{descriptionOriginal}"</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-3)', display: 'block' }}>English translation stored:</span>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 600, fontSize: '13px', color: 'var(--text-1)' }}>"{descriptionEnglish}"</p>
                  </div>
                </div>
              )}

              {/* Semantic details summary */}
              {department && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--surface-2)', padding: '12px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ color: 'var(--text-3)', display: 'block' }}>Triage Department</span>
                    <strong style={{ color: 'var(--text-1)' }}>{department}</strong>
                  </div>
                  {theme && (
                    <div>
                      <span style={{ color: 'var(--text-3)', display: 'block' }}>Triage Theme</span>
                      <strong style={{ color: 'var(--text-1)' }}>{theme}</strong>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setCurrentStep(2)}
              >
                <ChevronLeft size={16} />
                Back to Map Location
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  fontSize: '14px', 
                  fontWeight: 700,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px'
                }}
                disabled={submitting || !imagePreview || !lat || !lng || !address || !title || !description}
              >
                {submitting ? (
                  <>
                    <Loader size={16} className="shimmer" style={{ animation: 'spin 1s linear infinite' }} />
                    Auto-Triage & Registering on Ledger...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {mode === 'suggestion' 
                      ? 'Submit Proposal to Ward Development Ledger' 
                      : 'Submit Problem Report to Municipal Ledger'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
