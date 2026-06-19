import { prisma } from "../prisma";
import { User } from "../types";

export const generateUsername = (name: string): string => {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 20) || "user";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}_${suffix}`;
}

export const ensureUserProfile = async (identity: {
  id: string;
  name: string;
  image?: string | null;
}): Promise<User> => {
  const existing = await prisma.userProfile.findUnique({
    where: { id: identity.id },
  });

  if (existing) {
    return {
      id: existing.id,
      username: existing.username,
      displayName: identity.name,
      avatarUrl: existing.avatarUrl ?? identity.image ?? undefined,
      coverUrl: existing.coverUrl ?? undefined,
    };
  }

  const row = await prisma.userProfile.create({
    data: { id: identity.id, username: generateUsername(identity.name) },
  });

  return {
    id: row.id,
    username: row.username,
    displayName: identity.name,
    avatarUrl: identity.image ?? undefined,
  };
}
