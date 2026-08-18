/**
 * Generate initials from a display name.
 * Examples: "John Doe" → "JD", "Alice" → "A", "" → "?"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate a stable background color from a string (user ID or name).
 * Returns a Tailwind bg-* class.
 */
export function getAvatarColor(seed: string | null | undefined): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-red-500",
  ];

  if (!seed) return colors[0];

  const hash = seed.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}
