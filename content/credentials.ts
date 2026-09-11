export type Credential = {
  name: string;
  issuer: string;
  dateEarned: string;
  badgeImage?: string;
  verifyUrl?: string;
};

// Empty for now — populate as certifications/courses are completed. The
// About page renders a "coming soon" state whenever this is empty, so no
// code changes are needed later, just add entries here.
export const credentials: Credential[] = [];
