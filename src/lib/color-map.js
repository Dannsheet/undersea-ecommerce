export const colorNameToHex = {
  // --- Colores Básicos ---
  'negro': '#000000',
  'blanco': '#FFFFFF',
  'gris': '#808080',
  'rojo': '#FF0000',
  'verde': '#008000',
  'azul': '#0000FF',
  'amarillo': '#FFFF00',
  'naranja': '#FFA500',
  'morado': '#800080',
  'rosa': '#FFC0CB',

  // --- Tonos y Variaciones ---
  'gris claro': '#D3D3D3',
  'gris oscuro': '#A9A9A9',
  'azul marino': '#000080',
  'azul cielo': '#87CEEB',
  'verde oliva': '#808000',
  'verde menta': '#98FF98',
  'marrón': '#A52A2A',
  'beige': '#F5F5DC',
  'crema': '#FFFDD0',
  'vino': '#722F37',
  'turquesa': '#40E0D0',

  // Puedes agregar más colores según los necesites
};

export const getColorCode = (colorName) => {
  const lowerCaseName = colorName.toLowerCase();
  return colorNameToHex[lowerCaseName] || lowerCaseName; // Devuelve el hex o el nombre original si no se encuentra
};
