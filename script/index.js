import { startAnalyzeAnimation } from "./analyzeAnimation.js";
import { startColorizeAnimation } from "./colorizeAnimation.js";
import {
  imageRGBAtoLAB,
  imageLABtoRGBA,
  LABToRGB,
  RGBToHex,
} from "./colorspaces.js";
import { coordinateByIndex, indexByCoordinate } from "./coordinate.js";
import { startTransferAnimation } from "./transferAnimation.js";
import { randomBetween } from "./utils.js";

const N_SAMPLES_FULL_IMAGE = 200;
const N_OFFSET_DEVIATION = 2;

window.addEventListener("load", async () => {
  const executeButton = document.getElementById("execute");
  executeButton.addEventListener("click", () => executeTransfer());
});

const executeTransfer = async () => {
  startAnalyzeAnimation("source");

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

  writeResult(tgtArrayColoredRGB, tgtWidth, tgtHeight, srcArraySamples);
};

const writeResult = (resArray, resWidth, resHeight, samplesArray) => {
  startTransferAnimation(samplesArray);
  startColorizeAnimation(resArray, resWidth, resHeight);
};

const getImageProperties = async (id) => {
  const canvas = document.getElementById("canvasColorize");
  const context = canvas.getContext("2d", { willReadFrequently: true });

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
