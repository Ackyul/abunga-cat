import { useState, useEffect, useRef } from "react";
import { Download, Upload, RefreshCw, Layers, ZoomIn, Move, FileText, Check } from "lucide-react";
import { toast } from "sonner";

export default function BannerGenerator({ products = [] }) {
  const canvasRef = useRef(null);
  
  // Opciones de control
  const [selectedProductId, setSelectedProductId] = useState("");
  const [layout, setLayout] = useState("publicidad"); // "publicidad" (izq/der), "centrado" (medio)
  const [bgStyle, setBgStyle] = useState("verde"); // "verde", "tropical", "limpio"
  
  const [title, setTitle] = useState("Snack Premium");
  const [subtitle, setSubtitle] = useState("Abunga - Snacks Naturales");
  const [price, setPrice] = useState("S/ 8.00"); // Precio de oferta
  const [originalPrice, setOriginalPrice] = useState("S/ 10.00"); // Precio anterior tachado
  const [badgeText, setBadgeText] = useState("100% NATURAL");
  const [extraText, setExtraText] = useState(""); // Texto personalizado adicional
  
  // Custom uploaded image or product image url
  const [productImgUrl, setProductImgUrl] = useState("");
  
  // Control de posición y tamaño de la imagen del producto
  const [imgScale, setImgScale] = useState(1.0);
  const [imgXOffset, setImgXOffset] = useState(0);
  const [imgYOffset, setImgYOffset] = useState(0);
  
  // Control de posición y tamaño del logo
  const [logoScale, setLogoScale] = useState(1.0);
  const [logoXOffset, setLogoXOffset] = useState(0);
  const [logoYOffset, setLogoYOffset] = useState(0);
  
  // Control de posición, tamaño, color y rotación individual para cada elemento de texto:
  // 1. TÍTULO
  const [titleSize, setTitleSize] = useState(68);
  const [titleXOffset, setTitleXOffset] = useState(0);
  const [titleYOffset, setTitleYOffset] = useState(0);
  const [titleColor, setTitleColor] = useState("#ffffff");

  // 2. SUBTÍTULO
  const [subtitleSize, setSubtitleSize] = useState(32);
  const [subtitleXOffset, setSubtitleXOffset] = useState(0);
  const [subtitleYOffset, setSubtitleYOffset] = useState(0);
  const [subtitleColor, setSubtitleColor] = useState("#f3f4f6");

  // 3. PRECIO
  const [priceSize, setPriceSize] = useState(90);
  const [priceXOffset, setPriceXOffset] = useState(0);
  const [priceYOffset, setPriceYOffset] = useState(0);
  const [priceColor, setPriceColor] = useState("#ffffff");

  // 4. SELLO (STICKER)
  const [badgeSize, setBadgeSize] = useState(24);
  const [badgeXOffset, setBadgeXOffset] = useState(0);
  const [badgeYOffset, setBadgeYOffset] = useState(0);
  const [badgeColor, setBadgeColor] = useState("#e24052"); // Rojo Abunga
  const [badgeTextColor, setBadgeTextColor] = useState("#ffffff");
  const [badgeRotation, setBadgeRotation] = useState(-10); // En grados
  
  // 5. PRECIO ANTERIOR TACHADO (PROMOCIÓN)
  const [originalPriceSize, setOriginalPriceSize] = useState(50);
  const [originalPriceXOffset, setOriginalPriceXOffset] = useState(0);
  const [originalPriceYOffset, setOriginalPriceYOffset] = useState(0);
  const [originalPriceColor, setOriginalPriceColor] = useState("#d1d5db");

  // 6. TEXTO EXTRA PERSONALIZADO
  const [extraTextSize, setExtraTextSize] = useState(36);
  const [extraTextXOffset, setExtraTextXOffset] = useState(0);
  const [extraTextYOffset, setExtraTextYOffset] = useState(0);
  const [extraTextColor, setExtraTextColor] = useState("#ffffff");
  
  // Estado para la pestaña de edición activa
  const [activeEditTab, setActiveEditTab] = useState("title");

  // Cargar imágenes en memoria para el Canvas
  const [logoImage, setLogoImage] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Efecto para ajustar automáticamente los colores por defecto según el fondo
  useEffect(() => {
    if (bgStyle === "limpio") {
      setTitleColor("#2c3e02"); // Verde oliva muy oscuro para buen contraste
      setSubtitleColor("#4d5f24"); 
      setPriceColor("#95b721"); // Verde corporativo
      setOriginalPriceColor("#78716c"); // Gris piedra oscuro
      setExtraTextColor("#1c1917"); // Casi negro
    } else if (bgStyle === "tropical") {
      setTitleColor("#ffffff");
      setSubtitleColor("#fef3c7"); // Crema
      setPriceColor("#ffffff");
      setOriginalPriceColor("#fed7aa"); // Naranja muy claro
      setExtraTextColor("#ffffff");
    } else { // "verde"
      setTitleColor("#ffffff");
      setSubtitleColor("#f3f4f6");
      setPriceColor(layout === "centrado" ? "#ffc700" : "#ffffff");
      setOriginalPriceColor("#d1d5db"); // Gris claro
      setExtraTextColor("#ffffff");
    }
  }, [bgStyle, layout]);


  // 1. Cargar el Logo de Abunga al iniciar
  useEffect(() => {
    const img = new Image();
    img.src = "/logo-abunga.png";
    img.onload = () => setLogoImage(img);
  }, []);

  // 2. Manejar selección de producto del catálogo
  useEffect(() => {
    if (selectedProductId) {
      const prod = products.find(p => String(p.id) === String(selectedProductId));
      if (prod) {
        setTitle(prod.name);
        setSubtitle(`${prod.brand || "Abunga"} - ${prod.tipo || "Snacks"}`);
        const formattedPrice = prod.precio ? `S/ ${Number(prod.precio).toFixed(2)}` : "S/ 10.00";
        setOriginalPrice(formattedPrice);
        // Sugerir un precio con 20% de descuento por defecto
        const discVal = prod.precio ? Number(prod.precio) * 0.8 : 8.00;
        setPrice(`S/ ${discVal.toFixed(2)}`);
        
        if (prod.image) {
          setProductImgUrl(prod.image);
        } else {
          setProductImgUrl("");
          setProductImage(null);
        }
      }
    }
  }, [selectedProductId, products]);

  // 3. Cargar la imagen del producto (URL o Local)
  useEffect(() => {
    if (productImgUrl) {
      const img = new Image();
      // Importantísimo para evitar error de seguridad CORS al exportar canvas
      img.crossOrigin = "anonymous";
      img.src = productImgUrl;
      img.onload = () => {
        setProductImage(img);
      };
      img.onerror = () => {
        console.error("No se pudo cargar la imagen del producto:", productImgUrl);
        setProductImage(null);
      };
    } else {
      setProductImage(null);
    }
  }, [productImgUrl]);

  useEffect(() => {
    drawCanvas();
  }, [
    logoImage, productImage, layout, bgStyle, 
    title, subtitle, price, originalPrice, badgeText, extraText,
    imgScale, imgXOffset, imgYOffset, 
    logoScale, logoXOffset, logoYOffset,
    titleSize, titleXOffset, titleYOffset, titleColor,
    subtitleSize, subtitleXOffset, subtitleYOffset, subtitleColor,
    priceSize, priceXOffset, priceYOffset, priceColor,
    badgeSize, badgeXOffset, badgeYOffset, badgeColor, badgeTextColor, badgeRotation,
    originalPriceSize, originalPriceXOffset, originalPriceYOffset, originalPriceColor,
    extraTextSize, extraTextXOffset, extraTextYOffset, extraTextColor
  ]);

  // Función principal de renderizado en Canvas (1080x1080 px para alta calidad)
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.clearRect(0, 0, 1080, 1080);

    // ── A. DIBUJAR FONDO ──
    if (bgStyle === "verde") {
      // Degradado verde clásico de Abunga
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      gradient.addColorStop(0, "#95b721");
      gradient.addColorStop(0.5, "#85a31d");
      gradient.addColorStop(1, "#6f8815");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // Líneas onduladas decorativas
      ctx.fillStyle = "rgba(188, 219, 66, 0.15)"; // #bcdb42 con opacidad
      ctx.beginPath();
      ctx.moveTo(0, 800);
      ctx.bezierCurveTo(300, 700, 700, 950, 1080, 750);
      ctx.lineTo(1080, 1080);
      ctx.lineTo(0, 1080);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.moveTo(0, 400);
      ctx.bezierCurveTo(400, 600, 600, 200, 1080, 450);
      ctx.lineTo(1080, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

    } else if (bgStyle === "tropical") {
      // Degradado de Tropical (Naranja - Amarillo)
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      gradient.addColorStop(0, "#ff6b00");
      gradient.addColorStop(0.6, "#ff9e00");
      gradient.addColorStop(1, "#ffc700");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // Círculos abstractos gigantes decorativos
      ctx.fillStyle = "rgba(162, 0, 135, 0.1)"; // Púrpura decorativo
      ctx.beginPath();
      ctx.arc(100, 900, 300, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.arc(950, 200, 200, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Limpio / Minimalista (Crema - Blanco con borde verde)
      ctx.fillStyle = "#faf9f6";
      ctx.fillRect(0, 0, 1080, 1080);

      // Marco verde elegante
      ctx.strokeStyle = "#95b721";
      ctx.lineWidth = 30;
      ctx.strokeRect(15, 15, 1050, 1050);

      // Esquinas curvas decorativas
      ctx.fillStyle = "rgba(149, 183, 33, 0.04)";
      ctx.beginPath();
      ctx.arc(0, 0, 350, 0, Math.PI * 0.5);
      ctx.fill();
    }

    // ── B. DIBUJAR LOGO (ARRIBA A LA DERECHA) ──
    if (logoImage) {
      // Logo Abunga en la esquina superior derecha
      const logoSize = 160 * logoScale;
      const logoX = 1080 - logoSize - 60 + logoXOffset;
      const logoY = 60 + logoYOffset;

      // Dibujar fondo blanco sutil para el logo para que resalte
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Recortar la imagen en un círculo perfecto (oculta el fondo cuadrado/ondulado original)
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
      ctx.restore();
    }

    // ── C. DIBUJAR IMAGEN DEL PRODUCTO ──
    if (productImage) {
      ctx.save();
      
      // Aplicar sombra premium al producto
      ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 15;

      let drawX = 0;
      let drawY = 0;
      let drawW = 0;
      let drawH = 0;

      // Calcular dimensiones proporcionales
      const imgRatio = productImage.width / productImage.height;
      const targetSize = 520 * imgScale; // Tamaño objetivo

      if (imgRatio > 1) {
        drawW = targetSize;
        drawH = targetSize / imgRatio;
      } else {
        drawW = targetSize * imgRatio;
        drawH = targetSize;
      }

      if (layout === "publicidad") {
        // En el layout publicitario, la imagen se posiciona en el lado izquierdo/centro
        drawX = 260 - drawW / 2 + imgXOffset;
        drawY = 540 - drawH / 2 + imgYOffset;
      } else {
        // En el layout centrado, la imagen se posiciona en el centro del banner
        drawX = 540 - drawW / 2 + imgXOffset;
        drawY = 480 - drawH / 2 + imgYOffset;
      }

      ctx.drawImage(productImage, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      // Indicador de imagen vacía
      ctx.save();
      ctx.fillStyle = bgStyle === "limpio" ? "rgba(0,0,0,0.05)" : "rgba(255, 255, 255, 0.1)";
      ctx.strokeStyle = bgStyle === "limpio" ? "rgba(0,0,0,0.1)" : "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 10]);

      let rectX = 0, rectY = 0, rectW = 400, rectH = 400;
      if (layout === "publicidad") {
        rectX = 80;
        rectY = 340;
      } else {
        rectX = 340;
        rectY = 280;
      }

      ctx.beginPath();
      ctx.roundRect(rectX, rectY, rectW, rectH, 30);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = bgStyle === "limpio" ? "rgba(0,0,0,0.3)" : "rgba(255, 255, 255, 0.5)";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Sin Imagen", rectX + rectW / 2, rectY + rectH / 2 + 10);
      ctx.restore();
    }

    // ── D. DIBUJAR TEXTOS ──
    ctx.save();
    
    // Configurar fuentes y suavizado
    ctx.textBaseline = "top";

    if (layout === "publicidad") {
      // --- LAYOUT PUBLICIDAD: TEXTOS A LA DERECHA ---

      // 1. Subtítulo (Marca/Categoría)
      ctx.fillStyle = subtitleColor;
      ctx.font = `800 ${subtitleSize}px sans-serif`;
      const subX = 560 + subtitleXOffset;
      const subY = 390 + subtitleYOffset;
      ctx.fillText(subtitle.toUpperCase(), subX, subY);

      // 2. Título del Producto (con salto de línea si es largo)
      ctx.fillStyle = titleColor;
      ctx.font = `900 ${titleSize}px sans-serif`;
      const titleX = 560 + titleXOffset;
      let startY = 440 + titleYOffset;
      
      const words = title.split(" ");
      let line = "";

      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + " ";
        let metrics = ctx.measureText(testLine);
        if (metrics.width > 480 && n > 0) {
          ctx.fillText(line, titleX, startY);
          line = words[n] + " ";
          startY += titleSize + 12; // Espaciado proporcional al tamaño
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, titleX, startY);

      // 3. Precio anterior tachado (si existe)
      if (originalPrice.trim()) {
        ctx.save();
        ctx.fillStyle = originalPriceColor;
        ctx.font = `700 ${originalPriceSize}px sans-serif`;
        const opX = 560 + originalPriceXOffset;
        const opY = startY + 50 + originalPriceYOffset;
        ctx.fillText(originalPrice, opX, opY);
        
        // Dibujar línea de tachado
        const textWidth = ctx.measureText(originalPrice).width;
        ctx.strokeStyle = originalPriceColor;
        ctx.lineWidth = Math.max(2, originalPriceSize / 15);
        ctx.beginPath();
        const lineY = opY + originalPriceSize * 0.45;
        ctx.moveTo(opX, lineY);
        ctx.lineTo(opX + textWidth, lineY);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Precio grande destacado
      const priceX = 560 + priceXOffset;
      const priceY = startY + 110 + priceYOffset;
      ctx.fillStyle = priceColor;
      ctx.font = `900 ${priceSize}px sans-serif`;
      ctx.fillText(price, priceX, priceY);

    } else {
      // --- LAYOUT CENTRADO: TEXTOS AL PIE ---
      // 1. Título Centrado
      ctx.fillStyle = titleColor;
      ctx.font = `900 ${titleSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(title, 540 + titleXOffset, 780 + titleYOffset);

      // 2. Subtítulo Centrado
      ctx.fillStyle = subtitleColor;
      ctx.font = `700 ${subtitleSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(subtitle, 540 + subtitleXOffset, 865 + subtitleYOffset);

      // 3. Precio anterior tachado centrado (si existe)
      if (originalPrice.trim()) {
        ctx.save();
        ctx.fillStyle = originalPriceColor;
        ctx.font = `700 ${originalPriceSize}px sans-serif`;
        ctx.textAlign = "center";
        const opX = 540 + originalPriceXOffset;
        const opY = 920 + originalPriceYOffset - 55;
        ctx.fillText(originalPrice, opX, opY);
        
        // Dibujar línea de tachado centrada
        const textWidth = ctx.measureText(originalPrice).width;
        ctx.strokeStyle = originalPriceColor;
        ctx.lineWidth = Math.max(2, originalPriceSize / 15);
        ctx.beginPath();
        const lineY = opY + originalPriceSize * 0.45;
        ctx.moveTo(opX - textWidth / 2, lineY);
        ctx.lineTo(opX + textWidth / 2, lineY);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Precio Centrado
      ctx.fillStyle = priceColor;
      ctx.font = `900 ${priceSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(price, 540 + priceXOffset, 920 + priceYOffset);
    }

    ctx.restore();

    // ── E. DIBUJAR BADGE / SELLO (STICKER REDONDEADO) ──
    if (badgeText.trim()) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 6;

      ctx.fillStyle = badgeColor;
      ctx.font = `900 ${badgeSize}px sans-serif`;
      const textWidth = ctx.measureText(badgeText).width;
      
      const badgeW = textWidth + 40;
      const badgeH = badgeSize + 30; // Altura proporcional al tamaño del texto
      
      let bx = 0;
      let by = 0;
      let rotateAngle = (badgeRotation * Math.PI) / 180;

      if (layout === "publicidad") {
        bx = 560 + badgeXOffset;
        by = 310 + badgeYOffset;
      } else {
        bx = 100 + badgeXOffset;
        by = 150 + badgeYOffset;
      }

      ctx.translate(bx + badgeW / 2, by + badgeH / 2);
      ctx.rotate(rotateAngle);
      
      ctx.beginPath();
      ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, (badgeSize + 30) / 3);
      ctx.fill();

      ctx.fillStyle = badgeTextColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${badgeSize}px sans-serif`;
      ctx.fillText(badgeText.toUpperCase(), 0, 1);
      ctx.restore();
    }

    // ── F. DIBUJAR TEXTO EXTRA / PERSONALIZADO ──
    if (extraText.trim()) {
      ctx.save();
      ctx.fillStyle = extraTextColor;
      ctx.font = `bold ${extraTextSize}px sans-serif`;
      
      let ex = 560 + extraTextXOffset;
      let ey = 660 + extraTextYOffset;

      if (layout === "centrado") {
        ctx.textAlign = "center";
        ex = 540 + extraTextXOffset;
        ey = 1000 + extraTextYOffset;
      }

      ctx.fillText(extraText, ex, ey);
      ctx.restore();
    }

    setIsDrawing(false);
  };

  // Subir imagen local desde el ordenador
  const handleLocalImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("El archivo seleccionado debe ser una imagen.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProductImgUrl(event.target.result);
        setSelectedProductId(""); // Limpiar selección de catálogo
      }
    };
    reader.readAsDataURL(file);
  };

  // Descargar imagen generada
  const handleDownload = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `abunga-post-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataURL;
      link.click();
      toast.success("¡Imagen descargada con éxito!");
    } catch (err) {
      console.error(err);
      toast.error("Error al exportar la imagen. Verifica el origen de la imagen del producto (CORS).");
    }
  };

  const resetCurrentTab = () => {
    switch (activeEditTab) {
      case "title":
        setTitleSize(68);
        setTitleXOffset(0);
        setTitleYOffset(0);
        break;
      case "subtitle":
        setSubtitleSize(32);
        setSubtitleXOffset(0);
        setSubtitleYOffset(0);
        break;
      case "price":
        setPriceSize(layout === "publicidad" ? 90 : 80);
        setPriceXOffset(0);
        setPriceYOffset(0);
        break;
      case "originalPrice":
        setOriginalPriceSize(50);
        setOriginalPriceXOffset(0);
        setOriginalPriceYOffset(0);
        break;
      case "badge":
        setBadgeSize(24);
        setBadgeXOffset(0);
        setBadgeYOffset(0);
        setBadgeRotation(-10);
        break;
      case "extraText":
        setExtraTextSize(36);
        setExtraTextXOffset(0);
        setExtraTextYOffset(0);
        break;
      case "product":
        setImgScale(1.0);
        setImgXOffset(0);
        setImgYOffset(0);
        break;
      case "logo":
        setLogoScale(1.0);
        setLogoXOffset(0);
        setLogoYOffset(0);
        break;
      default:
        break;
    }
    toast.success("Ajustes del elemento activo restablecidos");
  };

  const resetAllAdjustments = () => {
    setImgScale(1.0);
    setImgXOffset(0);
    setImgYOffset(0);
    
    setLogoScale(1.0);
    setLogoXOffset(0);
    setLogoYOffset(0);

    setTitleSize(68);
    setTitleXOffset(0);
    setTitleYOffset(0);

    setSubtitleSize(32);
    setSubtitleXOffset(0);
    setSubtitleYOffset(0);

    setPriceSize(layout === "publicidad" ? 90 : 80);
    setPriceXOffset(0);
    setPriceYOffset(0);

    setOriginalPriceSize(50);
    setOriginalPriceXOffset(0);
    setOriginalPriceYOffset(0);

    setBadgeSize(24);
    setBadgeXOffset(0);
    setBadgeYOffset(0);
    setBadgeRotation(-10);

    setExtraTextSize(36);
    setExtraTextXOffset(0);
    setExtraTextYOffset(0);

    toast.success("Todos los ajustes de posición y tamaño han sido restablecidos");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
      {/* ── COLUMNA PREVIEW ── */}
      <div className="lg:col-span-6 flex flex-col items-center">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm w-full flex flex-col items-center gap-6">
          <h3 className="text-lg font-black text-gray-800 self-start border-b border-gray-100 pb-3 w-full text-left">
            Vista Previa (1080 x 1080)
          </h3>

          <div className="relative border-4 border-gray-200 rounded-3xl overflow-hidden shadow-inner max-w-full bg-slate-100 aspect-square flex items-center justify-center" style={{ width: "420px" }}>
            <canvas
              ref={canvasRef}
              width={1080}
              height={1080}
              className="w-full h-full object-contain"
            />
          </div>

          <button
            onClick={handleDownload}
            className="w-full max-w-sm bg-[#95b721] hover:bg-[#85a31d] text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-lg"
          >
            <Download className="w-5 h-5" />
            <span>Descargar Imagen PNG</span>
          </button>
        </div>
      </div>

      {/* ── COLUMNA CONTROLES ── */}
      <div className="lg:col-span-6 space-y-6">
        {/* PANEL: SELECCIÓN & FUENTE */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5 text-left">
          <h3 className="text-lg font-black text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#95b721]" />
            <span>Origen y Textos</span>
          </h3>

          {/* Cargar desde catálogo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase">Cargar de tu Catálogo</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721] font-medium"
            >
              <option value="">-- Selecciona un producto del catálogo --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (S/ {Number(p.precio || 10).toFixed(2)})</option>
              ))}
            </select>
          </div>

          {/* O subir imagen local */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase">O subir una imagen propia</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#95b721] rounded-xl py-3 px-4 bg-gray-50 hover:bg-[#95b721]/5 text-gray-500 hover:text-[#95b721] font-bold text-sm cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>Cargar PNG local (sin fondo)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalImageUpload}
                  className="hidden"
                />
              </label>
              {productImgUrl && (
                <button
                  onClick={() => {
                    setProductImgUrl("");
                    setProductImage(null);
                    setSelectedProductId("");
                  }}
                  className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-500 font-bold text-sm rounded-xl border border-red-100 transition-all"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Textos del Banner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Título del Producto</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Láminas de Fresa"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721] font-medium"
              />
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Subtítulo / Marca</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ej. Abunga - Snacks"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Precio de Oferta / Principal</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ej. S/ 8.00"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Precio Anterior / Normal (Tachado)</label>
              <input
                type="text"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Ej. S/ 10.00"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
              />
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Texto del Sello (Sticker)</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="Ej. 100% NATURAL o -20%"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721] font-bold text-gray-700"
              />
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Texto Extra / Personalizado</label>
              <input
                type="text"
                value={extraText}
                onChange={(e) => setExtraText(e.target.value)}
                placeholder="Ej. ¡LLEVA 3 POR S/ 20!"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721] font-medium"
              />
            </div>
          </div>
        </div>

        {/* PANEL: ESTILO & AJUSTES */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5 text-left">
          <h3 className="text-lg font-black text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-[#95b721]" />
            <span>Fondo y Layout</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Estilo del Fondo</label>
              <select
                value={bgStyle}
                onChange={(e) => setBgStyle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
              >
                <option value="verde">Verde Abunga (Corporativo)</option>
                <option value="tropical">Tropical (Naranja/Oro)</option>
                <option value="limpio">Limpio / Minimalista (Crema)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Layout</label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
              >
                <option value="publicidad">Publicitario (Izq/Der)</option>
                <option value="centrado">Centrado</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* AJUSTES AVANZADOS INDIVIDUALES (TABS) */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Layers className="w-4 h-4 text-gray-400" />
              <span>Ajustes por Elemento</span>
            </h4>

            {/* Selector de Pestañas */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 bg-gray-100 p-1 rounded-xl">
              {[
                { id: "title", label: "Título" },
                { id: "subtitle", label: "Subtítulo" },
                { id: "price", label: "P. Oferta" },
                { id: "originalPrice", label: "P. Tachado" },
                { id: "badge", label: "Sello" },
                { id: "extraText", label: "Txt Extra" },
                { id: "product", label: "Producto" },
                { id: "logo", label: "Logo" },
              ].map((tab) => {
                const active = activeEditTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveEditTab(tab.id)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer text-center truncate ${
                      active
                        ? "bg-white text-[#95b721] shadow-xs"
                        : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Contenido de la Pestaña Activa */}
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 space-y-4">
              
              {activeEditTab === "title" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">Edición del Título</span>
                    <button
                      type="button"
                      onClick={resetCurrentTab}
                      className="text-[10px] text-gray-400 hover:text-[#e24052] font-bold transition-all cursor-pointer"
                    >
                      Restablecer Elemento
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                      <span>Tamaño de Letra</span>
                      <span>{titleSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="120"
                      step="1"
                      value={titleSize}
                      onChange={(e) => setTitleSize(parseInt(e.target.value))}
                      className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento X</span>
                        <span>{titleXOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={titleXOffset}
                        onChange={(e) => setTitleXOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento Y</span>
                        <span>{titleYOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={titleYOffset}
                        onChange={(e) => setTitleYOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Color del Título</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={titleColor}
                        onChange={(e) => setTitleColor(e.target.value)}
                        className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-gray-200"
                      />
                      <span className="text-xs font-bold text-gray-700">{titleColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === "subtitle" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">Edición del Subtítulo</span>
                    <button
                      type="button"
                      onClick={resetCurrentTab}
                      className="text-[10px] text-gray-400 hover:text-[#e24052] font-bold transition-all cursor-pointer"
                    >
                      Restablecer Elemento
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                      <span>Tamaño de Letra</span>
                      <span>{subtitleSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="80"
                      step="1"
                      value={subtitleSize}
                      onChange={(e) => setSubtitleSize(parseInt(e.target.value))}
                      className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento X</span>
                        <span>{subtitleXOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={subtitleXOffset}
                        onChange={(e) => setSubtitleXOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento Y</span>
                        <span>{subtitleYOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={subtitleYOffset}
                        onChange={(e) => setSubtitleYOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Color del Subtítulo</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={subtitleColor}
                        onChange={(e) => setSubtitleColor(e.target.value)}
                        className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-gray-200"
                      />
                      <span className="text-xs font-bold text-gray-700">{subtitleColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === "price" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">Edición del Precio</span>
                    <button
                      type="button"
                      onClick={resetCurrentTab}
                      className="text-[10px] text-gray-400 hover:text-[#e24052] font-bold transition-all cursor-pointer"
                    >
                      Restablecer Elemento
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                      <span>Tamaño del Precio</span>
                      <span>{priceSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="150"
                      step="1"
                      value={priceSize}
                      onChange={(e) => setPriceSize(parseInt(e.target.value))}
                      className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento X</span>
                        <span>{priceXOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={priceXOffset}
                        onChange={(e) => setPriceXOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento Y</span>
                        <span>{priceYOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={priceYOffset}
                        onChange={(e) => setPriceYOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Color del Precio</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={priceColor}
                        onChange={(e) => setPriceColor(e.target.value)}
                        className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-gray-200"
                      />
                      <span className="text-xs font-bold text-gray-700">{priceColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === "originalPrice" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">Edición del Precio Tachado</span>
                    <button
                      type="button"
                      onClick={resetCurrentTab}
                      className="text-[10px] text-gray-400 hover:text-[#e24052] font-bold transition-all cursor-pointer"
                    >
                      Restablecer Elemento
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                      <span>Tamaño del Texto</span>
                      <span>{originalPriceSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="1"
                      value={originalPriceSize}
                      onChange={(e) => setOriginalPriceSize(parseInt(e.target.value))}
                      className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento X</span>
                        <span>{originalPriceXOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={originalPriceXOffset}
                        onChange={(e) => setOriginalPriceXOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento Y</span>
                        <span>{originalPriceYOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={originalPriceYOffset}
                        onChange={(e) => setOriginalPriceYOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Color del Texto</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={originalPriceColor}
                        onChange={(e) => setOriginalPriceColor(e.target.value)}
                        className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-gray-200"
                      />
                      <span className="text-xs font-bold text-gray-700">{originalPriceColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === "badge" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">Edición del Sello / Sticker</span>
                    <button
                      type="button"
                      onClick={resetCurrentTab}
                      className="text-[10px] text-gray-400 hover:text-[#e24052] font-bold transition-all cursor-pointer"
                    >
                      Restablecer Elemento
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                      <span>Tamaño de Letra Sello</span>
                      <span>{badgeSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="60"
                      step="1"
                      value={badgeSize}
                      onChange={(e) => setBadgeSize(parseInt(e.target.value))}
                      className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento X</span>
                        <span>{badgeXOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={badgeXOffset}
                        onChange={(e) => setBadgeXOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento Y</span>
                        <span>{badgeYOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={badgeYOffset}
                        onChange={(e) => setBadgeYOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                      <span>Rotación del Sello</span>
                      <span>{badgeRotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={badgeRotation}
                      onChange={(e) => setBadgeRotation(parseInt(e.target.value))}
                      className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Color Fondo</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={badgeColor}
                          onChange={(e) => setBadgeColor(e.target.value)}
                          className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-gray-200"
                        />
                        <span className="text-xs font-bold text-gray-700">{badgeColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Color Texto</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={badgeTextColor}
                          onChange={(e) => setBadgeTextColor(e.target.value)}
                          className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-gray-200"
                        />
                        <span className="text-xs font-bold text-gray-700">{badgeTextColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === "extraText" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">Edición del Texto Extra</span>
                    <button
                      type="button"
                      onClick={resetCurrentTab}
                      className="text-[10px] text-gray-400 hover:text-[#e24052] font-bold transition-all cursor-pointer"
                    >
                      Restablecer Elemento
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                      <span>Tamaño de Letra</span>
                      <span>{extraTextSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="100"
                      step="1"
                      value={extraTextSize}
                      onChange={(e) => setExtraTextSize(parseInt(e.target.value))}
                      className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento X</span>
                        <span>{extraTextXOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={extraTextXOffset}
                        onChange={(e) => setExtraTextXOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento Y</span>
                        <span>{extraTextYOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-500"
                        max="500"
                        step="5"
                        value={extraTextYOffset}
                        onChange={(e) => setExtraTextYOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Color del Texto Extra</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={extraTextColor}
                        onChange={(e) => setExtraTextColor(e.target.value)}
                        className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-gray-200"
                      />
                      <span className="text-xs font-bold text-gray-700">{extraTextColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === "product" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">Edición de Imagen del Producto</span>
                    <button
                      type="button"
                      onClick={resetCurrentTab}
                      className="text-[10px] text-gray-400 hover:text-[#e24052] font-bold transition-all cursor-pointer"
                    >
                      Restablecer Elemento
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                      <span>Tamaño (Escala)</span>
                      <span>{Math.round(imgScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="2.5"
                      step="0.05"
                      value={imgScale}
                      onChange={(e) => setImgScale(parseFloat(e.target.value))}
                      className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento X</span>
                        <span>{imgXOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-400"
                        max="400"
                        step="5"
                        value={imgXOffset}
                        onChange={(e) => setImgXOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento Y</span>
                        <span>{imgYOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-400"
                        max="400"
                        step="5"
                        value={imgYOffset}
                        onChange={(e) => setImgYOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === "logo" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">Edición del Logo</span>
                    <button
                      type="button"
                      onClick={resetCurrentTab}
                      className="text-[10px] text-gray-400 hover:text-[#e24052] font-bold transition-all cursor-pointer"
                    >
                      Restablecer Elemento
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                      <span>Tamaño (Escala Logo)</span>
                      <span>{Math.round(logoScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="2.0"
                      step="0.05"
                      value={logoScale}
                      onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                      className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento X</span>
                        <span>{logoXOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-800"
                        max="400"
                        step="5"
                        value={logoXOffset}
                        onChange={(e) => setLogoXOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                        <span>Desplazamiento Y</span>
                        <span>{logoYOffset}px</span>
                      </div>
                      <input
                        type="range"
                        min="-200"
                        max="800"
                        step="5"
                        value={logoYOffset}
                        onChange={(e) => setLogoYOffset(parseInt(e.target.value))}
                        className="w-full accent-[#95b721] h-1.5 bg-gray-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          <hr className="border-gray-100" />

          {/* BOTÓN RESTABLECER TODO */}
          <button
            type="button"
            onClick={resetAllAdjustments}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 font-bold text-xs rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Todos los Ajustes del Banner</span>
          </button>

        </div>
      </div>
    </div>
  );
}
