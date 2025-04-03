// hooks/useFeatureExtractor.ts
import { extractRealEstateFeatures } from '../utils/extractRealEstateFeatures';
import { extractFeaturesWithLLM } from '../utils/llmFeatureExtractor';
import { FeatureExtraction } from 'types/chat';

// Helper for formatting console output
function formatFeatureOutput(label: string, features: FeatureExtraction): void {
  console.group(`📋 ${label}`);
  
  // Format key fields for easier reading in console
  console.log(`Query Type: ${features.queryType}`);
  console.log(`Zip Code: ${features.extractedZipCode || 'None'}`);
  console.log(`Action: ${features.actionRequested || 'None'}`);
  
  if (Object.keys(features.propertyFeatures).length > 0) {
    console.group('Property Features:');
    Object.entries(features.propertyFeatures).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
    console.groupEnd();
  }
  
  if (Object.keys(features.locationFeatures).length > 0) {
    console.group('Location Features:');
    Object.entries(features.locationFeatures).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        console.log(`${key}:`);
        Object.entries(value).forEach(([subKey, subValue]) => {
          console.log(`  ${subKey}: ${subValue}`);
        });
      } else {
        console.log(`${key}: ${value}`);
      }
    });
    console.groupEnd();
  }
  
  if (Object.keys(features.filters).length > 0) {
    console.group('Filters:');
    Object.entries(features.filters).forEach(([key, value]) => {
      console.log(`${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
    });
    console.groupEnd();
  }
  
  if (features.sortBy) {
    console.log(`Sort By: ${features.sortBy}`);
  }
  
  console.groupEnd();
}

export const useFeatureExtractor = () => {
    const extract = async (query: string): Promise<FeatureExtraction> => {
        console.log(`🔍 Feature extraction requested for: "${query}"`);
        
        try {
            console.time('LLM Feature Extraction');
            console.log('🤖 Attempting LLM-based feature extraction...');
            
            const features = await extractFeaturesWithLLM(query);
            
            console.timeEnd('LLM Feature Extraction');
            formatFeatureOutput('LLM Extraction Results', features);
            
            return features;
        } catch (error) {
            console.timeEnd('LLM Feature Extraction');
            console.error('❌ LLM extraction failed:', error);
            console.log('⚠️ Falling back to regex-based extraction');
            
            console.time('Regex Feature Extraction');
            const fallbackFeatures = extractRealEstateFeatures(query);
            console.timeEnd('Regex Feature Extraction');
            
            formatFeatureOutput('Regex Fallback Results', fallbackFeatures);
            
            return fallbackFeatures;
        }
    };

    return { extract };
};