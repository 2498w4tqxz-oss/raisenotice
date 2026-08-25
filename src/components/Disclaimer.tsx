export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-mute ${className}`}>
      Not legal advice. RaiseNotice fills a statutory notice; it is not a law firm.
      You are responsible for service, timing, and whether an exemption actually
      applies.
    </p>
  );
}
