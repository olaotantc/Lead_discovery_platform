export default function ContactsTemplate({ children }: { children: React.ReactNode }) {
  // Server-side template wrapper; useful for SSR diagnostics
  console.log('[contacts] template render')
  return children
}

