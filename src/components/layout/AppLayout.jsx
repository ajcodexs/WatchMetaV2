import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer.jsx'
import MobileNav from './MobileNav.jsx'
import Sidebar from './Sidebar.jsx'

export default function AppLayout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const isDetailsPage = /^\/(movie|tv)\//.test(pathname)
  const isPersonPage = pathname.startsWith('/person/')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:ml-60">
        <main
          className={
            isHome
              ? 'w-full flex-1 p-0'
              : isPersonPage
                ? 'mx-auto w-full max-w-[1100px] flex-1 px-4 pb-32 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:pb-8'
                : isDetailsPage
                ? 'mx-auto w-full max-w-[1400px] flex-1 px-4 pb-32 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:max-w-none lg:px-0 lg:pb-8'
                : 'mx-auto w-full max-w-[1400px] flex-1 px-4 pb-32 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:px-8 lg:pb-8'
          }
        >
          <Outlet />
        </main>
        <Footer />
      </div>
      <MobileNav />
    </div>
  )
}
