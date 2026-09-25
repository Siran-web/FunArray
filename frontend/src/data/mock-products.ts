import { Product } from "@/types/product";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  itemCount: number;
  imageUrl: string;
  featured?: boolean;
}

export interface ShowroomLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  timing: string;
  hasArStudio: boolean;
}

export interface Testimonial {
  id: string;
  author: string;
  city: string;
  rating: number;
  productName: string;
  reviewTitle: string;
  comment: string;
  arUsed: boolean;
  date: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: "cat-1",
    name: "Living Room",
    slug: "living-room",
    description: "Modular sofas, handcrafted lounge chairs, and sculptural coffee tables.",
    itemCount: 48,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
    featured: true,
  },
  {
    id: "cat-2",
    name: "Dining & Kitchen",
    slug: "dining",
    description: "Solid oak and walnut dining tables, upholstered chairs, and credenzas.",
    itemCount: 34,
    imageUrl: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
    featured: true,
  },
  {
    id: "cat-3",
    name: "Bedroom",
    slug: "bedroom",
    description: "Platform beds, nightstands, and dressers built with architectural precision.",
    itemCount: 29,
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    featured: true,
  },
  {
    id: "cat-4",
    name: "Home Office",
    slug: "office",
    description: "Ergonomic leather chairs, solid timber writing desks, and shelving systems.",
    itemCount: 22,
    imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cat-5",
    name: "Lighting & Accents",
    slug: "lighting",
    description: "Warm architectural brass pendants, ceramic table lamps, and wool rugs.",
    itemCount: 41,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cat-6",
    name: "Outdoor & Patio",
    slug: "outdoor",
    description: "Weather-resistant teak loungers, concrete tables, and sun loungers.",
    itemCount: 18,
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  },
];

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: "prod-101",
    name: "Kanso 3-Seater Modular Sofa",
    slug: "kanso-3-seater-modular-sofa",
    description:
      "Deep-seated comfort paired with clean Japanese-Scandinavian lines. Features kiln-dried solid ash framing and high-resiliency foam cushions wrapped in natural Belgian linen.",
    brand: "FunArray Studio",
    basePrice: 58999,
    status: "ACTIVE",
    material: "Kiln-Dried Ash & Belgian Linen",
    dimensions: {
      widthCm: 225,
      heightCm: 82,
      depthCm: 95,
    },
    sku: "FA-SOF-101",
    categoryId: "cat-1",
    categoryName: "Living Room",
    rating: 4.9,
    reviewCount: 128,
    availableOnline: true,
    arSupported: true,
    images: [
      {
        id: "img-1",
        imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80",
        altText: "Kanso 3-Seater Modular Sofa in Oatmeal Linen",
        sortOrder: 0,
        isPrimary: true,
      },
      {
        id: "img-2",
        imageUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=80",
        altText: "Kanso 3-Seater Sofa room perspective",
        sortOrder: 1,
        isPrimary: false,
      },
    ],
    variants: [
      {
        id: "var-1",
        sku: "FA-SOF-101-OAT",
        color: "Oatmeal Linen",
        material: "Belgian Linen",
        price: 58999,
        stockQuantity: 8,
        status: "ACTIVE",
      },
      {
        id: "var-2",
        sku: "FA-SOF-101-CHA",
        color: "Charcoal Wool",
        material: "Virgin Wool",
        price: 62999,
        stockQuantity: 3,
        status: "ACTIVE",
      },
      {
        id: "var-3",
        sku: "FA-SOF-101-TER",
        color: "Terracotta Velvet",
        material: "Cotton Velvet",
        price: 64999,
        stockQuantity: 2,
        status: "ACTIVE",
      },
    ],
    model3D: {
      id: "mod-1",
      modelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb", // sample reliable test GLB
      format: "glb",
      widthCm: 225,
      heightCm: 82,
      depthCm: 95,
      version: 1,
    },
  },
  {
    id: "prod-102",
    name: "Neva Sculptural Lounge Chair",
    slug: "neva-sculptural-lounge-chair",
    description:
      "Hand-finished organic contours carved from American Black Walnut. Designed to cradle the body with ergonomic lumbar pitch and top-grain saddle leather.",
    brand: "Artisan Heritage",
    basePrice: 32499,
    status: "ACTIVE",
    material: "American Walnut & Full-Grain Leather",
    dimensions: {
      widthCm: 78,
      heightCm: 76,
      depthCm: 84,
    },
    sku: "FA-CHR-102",
    categoryId: "cat-1",
    categoryName: "Living Room",
    rating: 4.8,
    reviewCount: 94,
    availableOnline: true,
    arSupported: true,
    images: [
      {
        id: "img-3",
        imageUrl: "https://images.unsplash.com/photo-1580481077195-c3a821a58875?auto=format&fit=crop&w=1000&q=80",
        altText: "Neva Sculptural Lounge Chair in Walnut & Cognac Leather",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: "var-4",
        sku: "FA-CHR-102-COG",
        color: "Cognac Brown",
        material: "Saddle Leather",
        price: 32499,
        stockQuantity: 5,
        status: "ACTIVE",
      },
      {
        id: "var-5",
        sku: "FA-CHR-102-NOI",
        color: "Noir Black",
        material: "Aniline Leather",
        price: 34499,
        stockQuantity: 2,
        status: "ACTIVE",
      },
    ],
  },
  {
    id: "prod-103",
    name: "Soren Solid Oak Extendable Dining Table",
    slug: "soren-solid-oak-extendable-dining-table",
    description:
      "Crafted from solid European white oak with soft chamfered edges and an integrated butterfly extension leaf that expands from 6 to 10 guests effortlessly.",
    brand: "FunArray Studio",
    basePrice: 74999,
    status: "ACTIVE",
    material: "European White Oak",
    dimensions: {
      widthCm: 200,
      heightCm: 75,
      depthCm: 100,
    },
    sku: "FA-TBL-103",
    categoryId: "cat-2",
    categoryName: "Dining",
    rating: 4.9,
    reviewCount: 67,
    availableOnline: true,
    arSupported: true,
    images: [
      {
        id: "img-4",
        imageUrl: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=80",
        altText: "Soren Extendable Dining Table in Natural Oak",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: "var-6",
        sku: "FA-TBL-103-NAT",
        color: "Natural Matte Oak",
        material: "White Oak",
        price: 74999,
        stockQuantity: 4,
        status: "ACTIVE",
      },
      {
        id: "var-7",
        sku: "FA-TBL-103-SMK",
        color: "Smoked Dark Oak",
        material: "Fumed Oak",
        price: 78999,
        stockQuantity: 1,
        status: "ACTIVE",
      },
    ],
  },
  {
    id: "prod-104",
    name: "Astrid Low-Profile Platform Bed",
    slug: "astrid-low-profile-platform-bed",
    description:
      "A serene minimalist bed frame featuring an angled headboard upholstered in bouclé fabric, integrated solid timber floating ledges, and quiet slat support.",
    brand: "Nordic Atelier",
    basePrice: 68999,
    status: "ACTIVE",
    material: "Solid Teak & Bouclé Fabric",
    dimensions: {
      widthCm: 190,
      heightCm: 95,
      depthCm: 215,
    },
    sku: "FA-BED-104",
    categoryId: "cat-3",
    categoryName: "Bedroom",
    rating: 4.7,
    reviewCount: 52,
    availableOnline: true,
    arSupported: true,
    images: [
      {
        id: "img-5",
        imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80",
        altText: "Astrid Platform Bed in Teak Wood",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: "var-8",
        sku: "FA-BED-104-KNG",
        color: "Warm Teak / Ivory",
        material: "Solid Teak",
        price: 68999,
        stockQuantity: 6,
        status: "ACTIVE",
      },
    ],
  },
  {
    id: "prod-105",
    name: "Arkiv Walnut Credenza & Media Unit",
    slug: "arkiv-walnut-credenza-media-unit",
    description:
      "Slatted sliding tambour doors concealing smart cable routing, adjustable shelving, and brass-capped tapered legs. Hand-rubbed organic oil finish.",
    brand: "FunArray Studio",
    basePrice: 48999,
    status: "ACTIVE",
    material: "American Walnut & Brushed Brass",
    dimensions: {
      widthCm: 180,
      heightCm: 60,
      depthCm: 45,
    },
    sku: "FA-MED-105",
    categoryId: "cat-1",
    categoryName: "Living Room",
    rating: 4.9,
    reviewCount: 41,
    availableOnline: true,
    arSupported: true,
    images: [
      {
        id: "img-6",
        imageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1000&q=80",
        altText: "Arkiv Walnut Credenza with slatted tambour doors",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: "var-9",
        sku: "FA-MED-105-WAL",
        color: "Warm Walnut",
        material: "Walnut",
        price: 48999,
        stockQuantity: 3,
        status: "ACTIVE",
      },
    ],
  },
  {
    id: "prod-106",
    name: "Verre Elliptical Smoked Glass Coffee Table",
    slug: "verre-elliptical-smoked-glass-coffee-table",
    description:
      "Tempered 12mm smoked grey glass resting gently on three asymmetrical interlocking walnut pedestals. A sculptural focal point for light-filled rooms.",
    brand: "Artisan Heritage",
    basePrice: 28999,
    status: "ACTIVE",
    material: "Smoked Tempered Glass & Solid Walnut",
    dimensions: {
      widthCm: 130,
      heightCm: 38,
      depthCm: 70,
    },
    sku: "FA-COF-106",
    categoryId: "cat-1",
    categoryName: "Living Room",
    rating: 4.8,
    reviewCount: 38,
    availableOnline: true,
    arSupported: true,
    images: [
      {
        id: "img-7",
        imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80",
        altText: "Verre Coffee Table in Smoked Glass and Walnut",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: "var-10",
        sku: "FA-COF-106-SMK",
        color: "Smoked Grey / Walnut",
        material: "Glass & Timber",
        price: 28999,
        stockQuantity: 7,
        status: "ACTIVE",
      },
    ],
  },
];

