import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

// Edit access for the NBA standings pool. Same signed-cookie scheme as
// /api/board-games/access but keyed to its own passcode so unlocking one
// page never unlocks the other.
const ACCESS_COOKIE = "nba_standings_access";
const ACCESS_TTL_SECONDS = 60 * 60 * 8;

function normalizePasscode(value: string) {
  // Vercel's dashboard and mobile keyboards can introduce surrounding
  // whitespace or composed Unicode variants. Keep case and internal spaces
  // significant while making those copy/paste differences harmless.
  return value.normalize("NFKC").trim();
}

function configuredPasscode() {
  const passcode = process.env.NBA_STANDINGS_PASSCODE;
  if (!passcode) return null;
  const normalized = normalizePasscode(passcode);
  return normalized.length > 0 ? normalized : null;
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signIssuedAt(issuedAt: string, passcode: string) {
  return createHmac("sha256", passcode).update(issuedAt).digest("hex");
}

function createAccessToken(passcode: string) {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${signIssuedAt(issuedAt, passcode)}`;
}

function isValidAccessToken(token: string | undefined, passcode: string) {
  if (!token) return false;

  const [issuedAt, signature] = token.split(".");
  const issuedAtNumber = Number(issuedAt);
  if (!issuedAt || !signature || !Number.isFinite(issuedAtNumber)) return false;

  const age = Date.now() - issuedAtNumber;
  if (age < 0 || age > ACCESS_TTL_SECONDS * 1000) return false;

  return signaturesMatch(signature, signIssuedAt(issuedAt, passcode));
}

function cookieOptions() {
  return {
    httpOnly: true,
    maxAge: ACCESS_TTL_SECONDS,
    path: "/",
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function GET(request: NextRequest) {
  const passcode = configuredPasscode();
  if (!passcode) {
    return NextResponse.json(
      { configured: false, unlocked: false },
      { status: 503 },
    );
  }

  return NextResponse.json({
    configured: true,
    unlocked: isValidAccessToken(request.cookies.get(ACCESS_COOKIE)?.value, passcode),
  });
}

export async function POST(request: NextRequest) {
  const passcode = configuredPasscode();
  if (!passcode) {
    return NextResponse.json(
      { error: "Set NBA_STANDINGS_PASSCODE on the server before unlocking the boards." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a password." }, { status: 400 });
  }

  const enteredPasscode =
    typeof body === "object" && body !== null && "passcode" in body &&
    typeof body.passcode === "string"
      ? body.passcode
      : null;

  if (!enteredPasscode || !signaturesMatch(normalizePasscode(enteredPasscode), passcode)) {
    return NextResponse.json({ error: "That password does not match." }, { status: 401 });
  }

  const response = NextResponse.json({ configured: true, unlocked: true });
  response.cookies.set(ACCESS_COOKIE, createAccessToken(passcode), cookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ unlocked: false });
  response.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}
