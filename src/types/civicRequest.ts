export type CivicRequestType = 'CIVIC_ISSUE' | 'DEVELOPMENT_NEED';

export interface CivicRequestBase {
  requestId: string;
  type: CivicRequestType;
  category: string;
  description: string;
  title: string;
  language?: string;          // ISO 639-1 code if known, e.g. "kn", "hi", "en"
  lat: number;
  lng: number;
  ward?: string;
  district?: string;
  state?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  citizenCount?: number;      // demand signal — number of distinct citizens behind this request
  upvotes?: string[];
  createdAt: any;             // Firestore Timestamp
  status: string;             // keep as string — issues and suggestions currently use different status vocabularies, don't force-unify them yet
  source?: string;            // 'web' | 'whatsapp' | 'sms' | 'voice'
}

export interface InfrastructureContext {
  radiusKm: number;                          // always = DEVELOPMENT_CONTEXT_RADIUS_KM
  facilityCountWithinRadius: number;          // deterministic
  nearestFacilityDistanceKm?: number;         // deterministic
  nearestFacilityName?: string;               // deterministic
  nearestFacilityId?: string;                 // deterministic
  averageFacilityDistanceKm?: number;         // deterministic
  infrastructureGapScore: number;             // 0–100, deterministic (see formulas below)
  accessibilityGapScore: number;              // 0–100, deterministic (see formulas below)
  infrastructureContextAvailable: boolean;    // false when dataset returns no data at all
}

export interface DevelopmentNeedExtended extends CivicRequestBase {
  type: 'DEVELOPMENT_NEED';
  subCategory?: string;                       // AI-produced human label, e.g. "School Capacity"
  infrastructureType?: string;                // deterministic mapped type, e.g. "School"
  intent?: 'REQUEST_NEW_INFRASTRUCTURE' | 'UPGRADE_EXISTING_INFRASTRUCTURE' | 'SERVICE_EXPANSION' | 'OTHER';
  originalText?: string;                      // raw citizen input, preserved verbatim
  infrastructureContext?: InfrastructureContext;
  source: 'web' | 'voice' | 'whatsapp' | 'sms';
}

