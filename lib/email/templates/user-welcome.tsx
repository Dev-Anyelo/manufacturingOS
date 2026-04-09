import * as React from "react"

export type WelcomeEmailTemplateProps = {
  fullName: string
  email: string
  role: string
  accessUrl: string
}

export function UserWelcomeEmailTemplate({
  fullName,
  email,
  role,
  accessUrl,
}: WelcomeEmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <h2>Bienvenido a manufacturingOS</h2>
      <p>Hola {fullName}, tu cuenta fue creada correctamente.</p>
      <ul>
        <li>Correo: {email}</li>
        <li>Rol asignado: {role}</li>
      </ul>
      <p>
        Ingresa al sistema desde este enlace:{" "}
        <a href={accessUrl}>{accessUrl}</a>
      </p>
      <p>Por seguridad, cambia tu contrasena en tu primer inicio de sesion.</p>
    </div>
  )
}
