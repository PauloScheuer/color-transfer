import { coordinateByIndex, indexByCoordinate } from "./coordinate.js";
import { randomBetween } from "./utils.js";

const N_ANIMATION_POSITIONS = 4;
const N_FULL_OPAQUE = 255;
const N_MAX_RADIUS = 5;

export const startAnimation = (resArray, resWidth, resHeight) => {
  const canvas = document.getElementById("canvas");
  const result = document.getElementById("result");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = resWidth;
  canvas.height = resHeight;

  canvas.classList.remove("invisible");
  result.classList.add("invisible");

  const positions = [];
  animate(resArray, resWidth, resHeight, positions, canvas, context, result);
};

const animate = (
  resArray,
  resWidth,
  resHeight,
  positions,
  canvas,
  context,
  result
) => {
  requestAnimationFrame(() => {
    positions = [
      ...startOpacity(resArray),
      ...spreadOpacity(resArray, positions, resWidth, resHeight),
    ];

    context.putImageData(new ImageData(resArray, resWidth, resHeight), 0, 0);

    const allColorized = resArray.every((item, index) => {
      if ((index + 1) % 4 === 0) {
        return item === N_FULL_OPAQUE;
      }
      return true;
    });

    if (allColorized) {
      result.src = canvas.toDataURL();
      canvas.classList.add("invisible");
      result.classList.remove("invisible");
    } else {
      requestAnimationFrame(() =>
        animate(
          resArray,
          resWidth,
          resHeight,
          positions,
          canvas,
          context,
          result
        )
      );
    }
  });
};

const getPositions = (count, max) => {
  const arr = new Array(count);
  for (let i = 0; i < count; i++) {
    const random = randomBetween(0, max);
    arr[i] = Math.floor(random / 4) * 4 + 3;
  }
  return arr;
};

const getAroundIndexes = (baseIndex, imgWidth, imgHeight) => {
  const baseCoordinate = coordinateByIndex(
    baseIndex - 3,
    imgWidth,
    imgHeight,
    true
  );

  const startX = Math.max(0, baseCoordinate.x - randomBetween(0, N_MAX_RADIUS));
  const endX = Math.min(
    imgWidth - 1,
    baseCoordinate.x + randomBetween(0, N_MAX_RADIUS)
  );

  const startY = Math.max(0, baseCoordinate.y - randomBetween(0, N_MAX_RADIUS));
  const endY = Math.min(
    imgHeight - 1,
    baseCoordinate.y + randomBetween(0, N_MAX_RADIUS)
  );

  const aroundCoordinates = [];

  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      const distance = Math.sqrt(
        Math.pow(Math.abs(baseCoordinate.x - x), 2) +
          Math.pow(Math.abs(baseCoordinate.y - y), 2)
      );
      if (distance < N_MAX_RADIUS) {
        aroundCoordinates.push({ x, y });
      }
    }
  }

  const aroundIndexes = aroundCoordinates.map((coord) => {
    return indexByCoordinate(coord.x, coord.y, imgWidth, imgHeight, true) + 3;
  });

  return aroundIndexes;
};

const startOpacity = (array) => {
  const opaquePositions = getPositions(N_ANIMATION_POSITIONS, array.length);
  opaquePositions.forEach((index) => {
    array[index] = N_FULL_OPAQUE;
  });

  return opaquePositions;
};

const spreadOpacity = (array, positions, imgWidth, imgHeight) => {
  const newPositions = [];
  positions.forEach((position) => {
    const aroundPositions = getAroundIndexes(position, imgWidth, imgHeight);
    aroundPositions.forEach((aroundPosition) => {
      if (array[aroundPosition] !== N_FULL_OPAQUE) {
        array[aroundPosition] = N_FULL_OPAQUE;
        newPositions.push(aroundPosition);
      }
    });
  });
  return newPositions;
};
