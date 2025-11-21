import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { generateStyledImage, analyzeTrend } from './services/geminiService';
import { TrendAnalysisResult } from './types';
import { ClothingSelector } from './components/ClothingSelector';
import { clothingItems as initialClothingItems, ClothingItem } from './data/clothingItems';
import { ApiError } from './utils/errors';


const App: React.FC = () => {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<string | null>(null);
  const [selectedClothingId, setSelectedClothingId] = useState<number | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [trendResult, setTrendResult] = useState<TrendAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Generating your look...');
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ClothingItem[]>(initialClothingItems);

  const handleAddItem = (item: Omit<ClothingItem, 'id'>) => {
    const newItem: ClothingItem = {
      id: Date.now(),
      ...item,
    };
    setItems(prevItems => [newItem, ...prevItems]);
  };

  const handleStartOver = () => {
    setGeneratedImage(null);
    setTrendResult(null);
    setError(null);
    setIsLoading(false);
  };

  const handleModelImageUpload = (image: string) => {
    setModelImage(image);
    handleStartOver();
  };

  const handleClothingSelect = (id: number, imageData: string) => {
    setSelectedClothingId(id);
    setSelectedClothing(imageData);
    handleStartOver();
  };

  const handleRemoveItem = (idToRemove: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== idToRemove));
    if (selectedClothingId === idToRemove) {
      setSelectedClothing(null);
      setSelectedClothingId(null);
    }
    handleStartOver();
  };


  const handleGenerateImage = useCallback(async () => {
    if (!modelImage || !selectedClothing) {
      setError('Please upload a model image and select a clothing item.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Generating your look...');
    setError(null);
    setGeneratedImage(null);
    setTrendResult(null);

    try {
      const newImageBase64 = await generateStyledImage(
        modelImage,
        selectedClothing,
        (attempt) => setLoadingMessage(`High demand. Retrying image generation... (Attempt ${attempt}/2)`)
      );
      setGeneratedImage(newImageBase64);
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
          setError(err.message);
      } else {
          setError('An unexpected error occurred. Please check the console for details.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [modelImage, selectedClothing]);

  const handleAnalyzeTrend = useCallback(async () => {
    if (!generatedImage) return;

    setIsLoading(true);
    setLoadingMessage('Analyzing the trend...');
    setError(null);

    try {
        const analysisResult = await analyzeTrend(
            generatedImage,
            (attempt) => setLoadingMessage(`High demand. Retrying trend analysis... (Attempt ${attempt}/2)`)
        );
        setTrendResult(analysisResult);
    } catch (err) {
        console.error(err);
        if (err instanceof ApiError) {
            setError(err.message);
        } else {
            setError('An unexpected error occurred during analysis. Please try again.');
        }
    } finally {
        setIsLoading(false);
    }
  }, [generatedImage]);
  
  const canGenerate = modelImage && selectedClothing && !isLoading;

  const renderOutputContent = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-lg font-semibold text-gray-300">{loadingMessage}</p>
          <p className="text-sm text-gray-500">This may take a moment.</p>
        </div>
      );
    }

    if (error && !generatedImage) { // Only show full-screen error if there's no image to show alongside it
        return (
            <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg w-full">
                <h3 className="font-bold text-lg">Error</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (generatedImage && trendResult) {
        return <ResultDisplay image={generatedImage} score={trendResult.score} analysis={trendResult.analysis} />;
    }

    if (generatedImage) {
        const parsedImage = JSON.parse(generatedImage);
        const imageUrl = `data:${parsedImage.mimeType};base64,${parsedImage.data}`;
        return (
            <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in text-center">
                <h3 className="text-xl font-bold mb-4 text-indigo-400">Generated Look Preview</h3>
                <div className="mb-6 relative">
                    <img
                        src={imageUrl}
                        alt="AI Generated Look Preview"
                        className="w-full max-h-[300px] lg:max-h-[350px] object-contain rounded-lg shadow-lg"
                    />
                </div>
                {error && (
                    <div className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg w-full mb-4">
                        <p>{error}</p>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button onClick={handleGenerateImage} className="w-full sm:w-auto flex-1 px-6 py-3 text-md font-semibold rounded-lg bg-gray-600 hover:bg-gray-500 text-white transition-all">
                        Try Again
                    </button>
                    <button onClick={handleAnalyzeTrend} className="w-full sm:w-auto flex-1 px-6 py-3 text-md font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-2">
                        <SparklesIcon className="w-5 h-5" />
                        Analyze Trend
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-center text-gray-500">
            <h3 className="text-2xl font-bold mb-2">Your AI Fashion Analysis Awaits</h3>
            <p>Upload a model and select an item to begin.</p>
        </div>
    );
};


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Input Panel */}
          <div className="bg-gray-800/50 rounded-2xl p-6 shadow-2xl border border-gray-700 flex flex-col">
            <h2 className="text-2xl font-bold mb-6 text-center text-indigo-400">Create Your Look</h2>
            <div className="space-y-6">
              <ImageUploader title="1. Upload Model Image" onImageUpload={handleModelImageUpload} />
              <ClothingSelector
                title="2. Choose or Add an Item"
                items={items}
                selectedId={selectedClothingId}
                onSelect={handleClothingSelect}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
              />
            </div>
            <button
              onClick={handleGenerateImage}
              disabled={!canGenerate || !!generatedImage}
              className={`
                mt-8 w-full flex items-center justify-center gap-3 px-6 py-4 text-lg font-semibold rounded-xl
                transition-all duration-300 ease-in-out
                ${canGenerate && !generatedImage
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <SparklesIcon className="w-6 h-6" />
              <span>Generate Look</span>
            </button>
             {(generatedImage || error) && !isLoading && (
                 <button
                    onClick={handleStartOver}
                    className="mt-4 w-full flex items-center justify-center gap-3 px-6 py-3 text-md font-semibold rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-all"
                >
                    Start Over
                </button>
            )}
          </div>

          {/* Output Panel */}
          <div className="bg-gray-800/50 rounded-2xl p-6 shadow-2xl border border-gray-700 flex items-center justify-center min-h-[400px] lg:min-h-0">
             {renderOutputContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
