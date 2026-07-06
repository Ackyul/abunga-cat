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
  const [price, setPrice] = useState("S/ 10.00");
  const [badgeText, setBadgeText] = useState("100% NATURAL");
  
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
  
  // Control de posición de los textos
  const [textXOffset, setTextXOffset] = useState(0);
  const [textYOffset, setTextYOffset] = useState(0);
  
  // Colores de textos
  const [titleColor, setTitleColor] = useState("#ffffff");
  const [subtitleColor, setSubtitleColor] = useState("#f3f4f6");
  const [badgeColor, setBadgeColor] = useState("#e24052"); // Rojo Abunga
  
  // Cargar imágenes en memoria para el Canvas
  const [logoImage, setLogoImage] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
        setPrice(prod.precio ? `S/ ${Number(prod.precio).toFixed(2)}` : "S/ 10.00");
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
  }, [logoImage, productImage, layout, bgStyle, title, subtitle, price, badgeText, imgScale, imgXOffset, imgYOffset, titleColor, subtitleColor, badgeColor, logoScale, logoXOffset, logoYOffset, textXOffset, textYOffset]);

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
      // Degradado de CyberDays / Tropical (Naranja - Amarillo)
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      gradient.addColorStop(0, "#ff6b00");
      gradient.addColorStop(0.6, "#ff9e00");
      gradient.addColorStop(1, "#ffc700");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // Círculos abstractos gigantes decorativos
      ctx.fillStyle = "rgba(162, 0, 135, 0.1)"; // Púrpura Cyber
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
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
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
      const textX = 560 + textXOffset;

      // 1. Subtítulo (Marca/Categoría)
      ctx.fillStyle = subtitleColor;
      ctx.font = "800 32px sans-serif";
      ctx.fillText(subtitle.toUpperCase(), textX, 390 + textYOffset);

      // 2. Título del Producto (con salto de línea si es largo)
      ctx.fillStyle = titleColor;
      ctx.font = "900 68px sans-serif";
      
      const words = title.split(" ");
      let line = "";
      let startY = 440;

      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + " ";
        let metrics = ctx.measureText(testLine);
        if (metrics.width > 480 && n > 0) {
          ctx.fillText(line, textX, startY + textYOffset);
          line = words[n] + " ";
          startY += 80;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, textX, startY + textYOffset);

      // 3. Precio grande destacado
      const priceY = startY + 110;
      ctx.fillStyle = bgStyle === "limpio" ? "#95b721" : "#ffffff";
      ctx.font = "900 90px sans-serif";
      ctx.fillText(price, textX, priceY + textYOffset);

    } else {
      // --- LAYOUT CENTRADO: TEXTOS AL PIE ---
      // 1. Título Centrado
      ctx.fillStyle = titleColor;
      ctx.font = "900 68px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(title, 540 + textXOffset, 780 + textYOffset);

      // 2. Subtítulo Centrado
      ctx.fillStyle = subtitleColor;
      ctx.font = "700 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(subtitle, 540 + textXOffset, 865 + textYOffset);

      // 3. Precio Centrado
      ctx.fillStyle = bgStyle === "limpio" ? "#95b721" : "#ffc700";
      ctx.font = "900 80px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(price, 540 + textXOffset, 920 + textYOffset);
    }

    ctx.restore();

    // ── E. DIBUJAR BADGE / SELLO (STICKER REDONDEADO) ──
    if (badgeText.trim()) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 6;

      ctx.fillStyle = badgeColor;
      ctx.font = "black 24px sans-serif";
      const textWidth = ctx.measureText(badgeText).width;
      
      const badgeW = textWidth + 40;
      const badgeH = 55;
      
      let bx = 0;
      let by = 0;
      let rotateAngle = -10 * Math.PI / 180; // Inclinado 10 grados

      if (layout === "publicidad") {
        bx = 560 + textXOffset;
        by = 310 + textYOffset;
      } else {
        bx = 100 + textXOffset;
        by = 150 + textYOffset;
      }

      ctx.translate(bx + badgeW / 2, by + badgeH / 2);
      ctx.rotate(rotateAngle);
      
      ctx.beginPath();
      ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 18);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 24px sans-serif";
      ctx.fillText(badgeText.toUpperCase(), 0, 1);

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

            <div className="space-y-1">
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
              <label className="text-xs font-bold text-gray-600 uppercase">Precio</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
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
                <option value="tropical">Cyber / Tropical (Naranja/Oro)</option>
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

          {/* Posicionamiento de la imagen del producto */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
              <ZoomIn className="w-4 h-4 text-gray-400" />
              <span>Ajustes de Imagen de Producto</span>
            </h4>

            <div className="space-y-3">
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
                  className="w-full accent-[#95b721] h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
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
                    className="w-full accent-[#95b721] h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
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
                    className="w-full accent-[#95b721] h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
          </div>

          <hr className="border-gray-100" />

          {/* Posicionamiento y tamaño del Logo */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
              <Move className="w-4 h-4 text-gray-400" />
              <span>Ajustes de Logo</span>
            </h4>

            <div className="space-y-3">
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
                  className="w-full accent-[#95b721] h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
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
                    className="w-full accent-[#95b721] h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
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
                    className="w-full accent-[#95b721] h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Posicionamiento de los Textos */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Ajustes de Textos</span>
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                  <span>Desplazamiento X</span>
                  <span>{textXOffset}px</span>
                </div>
                <input
                  type="range"
                  min="-400"
                  max="400"
                  step="5"
                  value={textXOffset}
                  onChange={(e) => setTextXOffset(parseInt(e.target.value))}
                  className="w-full accent-[#95b721] h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                  <span>Desplazamiento Y</span>
                  <span>{textYOffset}px</span>
                </div>
                <input
                  type="range"
                  min="-400"
                  max="400"
                  step="5"
                  value={textYOffset}
                  onChange={(e) => setTextYOffset(parseInt(e.target.value))}
                  className="w-full accent-[#95b721] h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Colores de Textos */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest">Colores del Contenido</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Título</label>
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

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtítulo</label>
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

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sticker</label>
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
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
