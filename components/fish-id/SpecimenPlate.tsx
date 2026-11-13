"use client";

import Image from "next/image";
import type { NameField, PromptKind } from "@/lib/fishId/modes";
import type { Fish } from "@/lib/fishId/types";
import FishName from "./FishName";
import { isRemote } from "./photo";

// The left-hand plate of a question. A photo prompt shows the photograph in a
// frame; a name prompt shows just a specimen label (no frame), replaced by the
// framed photograph (when there is one) once the question is answered. Missing
// or broken photographs fall back to a ruled, empty plate.
export default function SpecimenPlate({
  fish,
  prompt,
  revealed,
  photoFailed,
  onPhotoError,
}: {
  fish: Fish;
  prompt: PromptKind;
  revealed: boolean;
  photoFailed: boolean;
  onPhotoError: () => void;
}) {
  const photo = fish.image && !photoFailed ? fish.image : null;
  const showPhoto = prompt === "photo" || (revealed && photo !== null);

  let body;
  if (!showPhoto) {
    body = <SpecimenLabel fish={fish} field={prompt as NameField} />;
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
    // The bare name label is shorter than the question beside it, so it sits
    // centred against the choices on wide screens, as a photograph's height does.
    <figure className={`m-0 ${showPhoto ? "" : "lg:self-center"}`}>
      {showPhoto ? <div className="fid-frame">{body}</div> : body}
      {showPhoto && photo && (
        <figcaption className="mt-3 text-right font-mono text-[11px] text-fid-mist/70">
          <Credit image={photo} revealed={revealed} />
        </figcaption>
      )}
    </figure>
  );
}

// The name being asked about, on a museum label. In the name modes this is
// the whole plate until the question is answered.
function SpecimenLabel({ fish, field }: { fish: Fish; field: NameField }) {
  return (
    <div className="fid-label px-7 py-8 text-center sm:px-9 sm:py-10">
      <p className="font-fidserif text-[clamp(1.75rem,4.2vw,2.6rem)] leading-[1.08] text-fid-ink">
        <FishName field={field}>{fish[field]}</FishName>
      </p>
    </div>
  );
}

function VacantPlate({ failed }: { failed: boolean }) {
  return (
    <div className="fid-vacant absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="font-fidserif text-xl italic text-fid-sand/85">
        {failed ? "The photograph could not be loaded" : "Photograph not yet catalogued"}
      </p>
      <p className="font-fidserif font-medium lining-nums text-[12px] uppercase tracking-[0.14em] text-fid-mist/60">Plate reserved</p>
    </div>
  );
}

// Credit for the photograph on show. The source link (whose URL names the
// species) only appears once the question is answered.
function Credit({ image, revealed }: { image: NonNullable<Fish["image"]>; revealed: boolean }) {
  return (
    <span>
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
