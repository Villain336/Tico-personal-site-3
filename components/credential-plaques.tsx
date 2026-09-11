import { GlareCard } from "@/components/ui/glare-card";
import { credentials, type Credential } from "@/content/credentials";

function Plaque({
  credential,
  placeholder,
}: {
  credential?: Credential;
  placeholder?: boolean;
}) {
  return (
    <GlareCard className="gold-plaque flex flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold-dark/40 bg-gold-light/40 shadow-inner">
        {placeholder ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-7 w-7 text-gold-dark"
            aria-hidden
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-7 w-7 text-gold-dark"
            aria-hidden
          >
            <circle cx="12" cy="9" r="5" />
            <path d="m8.5 13.5-2 7 5.5-3 5.5 3-2-7" />
          </svg>
        )}
      </div>
      <p className="font-display mt-5 text-lg font-bold leading-tight text-gold-dark">
        {credential?.name ?? "Certification"}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-gold-dark/70">
        {credential?.issuer ?? "Coming soon"}
      </p>
      {credential?.dateEarned && (
        <p className="mt-3 text-xs text-gold-dark/70">{credential.dateEarned}</p>
      )}
    </GlareCard>
  );
}

/**
 * Gold plaques for certifications & badges (Aceternity glare card). Renders
 * locked placeholder plaques until `content/credentials.ts` has entries.
 */
export function CredentialPlaques() {
  const items: (Credential | null)[] =
    credentials.length > 0 ? credentials : [null, null, null];

  return (
    <div className="grid justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c, i) => (
        <Plaque key={c?.name ?? `placeholder-${i}`} credential={c ?? undefined} placeholder={!c} />
      ))}
    </div>
  );
}
