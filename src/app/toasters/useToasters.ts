import { useContext } from 'react'
import { ToasterContext } from './ToasterContext'

export function useToasters() {
  const context = useContext(ToasterContext)
  if (!context) {
    throw new Error('useToasters must be used within a ToasterProvider')
  }
  return context
}
