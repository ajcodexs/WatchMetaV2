export function readStorage(key, fallback, validate = () => true) {
  try {
    const stored = window.localStorage.getItem(key)
    if (stored === null) return fallback
    let value
    try {
      value = JSON.parse(stored)
    } catch (error) {
      if (validate(stored)) return stored
      throw error
    }
    if (validate(value)) return value
    console.warn(`Ignoring invalid localStorage data for "${key}".`)
  } catch (error) {
    console.warn(`Could not read localStorage key "${key}".`, error)
  }
  return fallback
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Could not save localStorage key "${key}".`, error)
    return false
  }
}

export function removeStorage(key) {
  try {
    window.localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Could not remove localStorage key "${key}".`, error)
    return false
  }
}
