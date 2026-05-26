export const categories = [
  { id: 'pesticides', name: 'Pesticides', image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8dd?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 'seeds', name: 'Seeds', image: 'https://images.unsplash.com/photo-1593111774640-36b1f28b4952?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 'fertilizers', name: 'Fertilizers', image: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=200&h=200' },
];

export const products = [
  // Pesticides
  { id: 'p1', categoryId: 'pesticides', name: 'Sumiprempt, Insecticide, 500 ml', originalPrice: 1525, price: 860, image: 'https://images.unsplash.com/photo-1584483756858-40618035b1c5?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 'p2', categoryId: 'pesticides', name: 'Yoro, Pesticide, 100 gm', originalPrice: 1450, price: 700, image: 'https://images.unsplash.com/photo-1605330836569-8db6db71597f?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 'p3', categoryId: 'pesticides', name: 'Monostar, Insecticide', originalPrice: 800, price: 500, image: 'https://images.unsplash.com/photo-1584483756858-40618035b1c5?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 'p4', categoryId: 'pesticides', name: 'Profenofos 40% + Cypermethrin', originalPrice: 950, price: 620, image: 'https://images.unsplash.com/photo-1605330836569-8db6db71597f?auto=format&fit=crop&q=80&w=200&h=200' },
  
  // Fertilizers
  { id: 'f1', categoryId: 'fertilizers', name: 'Agromin Gold, Micronutrients, 1kg', originalPrice: 400, price: 320, image: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 'f2', categoryId: 'fertilizers', name: 'Urea Fertilizer 50kg Bag', originalPrice: 1200, price: 1050, image: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=200&h=200' },
  
  // Seeds
  { id: 's1', categoryId: 'seeds', name: 'Hybrid Cotton Seeds, 450g', originalPrice: 850, price: 750, image: 'https://images.unsplash.com/photo-1593111774640-36b1f28b4952?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 's2', categoryId: 'seeds', name: 'Tomato Seeds High Yield', originalPrice: 200, price: 150, image: 'https://images.unsplash.com/photo-1593111774640-36b1f28b4952?auto=format&fit=crop&q=80&w=200&h=200' },
];

export const getProductsByCategory = (categoryId) => {
  return products.filter(p => p.categoryId === categoryId);
};

export const getTrendingProducts = () => {
  return products.slice(0, 4);
};

export const getMostPurchased = () => {
  return [products[4], products[0], products[3], products[6]];
};
