"use client";

import Image from "next/image";
import { FIELD_LABEL, type PromptKind, type NameField } from "@/lib/fishId/modes";
import type { Fish } from "@/lib/fishId/types";
import FishName from "./FishName";
import { isRemote } from "./photo";

// The left-hand plate of a question. A photo prompt shows the photograph; a
// name prompt shows a specimen label, replaced by the photograph (when there is
// one) once the question is answered. Missing or broken photographs fall back
// to a ruled, empty plate so the layout never shifts.
export default function SpecimenPlate({
  fish,
  number,
  prompt,
  revealed,
  photoFailed,
  onPhotoError,
}: {
  fish: Fish;
  number: number;
  prompt: PromptKind;
  revealed: boolean;
  photoFailed: boolean;
  onPhotoError: () => void;
}) {
  const plate = String(number).padStart(2, "0");
  const photo = fish.image && !photoFailed ? fish.image : null;
  const showPhoto = prompt === "photo" || (revealed && photo !== null);

  let body;
  if (!showPhoto) {
    body = <SpecimenLabel fish={fish} field={prompt as NameField} plate={plate} />;
  } else if (photo) {
    body = (
      <Image
        key={photo.src}
        src={photo.src}
        unoptimized={isRemote(photo.src)}
        alt={revealed ? `Photograph of ${fish.commonName} (${fish.scientificName})` : "Photograph of the fish to identify"}
        fill
        sizes="(min-width: 1024px) 600px, (min-width: 640px) 90vw, 100vw"
        className={`object-contain ${prompt === "photo" ? "" : "fid-reveal"}`}
        onError={onPhotoError}
        priority
      />
    );
  } else {
    body = <VacantPlate failed={photoFailed} />;
  }

  return (
    <figure className="m-0">
      <div className="fid-frame">{body}</div>
      <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-[11px] text-fid-mist/70">
        <span className="uppercase tracking-[0.18em] text-fid-foam/80">Pl. {plate}</span>
        <Credit fish={fish} prompt={prompt} showPhoto={showPhoto && photo !== null} revealed={revealed} />
      </figcaption>
    </figure>
  );
}

function SpecimenLabel({ fish, field, plate }: { fish: Fish; field: NameField; plate: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-8">
      <div className="fid-label w-full max-w-md px-7 py-6 sm:px-9 sm:py-8">
        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-fid-ink/65">
          <span>Specimen</span>
          <span>No. {plate}</span>
        </div>
        <p className="mt-4 border-t border-fid-ink/25 pt-4 font-fidserif text-[clamp(1.75rem,4.2vw,2.6rem)] leading-[1.08] text-fid-ink">
          <FishName field={field}>{fish[field]}</FishName>
        </p>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-fid-ink/65">{FIELD_LABEL[field]}</p>
      </div>
    </div>
  );
}

function VacantPlate({ failed }: { failed: boolean }) {
  return (
    <div className="fid-vacant absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="font-fidserif text-xl italic text-fid-sand/85">
        {failed ? "The photograph could not be loaded" : "Photograph not yet catalogued"}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fid-mist/60">Plate reserved</p>
    </div>
  );
}

// Credit for the photograph on show. The source link (whose URL names the
// species) only appears once the question is answered.
function Credit({ fish, prompt, showPhoto, revealed }: { fish: Fish; prompt: PromptKind; showPhoto: boolean; revealed: boolean }) {
  const image = fish.image;
  if (!showPhoto || !image) {
    if (prompt === "photo") return <span>No photograph</span>;
    return <span>{image ? "Photograph shown after you answer" : "No photograph catalogued yet"}</span>;
  }
  return (
    <span className="text-right">
      Photo {image.author} ·{" "}
      {image.licenseUrl ? (
        <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-fid-foam/30 underline-offset-2 hover:text-fid-sand">
          {image.license}
        </a>
      ) : (
        image.license
      )}
      {revealed && (
        <>
          {" · "}
          <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-fid-foam/30 underline-offset-2 hover:text-fid-sand">
            {image.source}
            <span aria-hidden> ↗</span>
          </a>
        </>
      )}
    </span>
  );
}