export const SHOWROOMS: ShowroomLocation[] = [
  {
    id: "store-delhi",
    name: "Delhi Flagship Experience Center",
    city: "New Delhi",
    address: "Plot 14, Mehrauli-Gurgaon Road, Sultanpur, New Delhi 110030",
    phone: "+91 11 4987 6500",
    timing: "Open Daily: 10:00 AM – 8:00 PM",
    hasArStudio: true,
  },
  {
    id: "store-jalandhar",
    name: "Jalandhar Design Showroom",
    city: "Jalandhar",
    address: "Model Town Market, Near BMC Chowk, Jalandhar, Punjab 144001",
    phone: "+91 181 245 8890",
    timing: "Tue – Sun: 10:30 AM – 7:30 PM",
    hasArStudio: true,
  },
  {
    id: "store-chandigarh",
    name: "Chandigarh Showroom & Studio",
    city: "Chandigarh",
    address: "Sector 8-C, Madhya Marg, Chandigarh 160009",
    phone: "+91 172 501 3421",
    timing: "Open Daily: 10:00 AM – 8:00 PM",
    hasArStudio: false,
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    author: "Arjun & Priyanka M.",
    city: "New Delhi",
    rating: 5,
    productName: "Kanso 3-Seater Modular Sofa",
    reviewTitle: "The AR preview saved us from buying the wrong size!",
    comment:
      "We were worried a 3-seater would block the balcony sliding door. Using the 'View in My Room' photo feature, we placed the exact model against our wall. When the sofa arrived, it was identical down to the centimeter.",
    arUsed: true,
    date: "September 2026",
  },
  {
    id: "test-2",
    author: "Dr. Kabir Oberoi",
    city: "Jalandhar",
    rating: 5,
    productName: "Neva Lounge Chair",
    reviewTitle: "Saw it in the Jalandhar store, bought it online with confidence.",
    comment:
      "Visited the Model Town store, scanned the QR code by the chair, and tested the wood finish against my library lighting at home. Exceptional craftsmanship and seamless omnichannel service.",
    arUsed: true,
    date: "August 2026",
  },
  {
    id: "test-3",
    author: "Ananya Sengupta",
    city: "Gurugram",
    rating: 5,
    productName: "Soren Dining Table",
    reviewTitle: "Heirloom-grade solid timber and white-glove setup.",
    comment:
      "The delivery crew brought the table upstairs, assembled it with care, and cleaned up every piece of packaging. The European oak finish feels buttery smooth. Worth every rupee.",
    arUsed: false,
    date: "September 2026",
  },
];
