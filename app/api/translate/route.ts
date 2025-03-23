// File: app/api/translate/route.ts
import { NextResponse } from 'next/server';
import { text } from 'node:stream/consumers';

// Helper function to preserve proper nouns during translation
function preserveProperNouns(originalText: string, translatedText: string) {
  // Regex to identify proper nouns (names, places, addresses)
  // This is a simplified approach - real implementation would need more refinement
  const properNounsRegex = /((?:[A-Z][a-z]+ )+(?:St|Ave|Rd|Blvd|Dr|Ln|Ct|Way|Pl|Cir|Sq|Ter|Station)|[A-Z][a-z]+ [A-Z][a-z]+|\d+ [A-Z][a-z]+ (?:St|Ave|Rd|Blvd|Dr))/g;
  
  // Extract proper nouns from original text
  const properNouns = originalText.match(properNounsRegex) || [];
  
  // For each proper noun, replace its translation with the original
  let preservedText = translatedText;
  properNouns.forEach((noun, index) => {
    // This is a simplified replacement strategy
    // A more robust solution would need alignment between source and translation
    preservedText = preservedText.replace(`PROPER_NOUN_${index}`, noun);
  });
  
  return preservedText;
}
// Update the API route with better error handling and debugging
// File: app/api/translate/route.ts

export async function POST(request: Request) {
  try {
    const { text, sourceLanguage, targetLanguage } = await request.json();
    
    // Debug request details
    console.log('⭐ TRANSLATION REQUEST:');
    console.log(`Source Language: ${sourceLanguage}`);
    console.log(`Target Language: ${targetLanguage}`);
    console.log(`Text Length: ${text.length} characters`);
    
    // Check if we're using the same language (no translation needed)
    if (sourceLanguage === targetLanguage) {
      console.log('🔄 Same language, skipping translation');
      return NextResponse.json({ translatedText: text });
    }
    
    console.log(`📝 Translating text from ${sourceLanguage} to ${targetLanguage}`);
    
    // Temporary fallback for debugging
    const useLocalFallback = false; // Set to false once backend is working

    if (useLocalFallback) {
      // DEBUG: Simulate translation with a prefix for testing
      console.log('⚠️ Using local fallback translation (FOR TESTING ONLY)');
      const fakeTranslated = `[${targetLanguage}]` + text;
      return NextResponse.json({ translatedText: fakeTranslated });
    }
    
    // Real translation via Flask backend
    try {
      //const translationResponse = await fetch('https://cs532-project.onrender.com/api/translate', {
        const translationResponse = await fetch('http://127.0.0.1:5000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLanguage,
          targetLanguage
        }),
        signal: AbortSignal.timeout(20000), // 20-second timeout
      });

      console.log(`🔄 Translation service responded with status: ${translationResponse.status}`);

      if (!translationResponse.ok) {
        console.warn(`⚠️ Translation service error: HTTP ${translationResponse.status}`);
        // Try to get the error message from the response
        try {
          const errorData = await translationResponse.json();
          console.error('📛 Translation service error details:', errorData);
        } catch (e) {
          console.error('📛 Could not parse error response');
        }
        
        // Fallback to original text
        console.log('⚠️ Using original text as fallback');
        return NextResponse.json({ 
          translatedText: text,
          error: `Translation service error: ${translationResponse.status}`
        });
      }

      // Parse successful response
      const data = await translationResponse.json();
      console.log('✅ Translation successful');
      
      return NextResponse.json({ 
        translatedText: data.translatedText || text,
        sourceLanguage,
        targetLanguage
      });
    } catch (fetchError) {
        console.error('📛 Translation service fetch error:', fetchError);
        return NextResponse.json({ 
          translatedText: text,
          error: (fetchError as Error).message 
        });
    }
  } catch (error) {
    console.error('📛 Translation processing error:', error);
    return NextResponse.json({ 
      translatedText: text,
      error: (error as Error).message
    });
  }
}