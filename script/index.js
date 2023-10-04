import { startAnalyzeAnimation } from "./animations/analyzeAnimation.js";
import { startColorizeAnimation } from "./animations/colorizeAnimation.js";
import { startTransferAnimation } from "./animations/transferAnimation.js";

window.addEventListener("load", async () => {
  const executeButton = document.getElementById("execute");
  executeButton.addEventListener("click", executeTransfer);

  const selectSource = document.getElementById("sourceSelect");
  selectSource.addEventListener("change", (event) =>
    changeImage(event, "source")
  );

  const clearSource = document.getElementById("sourceClear");
  clearSource.addEventListener("click", () => resetImage("source"));

  const selectTarget = document.getElementById("targetSelect");
  selectTarget.addEventListener("change", (event) =>
    changeImage(event, "target")
  );

  const clearTarget = document.getElementById("targetClear");
  clearTarget.addEventListener("click", () => resetImage("target"));
});

const executeTransfer = async () => {
  positionAnalyze();
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

  positionResult();

  const callBack = () => startColorizeAnimation(resArray, resWidth, resHeight);
  startTransferAnimation(samplesArray, callBack);

  window.addEventListener("colorize", callBack);
};

const positionAnalyze = () => {
  const source = document.getElementById("source");
  const sourceContainer = document.getElementById("sourceContainer");

  const y =
    source.getBoundingClientRect().y -
    sourceContainer.getBoundingClientRect().y;

  const canvas = document.getElementById("canvasAnalyze");

  canvas.style.top = y + "px";
};

const positionResult = () => {
  const target = document.getElementById("target").getBoundingClientRect();
  const targetContainer = document
    .getElementById("targetContainer")
    .getBoundingClientRect();

  const y = target.y - targetContainer.y;
  const width = target.width;

  const canvas = document.getElementById("canvasColorize");
  const result = document.getElementById("result");

  canvas.style.top = y + "px";
  result.style.top = y + "px";

  canvas.style.width = width + "px";
  result.style.width = width + "px";
};

const hideResult = () => {
  const canvas = document.getElementById("canvasColorize");
  const result = document.getElementById("result");

  canvas.classList.add("invisible");
  result.classList.add("invisible");
  result.removeAttribute("src");
};

const changeImage = (event, type) => {
  hideResult();

  const file = event.target.files[0];
  const fileReader = new FileReader();

  fileReader.onloadend = () => {
    const img = document.getElementById(type);
    img.src = fileReader.result;
    img.classList.remove("invisible");

    const labelMissing = document.getElementById(type + "Missing");
    labelMissing.classList.add("invisible");
  };

  fileReader.onerror = () => {
    resetImage(type);
  };

  fileReader.readAsDataURL(file);
};

const resetImage = (type) => {
  hideResult();

  const img = document.getElementById(type);
  img.src = "";
  img.classList.add("invisible");

  const select = document.getElementById(type + "Select");
  select.value = "";

  const labelMissing = document.getElementById(type + "Missing");
  labelMissing.classList.remove("invisible");
};
