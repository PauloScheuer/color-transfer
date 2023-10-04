import { coordinateByIndex, indexByCoordinate } from "../coordinate.js";
import { randomBetween } from "../utils.js";

const N_ANIMATION_POSITIONS = 1;
const N_FULL_OPAQUE = 255;
const N_MAX_RADIUS = 4;

export const startColorizeAnimation = (
  resArray,
  resWidth,
  resHeight,
  callBack
) => {
  const canvas = document.getElementById("canvasColorize");
  const result = document.getElementById("result");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = resWidth;
  canvas.height = resHeight;

  const positions = [];
  animate(
    resArray,
    resWidth,
    resHeight,
    positions,
    canvas,
    context,
    result,
    callBack
  );
};

const animate = (
  resArray,
  resWidth,
  resHeight,
  positions,
  canvas,
  context,
  result,
  callBack
) => {
  requestAnimationFrame(() => {
    positions = [
      ...startOpacity(resArray, resWidth, resHeight),
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
      result.src = "";
      window.setTimeout(() => {
        result.src = canvas.toDataURL();
        canvas.classList.add("invisible");
        result.classList.remove("invisible");
        callBack();
      }, 1000);
    } else {
      animate(
        resArray,
        resWidth,
        resHeight,
        positions,
        canvas,
        context,
        result,
        callBack
      );
    }
  });
};

const getPositions = (count, width, height) => {
  const arr = new Array(count);
  for (let i = 0; i < count; i++) {
    const x = randomBetween(0, width / 5);
    const y = randomBetween(height / 2 - height / 5, height / 2 + height / 5);
    arr[i] = indexByCoordinate(x, y, width, height, true);
  }
  return arr;
};

const getAroundIndexes = (baseIndex, imgWidth, imgHeight) => {
  const baseCoordinate = coordinateByIndex(
    baseIndex,
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
    return indexByCoordinate(coord.x, coord.y, imgWidth, imgHeight, true);
  });

  return aroundIndexes;
};

const startOpacity = (array, imgWidth, imgHeight) => {
  const opaquePositions = getPositions(
    N_ANIMATION_POSITIONS,
    imgWidth,
    imgHeight
  );
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
      if (array[aroundPosition + 3] !== N_FULL_OPAQUE) {
        array[aroundPosition + 3] = N_FULL_OPAQUE;
        newPositions.push(aroundPosition);
      }
    });
  });
  return newPositions;
};
