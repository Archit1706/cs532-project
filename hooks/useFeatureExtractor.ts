// hooks/useFeatureExtractor.ts
import { extractRealEstateFeatures } from '../utils/extractRealEstateFeatures';
import { extractFeaturesWithLLM } from '../utils/llmFeatureExtractor';
import { FeatureExtraction } from 'types/chat';

export const useFeatureExtractor = () => {
    const extract = async (query: string): Promise<FeatureExtraction> => {
        try {
            return await extractFeaturesWithLLM(query);
        } catch {
            return extractRealEstateFeatures(query);
        }
    };

    return { extract };
};
