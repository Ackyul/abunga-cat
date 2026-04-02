import { useEffect } from "react";
import ProductCard from "./product-card";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import useProductStore from "../stores/useProductStore";

function Products() {
  const { 
    getProducts, 
    loading, 
    error, 
    visibleCount, 
    setVisibleCount, 
    getFilteredProducts 
  } = useProductStore();

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  const handleLoadMore = () => {
    setVisibleCount(5);
  };

  if (loading) {
     return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-[#95b721]" /></div>;
  }

  if (error) {
      return <div className="text-center p-12 text-red-500 font-bold">{error}</div>;
  }

  const filtered = getFilteredProducts();
  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="flex flex-col items-center space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 w-full">
        {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
        ))}
        {visibleProducts.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-12">
            No se encontraron productos con los filtros seleccionados.
          </div>
        )}
        </div>

        {hasMore && (
            <Button 
                onClick={handleLoadMore}
                className="bg-[#95b721] hover:bg-[#84a31d] text-white font-bold rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            >
                Ver más
            </Button>
        )}
    </div>
  );
}

export default Products;
