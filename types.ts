export interface CardData {
  id: string;
  name: string;
  set: string;
  number: string;
  estimatedPrice: number;
  currency: string;
  confidence: number;
  imageUrl?: string; // Captures the frame for the list view
}

export interface ScanResult {
  found: boolean;
  data?: CardData;
}
