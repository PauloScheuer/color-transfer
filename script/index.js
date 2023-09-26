import { imageRGBAtoLAB, imageLABtoRGBA } from "./colorspaces.js";
import { randomBetween } from "./utils.js";

const canvas = document.getElementById("canvas");
const result = document.getElementById("result");
const context = canvas.getContext("2d", { willReadFrequently: true });

const N_SAMPLES_FULL_IMAGE = 10;
const N_OFFSET_DEVIATION = 2;
const N_ANIMATION_POSITIONS = 4;
const N_FULL_OPAQUE = 255;
const N_MAX_RADIUS = 5;

window.addEventListener("load", async () => {
  const [srcArray, srcWidth, srcHeight] = await getImageProperties("source");
  const [tgtArray, tgtWidth, tgtHeight] = await getImageProperties("target");

  const srcArrayLAB = imageRGBAtoLAB(srcArray);
  const tgtArrayLAB = imageRGBAtoLAB(tgtArray);

  const [srcMeanLuminance, srcDeviationLuminance] =
    getLuminanceProperties(srcArrayLAB);
  const [tgtMeanLuminance, tgtDeviationLuminance] =
    getLuminanceProperties(tgtArrayLAB);

  const srcArrayLABRemapped = luminanceRemapping(
    srcArrayLAB,
    srcMeanLuminance,
    srcDeviationLuminance,
    tgtMeanLuminance,
    tgtDeviationLuminance
  );

  const srcArraySamples = generateSamples(
    srcArrayLABRemapped,
    srcWidth,
    srcHeight,
    N_SAMPLES_FULL_IMAGE
  );

  const tgtArrayColoredLAB = applyColorToImageLAB(
    tgtArrayLAB,
    tgtWidth,
    tgtHeight,
    srcArraySamples
  );

  const tgtArrayColoredRGB = imageLABtoRGBA(tgtArrayColoredLAB, 0);
  writeResult(tgtArrayColoredRGB, tgtWidth, tgtHeight);
});

const getImageProperties = async (id) => {
  const imgElement = document.getElementById(id);

  const imgBitmap = await createImageBitmap(imgElement);

  canvas.width = imgBitmap.width;
  canvas.height = imgBitmap.height;

  context.drawImage(imgBitmap, 0, 0);

  const imgData = context.getImageData(0, 0, imgBitmap.width, imgBitmap.height);

  const imgArray = imgData.data;
  const imgWidth = imgData.width;
  const imgHeight = imgData.height;

  return [imgArray, imgWidth, imgHeight];
};

const writeResult = (resArray, resWidth, resHeight) => {
  canvas.width = resWidth;
  canvas.height = resHeight;

  const resArrayAux = new Uint8ClampedArray(resArray);

  const positions = startOpacity(resArrayAux);

  canvas.classList.remove("invisible");
  result.classList.add("invisible");
  animate(resArray, resWidth, resHeight, positions);
};

const animate = (resArray, resWidth, resHeight, positions) => {
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
        animate(resArray, resWidth, resHeight, positions)
      );
    }
  });
};

const getLuminanceProperties = (src) => {
  let resMean = 0;
  for (let i = 0; i < src.length; i += 3) {
    resMean += src[i];
  }

  resMean /= src.length / 3;

  let resDeviation = 0;
  for (let i = 0; i < src.length; i += 3) {
    resDeviation += (src[i] - resMean) * (src[i] - resMean);
  }

  resDeviation = Math.sqrt(resDeviation / (src.length / 3));

  return [resMean, resDeviation];
};

const luminanceRemapping = (
  srcArray,
  srcMean,
  srcDeviation,
  tgtMean,
  tgtDeviation
) => {
  const resArray = [];

  let l;
  for (let i = 0; i < srcArray.length; i += 3) {
    l = (tgtDeviation / srcDeviation) * (srcArray[i] - srcMean) + tgtMean;
    resArray[i + 0] = l;
    resArray[i + 1] = srcArray[i + 1];
    resArray[i + 2] = srcArray[i + 2];
  }

  return resArray;
};

