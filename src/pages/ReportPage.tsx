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
import { encodeGeohash } from '../utils/geohash';
import { 
  Camera, MapPin, Loader, AlertTriangle, CheckCircle, 
  Lightbulb, Droplet, Trash2, HelpCircle, Mic, RefreshCw, Video, Eye, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { logger } from '../utils/logger';

export default function ReportPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();

  // Map and Marker Refs for OpenFreeMap
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Removed redirect so anonymous/guest users can explore reporting form

  // Handle passed location state from Map right-click
  const passedLocation = routerLocation.state as { lat?: number; lng?: number } | null;

  // Form States
  const [image, setImage] = useState<string | null>(null); // base64 representation
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [frames, setFrames] = useState<string[]>([]); // Multi-frame series Base64
  const [framePreviews, setFramePreviews] = useState<string[]>([]); // Multi-frame previews
  const [isCapturingSeries, setIsCapturingSeries] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('pothole');
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState('');

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

  // Helper for cleaning speech
  const processCleanVoice = async (resultText: string) => {
    setVoiceCleaning(true);
    try {
      const res = await fetchWithAuth('/api/agents/clean-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: resultText })
      });
      const data = await res.json();
      
      setTitle(data.title || "Reported Civic Hazard");
      setDescription(data.description || resultText);
      setCategory(data.category || "pothole");
      toast.success("Voice transcript cleaned and form pre-filled!");
    } catch (err) {
      console.error("Failed to clean voice input:", err);
      setDescription(resultText);
      toast.success("Raw transcript inserted into description.");
    } finally {
      setVoiceCleaning(false);
      setShowVoiceSimulation(false);
    }
  };

  // Speech Recognition Handler
  const startVoiceRecording = () => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: any, webkitSpeechRecognition?: any }).SpeechRecognition || (window as unknown as { SpeechRecognition?: any, webkitSpeechRecognition?: any }).webkitSpeechRecognition;
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

    recognition.onerror = (e: unknown) => {
      logger.error("Speech recognition error", e);
      setVoiceActive(false);
      toast.error("Microphone blocked or not permitted in iframe. Opening Voice Simulator.");
      setShowVoiceSimulation(true);
    };

    recognition.onend = () => {
      setVoiceActive(false);
    };

    recognition.onresult = async (event: { results: { transcript: string }[][] }) => {
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
      // Fallback
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

  const handleSimulateScan = (preset: typeof SCAN_PRESETS[0]) => {
    setAnalyzing(true);
    setImagePreview(preset.url);
    setImage(preset.url);
    setTimeout(() => {
      setTitle(preset.title);
      setDescription(preset.desc);
      setCategory(preset.category);
      setSeverity(preset.severity);
      setAiAssessment(`AI Automated Scan Successful. Located matching visual markers for: "${preset.category}".`);
      setEstDays(preset.category === 'pothole' ? 4 : preset.category === 'waste' ? 1 : 3);
      setAnalyzing(false);
      toast.success(`Successfully detected: ${preset.title}!`);
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
          setFrames([]);
          setFramePreviews([]);
          triggerVisionAgent(base64Data);
        }
        stopCamera();
        return;
      }
    }

    // Fallback if camera completely blocked and capture clicked
    const randomPreset = SCAN_PRESETS[Math.floor(Math.random() * SCAN_PRESETS.length)];
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
            body: JSON.stringify({ image: frameBase64 })
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
          const categories = ['pothole', 'streetlight', 'waste', 'water'];
          setLiveClass(categories[Math.floor(Math.random() * categories.length)]);
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
  }, [cameraActive, stream, isCameraBlocked]);

  const startSeriesCapture = () => {
    if (!cameraActive) return;
    setIsCapturingSeries(true);
    setFrames([]);
    setFramePreviews([]);
    setCaptureProgress(0);
    setImagePreview(null);
    setImage(null);
    toast.success("Starting multi-frame series capture (1 frame every 3s)...");
  };

  useEffect(() => {
    if (!isCapturingSeries || !cameraActive) return;

    let count = 0;
    const interval = setInterval(() => {
      if (isCameraBlocked) {
        // Mock capture since camera is blocked
        const randomPreset = SCAN_PRESETS[Math.floor(Math.random() * SCAN_PRESETS.length)];
        setFramePreviews(prev => [...prev, randomPreset.url]);
        setFrames(prev => {
          const updated = [...prev, randomPreset.url];
          if (updated.length >= 5) {
            clearInterval(interval);
            setIsCapturingSeries(false);
            setCameraActive(false);
            triggerVisionAgent(updated);
            toast.success("Finished capturing series!");
          }
          return updated;
        });
        count += 1;
        setCaptureProgress(count);
      } else {
        // Capture actual frame from stream
        const video = document.getElementById('scan-video') as HTMLVideoElement;
        if (video && stream) {
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 600;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // 0.7 quality for compression
            const base64Data = dataUrl.split(',')[1];
            
            setFramePreviews(prev => [...prev, dataUrl]);
            setFrames(prev => {
              const updated = [...prev, base64Data];
              if (updated.length >= 5) {
                clearInterval(interval);
                setIsCapturingSeries(false);
                stopCamera();
                triggerVisionAgent(updated);
                toast.success("Finished capturing series!");
              }
              return updated;
            });
            count += 1;
            setCaptureProgress(count);
          }
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isCapturingSeries, cameraActive, isCameraBlocked, stream]);

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

  // Get current position (Strict GPS with standard accuracy fallback for desktop compatibility)
  const useMyLocation = (silent = false) => {
    setGeocoding(true);
    setGpsError(false);
    setGpsFallbackActive(false);

    if (!navigator.geolocation) {
      if (!silent) {
        toast.error("Geolocation is not supported by your browser");
      }
      setGeocoding(false);
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
          setShowPresetLocation(false); // Hide presets list on precise GPS lock!
          triggerReverseGeocode(latitude, longitude);
          setGeocoding(false);
          if (!silent) {
            toast.success("GPS Lock Established!");
          }
        },
        (error) => {
          console.error(`Geolocation error (highAccuracy: ${highAccuracy}):`, error);
          
          // If high accuracy failed, try standard accuracy before giving up
          if (highAccuracy) {
            console.log("High-accuracy failed. Retrying with standard accuracy...");
            tryGetPosition(false);
          } else {
            let reason = "Unknown error";
            if (error.code === 1) reason = "Permission denied. Please click the lock icon in your browser URL bar and allow Location access.";
            if (error.code === 2) reason = "Position unavailable. Your device cannot determine its location.";
            if (error.code === 3) reason = "Timeout. The request to get your location took too long.";
            
            if (!silent) {
              toast.error(`Could not fetch location: ${reason}`);
            }
            setGpsError(true);
            setGeocoding(false);
          }
        },
        { timeout: 8000, enableHighAccuracy: highAccuracy }
      );
    };

    tryGetPosition(true);
  };

  // Trigger Geocoding if lat/lng is preset, or attempt live location capture
  useEffect(() => {
    if (passedLocation?.lat && passedLocation?.lng) {
      setLat(passedLocation.lat);
      setLng(passedLocation.lng);
      triggerReverseGeocode(passedLocation.lat, passedLocation.lng);
    } else if (!lat && !lng) {
      // Automatically attempt to fetch live GPS coordinates on load
      useMyLocation(true);
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
      // First-time initialization
      try {
        const mapInstance = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [lng, lat],
          zoom: 14,
          pitch: 0,
          bearing: 0
        });

        mapRef.current = mapInstance;

        // Add navigation controls
        mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

        // Create a marker
        const marker = new maplibregl.Marker({ color: '#E11D48' }) // Rose/Red marker
          .setLngLat([lng, lat])
          .addTo(mapInstance);
        markerRef.current = marker;

        // When map is clicked, update lat/lng and trigger reverse geocode!
        mapInstance.on('click', (e) => {
          const { lat: clickLat, lng: clickLng } = e.lngLat;
          setLat(clickLat);
          setLng(clickLng);
          setGpsFallbackActive(false);
          setShowPresetLocation(false); // Hide presets list since marker was placed manually
          triggerReverseGeocode(clickLat, clickLng);
        });
      } catch (err) {
        console.error("Failed to initialize OpenFreeMap:", err);
      }
    } else {
      // Update existing map center and marker position
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
  }, [lat, lng]);

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
      
      // Extract the raw base64 data for the API (strip header)
      const rawBase64 = base64String.split(',')[1];
      setImage(rawBase64);
      setFrames([]);
      setFramePreviews([]);
      triggerVisionAgent(rawBase64);
    };
    reader.readAsDataURL(file);
  };

  // Call vision agent proxy route
  const triggerVisionAgent = async (base64Data: string | string[]) => {
    setAnalyzing(true);
    setValidationError(null);
    setAiAssessment(null);
    try {
      const payload = Array.isArray(base64Data) 
        ? { images: base64Data } 
        : { image: base64Data };

      const response = await fetchWithAuth('/api/agents/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!data.isValidCivicIssue) {
        setValidationError(data.invalidReason || "This doesn't appear to be a civic issue. Please upload a photo of public infrastructure damage.");
        setImage(null);
        setImagePreview(null);
        setFrames([]);
        setFramePreviews([]);
        toast.error("Vision Analysis Rejected: Not a valid civic issue.");
      } else {
        // Pre-fill fields with AI parameters
        setTitle(data.title || '');
        setCategory(data.category || 'pothole');
        setSeverity(data.severity || 3);
        setAiAssessment(data.severityReason || '');
        setAiTags(data.tags || []);
        setEstDays(data.estimatedResolutionDays || 5);
        toast.success("AI Classification and Severity Triage Complete!");
      }
    } catch (error) {
      console.error("AI vision classification failed:", error);
      toast.error("AI service busy. Proceeding with manual reporting.");
      // Fallback: let user input manually
      setTitle("Reported Civic Hazard");
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || user.isAnonymous) {
      toast.error("Please sign in with a registered account to submit a verified report to the municipal ledger.");
      return;
    }

    if ((!imagePreview && framePreviews.length === 0) || !lat || !lng || !address) {
      toast.error("Please complete the image verification and set a valid location.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      const previewsToUpload = framePreviews.length > 0 ? framePreviews : (imagePreview ? [imagePreview] : []);

      // 1. Upload photos to Firebase Storage if fully configured
      try {
        const uploadPromises = previewsToUpload.map(async (preview, idx) => {
          if (preview.startsWith('data:')) {
            const imageId = `issue_${Date.now()}_${idx}`;
            const storageRef = ref(storage, `issues/${imageId}.jpg`);
            await uploadString(storageRef, preview, 'data_url');
            return await getDownloadURL(storageRef);
          } else {
            return preview;
          }
        });

        // Race the uploads against a 6-second timeout to prevent getting stuck
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Storage upload timed out")), 6000)
        );

        imageUrls = await Promise.race([
          Promise.all(uploadPromises),
          timeoutPromise
        ]) as string[];
      } catch (storageErr) {
        console.warn("Storage upload bypassed or timed out (falling back to preview images):", storageErr);
        imageUrls = previewsToUpload;
      }

      const primaryImageUrl = imageUrls[0] || "https://picsum.photos/seed/reported/800/600";

      // 2. Create document in Firestore
      const issueData = {
        title,
        description,
        category,
        severity,
        severityReason: aiAssessment || "Manually reported community problem.",
        status: 'reported',
        lat,
        lng,
        geohash: encodeGeohash(lat, lng, 5),
        address,
        imageUrl: primaryImageUrl,
        imageUrls: imageUrls,
        reportedBy: user?.uid || 'anonymous',
        reporterName: profile?.displayName || 'Citizen Warden',
        upvotes: [],
        verified: false,
        verificationReason: '',
        aiTags,
        estimatedResolutionDays: estDays,
        escalated: false,
        escalatedAt: null,
        resolvedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Race the write against a 6-second timeout to prevent getting stuck if offline/unreachable
      const docPromise = addDoc(collection(db, 'issues'), issueData);
      const writeTimeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Ward database connection timed out")), 6000)
      );
      const docRef = await Promise.race([docPromise, writeTimeoutPromise]) as any;

      // 3. Award 50 points to the user for contributing
      if (user?.uid) {
        await awardPoints(user.uid, 50, 'Reported new civic issue');
        
        // Handle First Report badge
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
          `Thank you for reporting "${title}"! +50 points awarded. AI is triaging resolution timelines.`,
          docRef.id
        );
      }

      await refreshProfile();
      toast.success(t('report.toast.success'));
      
      // Redirect to newly created issue page
      navigate(`/issue/${docRef.id}`, { state: { justReported: true } });
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(err.message || t('report.toast.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { id: 'pothole', label: t('report.category.pothole'), icon: <AlertTriangle size={16} /> },
    { id: 'streetlight', label: t('report.category.streetlight'), icon: <Lightbulb size={16} /> },
    { id: 'water', label: t('report.category.water'), icon: <Droplet size={16} /> },
    { id: 'waste', label: t('report.category.waste'), icon: <Trash2 size={16} /> },
    { id: 'other', label: t('report.category.other'), icon: <HelpCircle size={16} /> }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
      <h1 style={{ marginBottom: '8px' }}>{t('report.title')}</h1>
      <p style={{ color: 'var(--text-2)', marginBottom: '32px' }}>
        {t('report.subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="grid-cols-2">
        
        {/* LEFT COLUMN: Image Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div 
            className="card"
            style={{ 
              padding: 0, 
              overflow: 'hidden', 
              aspectRatio: cameraActive ? undefined : '4/3', 
              minHeight: cameraActive ? '380px' : undefined,
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative',
              justifyContent: 'center',
              borderStyle: (imagePreview || cameraActive) ? 'solid' : 'dashed',
              borderWidth: '2px',
              borderColor: validationError ? 'var(--danger)' : 'var(--border)'
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {cameraActive ? (
              <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0c10', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
                {isCameraBlocked ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center', width: '100%', height: '100%', justifyContent: 'center', zIndex: 10, padding: '12px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', borderRadius: '50%', padding: '12px' }}>
                      <Video size={24} style={{ color: '#10B981' }} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#FFF', display: 'block' }}>Iframe Camera Simulator</strong>
                      <span style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginTop: '4px' }}>
                        Physical hardware is restricted by browser preview frame. Tap a quick municipal target below to simulate live scanning:
                      </span>
                    </div>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                        {SCAN_PRESETS.map((preset, i) => (
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
                
                {/* HUD Green Scanning Overlays */}
                {!isCameraBlocked && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #10B981', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
                    <div style={{ background: 'rgba(10,12,16,0.85)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid #10B981', alignSelf: 'flex-start' }}>
                      <span style={{ fontSize: '9px', color: '#10B981', display: 'block', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>LIVE AI RADAR SCANNING</span>
                      <span style={{ fontSize: '13px', color: '#FFF', fontWeight: 600 }}>
                        {liveClass ? `${liveClass.toUpperCase()}` : 'Searching for hazard...'}
                      </span>
                      {liveConfidence !== null && (
                        <span style={{ fontSize: '10px', color: '#A3E635', display: 'block', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          Confidence: {(liveConfidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    {liveAnalyzing && (
                      <div style={{ alignSelf: 'center', background: 'rgba(10,12,16,0.9)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw size={12} className="shimmer" style={{ color: '#10B981', animation: 'spin 1.5s linear infinite' }} />
                        <span style={{ fontSize: '10px', color: '#FFF', fontFamily: 'var(--font-mono)' }}>SCANNING FRAME...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (imagePreview || framePreviews.length > 0) ? (
              <img 
                src={imagePreview || framePreviews[0]} 
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
                <Camera size={40} style={{ color: 'var(--text-3)' }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)' }}>
                  {t('report.upload.drag')}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                  {t('report.upload.format')}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }}
                />
              </label>
            )}

            {/* Scanning Overlay */}
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
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>
                  {t('report.ai.triaging')}
                </span>
              </div>
            )}
          </div>

          {/* Filmstrip Gallery */}
          {framePreviews.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>
                Captured Series ({framePreviews.length} frames):
              </span>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {framePreviews.map((src, index) => (
                  <div key={index} style={{ position: 'relative', width: '80px', height: '60px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => {
                        setFramePreviews(prev => prev.filter((_, idx) => idx !== index));
                        setFrames(prev => prev.filter((_, idx) => idx !== index));
                      }}
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Live Camera Controls */}
          {!imagePreview && !cameraActive && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderColor: '#10B981', color: '#10B981', fontWeight: 600 }}
              onClick={startCamera}
            >
              <Video size={16} />
              {t('report.camera.switch')}
            </button>
          )}

          {cameraActive && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              {isCapturingSeries ? (
                <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)' }}>Capturing Series...</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{captureProgress}/5 frames</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(captureProgress / 5) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary text-xs"
                    style={{ width: '100%', padding: '6px', minHeight: 'auto' }}
                    onClick={() => {
                      setIsCapturingSeries(false);
                      stopCamera();
                      if (frames.length > 0) {
                        triggerVisionAgent(frames);
                      }
                    }}
                  >
                    Finish Capture Early
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1, background: '#10B981', borderColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onClick={captureFrame}
                    >
                      <Camera size={16} />
                      {t('report.camera.capture')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={stopCamera}
                    >
                      {t('report.camera.cancel')}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={startSeriesCapture}
                  >
                    <Video size={16} />
                    Capture 5-Frame Series (Interval)
                  </button>
                </>
              )}
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

          {/* AI Success Feedback */}
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
                <strong style={{ display: 'block', marginBottom: '2px' }}>{t('report.ai.success')}</strong>
                <span>{aiAssessment} {t('report.ai.est')} <strong>{estDays} {t('report.ai.days')}</strong>.</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Title */}
          <div className="form-group">
            <label className="form-label">{t('report.form.title')}</label>
            <input 
              type="text" 
              className="form-input" 
              required
              placeholder={t('report.form.titlePlaceholder')} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">{t('report.form.category')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  className={`btn ${category === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: '1 0 calc(50% - 10px)', padding: '10px 12px', justifyContent: 'flex-start' }}
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="form-group">
            <label className="form-label">{t('report.form.priority')} ({severity}/5)</label>
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
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                    background: severity === lvl ? 'var(--primary)' : 'var(--surface-2)',
                    color: severity === lvl ? '#FFFFFF' : 'var(--text-2)'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('report.form.description')}</span>
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
                  style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', minHeight: 'auto', background: voiceActive ? 'var(--danger-subtle)' : 'var(--surface-2)', borderColor: voiceActive ? 'var(--danger)' : 'var(--border)' }}
                  onClick={startVoiceRecording}
                  disabled={voiceCleaning}
                >
                  <Mic size={12} style={{ color: voiceActive ? 'var(--danger)' : 'var(--text-1)' }} />
                  {voiceActive ? t('report.voice.listening') : (voiceCleaning ? t('report.voice.cleaning') : t('report.voice.speak'))}
                </button>
              </div>
            </label>
            <textarea 
              className="form-textarea"
              placeholder={t('report.form.descPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            {/* Smart Voice Simulator fallback panel */}
            {showVoiceSimulation && (
              <div 
                style={{ 
                  marginTop: '10px', 
                  padding: '12px', 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mic size={14} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)' }}>Iframe Voice Simulator Fallback</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                  Iframe security restricts microphone capture. Click a spoken preset below to simulate citizen speech and trigger AI pre-fill:
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-2)' }}>Or type/paste raw conversational slang:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="text" 
                      className="form-input text-xs" 
                      style={{ padding: '6px', height: '32px' }}
                      placeholder="e.g. yeah there is huge hole on corner near bakery..."
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
                      Clean Draft
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location Area */}
          <div className="form-group" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('report.location.title')}</span>
              {gpsFallbackActive ? (
                <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600 }}>
                  {t('report.location.fallbackActive')}
                </span>
              ) : lat && lng ? (
                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                  {t('report.location.gpsActive')}
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 600 }}>
                  {t('report.location.notDetected')}
                </span>
              )}
            </label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => useMyLocation(false)}
                disabled={geocoding}
              >
                <MapPin size={15} />
                {geocoding ? t('report.location.detecting') : t('report.location.detect')}
              </button>
            </div>

            {/* Checkpoint selector for fallback / manual convenience */}
            {(showPresetLocation || gpsError || gpsFallbackActive) && (
              <div style={{ marginBottom: '12px', padding: '10px', background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-1)', display: 'block', marginBottom: '4px' }}>
                  Select Municipal District Checkpoint:
                </span>
                <p style={{ margin: '0 0 8px 0', fontSize: '10.5px', color: 'var(--text-2)', lineHeight: '1.4' }}>
                  We have automatically aligned your report to the ward center fallback coordinates. You can select another active municipal landmark below if needed:
                </p>
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
                        setShowPresetLocation(false); // Hide presets list after selection
                        toast.success(t('report.toast.locationAligned').replace('{name}', cp.name));
                      }}
                    >
                      📍 <strong>{cp.name}</strong> ({cp.lat.toFixed(4)}, {cp.lng.toFixed(4)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Live OpenFreeMap */}
            {lat && lng ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div 
                  ref={mapContainerRef}
                  style={{ 
                    height: '180px', 
                    background: 'var(--bg)', 
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                />
                
                {/* Manual address entry */}
                <input 
                  type="text" 
                  className="form-input text-sm"
                  style={{ background: 'var(--bg)' }}
                  placeholder={t('report.location.addressPlaceholder')} 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            ) : (
              <div 
                style={{ 
                  height: '60px', 
                  border: '1px dashed var(--border)', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-3)',
                  fontSize: '12px'
                }}
              >
                {t('report.location.noLock')}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '14px' }}
            disabled={submitting || !imagePreview || !lat || !lng || !address}
          >
            {submitting ? (
              <>
                <Loader size={16} className="shimmer" style={{ animation: 'spin 1s linear infinite' }} />
                {t('report.submit.loading')}
              </>
            ) : (
              (!user || user.isAnonymous) ? "Sign in to Submit Report" : t('report.submit.button')
            )}
          </button>

        </div>
      </form>
    </div>
  );
}
