
/** TODO: drobná UI nápověda proč něco není dostupné (403-like) */
export default function ScopeHint({ message }: { message?: string }) {
  return <div className="text-sm text-muted-foreground">{message ?? "Nemáš pro tuto akci oprávnění."}</div>;
}
