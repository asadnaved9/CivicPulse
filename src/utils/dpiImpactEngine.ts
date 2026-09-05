import { DPI_ROLLOUTS, DPIRollout } from '../data/dpiRollouts';

export interface DPIImpactResult {
  dpiId: string;
  name: string;
  domain: string;
  countryCode: string;
  overallScore: number;
  verdict: 'HIGH_IMPACT' | 'MODERATE_IMPACT' | 'LOW_IMPACT' | 'NEEDS_INVESTIGATION';
  components: {
    coverageScore: number;       // 30%: adoption % relative to target
    sentimentScore: number;      // 30%: inverse of citizen dissatisfaction/complaints
    velocityScore: number;       // 20%: compound growth velocity since launch
    serviceQualityScore: number; // 20%: low high-urgency bottlenecks
  };
  metrics: {
    currentAdoptionPct: number;
    targetAdoptionPct: number;
    relatedReportsCount: number;
    highUrgencyCount: number;
    yearsInService: number;
  };
  reasoning: string;
  sourceCitation: string;
}

export function computeDPIImpactScore(
  dpi: DPIRollout,
  civicRequests: any[] = []
): DPIImpactResult {
  const currentYear = 2026;
  const yearsInService = Math.max(1, currentYear - dpi.launchYear);

  // 1. Coverage Score (30%) - Ratio of achieved adoption against official target
  const coverageRatio = Math.min(1.0, dpi.currentAdoptionPct / (dpi.targetAdoptionPct || 100));
  const coverageScore = Math.round(coverageRatio * 100);

  // Filter civic requests related to this DPI's operational domain
  const relevantCategories = dpi.relatedCategories.map(c => c.toLowerCase());
  const relatedReports = civicRequests.filter(r => {
    const cat = (r.category || '').toLowerCase();
    const title = (r.title || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    return (
      relevantCategories.some(rc => cat.includes(rc) || rc.includes(cat)) ||
      title.includes(dpi.name.toLowerCase()) ||
      desc.includes(dpi.name.toLowerCase())
    );
  });

  const highUrgencyReports = relatedReports.filter(r => {
    const u = r.urgency || (r.priority === 'high' || r.priority === 'critical' ? 80 : 40);
    return u >= 75;
  });

  // 2. Sentiment Score (30%) - 100 minus proportion of negative friction reports
  const reportPenalty = Math.min(60, relatedReports.length * 6);
  const sentimentScore = Math.max(20, 100 - reportPenalty);

  // 3. Adoption Velocity Score (20%) - % annual adoption rate
  const annualAdoptionRate = dpi.currentAdoptionPct / yearsInService;
  const velocityScore = Math.min(100, Math.round(annualAdoptionRate * 12));

  // 4. Service Quality Score (20%) - resilience against critical bottleneck reports
  const bottleneckPenalty = Math.min(70, highUrgencyReports.length * 15);
  const serviceQualityScore = Math.max(30, 100 - bottleneckPenalty);

  // Weighted formula: 30% coverage + 30% sentiment + 20% velocity + 20% quality
  const overallScore = Math.round(
    coverageScore * 0.30 +
    sentimentScore * 0.30 +
    velocityScore * 0.20 +
    serviceQualityScore * 0.20
  );

  let verdict: DPIImpactResult['verdict'] = 'MODERATE_IMPACT';
  if (overallScore >= 80) verdict = 'HIGH_IMPACT';
  else if (overallScore >= 60) verdict = 'MODERATE_IMPACT';
  else if (overallScore >= 40) verdict = 'LOW_IMPACT';
  else verdict = 'NEEDS_INVESTIGATION';

  const reasoning = `${dpi.name} achieves an Impact Score of ${overallScore}/100 (${verdict.replace('_', ' ')}). Coverage stands at ${dpi.currentAdoptionPct}% against ${dpi.targetAdoptionPct}% target. Correlation with ${relatedReports.length} ward citizen submissions (${highUrgencyReports.length} urgent service frictions). ${yearsInService} years active with steady adoption velocity.`;

  return {
    dpiId: dpi.id,
    name: dpi.name,
    domain: dpi.domain,
    countryCode: dpi.countryCode,
    overallScore,
    verdict,
    components: {
      coverageScore,
      sentimentScore,
      velocityScore,
      serviceQualityScore
    },
    metrics: {
      currentAdoptionPct: dpi.currentAdoptionPct,
      targetAdoptionPct: dpi.targetAdoptionPct,
      relatedReportsCount: relatedReports.length,
      highUrgencyCount: highUrgencyReports.length,
      yearsInService
    },
    reasoning,
    sourceCitation: dpi.sourceCitation
  };
}

export function scoreAllDPIs(
  civicRequests: any[] = [],
  countryCode: string = 'IN'
): DPIImpactResult[] {
  const filtered = DPI_ROLLOUTS.filter(d => d.countryCode.toUpperCase() === countryCode.toUpperCase());
  const list = filtered.length > 0 ? filtered : DPI_ROLLOUTS;

  const scored = list.map(dpi => computeDPIImpactScore(dpi, civicRequests));
  // Sort by lowest first to highlight intervention gaps for policymakers
  return scored.sort((a, b) => a.overallScore - b.overallScore);
}
