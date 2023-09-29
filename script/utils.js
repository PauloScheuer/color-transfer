export const randomBetween = (min, max) => {
  const roundedMin = Math.round(min);
  const roundedMax = Math.round(max);
  return Math.floor(Math.random() * (roundedMax - roundedMin)) + roundedMin;
};
