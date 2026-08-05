import Pin from "@/components/Pin";
import Image from "next/image";

export default function Review({ paperClass }: { paperClass: string }) { 
    return (
    <div className="mt-12 flex justify-center">
    <div
    className="relative inline-block rotate-1"
    style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))" }}
    >
    <Pin color="navy" />
    <div className={`paper-torn ${paperClass} px-[18px] pb-6 pt-[18px] shadow-lg`}>
        <div className="relative overflow-hidden bg-ink/5" style={{ width: 360, height: 400 }}>
        <Image
            src="/images/ibisreview.png"
            alt="review"
            fill
            className="object-cover"
            sizes="360px"
            priority={false}
        />
        </div>
        <p className="mt-4 text-center font-serif text-sm italic tracking-wide text-[#555]">
        review from trusted client
        </p>
    </div>
    </div>
    </div>
    )
}