export const fetchProducts = async () => {
  const response = await fetch("/api/products");
  if (!response.ok) {
    throw new Error("Error al cargar los productos");
  }
  return await response.json();
};

export const fetchNews = async () => {
  const response = await fetch("/api/news");
  if (!response.ok) {
    throw new Error("Error al cargar las noticias");
  }
  return await response.json();
};
