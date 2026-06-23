export const aiReviewContent = {
  duct: {
    suggestion:
      "Shift this duct 180 mm south and lower it by 60 mm. The proposed route preserves the required beam clearance and avoids the cable tray in Zone C.",
    confidence: 86,
    checks: [
      ["Clash detection", "1 hard clash found", true],
      ["Access clearance", "600 mm maintained", false],
      ["System continuity", "No breaks detected", false],
    ] as const,
  },
  door: {
    suggestion:
      "Reverse the door swing and move the frame 120 mm east. This restores the required 900 mm clear opening without changing the corridor wall.",
    confidence: 79,
    checks: [
      ["Clear opening", "842 mm available", true],
      ["Swing conflict", "Furniture zone detected", true],
      ["Fire compartment", "EI30 requirement maintained", false],
    ] as const,
  },
  damper: {
    suggestion:
      "Assign the FD-300 fire-damper type and link it to the Level 07 smoke extract system before the next coordination issue.",
    confidence: 91,
    checks: [
      ["Classification", "Fire rating is missing", true],
      ["System continuity", "Smoke extract connected", false],
      ["Access clearance", "Inspection zone maintained", false],
    ] as const,
  },
}
