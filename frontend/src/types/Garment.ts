export type Garment = {
  id: number;
  name: string;
  size: string | null;
  description: string | null;
  photo_urls: string[];
  claimant_name: string | null;
  claimed_at: string | null;
};
