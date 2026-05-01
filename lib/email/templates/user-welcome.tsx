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
      <p>Correo: {email}</p>
      <p>Rol asignado: {role}</p>
      <p>
        Ingresa al sistema desde este enlace:{" "}
        <a href="https://manufacturing-os.vercel.app">manufacturingOS</a>
      </p>
      <p>Por seguridad, cambia tu contrasena en tu primer inicio de sesion.</p>
    </div>
  )
}
