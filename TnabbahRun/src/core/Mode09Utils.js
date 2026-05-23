export function hexToAscii(hex) {
  try {
    const bytes = Buffer.from(hex, "hex");
    let text = "";

    for (const b of bytes) {
      if (b >= 32 && b <= 126) text += String.fromCharCode(b);
    }

    return text.trim() || null;
  } catch {
    return null;
  }
}

export function extractMode09Text(resp, prefix) {
  if (!resp || !resp.startsWith(prefix)) return null;

  const data = resp.slice(prefix.length);
  if (!data) return null;

  return hexToAscii(data);
}