'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { designApi, SavedRoomDesign } from '../../services/designApi';

export default function MyDesignsPage() {
  const router = useRouter();
  const [designs, setDesigns] = useState<SavedRoomDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rename modal state
  const [renamingDesign, setRenamingDesign] = useState<SavedRoomDesign | null>(null);
  const [newName, setNewName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await designApi.getDesigns();
      if (res && Array.isArray(res)) {
        setDesigns(res);
      }
    } catch (err: any) {
      console.warn('Failed to fetch saved designs:', err);
      setError(err?.message || 'Failed to load saved designs. Please make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRename = (design: SavedRoomDesign) => {
    setRenamingDesign(design);
    setNewName(design.name);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingDesign || !newName.trim()) return;

    setIsRenaming(true);
    try {
      const updated = await designApi.renameDesign(renamingDesign.id, newName.trim());
      setDesigns((prev) =>
        prev.map((d) => (d.id === renamingDesign.id ? { ...d, name: updated.name, updatedAt: updated.updatedAt } : d))
      );
      setRenamingDesign(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to rename design');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    setDeletingId(id);
    try {
      await designApi.deleteDesign(id);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete design');
    } finally {
      setDeletingId(null);
    }
  };

  const getPlacedItemCount = (sceneData?: string): number => {
    if (!sceneData) return 0;
    try {
      const parsed = JSON.parse(sceneData);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-stone-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-stone-400">Loading your saved room designs...</p>
      </div>
    );
  }

  return (
    <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-stone-950 text-white flex flex-col font-sans">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/visualize" className="text-xs text-amber-500 hover:underline">
                ← 3D Room Studio
              </Link>
              <span className="text-stone-600">•</span>
              <span className="text-xs text-stone-400">Saved Layouts</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">My Saved Room Designs</h1>
            <p className="text-xs text-stone-400 mt-1">
              Browse, rename, reopen, and manage your personalized 3D living space arrangements.
            </p>
          </div>

          <Link
            href="/visualize"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold transition shadow-md inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>+ Create New Design</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchDesigns} className="underline text-rose-200 ml-4 cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {designs.length === 0 ? (
          <div className="py-20 text-center bg-stone-900/40 border border-stone-800/60 rounded-3xl p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-500 mb-4 text-2xl mx-auto">
              🛋️
            </div>
            <h2 className="text-xl font-bold text-white">No Saved Designs Yet</h2>
            <p className="text-xs text-stone-400 mt-2 mb-6 leading-relaxed">
              Arrange sofas, chairs, tables, and lighting in our 3D Room Studio canvas and save your layout as "Living Room", "Bedroom", or "New Apartment".
            </p>
            <Link
              href="/visualize"
              className="px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition shadow-md"
            >
              Open 3D Room Studio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => {
              const itemCount = getPlacedItemCount(design.sceneData);
              return (
                <div
                  key={design.id}
                  className="bg-stone-900/80 border border-stone-800 rounded-3xl overflow-hidden hover:border-amber-500/40 transition flex flex-col group shadow-lg"
                >
                  {/* Preview Area */}
                  <div className="relative h-48 bg-stone-950 flex items-center justify-center overflow-hidden border-b border-stone-800/60">
                    {design.roomImageUrl ? (
                      <img
                        src={design.roomImageUrl}
                        alt={design.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          // Handle deleted/missing external image gracefully
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 flex flex-col items-center justify-center text-stone-500">
                        <span className="text-3xl mb-1">📐</span>
                        <span className="text-[11px] font-mono text-stone-400">3D Grid Canvas</span>
                      </div>
                    )}

                    <div className="absolute top-3 right-3 bg-stone-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-stone-700/60 text-[10px] font-medium text-amber-400">
                      {itemCount} {itemCount === 1 ? 'Piece' : 'Pieces'} Placed
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-lg font-semibold text-white tracking-tight group-hover:text-amber-400 transition line-clamp-1">
                          {design.name}
                        </h3>
                        <button
                          onClick={() => handleOpenRename(design)}
                          className="text-[11px] text-stone-400 hover:text-amber-400 p-1 rounded-md hover:bg-stone-800 transition cursor-pointer"
                          title="Rename Design"
                        >
                          ✎ Rename
                        </button>
                      </div>

                      <p className="text-[11px] text-stone-400 mt-1">
                        Saved on {new Date(design.updatedAt || design.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-stone-800/80">
                      <Link
                        href={`/visualize?designId=${design.id}`}
                        className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-semibold rounded-xl text-center transition"
                      >
                        Open in Studio →
                      </Link>

                      <button
                        onClick={() => handleDelete(design.id, design.name)}
                        disabled={deletingId === design.id}
                        className="p-2.5 bg-stone-800/80 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 rounded-xl border border-stone-700/60 transition cursor-pointer text-xs"
                        title="Delete Design"
                      >
                        {deletingId === design.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renamingDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Rename Room Design</h3>
            <p className="text-xs text-stone-400 mb-4">
              Enter a new name for your custom layout (e.g., "Living Room", "Master Bedroom", "New Apartment").
            </p>

            <form onSubmit={handleConfirmRename} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Design Name"
                  className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenamingDesign(null)}
                  className="flex-1 py-2.5 bg-stone-800 text-stone-300 rounded-xl text-xs font-medium hover:bg-stone-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming || !newName.trim()}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
                >
                  {isRenaming ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
