import { Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { NavBar } from './components/NavBar'
import { RecommendedCourses } from './pages/RecommendedCourses'
import { CreateCourse } from './pages/CreateCourse'
import { Staking } from './pages/Staking'
import { Profile } from './pages/Profile'

const App = () => {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-neutral-bg text-slate-900">
      <NavBar />
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-16 pt-10">
        <Suspense fallback={<div className="text-center text-sm text-slate-400">加载中...</div>}>
          <Routes>
            <Route path="/" element={<RecommendedCourses />} />
            <Route path="/create" element={<CreateCourse />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

export default App
