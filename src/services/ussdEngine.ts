export interface USSDSessionState {
  sessionId: string;
  phoneNumber: string;
  step: 'START' | 'LANGUAGE' | 'TYPE' | 'CATEGORY' | 'DESCRIPTION' | 'WARD' | 'URGENCY' | 'CONFIRM' | 'COMPLETE';
  language: string;
  type: 'CIVIC_ISSUE' | 'DEVELOPMENT_NEED';
  category: string;
  description: string;
  ward: string;
  urgency: number;
  createdAt: number;
}

export interface USSDResponse {
  sessionId: string;
  message: string;
  isComplete: boolean;
  requestPayload?: any;
}

const CATEGORY_MAP: Record<string, string> = {
  '1': 'Roads & Transit',
  '2': 'Water Supply & Sewage',
  '3': 'Sanitation & Solid Waste',
  '4': 'Healthcare & Clinics',
  '5': 'Electricity & Streetlights',
  '6': 'Education & Schools'
};

const WARD_MAP: Record<string, { name: string; lat: number; lng: number }> = {
  '1': { name: 'Koramangala 4th Block', lat: 12.9372, lng: 77.6265 },
  '2': { name: 'HSR Layout Sector 2', lat: 12.9125, lng: 77.6432 },
  '3': { name: 'Indiranagar', lat: 12.9710, lng: 77.6405 },
  '4': { name: 'Whitefield', lat: 12.9692, lng: 77.7510 },
  '5': { name: 'Other / Central Ward', lat: 12.9716, lng: 77.5946 }
};

const SESSIONS = new Map<string, USSDSessionState>();

// Clear stale sessions (> 15 minutes)
function cleanExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of SESSIONS.entries()) {
    if (now - session.createdAt > 15 * 60 * 1000) {
      SESSIONS.delete(id);
    }
  }
}

export function processUSSDInput(
  sessionId: string,
  input: string,
  phoneNumber: string = '+919876543210'
): USSDResponse {
  cleanExpiredSessions();

  let session = SESSIONS.get(sessionId);
  const trimmed = input.trim();

  // Root or new dialer trigger (e.g. *384*2484#)
  if (!session || trimmed === '*384#' || trimmed === '*384*2484#' || trimmed.toLowerCase() === 'reset') {
    session = {
      sessionId,
      phoneNumber,
      step: 'LANGUAGE',
      language: 'en',
      type: 'CIVIC_ISSUE',
      category: 'General',
      description: '',
      ward: 'Central Constituency',
      urgency: 70,
      createdAt: Date.now()
    };
    SESSIONS.set(sessionId, session);

    return {
      sessionId,
      message: `CON CivicPulse Citizen Voice Service\nSelect Preferred Language:\n1. English\n2. Hindi (हिन्दी)\n3. Kannada (ಕನ್ನಡ)\n4. isiZulu / Regional`,
      isComplete: false
    };
  }

  // Handle flow steps
  switch (session.step) {
    case 'LANGUAGE': {
      if (trimmed === '2') session.language = 'hi';
      else if (trimmed === '3') session.language = 'kn';
      else if (trimmed === '4') session.language = 'zu';
      else session.language = 'en';

      session.step = 'TYPE';
      return {
        sessionId,
        message: `CON What would you like to lodge?\n1. Report Urgent Civic Issue (e.g. Broken Pipe, Open Manhole)\n2. Submit Long-Term Development Need (e.g. Health Clinic, New Bus Stop)`,
        isComplete: false
      };
    }

    case 'TYPE': {
      if (trimmed === '2') {
        session.type = 'DEVELOPMENT_NEED';
      } else {
        session.type = 'CIVIC_ISSUE';
      }

      session.step = 'CATEGORY';
      return {
        sessionId,
        message: `CON Select Sector Category:\n1. Roads & Transit\n2. Water & Sewage\n3. Sanitation & Waste\n4. Health Clinic\n5. Electricity\n6. Education`,
        isComplete: false
      };
    }

    case 'CATEGORY': {
      session.category = CATEGORY_MAP[trimmed] || 'Public Infrastructure';
      session.step = 'WARD';
      return {
        sessionId,
        message: `CON Select Your Ward / Location:\n1. Koramangala 4th Block\n2. HSR Layout Sector 2\n3. Indiranagar\n4. Whitefield\n5. Other Ward`,
        isComplete: false
      };
    }

    case 'WARD': {
      const wardInfo = WARD_MAP[trimmed] || WARD_MAP['5'];
      session.ward = wardInfo.name;
      session.step = 'DESCRIPTION';
      return {
        sessionId,
        message: `CON Type a brief description of your ${session.type === 'CIVIC_ISSUE' ? 'hazard' : 'proposal'}:\n(Example: "Water pipeline rupture near 8th cross market")`,
        isComplete: false
      };
    }

    case 'DESCRIPTION': {
      session.description = trimmed || 'Urgent citizen infrastructure submission via USSD feature phone';
      session.step = 'URGENCY';
      return {
        sessionId,
        message: `CON How urgent is this?\n1. Normal (Community project)\n2. High (Causes daily disruption)\n3. Critical Emergency (Immediate safety risk)`,
        isComplete: false
      };
    }

    case 'URGENCY': {
      if (trimmed === '3') session.urgency = 95;
      else if (trimmed === '2') session.urgency = 80;
      else session.urgency = 60;

      session.step = 'CONFIRM';
      return {
        sessionId,
        message: `CON Confirm Submission:\nType: ${session.type}\nSector: ${session.category}\nWard: ${session.ward}\nUrgency: ${session.urgency}/100\n\n1. Confirm & Submit to Municipal Queue\n2. Cancel`,
        isComplete: false
      };
    }

    case 'CONFIRM': {
      if (trimmed === '1') {
        session.step = 'COMPLETE';
        const wardCoords = Object.values(WARD_MAP).find(w => w.name === session.ward) || WARD_MAP['5'];

        const requestPayload = {
          title: `[USSD] ${session.category} in ${session.ward}`,
          description_original: session.description,
          description_english: session.description,
          type: session.type,
          category: session.category,
          ward: session.ward,
          lat: wardCoords.lat,
          lng: wardCoords.lng,
          urgency: session.urgency,
          priority: session.urgency >= 90 ? 'critical' : session.urgency >= 75 ? 'high' : 'medium',
          status: 'suggested',
          channel: 'ussd',
          source: 'ussd',
          phoneNumber: session.phoneNumber,
          language: session.language,
          upvotes: [],
          createdAt: new Date()
        };

        SESSIONS.delete(sessionId);

        return {
          sessionId,
          message: `END Thank you! Your civic submission has been officially logged in the Municipal Database.\nTicket: USSD-${sessionId.slice(-5).toUpperCase()}\nStatus: Broadcasted to Ward Officer & MP Cockpit.`,
          isComplete: true,
          requestPayload
        };
      } else {
        SESSIONS.delete(sessionId);
        return {
          sessionId,
          message: `END Submission cancelled. Dial *384# anytime to lodge civic requests for free.`,
          isComplete: true
        };
      }
    }

    default: {
      SESSIONS.delete(sessionId);
      return {
        sessionId,
        message: `END Session terminated. Dial *384# to restart.`,
        isComplete: true
      };
    }
  }
}
