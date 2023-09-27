export const indexByCoordinate = (
  pixelX,
  pixelY,
  imgWidth,
  imgHeight,
  bHasAlpha = false
) => {
  const multiplier = bHasAlpha ? 4 : 3;
  return (pixelY * imgWidth + pixelX) * multiplier;
};

export const coordinateByIndex = (
  index,
  imgWidth,
  imgHeight,
  bHasAlpha = false
) => {
  const divisor = bHasAlpha ? 4 : 3;
  const indexPos = index / divisor;
  const res = indexPos / imgWidth;
  const y = Math.floor(res);
  const x = Math.round((res - y) * imgWidth);

  return { x, y };
};
