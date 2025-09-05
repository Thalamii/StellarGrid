// Simple word obfuscation to make casual cheating harder
// This is security through obscurity - not cryptographically secure
// but stops 90% of casual browser inspection cheating

export function obfuscateWords(words: string[], date: string): string {
  try {
    // Create a simple date-based key for XOR
    const key = generateDateKey(date)
    
    // Convert words to JSON, then apply simple XOR obfuscation
    const jsonWords = JSON.stringify(words)
    const obfuscated = xorString(jsonWords, key)
    
    // Base64 encode to make it look less suspicious
    return btoa(obfuscated)
  } catch (error) {
    console.warn('Failed to obfuscate words, falling back to plain text:', error)
    // Fallback to base64 only if XOR fails
    return btoa(JSON.stringify(words))
  }
}

export function deobfuscateWords(obfuscatedData: string, date: string): string[] {
  try {
    // Try to decode the obfuscated data
    const base64Decoded = atob(obfuscatedData)
    const key = generateDateKey(date)
    
    // Apply XOR to decode
    const jsonWords = xorString(base64Decoded, key)
    
    // Parse back to array
    const words = JSON.parse(jsonWords)
    
    // Validate that we got an array of strings
    if (Array.isArray(words) && words.every(w => typeof w === 'string')) {
      return words
    } else {
      throw new Error('Invalid word array format')
    }
  } catch (error) {
    console.warn('Failed to deobfuscate words, trying fallback:', error)
    
    try {
      // Fallback: try simple base64 decode (for backward compatibility)
      const fallbackDecoded = atob(obfuscatedData)
      const words = JSON.parse(fallbackDecoded)
      
      if (Array.isArray(words) && words.every(w => typeof w === 'string')) {
        return words
      } else {
        throw new Error('Invalid fallback word array')
      }
    } catch (fallbackError) {
      console.error('All deobfuscation methods failed:', fallbackError)
      // Last resort: return empty array to prevent crashes
      return []
    }
  }
}

// Generate a simple date-based key for XOR
function generateDateKey(date: string): string {
  // Create a predictable but not obvious key based on the date
  let key = ''
  const dateStr = date + 'WordGridSecretSalt2025' // Add some salt
  
  for (let i = 0; i < dateStr.length; i++) {
    key += String.fromCharCode((dateStr.charCodeAt(i) % 26) + 65) // A-Z
  }
  
  // Ensure key is at least 16 characters
  while (key.length < 16) {
    key += key
  }
  
  return key.substring(0, 32) // Use first 32 characters
}

// Simple XOR cipher (not secure, but makes casual inspection much harder)
function xorString(text: string, key: string): string {
  let result = ''
  
  for (let i = 0; i < text.length; i++) {
    const textChar = text.charCodeAt(i)
    const keyChar = key.charCodeAt(i % key.length)
    result += String.fromCharCode(textChar ^ keyChar)
  }
  
  return result
}

// For debugging (remove in production)
export function testObfuscation() {
  const testWords = ['TEST', 'WORD', 'GAME']
  const date = '2025-01-01'
  
  console.log('Original words:', testWords)
  
  const obfuscated = obfuscateWords(testWords, date)
  console.log('Obfuscated:', obfuscated)
  
  const deobfuscated = deobfuscateWords(obfuscated, date)
  console.log('Deobfuscated:', deobfuscated)
  
  const matches = JSON.stringify(testWords) === JSON.stringify(deobfuscated)
  console.log('Round trip successful:', matches)
  
  return matches
}
