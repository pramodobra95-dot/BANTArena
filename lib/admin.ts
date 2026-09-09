import { getCurrentUser } from "./auth";
import { fail } from "./api";
export async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { error: fail("Admin access required", 403) } as const;
  return { me } as const;
}
