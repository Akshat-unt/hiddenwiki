import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ThemeProvider from './components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HiddenWiki - Knowledge Repository',
  description: 'A comprehensive knowledge repository covering history, science, technology, culture, geography, and biography.',
  keywords: 'wiki, knowledge, history, science, technology, culture, geography, biography',
  authors: [{ name: 'Wiki Editor' }],
  robots: 'index, follow',
  openGraph: {
    title: 'HiddenWiki - Knowledge Repository',
    description: 'A comprehensive knowledge repository covering history, science, technology, culture, geography, and biography.',
    type: 'website',
    locale: 'en_US',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
} 