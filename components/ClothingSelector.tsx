import React, { useState, useRef } from 'react';
import { ClothingItem } from '../data/clothingItems';
import { convertFileToBase64 } from '../utils/fileUtils';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';

interface ClothingSelectorProps {
  title: string;
  items: ClothingItem[];
  selectedId: number | null;
  onSelect: (id: number, imageData: string) => void;
  onAddItem: (item: Omit<ClothingItem, 'id'>) => void;
  onRemoveItem: (id: number) => void;
}

const AddItemForm: React.FC<{ onAddItem: (item: Omit<ClothingItem, 'id'>) => void }> = ({ onAddItem }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Outerwear' | 'Dresses' | 'Tops' | 'Bottoms'>('Tops');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [newItemImageData, setNewItemImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const base64 = await convertFileToBase64(file);
      const mimeType = base64.split(';')[0].split(':')[1];
      const data = base64.split(',')[1];
      setNewItemImage(base64);
      setNewItemImageData(JSON.stringify({ mimeType, data }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName && newItemCategory && newItemImageData) {
      onAddItem({
        name: newItemName,
        category: newItemCategory,
        imageData: newItemImageData,
      });
      // Reset form
      setNewItemName('');
      setNewItemCategory('Tops');
      setNewItemImage(null);
      setNewItemImageData(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border border-dashed border-gray-600 rounded-lg mb-4">
      <h4 className="text-md font-semibold mb-2 text-gray-400">Add Your Own Item</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
            <input
                type="text"
                placeholder="Item Name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
            />
            <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as any)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
            >
                <option>Outerwear</option>
                <option>Dresses</option>
                <option>Tops</option>
                <option>Bottoms</option>
            </select>
        </div>
        <div className="flex items-center justify-center">
            <label className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ease-in-out border-gray-600 bg-gray-800 hover:bg-gray-700/50">
                {newItemImage ? (
                    <img src={newItemImage} alt="New item preview" className="object-contain h-full w-full rounded-lg p-1"/>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                        <UploadIcon className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-xs text-gray-400">Choose Image</p>
                    </div>
                )}
                <input ref={fileInputRef} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} required/>
            </label>
        </div>
      </div>
      <button type="submit" disabled={!newItemName || !newItemImageData} className="mt-3 w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold py-1.5 rounded-md transition-colors">
        Add Item
      </button>
    </form>
  );
};


export const ClothingSelector: React.FC<ClothingSelectorProps> = ({ title, items, selectedId, onSelect, onAddItem, onRemoveItem }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = ['All', ...Array.from(new Set(items.map(item => item.category)))];

  const filteredItems = selectedCategory === 'All' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-300">{title}</h3>
      <div className="bg-gray-800 rounded-lg p-3 border-2 border-dashed border-gray-600 flex flex-col">
        <AddItemForm onAddItem={onAddItem} />

        <div className="flex items-center gap-2 mb-3 border-b border-gray-700 pb-3 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 flex-shrink-0
                ${selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="h-40 flex items-center gap-3 overflow-x-auto">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const parsed = JSON.parse(item.imageData);
              const src = `data:${parsed.mimeType};base64,${parsed.data}`;
              const isSelected = item.id === selectedId;

              return (
                <div key={item.id} className="relative flex-shrink-0 w-32 h-full group">
                  <button
                    onClick={() => onSelect(item.id, item.imageData)}
                    className={`
                      w-full h-full rounded-lg p-1.5 transition-all duration-200 ease-in-out
                      flex flex-col justify-between items-center
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500
                      ${isSelected ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-gray-700 hover:bg-gray-600'}
                    `}
                    aria-pressed={isSelected}
                    aria-label={`Select ${item.name}`}
                  >
                    <div className="w-full h-24 flex items-center justify-center">
                      <img
                        src={src}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain rounded-md"
                      />
                    </div>
                    <p className="mt-1 text-xs font-medium text-center text-gray-200 truncate w-full px-1">
                      {item.name}
                    </p>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                    className="absolute top-1 right-1 bg-red-600/70 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${item.name}`}
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center text-gray-500">
              No items in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
