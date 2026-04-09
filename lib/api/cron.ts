import { ApiRouteError } from "@/lib/api/response"

export function requireCronAuth(request: Request) {
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    throw new ApiRouteError("CRON_SECRET no configurado.", 500)
  }

  const providedSecret = request.headers.get("x-cron-secret")

  if (providedSecret !== expectedSecret) {
    throw new ApiRouteError("No autorizado.", 401)
  }
}
