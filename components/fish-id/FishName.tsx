import type { NameField } from "@/lib/fishId/modes";

// A species name. Scientific names are always italic (binomial convention);
// every place in the quiz that prints a name goes through here.
export default function FishName({
  field,
  children,
  className = "",
}: {
  field: NameField;
  children: string;
  className?: string;
}) {
  if (field === "scientificName") {
    return <i className={`italic ${className}`}>{children}</i>;
  }
  return <span className={className}>{children}</span>;
}
