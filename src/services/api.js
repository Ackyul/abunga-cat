export const fetchProducts = async () => {
  const response = await fetch("https://6952d479a319a928023a15f1.mockapi.io/Productos");
  if (!response.ok) {
    throw new Error("Error al cargar los productos");
  }
  return await response.json();
};
