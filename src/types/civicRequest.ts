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
