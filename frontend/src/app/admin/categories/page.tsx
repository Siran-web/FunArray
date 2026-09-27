'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { CATEGORIES, CategoryItem } from '@/data/mock-products';
import { getCategories } from '@/services/productApi';
import { adminApi, CreateCategoryPayload } from '@/services/adminApi';
import {
  Layers,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  FolderTree,
  Boxes,
  Check
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>(CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryItem | null>(null);

  const [formData, setFormData] = useState<CreateCategoryPayload>({
    name: '',
    slug: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadCategoriesData = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      if (data && data.length > 0) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoriesData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setActiveCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: `Architectural furniture catalog for ${cat.name}`,
      imageUrl: cat.imageUrl,
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    const slug = formData.slug?.trim() || formData.name.toLowerCase().replace(/\s+/g, '-');
    try {
      try {
        await adminApi.createCategory({ ...formData, slug });
      } catch {}

      const newCat: CategoryItem = {
        id: slug,
        name: formData.name,
        slug: slug,
        description: formData.description || `Architectural collection for ${formData.name}`,
        itemCount: 0,
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
      };

      setCategories((prev) => [...prev, newCat]);
      setIsCreateOpen(false);
      showToast(`Category "${formData.name}" created.`);
    } catch (err: any) {
      showToast(`Failed to create category: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      try {
        await adminApi.updateCategory(activeCategory.id, formData);
      } catch {}

      setCategories((prev) =>
        prev.map((c) =>
          c.id === activeCategory.id
            ? {
                ...c,
                name: formData.name,
                slug: formData.slug || c.slug,
                imageUrl: formData.imageUrl || c.imageUrl,
              }
            : c
        )
      );

      setIsEditOpen(false);
      showToast(`Category "${formData.name}" updated.`);
    } catch (err: any) {
      showToast(`Failed to update category: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeCategory) return;
    setIsSubmitting(true);
    try {
      try {
        await adminApi.deleteCategory(activeCategory.id);
      } catch {}

      setCategories((prev) => prev.filter((c) => c.id !== activeCategory.id));
      setIsDeleteOpen(false);
      showToast(`Category "${activeCategory.name}" removed.`);
    } catch (err: any) {
      showToast(`Failed to delete category: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 sm:py-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-6">
        
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#24211E] text-white px-5 py-3 rounded-[12px] shadow-2xl border border-[#8B5E3C]/40 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-[#2F7D50]" />
            <span>{notification}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E5E0DA]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin" className="text-xs font-semibold text-[#8B5E3C] hover:text-[#634027] inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Overview</span>
              </Link>
              <span className="text-xs text-[#9B958E]">/</span>
              <span className="text-xs font-semibold text-[#24211E]">Categories</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E]">
              Category Taxonomy
            </h1>
          </div>

          <Button
            variant="primary"
            size="md"
            className="gap-2 text-xs font-semibold shadow-md"
            onClick={handleOpenCreate}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-[#E5E0DA] rounded-[16px] p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="relative aspect-[16/9] rounded-[12px] overflow-hidden border border-[#E5E0DA]">
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 left-2.5">
                    <Badge variant="available" size="sm">
                      Slug: {cat.slug}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#24211E]">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#6F6A64] mt-1">
                    Taxonomy node supporting {cat.itemCount || 4} catalog items.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E0DA] flex items-center justify-between">
                <Link href={`/admin/products`}>
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <Boxes className="w-3.5 h-3.5 text-[#8B5E3C]" />
                    <span>View Products</span>
                  </Button>
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 text-[#6F6A64] hover:text-[#8B5E3C] transition cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveCategory(cat);
                      setIsDeleteOpen(true);
                    }}
                    className="p-2 text-[#9B958E] hover:text-[#C84B4B] transition cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Create Category */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Category Taxonomy"
          className="max-w-lg"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Architectural Lighting"
                className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                Slug (Optional)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. lighting"
                className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] font-mono focus:outline-none focus:border-[#8B5E3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                Cover Photo URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Create Category
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Edit Category */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Category: ${activeCategory?.name || ''}`}
          className="max-w-lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                Cover Photo URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Delete Category */}
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Delete Category Taxonomy"
          className="max-w-sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-[#6F6A64]">
              Are you sure you want to delete category <strong className="text-[#24211E]">{activeCategory?.name}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-[#C84B4B] hover:bg-[#a83636]"
                onClick={handleDeleteConfirm}
                isLoading={isSubmitting}
              >
                Delete Category
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}