const generateSamples = (imgArray, imgWidth, imgHeight, countSamples) => {
  const divisor = Math.floor(Math.sqrt(countSamples));

  const sampleWidth = Math.floor(imgWidth / divisor);
  const sampleHeight = Math.floor(imgHeight / divisor);

  const samples = [];
  for (let x = 0; x < divisor; x++) {
    for (let y = 0; y < divisor; y++) {
      const minX = x * sampleWidth;
      const maxX = x + 1 < divisor ? (x + 1) * sampleWidth : imgWidth;

      const minY = y * sampleHeight;
      const maxY = y + 1 < divisor ? (y + 1) * sampleHeight : imgHeight;

      const sampleX = randomBetween(minX, maxX);
      const sampleY = randomBetween(minY, maxY);

      const sampleIndex = indexByCoordinate(
        sampleX,
        sampleY,
        imgWidth,
        imgHeight
      );

      const stdDev = calcStandardDeviation(
        imgArray,
        sampleX,
        sampleY,
        imgWidth,
        imgHeight
      );

      samples.push({
        L: imgArray[sampleIndex],
        a: imgArray[sampleIndex + 1],
        b: imgArray[sampleIndex + 2],
        stdDev,
      });
    }
  }

  return samples;
};

const indexByCoordinate = (
  pixelX,
  pixelY,
  imgWidth,
  imgHeight,
  bHasAlpha = false
) => {
  const multiplier = bHasAlpha ? 4 : 3;
  return (pixelY * imgWidth + pixelX) * multiplier;
};

const coordinateByIndex = (index, imgWidth, imgHeight, bHasAlpha = false) => {
  const divisor = bHasAlpha ? 4 : 3;
  const indexPos = index / divisor;
  const res = indexPos / imgWidth;
  const y = Math.floor(res);
  const x = Math.round((res - y) * imgWidth);

  return { x, y };
};

const calcStandardDeviation = (imgArray, x, y, imgWidth, imgHeight) => {
  const minX = Math.max(x - N_OFFSET_DEVIATION * 3, 0);
  const maxX = Math.min(x + N_OFFSET_DEVIATION * 3, imgWidth);

  const minY = Math.max(y - N_OFFSET_DEVIATION * 3, 0);
  const maxY = Math.min(y + N_OFFSET_DEVIATION * 3, imgHeight);
  let sumAvg = 0;
  let count = 0;
  for (let x = minX; x <= maxX; x += 3) {
    for (let y = minY; y <= maxY; y += 3) {
      const newValue = imgArray[indexByCoordinate(x, y, imgWidth, imgHeight)];
      if (newValue) {
        sumAvg += newValue;
        count++;
      }
    }
  }

  const avg = sumAvg / count;

  let sumDev = 0;
  for (let x = minX; x <= maxX; x += 3) {
    for (let y = minY; y <= maxY; y += 3) {
      const l = imgArray[indexByCoordinate(x, y, imgWidth, imgHeight)];
      if (l) {
        sumDev += Math.pow(l - avg, 2);
      }
    }
  }

  const stdDev = Math.sqrt(sumDev / count);

  return stdDev;
};

const applyColorToImageLAB = (imgArray, imgWidth, imgHeight, samples) => {
  const imgColored = [...imgArray];
  for (let i = 0; i < imgColored.length; i += 3) {
    const { x, y } = coordinateByIndex(i, imgWidth, imgHeight);
    const stdDev = calcStandardDeviation(imgArray, x, y, imgWidth, imgHeight);
    const l = imgArray[i];

    const bestSample = getBestSample(l, stdDev, samples);

    imgColored[i + 1] = bestSample.a;
    imgColored[i + 2] = bestSample.b;
  }
  return imgColored;
};

const getBestSample = (l, stdDev, samples) => {
  let bestSample = {};
  let bestDiff = Number.POSITIVE_INFINITY;
  samples.forEach((sample) => {
    const sqrDiffL = Math.pow(l - sample.L, 2);
    const sqrDiffStdDev = Math.pow(stdDev - sample.stdDev, 2);
    const weightedDiff = 0.5 * sqrDiffL + 0.5 * sqrDiffStdDev;
    if (weightedDiff < bestDiff) {
      bestSample = { ...sample };
      bestDiff = weightedDiff;
    }
  });
  return bestSample;
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
