import './globals.css'

export const metadata = {
  title: 'Akash Network Chat',
  description: 'Chat interface for Akash Network',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}