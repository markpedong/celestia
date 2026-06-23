import { prisma } from "../prisma";
import { Prisma } from "../generated/prisma/client";
import { User } from "../types";

export const generateUsername = (name: string): string => {
  const usernameSource = name.trim().includes('@') ? name.trim().split('@')[0] : name;
  const base =
    usernameSource
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 20) || "user";
  return base;
}

export const ensureUserProfile = async (identity: {
  id: string;
  name: string;
  image?: string | null;
  username?: string;
}): Promise<User> => {
  const baseUsername = generateUsername(identity.username ?? identity.name);
  const usernameWithId = `${baseUsername}_${identity.id.replace(/[^a-z0-9]/gi, '').slice(-8).toLowerCase()}`;

  let row;
  try {
    row = await prisma.userProfile.upsert({
      where: { id: identity.id },
      update: {},
      create: { id: identity.id, username: baseUsername, displayName: identity.name },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;

    row = await prisma.userProfile.upsert({
      where: { id: identity.id },
      update: {},
      create: { id: identity.id, username: usernameWithId, displayName: identity.name },
    });
  }

  if (!row.displayName && identity.name) {
    row = await prisma.userProfile.update({
      where: { id: identity.id },
      data: { displayName: identity.name },
    });
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName ?? identity.name,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatarUrl ?? identity.image ?? undefined,
    coverUrl: row.coverUrl ?? undefined,
  };
}
