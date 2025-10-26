/**
 * Utilitários para compressão e otimização de arquivos
 * Resolve o problema de limite de 4.5MB do Vercel
 */

/**
 * Comprime uma imagem mantendo qualidade aceitável
 * @param {File} file - Arquivo de imagem
 * @param {number} maxSizeMB - Tamanho máximo em MB (padrão: 3MB)
 * @param {number} quality - Qualidade da compressão (0.1 a 1.0)
 * @returns {Promise<string>} - Base64 da imagem comprimida
 */
export const compressImage = (file, maxSizeMB = 3, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular dimensões otimizadas
      let { width, height } = img;
      const maxDimension = 1920; // Máximo 1920px na maior dimensão
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Tentar diferentes qualidades até atingir o tamanho desejado
      const tryCompress = (currentQuality) => {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        const sizeInMB = (compressedDataUrl.length * 0.75) / (1024 * 1024); // Aproximação do tamanho
        
        if (sizeInMB <= maxSizeMB || currentQuality <= 0.1) {
          resolve(compressedDataUrl);
        } else {
          // Reduzir qualidade e tentar novamente
          tryCompress(currentQuality - 0.1);
        }
      };
      
      tryCompress(quality);
    };
    
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Comprime um PDF (conversão para imagem se necessário)
 * @param {File} file - Arquivo PDF
 * @param {number} maxSizeMB - Tamanho máximo em MB
 * @returns {Promise<string>} - Base64 do arquivo otimizado
 */
export const compressPDF = (file, maxSizeMB = 3) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64 = reader.result;
      const sizeInMB = (base64.length * 0.75) / (1024 * 1024);
      
      if (sizeInMB <= maxSizeMB) {
        resolve(base64);
      } else {
        // PDF muito grande - rejeitar com mensagem específica
        reject(new Error(`PDF muito grande (${sizeInMB.toFixed(1)}MB). Máximo permitido: ${maxSizeMB}MB. Comprima o arquivo antes de enviar.`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo PDF'));
    reader.readAsDataURL(file);
  });
};

/**
 * Valida e comprime arquivo automaticamente
 * @param {File} file - Arquivo a ser processado
 * @param {number} maxSizeMB - Tamanho máximo em MB
 * @returns {Promise<{success: boolean, data?: string, error?: string, originalSize: number, finalSize: number}>}
 */
export const processFileForUpload = async (file, maxSizeMB = 3) => {
  const originalSizeMB = file.size / (1024 * 1024);
  
  try {
    let processedData;
    
    if (file.type.startsWith('image/')) {
      processedData = await compressImage(file, maxSizeMB);
    } else if (file.type === 'application/pdf') {
      processedData = await compressPDF(file, maxSizeMB);
    } else {
      throw new Error('Tipo de arquivo não suportado. Use PDF, PNG ou JPEG.');
    }
    
    const finalSizeMB = (processedData.length * 0.75) / (1024 * 1024);
    
    return {
      success: true,
      data: processedData,
      originalSize: originalSizeMB,
      finalSize: finalSizeMB
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      originalSize: originalSizeMB,
      finalSize: 0
    };
  }
};

/**
 * Formata tamanho de arquivo para exibição
 * @param {number} sizeInMB - Tamanho em MB
 * @returns {string} - Tamanho formatado
 */
export const formatFileSize = (sizeInMB) => {
  if (sizeInMB < 1) {
    return `${(sizeInMB * 1024).toFixed(0)}KB`;
  }
  return `${sizeInMB.toFixed(1)}MB`;
};