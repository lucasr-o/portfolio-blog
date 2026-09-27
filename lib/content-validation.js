const REQUIRED_PROFILE_FIELDS = ["name", "shortName", "role", "location", "objective", "summary", "contact"];

export function validateProfileContent({ profile, experience, education, credentials, terminalSteps }) {
  const errors = [];

  for (const field of REQUIRED_PROFILE_FIELDS) {
    if (!profile[field]) errors.push(`profile.${field} is required`);
  }

  if (experience.length !== 5) errors.push("experience must contain five entries");
  if (education.length !== 2) errors.push("education must contain two entries");
  if (credentials.length < 3) errors.push("credentials must contain the supplied achievements");
  if (!profile.contact.emailHref?.startsWith("mailto:")) errors.push("emailHref must be normalized");
  if (!profile.contact.linkedIn?.startsWith("https://www.linkedin.com/")) errors.push("LinkedIn URL must be normalized");
  if (!profile.contact.github?.startsWith("https://github.com/")) errors.push("GitHub URL must be normalized");
  if (!profile.contact.x?.startsWith("https://x.com/")) errors.push("X URL must be normalized");

  for (const step of terminalSteps) {
    const networkTargets = step.command.match(/https?:\/\/[^\s"']+|\b[\w-]+\.(?:com|net|org|io|dev|test)\b/g) ?? [];
    const hasNonReservedTarget = networkTargets.some((target) => {
      const hostname = target.startsWith("http") ? new URL(target).hostname : target;
      return hostname !== "test" && !hostname.endsWith(".test");
    });

    if (hasNonReservedTarget) {
      errors.push(`terminal target is not reserved: ${step.command}`);
    }
  }

  return errors;
}
