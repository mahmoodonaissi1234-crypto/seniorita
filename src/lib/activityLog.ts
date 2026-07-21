import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";

export const ALLOWED_ACTIONS = ["created", "edited", "deleted"] as const;
export type ActivityAction = (typeof ALLOWED_ACTIONS)[number];

export const ALLOWED_ENTITY_TYPES = ["category", "item", "settings", "user"] as const;
export type ActivityEntityType = (typeof ALLOWED_ENTITY_TYPES)[number];

export function logActivity(
  user: CurrentUser,
  action: ActivityAction,
  entityType: ActivityEntityType,
  entityId: number
) {
  return prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action,
      entityType,
      entityId,
    },
  });
}
