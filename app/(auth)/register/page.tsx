import { redirect } from "next/navigation"

export default function RegisterPage() {
  redirect(
    "/login?message=El%20registro%20de%20nuevos%20usuarios%20solo%20puede%20hacerlo%20el%20administrador%20del%20sistema"
  )
}
