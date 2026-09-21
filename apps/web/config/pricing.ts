/**
 * Pricing configuration (docs BRAND_UPDATE §29, §55).
 *
 * ⚠️ OWNER DECISION REQUIRED — pricing has NOT been approved. Do not publish
 * invented amounts as production truth. While `PRICING_DECIDED` is false the
 * homepage renders an honest "prijzen volgen" state instead of numbers.
 */
export interface PricingPlan {
  id: string;
  name: string;
  /** null until an amount is approved by the owner. */
  monthlyPrice: number | null;
  annualPrice: number | null;
  storage: string | null;
  features: string[];
  featured?: boolean;
}

/** Flip to true only once real, approved prices are filled in below. */
export const PRICING_DECIDED = false;

export const PRICING_CURRENCY = 'EUR';

/** Structure only — amounts intentionally null until the owner decides. */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'start',
    name: 'Start',
    monthlyPrice: null,
    annualPrice: null,
    storage: null,
    features: [
      'Koppel je eerste bronnen',
      'Automatisch veiligstellen wat er al staat',
      'Originelen downloadbaar',
    ],
  },
  {
    id: 'familie',
    name: 'Familie',
    monthlyPrice: null,
    annualPrice: null,
    storage: null,
    featured: true,
    features: [
      'Meer bronnen en meer opslag',
      'Doorlopend bijwerken waar ondersteund',
      'Gedeeld familiearchief (later)',
    ],
  },
];
