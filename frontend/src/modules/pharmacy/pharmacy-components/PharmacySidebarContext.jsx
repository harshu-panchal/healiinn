import { createContext, useContext, useState } from 'react'

const PharmacySidebarContext = createContext(null)

export const PharmacySidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <PharmacySidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar }}>
      {children}
    </PharmacySidebarContext.Provider>
  )
}

export const usePharmacySidebar = () => {
  const context = useContext(PharmacySidebarContext)
  if (!context) {
    throw new Error('usePharmacySidebar must be used within PharmacySidebarProvider')
  }
  return context
}

