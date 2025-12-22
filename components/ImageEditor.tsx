
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';

export const ImageEditor: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setEditedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!sourceImage || !prompt.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = sourceImage.split(',')[1];
      const mimeType = sourceImage.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: `Please edit this image based on the following instruction: ${prompt}. Return only the edited image.`,
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setEditedImage(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        setError("The AI didn't return an image. It might have responded with text instead.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during image processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32 space-y-8 animate-ios-slide">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Vision Lab</h2>
          <p className="text-white/60 font-black uppercase tracking-[0.2em] text-[10px] mt-2">Gemini 2.5 Flash Image Editor</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full text-[12px] font-black uppercase tracking-widest transition-all border border-white/20"
        >
          {sourceImage ? 'Change Image' : 'Upload Image'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {!sourceImage ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-video rounded-[32px] border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all group"
        >
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white/40 font-black uppercase tracking-widest text-sm">Select a photo to begin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Controls */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-8 shadow-2xl">
              <label className="block text-white/50 text-[12px] font-black uppercase tracking-[0.15em] mb-4">Editing Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-white/5 border border-white/10 text-white rounded-[24px] p-5 font-bold outline-none transition placeholder-white/20 resize-none text-[17px] focus:border-white/50 focus:bg-white/15 mb-6"
                placeholder="Describe your edits... e.g. 'Add a retro cinematic filter' or 'Convert this into a professional charcoal sketch'"
              />
              
              <button
                onClick={handleEdit}
                disabled={isProcessing || !prompt.trim()}
                className="w-full h-16 bg-[#3B82F6] hover:bg-blue-600 active:scale-[0.97] text-white font-black text-[16px] uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_40px_rgba(59,130,246,0.3)] transition-all border border-white/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-3">
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Apply AI Magic"
                )}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-xs font-bold uppercase tracking-widest">
                  {error}
                </div>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[24px] p-6">
                <h4 className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Sample Prompts</h4>
                <div className="flex flex-wrap gap-2">
                    {[
                        "Add a high-fashion retro filter",
                        "Convert to a high-contrast B&W photo",
                        "Make it look like a futuristic blueprint",
                        "Enhance professional lighting",
                        "Remove the background"
                    ].map(p => (
                        <button 
                            key={p} 
                            onClick={() => setPrompt(p)}
                            className="bg-white/10 hover:bg-white/20 text-white/80 text-[11px] font-bold px-4 py-2 rounded-full border border-white/10 transition-all"
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <div className="bg-black/20 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-full min-h-[400px]">
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{editedImage ? "Result" : "Source Preview"}</span>
                    {editedImage && (
                        <button 
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = editedImage;
                                link.download = 'edited-image.png';
                                link.click();
                            }}
                            className="text-teal-400 font-black text-[10px] uppercase tracking-widest"
                        >
                            Download
                        </button>
                    )}
                </div>
                <div className="flex-1 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    <AnimatePresence mode="wait">
                        <motion.img 
                            key={editedImage || sourceImage}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            src={editedImage || sourceImage!} 
                            alt="Preview" 
                            className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/20"
                        />
                    </AnimatePresence>
                </div>
                {editedImage && (
                    <div className="p-4 bg-white/5 border-t border-white/10 flex justify-center">
                        <button 
                            onClick={() => setEditedImage(null)}
                            className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white"
                        >
                            Reset Edits
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
