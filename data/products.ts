export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  sku: string;
  stock: number;
  image: string;
  description: string;
  dimensions: string;
  variants?: string[];
};

export const products: Product[] = [
  {
    id: "rhl-001",
    name: "Nordic Minimalist Romantic Couple Sculpture with Moon Night Lamp",
    category: "Lamps",
    price: 2499,
    sku: "RHL-001",
    stock: 8,
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=85",
    description: "A poetic sculptural lamp that blends soft ambience with modern minimalist form.",
    dimensions: "Approx. 30 × 18 × 42 cm",
    variants: ["Warm White", "Cool White"]
  },
  {
    id: "rhf-003",
    name: "Abstract Praying Head Sculpture",
    category: "Sculptures",
    price: 1899,
    sku: "RHF-003",
    stock: 12,
    image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=85",
    description: "A refined abstract sculpture designed to add a quiet artistic focal point.",
    dimensions: "Approx. 24 × 19 × 38 cm",
    variants: ["Gold", "Black", "White"]
  },
  {
    id: "rhl-002",
    name: "Thinking Human Lamp",
    category: "Lamps",
    price: 2999,
    sku: "RHL-002",
    stock: 5,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
    description: "A sculptural lighting piece that combines character, ambience, and contemporary design.",
    dimensions: "Approx. 28 × 20 × 45 cm",
    variants: ["Black", "Gold"]
  },
  {
    id: "rhl-003",
    name: "Playful Love Bear Ceramic Ornament",
    category: "Ornaments",
    price: 1299,
    sku: "RHL-003",
    stock: 18,
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=85",
    description: "A charming ceramic accent for shelves, consoles, bedside tables, and gifting.",
    dimensions: "Approx. 16 × 12 × 25 cm",
    variants: ["Cream", "Black", "Gold", "Red"]
  },
  {
    id: "ms-001",
    name: "Elegant Wine Holder",
    category: "Wine Holders",
    price: 1599,
    sku: "MSO-001",
    stock: 7,
    image: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=900&q=85",
    description: "A sculptural tabletop wine holder that turns entertaining into a design moment.",
    dimensions: "Approx. 28 × 12 × 24 cm",
    variants: ["Gold", "Black"]
  },
  {
    id: "rhf-006",
    name: "Knight Warrior Decorative Sculpture",
    category: "Figurines",
    price: 2199,
    sku: "RHF-006",
    stock: 3,
    image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=85",
    description: "A strong statement piece with an elegant silhouette for sophisticated interiors.",
    dimensions: "Approx. 18 × 15 × 40 cm",
    variants: ["Black", "Gold"]
  },
  {
    id: "rfl-001",
    name: "Modern Geometric Flamingo Decor Statue",
    category: "Figurines",
    price: 1799,
    sku: "RFL-001",
    stock: 9,
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=85",
    description: "A playful geometric silhouette designed to add personality without visual clutter.",
    dimensions: "Approx. 22 × 13 × 36 cm",
    variants: ["Gold", "White", "Black"]
  },
  {
    id: "clock-001",
    name: "GBP Minimalist Wall Clock",
    category: "Wall Decor",
    price: 2299,
    sku: "CLK-001",
    stock: 6,
    image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85",
    description: "A clean wall accent designed for modern, calm, and elegant interiors.",
    dimensions: "Approx. 45 cm diameter",
    variants: ["Midnight Blue", "Gold"]
  }
];