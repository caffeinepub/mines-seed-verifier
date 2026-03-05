/**
 * Stake.com Provably Fair Mines Algorithm
 * Uses HMAC-SHA256 + Fisher-Yates shuffle to deterministically place mines
 */

export async function getMinePositions(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  minesCount: number,
): Promise<number[]> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(serverSeed);
  const message = encoder.encode(`${clientSeed}:${nonce}`);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // We may need multiple HMAC rounds to get enough floats (25 shuffles = 25 floats needed)
  const allBytes: number[] = [];

  // Generate bytes from multiple HMAC rounds (each produces 32 bytes = 8 floats)
  // We need 24 floats for the Fisher-Yates shuffle of 25 elements
  // 3 rounds of 32 bytes = 96 bytes = 24 floats (exactly enough)
  for (let round = 0; allBytes.length < 96; round++) {
    const roundMessage = encoder.encode(`${clientSeed}:${nonce}:${round}`);
    const sig = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      round === 0 ? message : roundMessage,
    );
    const bytes = new Uint8Array(sig);
    for (const b of bytes) {
      allBytes.push(b);
    }
  }

  // Convert bytes to floats (4 bytes per float)
  const floats: number[] = [];
  for (let i = 0; i + 3 < allBytes.length; i += 4) {
    const val =
      ((allBytes[i] << 24) |
        (allBytes[i + 1] << 16) |
        (allBytes[i + 2] << 8) |
        allBytes[i + 3]) >>>
      0;
    floats.push(val / 0x100000000);
  }

  // Fisher-Yates shuffle on [0..24]
  const deck = Array.from({ length: 25 }, (_, i) => i);

  for (let i = 24; i > 0; i--) {
    const floatIndex = 24 - i;
    const float = floats[floatIndex] ?? Math.random();
    const j = Math.floor(float * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.slice(0, minesCount);
}

export async function hashServerSeed(serverSeed: string): Promise<string> {
  const data = new TextEncoder().encode(serverSeed);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
