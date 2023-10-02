import { startAnalyzeAnimation } from "./animations/analyzeAnimation.js";
import { startColorizeAnimation } from "./animations/colorizeAnimation.js";
import { startTransferAnimation } from "./animations/transferAnimation.js";

window.addEventListener("load", async () => {
  const executeButton = document.getElementById("execute");
  executeButton.addEventListener("click", () => executeTransfer());
  executeTransfer();
});

const executeTransfer = async () => {
  startAnalyzeAnimation("source");

  const colorizeWorker = new Worker("script/colorize.js", { type: "module" });

  const [srcArray, srcWidth, srcHeight] = await getImageProperties("source");
  const [tgtArray, tgtWidth, tgtHeight] = await getImageProperties("target");

  colorizeWorker.postMessage({
    source: { srcArray, srcWidth, srcHeight },
    target: { tgtArray, tgtWidth, tgtHeight },
  });

  colorizeWorker.onmessage = (e) => {
    const { imgData, imgWidth, imgHeight, arrSamples } = e.data;
    writeResult(imgData, imgWidth, imgHeight, arrSamples);
  };
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

const writeResult = (resArray, resWidth, resHeight, samplesArray) => {
  const canvas = document.getElementById("canvasColorize");
  const result = document.getElementById("result");

  canvas.classList.remove("invisible");
  result.classList.add("invisible");
  result.removeAttribute("src");

  const callBack = () => startColorizeAnimation(resArray, resWidth, resHeight);
  startTransferAnimation(samplesArray, callBack);

  window.addEventListener("colorize", callBack);
};
