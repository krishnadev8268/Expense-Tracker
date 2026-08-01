import './globals.css';

import Navbar from './components/Navbar';
import ChatbotWidget from './components/ChatbotWidget';
import AssetsSidebar from './components/AssetsSidebar';

export const metadata = {
  title: 'ExpenseTracker',
  description: 'AI-powered personal finance assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-slate-950 text-slate-100">
      <body>
        <Navbar />
        <AssetsSidebar />
        {children}
        <ChatbotWidget />
      </body>
    </html>
  )
}
