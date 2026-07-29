export default function Board({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto max-w-6xl">
      <div
        className="rounded-lg p-3 sm:p-4"
        style={{
          background: "linear-gradient(155deg, #6B4E32 0%, #4A3420 45%, #2C1E13 100%)",
          border: "3px solid #1E140C",
          boxShadow:
            "0 30px 70px -18px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="cork-bg rounded-sm p-6 sm:p-10 lg:p-12"
          style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.45)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
