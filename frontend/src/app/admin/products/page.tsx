'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FEATURED_PRODUCTS, CATEGORIES } from '@/data/mock-products';
import { Product, ProductImage, Furniture3DModel } from '@/types/product';
import { formatPrice } from '@/lib/utils';
import {
  adminApi,
  CreateProductPayload,
  AddImagePayload,
  SaveModelPayload,
} from '@/services/adminApi';
import { getProducts, getCategories } from '@/services/productApi';
import {
  Boxes,
  ArrowLeft,
  Box,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  Image as ImageIcon,
  Layers,
  AlertCircle,
  Eye,
  Sliders,
  Check
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(FEATURED_PRODUCTS);
  const [categories, setCategories] = useState(CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImagesOpen, setIsImagesOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateProductPayload>({
    name: '',
    sku: '',
    categoryId: 'living',
    basePrice: 24999,
    material: 'Solid Oak & Linen',
    brand: 'Atelier Signature',
    description: '',
    dimensions: {
      widthCm: 180,
      heightCm: 80,
      depthCm: 90,
    },
    status: 'ACTIVE',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Image Form State
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [newImageViewType, setNewImageViewType] = useState('FRONT');
  const [newImagePrimary, setNewImagePrimary] = useState(false);

  // 3D Model Form State
  const [modelFormData, setModelFormData] = useState<SaveModelPayload>({
    modelUrl: '',
    thumbnailUrl: '',
    format: 'glb',
    widthCm: 180,
    heightCm: 80,
    depthCm: 90,
    status: 'ACTIVE',
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        getProducts({ size: 100 }),
        getCategories(),
      ]);
      if (prodsRes && prodsRes.content && prodsRes.content.length > 0) {
        setProducts(prodsRes.content);
      }
      if (catsRes && catsRes.length > 0) {
        setCategories(catsRes);
      }
    } catch (err) {
      console.error('Failed to refresh products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU identifier is required';
    if (!formData.categoryId) errors.categoryId = 'Category selection is required';
    if (!formData.basePrice || formData.basePrice <= 0) errors.basePrice = 'Base price must be greater than 0';
    if (!formData.material.trim()) errors.material = 'Material specification is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.dimensions.widthCm <= 0) errors.widthCm = 'Width must be greater than 0';
    if (formData.dimensions.heightCm <= 0) errors.heightCm = 'Height must be greater than 0';
    if (formData.dimensions.depthCm <= 0) errors.depthCm = 'Depth must be greater than 0';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: categories[0]?.id || 'living',
      basePrice: 29999,
      material: 'Solid Oak & Linen',
      brand: 'Atelier Living',
      description: 'Architecturally proportioned heirloom furniture crafted for contemporary living spaces.',
      dimensions: {
        widthCm: 180,
        heightCm: 80,
        depthCm: 90,
      },
      status: 'ACTIVE',
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setActiveProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      categoryId: p.categoryId,
      basePrice: p.basePrice,
      material: p.material,
      brand: p.brand || 'Atelier Living',
      description: p.description,
      dimensions: {
        widthCm: p.dimensions.widthCm,
        heightCm: p.dimensions.heightCm,
        depthCm: p.dimensions.depthCm,
      },
      status: (p.status as any) || 'ACTIVE',
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  // Open Image Modal
  const handleOpenImages = (p: Product) => {
    setActiveProduct(p);
    setNewImageUrl('');
    setNewImageAlt(p.name);
    setNewImageViewType('FRONT');
    setNewImagePrimary(p.images.length === 0);
    setIsImagesOpen(true);
  };

  // Open 3D Model Modal
  const handleOpenModel = (p: Product) => {
    setActiveProduct(p);
    setModelFormData({
      modelUrl: p.model3D?.modelUrl || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb',
      thumbnailUrl: p.model3D?.thumbnailUrl || p.images[0]?.imageUrl || '',
      format: p.model3D?.format || 'glb',
      widthCm: p.dimensions.widthCm,
      heightCm: p.dimensions.heightCm,
      depthCm: p.dimensions.depthCm,
      status: 'ACTIVE',
    });
    setIsModelOpen(true);
  };

  // Save New Product
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let created: Product;
      try {
        created = await adminApi.createProduct(formData);
      } catch {
        // Fallback local addition
        created = {
          id: `prod-${Date.now()}`,
          name: formData.name,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
          description: formData.description,
          sku: formData.sku,
          categoryId: formData.categoryId,
          categoryName: categories.find((c) => c.id === formData.categoryId)?.name || 'Living Room',
          basePrice: formData.basePrice,
          material: formData.material,
          brand: formData.brand || 'Atelier Signature',
          dimensions: {
            widthCm: formData.dimensions.widthCm,
            heightCm: formData.dimensions.heightCm,
            depthCm: formData.dimensions.depthCm,
          },
          images: [
            {
              id: `img-${Date.now()}`,
              imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
              altText: formData.name,
              sortOrder: 1,
              isPrimary: true,
            },
          ],
          variants: [],
          model3D: {
            id: `mdl-${Date.now()}`,
            modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb',
            format: 'glb',
            widthCm: formData.dimensions.widthCm,
            heightCm: formData.dimensions.heightCm,
            depthCm: formData.dimensions.depthCm,
            version: 1,
          },
          status: (formData.status as any) || 'ACTIVE',
          rating: 5.0,
          reviewCount: 0,
          availableOnline: true,
          arSupported: true,
        };
      }

      setProducts((prev) => [created, ...prev]);
      setIsCreateOpen(false);
      showToast(`Product "${formData.name}" created successfully.`);
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Failed to create product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edited Product
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !validateForm()) return;

    setIsSubmitting(true);
    try {
      try {
        await adminApi.updateProduct(activeProduct.id, formData);
      } catch (err) {
        console.warn('Backend update failed, applying local state update');
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === activeProduct.id
            ? {
                ...p,
                name: formData.name,
                sku: formData.sku,
                categoryId: formData.categoryId,
                categoryName: categories.find((c) => c.id === formData.categoryId)?.name || p.categoryName,
                basePrice: formData.basePrice,
                material: formData.material,
                brand: formData.brand || 'Atelier Signature',
                description: formData.description,
                dimensions: {
                  widthCm: formData.dimensions.widthCm,
                  heightCm: formData.dimensions.heightCm,
                  depthCm: formData.dimensions.depthCm,
                },
                status: (formData.status as any) || p.status,
              }
            : p
        )
      );

      setIsEditOpen(false);
      showToast(`Product "${formData.name}" updated successfully.`);
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Failed to update product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteConfirm = async () => {
    if (!activeProduct) return;
    setIsSubmitting(true);
    try {
      try {
        await adminApi.deleteProduct(activeProduct.id);
      } catch (err) {
        console.warn('Backend delete failed, applying local state update');
      }

      setProducts((prev) => prev.filter((p) => p.id !== activeProduct.id));
      setIsDeleteOpen(false);
      showToast(`Product "${activeProduct.name}" deleted.`);
    } catch (err: any) {
      showToast(`Error deleting product: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (p: Product) => {
    const nextStatus = p.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    try {
      try {
        await adminApi.updateProductStatus(p.id, nextStatus);
      } catch {}

      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, status: nextStatus } : item))
      );
      showToast(`Product status updated to ${nextStatus}.`);
    } catch (err: any) {
      showToast(`Failed to update status: ${err.message}`);
    }
  };

  // Add Image to Product
  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !newImageUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: AddImagePayload = {
        imageUrl: newImageUrl.trim(),
        altText: newImageAlt.trim() || activeProduct.name,
        viewType: newImageViewType,
        isPrimary: newImagePrimary,
      };

      try {
        await adminApi.addProductImage(activeProduct.id, payload);
      } catch {}

      const newImg: ProductImage = {
        id: `img-${Date.now()}`,
        imageUrl: payload.imageUrl,
        altText: payload.altText || activeProduct.name,
        sortOrder: activeProduct.images.length + 1,
        isPrimary: !!payload.isPrimary,
      };

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== activeProduct.id) return p;
          const updatedImages = payload.isPrimary
            ? p.images.map((img) => ({ ...img, isPrimary: false })).concat(newImg)
            : p.images.concat(newImg);
          return { ...p, images: updatedImages };
        })
      );

      setActiveProduct((prev) =>
        prev
          ? {
              ...prev,
              images: payload.isPrimary
                ? prev.images.map((img) => ({ ...img, isPrimary: false })).concat(newImg)
                : prev.images.concat(newImg),
            }
          : null
      );

      setNewImageUrl('');
      showToast('Image successfully attached to product.');
    } catch (err: any) {
      showToast(`Failed to add image: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save 3D Model
  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !modelFormData.modelUrl.trim()) return;

    setIsSubmitting(true);
    try {
      try {
        await adminApi.saveProductModel(activeProduct.id, modelFormData);
      } catch {}

      const formatValue: "glb" | "gltf" = (modelFormData.format === "gltf" ? "gltf" : "glb");

      setProducts((prev) =>
        prev.map((p) =>
          p.id === activeProduct.id
            ? {
                ...p,
                model3D: {
                  id: p.model3D?.id || `mdl-${Date.now()}`,
                  modelUrl: modelFormData.modelUrl,
                  thumbnailUrl: modelFormData.thumbnailUrl,
                  format: formatValue,
                  widthCm: modelFormData.widthCm,
                  heightCm: modelFormData.heightCm,
                  depthCm: modelFormData.depthCm,
                  version: p.model3D?.version ? p.model3D.version + 1 : 1,
                },
              }
            : p
        )
      );

      setIsModelOpen(false);
      showToast(`3D GLB Model metadata associated with "${activeProduct.name}".`);
    } catch (err: any) {
      showToast(`Failed to save 3D model: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.material.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      p.categoryId.toLowerCase() === selectedCategory.toLowerCase() ||
      p.categoryName?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStatus =
      statusFilter === 'all' || (p.status || 'ACTIVE').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="py-6 sm:py-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-6">
        
        {/* Toast Notification */}
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
              <span className="text-xs font-semibold text-[#24211E]">Products</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E]">
              Product Catalog & 3D AR Models
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/categories">
              <Button variant="outline" size="md" className="text-xs gap-1.5">
                <Layers className="w-4 h-4 text-[#8B5E3C]" />
                <span>Categories</span>
              </Button>
            </Link>

            <Button
              variant="primary"
              size="md"
              className="gap-2 text-xs font-semibold shadow-md"
              onClick={handleOpenCreate}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </Button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-4 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#9B958E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, SKU, or material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] placeholder:text-[#9B958E] focus:outline-none focus:border-[#8B5E3C]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#6F6A64]">
              <Filter className="w-3.5 h-3.5 text-[#8B5E3C]" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] px-3 py-2 text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
              >
                <option value="all">All Categories ({products.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] px-3 py-2 text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-12 text-center shadow-card space-y-3">
            <Boxes className="w-10 h-10 text-[#9B958E] mx-auto" />
            <h3 className="font-serif text-lg font-medium text-[#24211E]">No Products Match Filter</h3>
            <p className="text-xs text-[#6F6A64]">Try adjusting your search query or category filter criteria.</p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setStatusFilter('all'); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => {
              const has3D = !!p.model3D?.modelUrl;
              const isActive = (p.status || 'ACTIVE') === 'ACTIVE';

              return (
                <div
                  key={p.id}
                  className="bg-white border border-[#E5E0DA] rounded-[16px] p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Image & Badges */}
                    <div className="relative aspect-[4/3] rounded-[12px] bg-[#F4F2EF] overflow-hidden border border-[#E5E0DA]">
                      <img
                        src={p.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {has3D && (
                          <Badge variant="ar" size="sm">
                            <Box className="w-3 h-3" />
                            3D GLB Ready
                          </Badge>
                        )}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px] border ${
                            isActive
                              ? 'bg-[#2F7D50]/10 text-[#2F7D50] border-[#2F7D50]/20'
                              : 'bg-[#9B958E]/20 text-[#6F6A64] border-[#9B958E]/30'
                          }`}
                        >
                          {p.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-[8px] p-1 border border-[#E5E0DA]">
                        <button
                          onClick={() => handleOpenImages(p)}
                          className="p-1 text-[#6F6A64] hover:text-[#8B5E3C] transition cursor-pointer"
                          title="Manage Photo Gallery"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenModel(p)}
                          className="p-1 text-[#6F6A64] hover:text-[#8B5E3C] transition cursor-pointer"
                          title="Manage 3D GLB Model"
                        >
                          <Box className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Meta */}
                    <div>
                      <span className="text-[11px] font-semibold text-[#8B5E3C] uppercase tracking-wider">
                        {p.categoryName || 'Living'} • SKU: {p.sku}
                      </span>
                      <h3 className="font-serif text-lg font-medium text-[#24211E] mt-0.5">
                        {p.name}
                      </h3>
                    </div>

                    {/* Spec Box */}
                    <div className="p-3 rounded-[10px] bg-[#FAF9F7] border border-[#E5E0DA] text-[11px] text-[#6F6A64] space-y-1">
                      <p className="flex justify-between">
                        <span>Dimensions (W×H×D):</span>
                        <strong className="text-[#24211E]">
                          {p.dimensions.widthCm} × {p.dimensions.heightCm} × {p.dimensions.depthCm} cm
                        </strong>
                      </p>
                      <p className="flex justify-between">
                        <span>Material:</span>
                        <strong className="text-[#24211E]">{p.material}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span>Base Price:</span>
                        <strong className="text-[#8B5E3C] font-semibold">{formatPrice(p.basePrice)}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-3 border-t border-[#E5E0DA] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(p)}
                        className="text-xs gap-1 px-2.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(p)}
                        className={`text-xs px-2 ${isActive ? 'text-[#C78A24]' : 'text-[#2F7D50]'}`}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Link href={`/visualize/${p.id}`} title="Test in 3D Studio">
                        <Button variant="ghost" size="sm" className="p-2 text-[#8B5E3C]">
                          <Box className="w-4 h-4" />
                        </Button>
                      </Link>

                      <button
                        onClick={() => {
                          setActiveProduct(p);
                          setIsDeleteOpen(true);
                        }}
                        className="p-2 text-[#9B958E] hover:text-[#C84B4B] transition cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create Product */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Architectural Product"
          className="max-w-2xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {formErrors.submit && (
              <div className="p-3 bg-[#C84B4B]/10 border border-[#C84B4B]/20 rounded-[10px] text-xs text-[#C84B4B] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formErrors.submit}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kanso Minimalist 3-Seater Sofa"
                  className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                />
                {formErrors.name && <p className="text-[10px] text-[#C84B4B] mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                  SKU Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. SOFA-KANSO-01"
                  className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] font-mono focus:outline-none focus:border-[#8B5E3C]"
                />
                {formErrors.sku && <p className="text-[10px] text-[#C84B4B] mt-1">{formErrors.sku}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                  Base Price (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                />
                {formErrors.basePrice && <p className="text-[10px] text-[#C84B4B] mt-1">{formErrors.basePrice}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                  Primary Material *
                </label>
                <input
                  type="text"
                  required
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="e.g. Solid White Oak & Belgian Linen"
                  className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                  Brand / Studio Line
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g. Atelier Living"
                  className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            {/* Dimensions Grid */}
            <div className="p-4 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[12px] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B5E3C]">
                3D CAD Dimensions (Centimeters)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#6F6A64] mb-1">Width (cm)</label>
                  <input
                    type="number"
                    value={formData.dimensions.widthCm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, widthCm: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#6F6A64] mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={formData.dimensions.heightCm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, heightCm: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#6F6A64] mb-1">Depth (cm)</label>
                  <input
                    type="number"
                    value={formData.dimensions.depthCm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, depthCm: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed craftsmanship, joinery, and ergonomic specifications..."
                className="w-full p-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C] resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Create Product
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Edit Product */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Product: ${activeProduct?.name || ''}`}
          className="max-w-2xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {formErrors.submit && (
              <div className="p-3 bg-[#C84B4B]/10 border border-[#C84B4B]/20 rounded-[10px] text-xs text-[#C84B4B]">
                {formErrors.submit}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                  Product Name *
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
                  SKU Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] font-mono focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                  Base Price (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                  Primary Material *
                </label>
                <input
                  type="text"
                  required
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                  Catalog Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                >
                  <option value="ACTIVE">ACTIVE (Published in Storefront)</option>
                  <option value="DRAFT">DRAFT (Hidden from Storefront)</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>

            {/* Dimensions Grid */}
            <div className="p-4 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[12px] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B5E3C]">
                3D CAD Dimensions (Centimeters)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#6F6A64] mb-1">Width (cm)</label>
                  <input
                    type="number"
                    value={formData.dimensions.widthCm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, widthCm: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#6F6A64] mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={formData.dimensions.heightCm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, heightCm: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#6F6A64] mb-1">Depth (cm)</label>
                  <input
                    type="number"
                    value={formData.dimensions.depthCm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, depthCm: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C] resize-none"
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

        {/* Modal: Delete Confirmation */}
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Delete Architectural Product"
          className="max-w-sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-[#6F6A64]">
              Are you sure you want to permanently delete <strong className="text-[#24211E]">{activeProduct?.name}</strong>? This action removes product listings, photo references, and linked 3D asset bindings.
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
                Delete Product
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal: Manage Images */}
        <Modal
          isOpen={isImagesOpen}
          onClose={() => setIsImagesOpen(false)}
          title={`Product Images: ${activeProduct?.name || ''}`}
          className="max-w-xl"
        >
          <div className="space-y-6">
            {/* Existing Images */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#24211E]">
                Attached Gallery Images ({activeProduct?.images.length || 0})
              </span>
              <div className="grid grid-cols-3 gap-3">
                {activeProduct?.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-[10px] border border-[#E5E0DA] overflow-hidden bg-[#FAF9F7] group"
                  >
                    <img src={img.imageUrl} alt={img.altText || ''} className="w-full h-full object-cover" />
                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 bg-[#8B5E3C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        PRIMARY
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Attach New Image Form */}
            <form onSubmit={handleAddImage} className="p-4 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[12px] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8B5E3C]">
                Attach Photo Asset
              </span>
              <div>
                <label className="block text-[11px] text-[#6F6A64] mb-1">Image URL (CloudFront / S3 CDN) *</label>
                <input
                  type="url"
                  required
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full h-9 px-3 bg-white border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#6F6A64] mb-1">View Perspective</label>
                  <select
                    value={newImageViewType}
                    onChange={(e) => setNewImageViewType(e.target.value)}
                    className="w-full h-9 px-2.5 bg-white border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E]"
                  >
                    <option value="FRONT">Front Profile</option>
                    <option value="PERSPECTIVE">Perspective Angle</option>
                    <option value="ROOM_CONTEXT">In-Room Styling</option>
                    <option value="MATERIAL_DETAIL">Material Close-up</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isPrimaryCheck"
                    checked={newImagePrimary}
                    onChange={(e) => setNewImagePrimary(e.target.checked)}
                    className="rounded text-[#8B5E3C]"
                  />
                  <label htmlFor="isPrimaryCheck" className="text-xs text-[#24211E] font-medium cursor-pointer">
                    Set as Primary Thumbnail
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Attach Image
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Modal: Manage 3D AR Model */}
        <Modal
          isOpen={isModelOpen}
          onClose={() => setIsModelOpen(false)}
          title={`3D AR Model Configuration: ${activeProduct?.name || ''}`}
          className="max-w-xl"
        >
          <form onSubmit={handleSaveModel} className="space-y-4">
            <div className="p-3 bg-[#F3E8DE]/60 border border-[#8B5E3C]/20 rounded-[10px] text-xs text-[#8B5E3C] space-y-1">
              <span className="font-bold uppercase tracking-wider block">Real-Time AR & WebGL Rendering</span>
              <p className="text-[11px] text-[#6F6A64]">
                GlTF Binary (.glb) format is utilized for interactive 3D studio visualization, raytraced shadow casting, and WebXR browser room previews.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#24211E] mb-1">
                3D GLB Model Asset URL *
              </label>
              <input
                type="url"
                required
                value={modelFormData.modelUrl}
                onChange={(e) => setModelFormData({ ...modelFormData, modelUrl: e.target.value })}
                placeholder="https://cdn.example.com/models/sofa.glb"
                className="w-full h-10 px-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] font-mono focus:outline-none focus:border-[#8B5E3C]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-[#6F6A64] mb-1">Width (cm)</label>
                <input
                  type="number"
                  value={modelFormData.widthCm}
                  onChange={(e) => setModelFormData({ ...modelFormData, widthCm: parseFloat(e.target.value) || 0 })}
                  className="w-full h-9 px-2.5 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#6F6A64] mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={modelFormData.heightCm}
                  onChange={(e) => setModelFormData({ ...modelFormData, heightCm: parseFloat(e.target.value) || 0 })}
                  className="w-full h-9 px-2.5 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#6F6A64] mb-1">Depth (cm)</label>
                <input
                  type="number"
                  value={modelFormData.depthCm}
                  onChange={(e) => setModelFormData({ ...modelFormData, depthCm: parseFloat(e.target.value) || 0 })}
                  className="w-full h-9 px-2.5 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E]"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {activeProduct && (
                <Link href={`/visualize/${activeProduct.id}`} target="_blank">
                  <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5">
                    <Box className="w-3.5 h-3.5 text-[#8B5E3C]" />
                    <span>Launch 3D Studio Test</span>
                  </Button>
                </Link>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsModelOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Save 3D Model
                </Button>
              </div>
            </div>
          </form>
        </Modal>

      </div>
    </div>
  );
}
