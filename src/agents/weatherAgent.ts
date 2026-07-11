import { db, FieldValue } from '../config/firebaseAdmin';
import { encodeGeohash } from '../utils/geohash';
import { generateText } from '../utils/geminiRetry';

/**
 * Weather & Flood Alerts Agent
 * Sweeps all active locations (from issues and users), fetches weather forecasts from Open-Meteo,
 * computes local flood risks, and writes advisories to Firestore.
 */
export async function runWeatherAlertsAgent() {
  try {
    console.error("[WeatherAgent] Running weather and flood risk analysis...");

    const issuesRef = db.collection('issues');
    const issuesSnap = await issuesRef.get();

    const usersRef = db.collection('users');
    const usersSnap = await usersRef.get();

    // Map to collect coordinates by geohash (precision 5 = ~4.9km ward/sector)
    const geohashClusters: { 
      [geohash: string]: { 
        lat: number; 
        lng: number; 
        waterloggingIssues: any[]; 
      } 
    } = {};

    // 1. Group active waterlogging issues by geohash
    issuesSnap.docs.forEach(docSnap => {
      const issue = docSnap.data();
      if (issue.status !== 'resolved' && issue.status !== 'duplicate' && issue.lat && issue.lng) {
        const lat = parseFloat(issue.lat);
        const lng = parseFloat(issue.lng);
        const hash = encodeGeohash(lat, lng, 5);

        if (!geohashClusters[hash]) {
          geohashClusters[hash] = { lat, lng, waterloggingIssues: [] };
        }

        const isWaterlogging = 
          issue.category === 'water' || 
          (issue.description && issue.description.toLowerCase().includes('waterlogging')) ||
          (issue.description && issue.description.toLowerCase().includes('drain')) ||
          (issue.aiTags && issue.aiTags.includes('water-leak')) ||
          (issue.aiTags && issue.aiTags.includes('flooding'));

        if (isWaterlogging) {
          geohashClusters[hash].waterloggingIssues.push({
            id: docSnap.id,
            title: issue.title,
            address: issue.address
          });
        }
      }
    });

    // 2. Add user locations to ensure active zones are monitored
    usersSnap.docs.forEach(docSnap => {
      const user = docSnap.data();
      if (user.lat && user.lng) {
        const lat = parseFloat(user.lat);
        const lng = parseFloat(user.lng);
        const hash = encodeGeohash(lat, lng, 5);

        if (!geohashClusters[hash]) {
          geohashClusters[hash] = { lat, lng, waterloggingIssues: [] };
        }
      }
    });

    const geohashes = Object.keys(geohashClusters);
    console.error(`[WeatherAgent] Identified ${geohashes.length} sectors to analyze.`);

    for (const hash of geohashes) {
      const cluster = geohashClusters[hash];
      
      // 3. Fetch Forecast from Open-Meteo
      let precipitationToday = 0;
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${cluster.lat}&longitude=${cluster.lng}&daily=precipitation_sum&timezone=auto`;
        const response = await fetch(weatherUrl);
        if (response.ok) {
          const data = await response.json();
          precipitationToday = data.daily?.precipitation_sum?.[0] || 0;
        }
      } catch (err) {
        console.error(`[WeatherAgent] Failed to fetch weather forecast for geohash ${hash}:`, err);
      }

      // 4. Compute flood risk severity from Open-Meteo using IMD thresholds
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let riskReason = "Normal weather conditions.";

      if (precipitationToday >= 204.4) {
        severity = 'critical';
        riskReason = "Extremely heavy rainfall predicted (>204.4mm). High risk of flash flooding.";
      } else if (precipitationToday >= 115.6) {
        severity = 'high';
        riskReason = "Very heavy rainfall predicted (>115.6mm). Susceptible to waterlogging.";
      } else if (precipitationToday >= 64.5) {
        severity = 'medium';
        riskReason = "Heavy rainfall predicted (>64.5mm). Potential drainage strain.";
      }

      // 5. Cross-reference open drainage/waterlogging reports to bump severity
      const issuesCount = cluster.waterloggingIssues.length;
      if (issuesCount > 0 && severity !== 'critical') {
        const prevSeverity = severity;
        if (severity === 'low') severity = 'medium';
        else if (severity === 'medium') severity = 'high';
        else if (severity === 'high') severity = 'critical';

        console.error(`[WeatherAgent] Sector ${hash} has ${issuesCount} active waterlogging reports. Bumping risk from ${prevSeverity.toUpperCase()} to ${severity.toUpperCase()}.`);
        riskReason += ` Bounded by ${issuesCount} active neighborhood waterlogging reports.`;
      }

      // 6. Generate hyper-local advisory using Gemini if risk is medium or higher
      let advisoryText = "Weather conditions are stable. No active alerts.";
      const hasKeys = !!(
        process.env.GEMINI_API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        process.env.GROQ_API_KEY ||
        process.env.OPENROUTER_API_KEY
      );

      if (severity !== 'low' && hasKeys) {
        const prompt = `You are a municipal emergency response assistant. Generate a hyper-local, plain-language advisory based on the following alerts:
        - Geohash Sector: ${hash}
        - Forecasted 24h Rainfall: ${precipitationToday} mm
        - Computed Flood Risk: ${severity.toUpperCase()}
        - Trigger Details: ${riskReason}
        - Active local drainage reports: ${JSON.stringify(cluster.waterloggingIssues)}

        Write a friendly, warning-tiered alert of exactly 2-3 sentences.
        Specifically mention and warn residents about avoiding streets listed in the active reports if they are nearby.
        
        CRITICAL NO-MARKDOWN RULE: Do not use any markdown formatting like bold asterisks (**), italics (*), or headers anywhere in your output.`;

        try {
          const result = await generateText<string>({
            prompt,
            fallbackValue: `Alert: ${riskReason} Avoid low-lying areas.`,
            jsonMode: false
          });
          advisoryText = result.trim();
        } catch (e) {
          advisoryText = `Alert: ${riskReason} Avoid low-lying sectors and report active waterlogging.`;
        }
      } else if (severity !== 'low') {
        advisoryText = `Alert: ${riskReason} Heavy rainfall forecast at this location. Please exercise caution and report municipal issues.`;
      }

      // 7. Write to Firestore weather_alerts collection
      const alertRef = db.collection('weather_alerts').doc(hash);
      await alertRef.set({
        geohash: hash,
        lat: cluster.lat,
        lng: cluster.lng,
        severity,
        precipitationToday,
        activeIssuesCount: issuesCount,
        advisoryText,
        updatedAt: FieldValue.serverTimestamp()
      });

      console.error(`[WeatherAgent] Alert saved for ${hash}: ${severity.toUpperCase()} - ${advisoryText}`);
    }

    console.error("[WeatherAgent] Weather and flood alert scan complete.");
  } catch (error) {
    console.error("[WeatherAgent] Weather Agent analysis failed:", error);
  }
}
