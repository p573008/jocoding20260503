const URL = "https://teachablemachine.withgoogle.com/models/Sa53Lxg8p/";

let model, maxPredictions;

const uploadContainer = document.getElementById("upload-container");
const imageUpload = document.getElementById("image-upload");
const imagePreview = document.getElementById("image-preview");
const uploadGuide = document.getElementById("upload-guide");
const loadingSpinner = document.getElementById("loading-spinner");
const resultMessage = document.getElementById("result-message");
const reUploadBtn = document.getElementById("re-upload-btn");
const labelContainer = document.getElementById("label-container");

let isModelLoaded = false;

// Load the image model
async function loadModel() {
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        isModelLoaded = true;
        console.log("Model loaded successfully");
    } catch (e) {
        console.error("Model load failed", e);
        resultMessage.innerHTML = "모델을 불러오지 못했습니다. 인터넷 연결을 확인해주세요.";
    }
}

loadModel();

// 이미지 업로드 클릭 이벤트
uploadContainer.addEventListener("click", () => imageUpload.click());

// 드래그 앤 드롭 이벤트
uploadContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadContainer.style.backgroundColor = "#e3f2fd";
});

uploadContainer.addEventListener("dragleave", () => {
    uploadContainer.style.backgroundColor = "#fff";
});

uploadContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadContainer.style.backgroundColor = "#fff";
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
        handleImage(file);
    }
});

// 파일 선택 시 이벤트
imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImage(file);
    }
});

// 재업로드 버튼
reUploadBtn.addEventListener("click", () => {
    imageUpload.value = "";
    imagePreview.classList.add("hidden");
    uploadGuide.classList.remove("hidden");
    resultMessage.innerHTML = "";
    labelContainer.innerHTML = "";
    reUploadBtn.classList.add("hidden");
});

async function handleImage(file) {
    if (!isModelLoaded) {
        alert("모델이 아직 로딩 중입니다. 잠시만 기다려주세요.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        imagePreview.src = e.target.result;
        
        // 이미지 객체가 완전히 로드된 후 분석 시작
        imagePreview.onload = async () => {
            imagePreview.classList.remove("hidden");
            uploadGuide.classList.add("hidden");
            loadingSpinner.classList.remove("hidden");
            labelContainer.innerHTML = "";
            resultMessage.innerHTML = "";

            try {
                await predict();
            } catch (error) {
                console.error("Prediction error:", error);
                resultMessage.innerHTML = "분석 중 오류가 발생했습니다.";
            } finally {
                loadingSpinner.classList.add("hidden");
                reUploadBtn.classList.remove("hidden");
            }
        };
    };
    reader.readAsDataURL(file);
}

async function predict() {
    const prediction = await model.predict(imagePreview);
    let topPrediction = { className: "", probability: 0 };

    labelContainer.innerHTML = ""; 
    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = prediction[i].probability;
        const probPercentage = (probability * 100).toFixed(0);
        
        if (probability > topPrediction.probability) {
            topPrediction = { className, probability };
        }

        const barContainer = document.createElement("div");
        barContainer.className = "bar-container";
        
        const label = document.createElement("div");
        label.className = "label-name";
        label.innerHTML = className + ": " + probPercentage + "%";
        
        const barWrapper = document.createElement("div");
        barWrapper.className = "bar-wrapper";
        
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.width = probPercentage + "%";
        
        if (className === "강아지") {
            bar.style.backgroundColor = "#ffc107";
        } else if (className === "고양이") {
            bar.style.backgroundColor = "#17a2b8";
        }
        
        barWrapper.appendChild(bar);
        barContainer.appendChild(label);
        barContainer.appendChild(barWrapper);
        labelContainer.appendChild(barContainer);
    }

    if (topPrediction.probability > 0.1) {
        resultMessage.innerHTML = `당신은 <span class="highlight">${topPrediction.className}상</span> 입니다!`;
    } else {
        resultMessage.innerHTML = "결과를 판독하기 어렵습니다.";
    }
}
