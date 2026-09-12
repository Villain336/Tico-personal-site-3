"use client";

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/15 bg-[#14121f] p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <div className="mt-3 space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function ModalButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles =
    variant === "primary"
      ? "bg-brand-lime text-[#12121a] hover:bg-brand-lime/90"
      : variant === "danger"
        ? "border border-brand-coral/60 text-brand-coral hover:bg-brand-coral/10"
        : "border border-white/20 text-white hover:bg-white/10";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${styles}`}
    >
      {children}
    </button>
  );
}
