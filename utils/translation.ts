// utils/translation.ts
export const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'zh', name: 'Chinese' },
    { code: 'de', name: 'German' }
];

export const translateText = async (
    text: string,
    sourceLanguage: string,
    targetLanguage: string
): Promise<string> => {
    if (sourceLanguage === targetLanguage) return text;

    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, sourceLanguage, targetLanguage })
        });

        if (!response.ok) throw new Error('Translation failed');
        const data = await response.json();
        return data.translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
};
