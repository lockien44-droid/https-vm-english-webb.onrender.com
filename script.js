function showPage(pageId) {
    let pages = document.querySelectorAll(".page");
    pages.forEach(function(page) {
        page.style.display = "none";
    });
    document.getElementById(pageId).style.display = "block";
}

document.addEventListener('DOMContentLoaded', () => {
    showPage('home');
});

function openTopicOverlay() {
    const overlay = document.getElementById("topic-overlay");
    if (overlay) {
        overlay.style.display = "flex";
    }
}

function closeTopicOverlay() {
    const overlay = document.getElementById("topic-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }
}

function openGameOverlay() {
    const overlay = document.getElementById("game-overlay");
    if (overlay) {
        overlay.style.display = "flex";
    }
}

function closeGameOverlay() {
    const overlay = document.getElementById("game-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }
}

// Dữ liệu từ vựng theo chủ đề (Học qua Hotspot)
const vocabData = {
    body: {
        title: "👤 Cơ thể người",
        imageEmoji: "🧍",
        hotspots: [
            { id: "head", en: "head", vi: "cái đầu", top: "10%", left: "50%" },
            { id: "eye", en: "eye", vi: "con mắt", top: "20%", left: "40%" },
            { id: "nose", en: "nose", vi: "cái mũi", top: "25%", left: "50%" },
            { id: "mouth", en: "mouth", vi: "cái miệng", top: "30%", left: "50%" },
            { id: "hand", en: "hand", vi: "bàn tay", top: "45%", left: "20%" },
            { id: "finger", en: "finger", vi: "ngón tay", top: "55%", left: "15%" },
            { id: "leg", en: "leg", vi: "cái chân", top: "70%", left: "35%" }
        ]
    },
    animal: {
        title: "🐶 Động vật",
        imageEmoji: "🐕",
        hotspots: [
            { id: "ear", en: "ear", vi: "cái tai", top: "15%", left: "25%" },
            { id: "tail", en: "tail", vi: "cái đuôi", top: "40%", left: "80%" },
            { id: "leg", en: "leg", vi: "cái chân", top: "75%", left: "30%" }
        ]
    },
    food: {
        title: "🍎 Đồ ăn",
        imageEmoji: "🍱",
        hotspots: [
            { id: "apple", en: "apple", vi: "quả táo", top: "20%", left: "30%" },
            { id: "banana", en: "banana", vi: "quả chuối", top: "40%", left: "70%" },
            { id: "rice", en: "rice", vi: "cơm", top: "70%", left: "40%" },
            { id: "bread", en: "bread", vi: "bánh mì", top: "60%", left: "80%" }
        ]
    },
    vehicle: {
        title: "🚗 Phương tiện",
        imageEmoji: "🚙",
        hotspots: [
            { id: "window", en: "window", vi: "cửa sổ", top: "35%", left: "50%" },
            { id: "wheel", en: "wheel", vi: "bánh xe", top: "75%", left: "25%" },
            { id: "door", en: "door", vi: "cửa xe", top: "50%", left: "50%" }
        ]
    }
};

function showVocab(topic) {
    showPage('vocab-learn');
    
    const data = vocabData[topic];
    if (!data) return;

    document.getElementById('vocab-title').textContent = data.title;
    
    const container = document.getElementById('vocab-container');
    container.innerHTML = `
        <div class="vocab-interactive-area">
            <div class="vocab-main-emoji">${data.imageEmoji}</div>
            ${data.hotspots.map(spot => `
                <div class="hotspot-btn" style="top: ${spot.top}; left: ${spot.left};" onclick="showHotspotInfo(this, '${spot.en}', '${spot.vi}')">
                    <div class="hotspot-pulse"></div>
                </div>
            `).join('')}
        </div>
        <div class="vocab-info-card" id="vocab-info-card" style="display: none;">
            <div class="vocab-en" id="vocab-info-en">word</div>
            <div class="vocab-phonetic" id="vocab-info-phonetic" style="font-size: 18px; color: #555; font-style: italic; margin-bottom: 5px;"></div>
            <div class="vocab-vi" id="vocab-info-vi">nghĩa</div>
            <button class="vocab-audio-btn" onclick="playAudio(document.getElementById('vocab-info-en').textContent)">🔊 Nghe</button>
        </div>
    `;
}

function showHotspotInfo(element, en, vi) {
    // Xóa active khỏi các hotspot khác
    document.querySelectorAll('.hotspot-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');

    const infoCard = document.getElementById('vocab-info-card');
    infoCard.style.display = 'flex';
    document.getElementById('vocab-info-en').textContent = en;
    document.getElementById('vocab-info-vi').textContent = vi;
    
    // Fetch and display phonetic
    fetchPhonetic(en, 'vocab-info-phonetic');
    
    // Play sound automatically when clicked
    playAudio(en);
}

function playAudio(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    } else {
        alert("Trình duyệt của bạn không hỗ trợ phát âm thanh!");
    }
}

async function translateText() {
    const sourceText = document.getElementById('source-text').value;
    const sourceLang = document.getElementById('source-lang').value;
    const targetLang = document.getElementById('target-lang').value;
    const targetTextArea = document.getElementById('target-text');

    if (!sourceText.trim()) {
        targetTextArea.value = '';
        document.getElementById('dictionary-container').style.display = 'none';
        return;
    }

    targetTextArea.value = 'Đang dịch...';

    // Sử dụng Google Translate API (client gtx) để lấy thêm từ loại
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&dt=bd&q=${encodeURIComponent(sourceText)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        let translatedText = '';
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            // Nối các câu dịch (phòng trường hợp văn bản dài ngắt câu)
            data[0].forEach(segment => {
                if (segment[0]) translatedText += segment[0];
            });
            targetTextArea.value = translatedText;

            // Dữ liệu từ điển ở data[1]
            const dictionaryData = data[1] || null;
            renderDictionary(sourceText, dictionaryData);
        } else {
            targetTextArea.value = 'Lỗi dịch ngôn ngữ.';
            document.getElementById('dictionary-container').style.display = 'none';
        }
    } catch (error) {
        console.error('Error translating:', error);
        targetTextArea.value = 'Lỗi kết nối.';
        document.getElementById('dictionary-container').style.display = 'none';
    }
}

function renderDictionary(word, dictData) {
    const dictContainer = document.getElementById('dictionary-container');
    const dictWord = document.getElementById('dict-word');
    const dictMainPos = document.getElementById('dict-main-pos');
    const dictTableBody = document.getElementById('dict-table-body');
    const otherTranslationsDiv = document.querySelector('.dict-other-translations');
    
    dictMainPos.innerHTML = '';
    dictTableBody.innerHTML = '';

    if (!dictData || dictData.length === 0) {
        dictContainer.style.display = 'none';
        return;
    }
    
    dictContainer.style.display = 'block';
    dictWord.textContent = word;
    
    // Fetch PHONETIC for the dictionary word
    fetchPhonetic(word, 'dict-phonetic');
    
    // Bản đồ việt hóa các từ loại (Google trả về tiếng Anh)
    const posMap = {
        'noun': 'Danh từ',
        'verb': 'Động từ',
        'adjective': 'Tính từ',
        'adverb': 'Trạng từ',
        'pronoun': 'Đại từ',
        'preposition': 'Giới từ',
        'conjunction': 'Liên từ',
        'interjection': 'Thán từ',
        'particle': 'Phân từ',
        'abbreviation': 'Viết tắt'
    };

    // Lấy phần đầu tiên (thường là từ loại phổ biến nhất) làm thẻ Main
    if (dictData.length > 0) {
        const firstPos = dictData[0];
        const posNameEn = firstPos[0];
        const posNameVi = posMap[posNameEn.toLowerCase()] || posNameEn;
        const mainTranslations = firstPos[1] || [];
        
        dictMainPos.innerHTML = `<span class="pos-label">${posNameVi}</span>`;
        // Hiển thị tối đa 5 từ dịch đầu tiên lên thẻ tag
        const limitTags = mainTranslations.slice(0, 5);
        limitTags.forEach(trans => {
            const span = document.createElement('span');
            span.className = 'dict-tag';
            span.textContent = trans;
            dictMainPos.appendChild(span);
        });
    }

    // Nếu không có các bản dịch chi tiết thì ẩn table đi
    const hasDetailedTranslations = dictData.some(posGroup => posGroup[2] && posGroup[2].length > 0);
    
    if (hasDetailedTranslations || dictData.length > 1) {
        otherTranslationsDiv.style.display = 'block';
        
        // Render vào table
        dictData.forEach(posGroup => {
            const posNameEn = posGroup[0];
            const posNameVi = posMap[posNameEn.toLowerCase()] || posNameEn;
            
            // Các nhóm từ (ví dụ: Google trả detailed translations trong group[2])
            const subTranslations = posGroup[2] || [];
            if (subTranslations.length > 0) {
                // Nhóm theo nghĩa chính
                subTranslations.forEach(subItem => {
                    const wordVi = subItem[0]; // nghĩa tiếng Việt
                    const synTags = subItem[1] || []; // các từ tiếng Anh tương đương

                    const tr = document.createElement('tr');
                    
                    const tdWord = document.createElement('td');
                    tdWord.className = 'trans-word';
                    // Viết hoa chữ đầu tiên để đẹp hơn
                    tdWord.textContent = wordVi;
                    
                    const tdPos = document.createElement('td');
                    tdPos.className = 'trans-pos';
                    tdPos.textContent = posNameVi;
                    
                    const tdTags = document.createElement('td');
                    tdTags.className = 'trans-tags';
                    
                    synTags.slice(0, 6).forEach(tagWord => {
                        const span = document.createElement('span');
                        span.className = 'dict-tag';
                        span.textContent = tagWord;
                        tdTags.appendChild(span);
                    });
                    
                    tr.appendChild(tdWord);
                    tr.appendChild(tdPos);
                    tr.appendChild(tdTags);
                    
                    dictTableBody.appendChild(tr);
                });
            } else {
                // Rơi vào trường hợp mảng ko có detailed (chỉ có từ đơn ở [1])
                const simpleTrans = posGroup[1] || [];
                const tr = document.createElement('tr');
                    
                const tdWord = document.createElement('td');
                tdWord.className = 'trans-word';
                tdWord.textContent = simpleTrans[0] || '-';
                
                const tdPos = document.createElement('td');
                tdPos.className = 'trans-pos';
                tdPos.textContent = posNameVi;
                
                const tdTags = document.createElement('td');
                tdTags.className = 'trans-tags';
                
                simpleTrans.forEach(tagWord => {
                    const span = document.createElement('span');
                    span.className = 'dict-tag';
                    span.textContent = tagWord;
                    tdTags.appendChild(span);
                });
                
                tr.appendChild(tdWord);
                tr.appendChild(tdPos);
                tr.appendChild(tdTags);
                
                dictTableBody.appendChild(tr);
            }
        });
    } else {
        otherTranslationsDiv.style.display = 'none';
    }
}

// ------------------- QUIZ GAME -------------------
let currentQuizWord = null;
let allVocabList = [];

function initVocabList() {
    if (allVocabList.length === 0) {
        for (let topic in vocabData) {
            const data = vocabData[topic];
            data.hotspots.forEach(item => {
                allVocabList.push({
                    ...item,
                    emoji: data.imageEmoji
                });
            });
        }
    }
}

function startQuiz() {
    showPage('game-quiz');
    initVocabList();
    loadQuestion();
}

function loadQuestion() {
    const container = document.getElementById('quiz-container');
    
    // Pick correct answer
    const correctIdx = Math.floor(Math.random() * allVocabList.length);
    currentQuizWord = allVocabList[correctIdx];
    
    // Pick 2 wrong answers
    let options = [currentQuizWord];
    while (options.length < 3) {
        const wrongIdx = Math.floor(Math.random() * allVocabList.length);
        const wrongWord = allVocabList[wrongIdx];
        if (!options.find(o => o.en === wrongWord.en)) {
            options.push(wrongWord);
        }
    }
    
    // Shuffle options
    options.sort(() => Math.random() - 0.5);
    
    container.innerHTML = `
        <div class="quiz-card">
            <div class="quiz-question">Đây là gì?</div>
            <div class="quiz-image">${currentQuizWord.emoji} <br><span style="font-size:24px;">(${currentQuizWord.vi})</span></div>
            <div class="quiz-options">
                ${options.map((opt, index) => `
                    <button class="quiz-btn" onclick="checkAnswer(this, '${opt.en}', '${currentQuizWord.en}')">
                       ${String.fromCharCode(65 + index)}. ${opt.en}
                    </button>
                `).join('')}
            </div>
            <div id="quiz-result" class="quiz-result"></div>
            <button id="quiz-next-btn" class="quiz-next-btn" style="display:none;" onclick="loadQuestion()">Tiếp tục ➔</button>
        </div>
    `;
}

function checkAnswer(btn, selectedEn, correctEn) {
    // Disable all buttons
    const buttons = document.querySelectorAll('.quiz-btn');
    buttons.forEach(b => b.disabled = true);
    
    const resultDiv = document.getElementById('quiz-result');
    const nextBtn = document.getElementById('quiz-next-btn');
    
    if (selectedEn === correctEn) {
        btn.classList.add('correct');
        resultDiv.innerHTML = '🎉 Chính xác!';
        resultDiv.style.color = '#00e676';
        playAudio(correctEn);
    } else {
        btn.classList.add('wrong');
        // Find correct button and highlight it
        buttons.forEach(b => {
            if (b.textContent.includes(correctEn)) {
                b.classList.add('correct');
            }
        });
        resultDiv.innerHTML = '❌ Sai rồi!';
        resultDiv.style.color = '#ff1744';
    }
    
    nextBtn.style.display = 'block';
}

// ------------------- FLASHCARD GAME -------------------
let currentFlashcardIdx = 0;

function startFlashcard() {
    showPage('game-flashcard');
    initVocabList();
    currentFlashcardIdx = 0;
    renderFlashcard();
}

function renderFlashcard() {
    const container = document.getElementById('flashcard-container');
    const word = allVocabList[currentFlashcardIdx];
    
    container.innerHTML = `
        <div class="flashcard-wrapper">
            <div class="flashcard" onclick="this.classList.toggle('flipped')">
                <div class="flashcard-front">
                    <div class="flashcard-emoji">${word.emoji}</div>
                    <div class="flashcard-hint">Chạm để lật</div>
                </div>
                <div class="flashcard-back">
                    <div class="flashcard-en">${word.en}</div>
                    <div class="flashcard-vi">${word.vi}</div>
                    <button class="flashcard-audio" onclick="event.stopPropagation(); playAudio('${word.en}')">🔊 Nghe</button>
                    <div class="flashcard-hint">Chạm để lật lại</div>
                </div>
            </div>
            
            <div class="flashcard-controls">
                <button class="flashcard-nav-btn" onclick="prevFlashcard()">⬅ Tới trước</button>
                <div class="flashcard-counter">${currentFlashcardIdx + 1} / ${allVocabList.length}</div>
                <button class="flashcard-nav-btn" onclick="nextFlashcard()">Tiếp theo ➡</button>
            </div>
        </div>
    `;
}

function prevFlashcard() {
    if (currentFlashcardIdx > 0) {
        currentFlashcardIdx--;
        renderFlashcard();
    }
}

function nextFlashcard() {
    if (currentFlashcardIdx < allVocabList.length - 1) {
        currentFlashcardIdx++;
        renderFlashcard();
    }
}

// ------------------- MATCHING GAME (Drag & Drop) -------------------
let matchItems = [];

function startMatchGame() {
    showPage('game-match');
    initVocabList();
    loadMatchGame();
}

function loadMatchGame() {
    const container = document.getElementById('match-container');
    
    // Random 4 items
    matchItems = [...allVocabList].sort(() => Math.random() - 0.5).slice(0, 4);
    
    // Create drop zones (images)
    const dropZonesHTML = matchItems.map((item, index) => `
        <div class="match-zone-card">
            <div class="match-emoji">${item.emoji} <br><span style="font-size:18px;">(${item.vi})</span></div>
            <div class="match-dropzone" data-id="${item.en}" ondragover="allowDrop(event)" ondrop="drop(event)">
                Thả từ vào đây
            </div>
        </div>
    `).join('');
    
    // Create draggable words (shuffled)
    const shuffledWords = [...matchItems].sort(() => Math.random() - 0.5);
    const dragItemsHTML = shuffledWords.map((item, index) => `
        <div class="match-drag-item" draggable="true" id="drag-${index}" data-id="${item.en}" ondragstart="drag(event)">
            ${item.en}
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="match-game-wrapper">
            <div class="match-zones-container">
                ${dropZonesHTML}
            </div>
            <div class="match-words-container" id="match-words-container">
                ${dragItemsHTML}
            </div>
            <button class="match-reload-btn" onclick="loadMatchGame()">🔄 Chơi lại</button>
        </div>
    `;
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    const dropZone = ev.target;
    
    // Check if the target is a valid dropzone
    if (!dropZone.classList.contains('match-dropzone')) return;
    
    // Check if correct
    if (draggedElement.dataset.id === dropZone.dataset.id) {
        dropZone.innerHTML = '';
        dropZone.appendChild(draggedElement);
        dropZone.classList.add('correct');
        draggedElement.setAttribute('draggable', 'false');
        draggedElement.style.cursor = 'default';
        playAudio(draggedElement.dataset.id);
    } else {
        // Highlight wrong briefly
        dropZone.classList.add('wrong');
        setTimeout(() => dropZone.classList.remove('wrong'), 500);
    }
}

// ------------------- LISTENING GAME -------------------
let currentListenTarget = null;

function startListenGame() {
    showPage('game-listen');
    initVocabList();
    loadListenGame();
}

function loadListenGame() {
    const container = document.getElementById('listen-container');
    
    // Pick 4 random items
    const options = [...allVocabList].sort(() => Math.random() - 0.5).slice(0, 4);
    
    // Pick 1 target
    currentListenTarget = options[Math.floor(Math.random() * options.length)];
    
    container.innerHTML = `
        <div class="listen-game-wrapper">
            <button class="listen-play-btn" onclick="playAudio('${currentListenTarget.en}')">🔊 Play Audio</button>
            <div class="listen-hint">Nghe và chọn hình đúng</div>
            
            <div class="listen-options-grid">
                ${options.map((opt, index) => `
                    <div class="listen-option-card" onclick="checkListenAnswer(this, '${opt.en}')">
                        <div class="listen-emoji">${opt.emoji}</div>
                    </div>
                `).join('')}
            </div>
            
            <div id="listen-result" class="listen-result"></div>
            <button id="listen-next-btn" class="listen-next-btn" style="display:none;" onclick="loadListenGame()">Tiếp tục ➔</button>
        </div>
    `;
    
    // Auto play audio once loaded
    setTimeout(() => playAudio(currentListenTarget.en), 500);
}

function checkListenAnswer(card, selectedEn) {
    // Disable all cards
    const cards = document.querySelectorAll('.listen-option-card');
    cards.forEach(c => c.style.pointerEvents = 'none');
    
    const resultDiv = document.getElementById('listen-result');
    const nextBtn = document.getElementById('listen-next-btn');
    
    if (selectedEn === currentListenTarget.en) {
        card.classList.add('correct');
        resultDiv.innerHTML = '🎉 Chính xác!';
        resultDiv.style.color = '#00e676';
    } else {
        card.classList.add('wrong');
        // highlight correct one
        cards.forEach(c => {
            if(c.innerHTML.includes(currentListenTarget.emoji)) {
                 c.classList.add('correct');
            }
        });
        resultDiv.innerHTML = `❌ Sai rồi! Đáp án là "${currentListenTarget.vi}"`;
        resultDiv.style.color = '#ff1744';
    }
    
    nextBtn.style.display = 'block';
}

// ------------------- UPLOAD IMAGE AI -------------------
function showUploadVocab() {
    showPage('vocab-upload');
}

let cocoSsdModel = null;

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const loading = document.getElementById('image-loading');
    const vocabList = document.getElementById('detected-vocab-list');
    const hotspotsContainer = document.getElementById('upload-hotspots');
    
    previewContainer.style.display = 'block';
    loading.style.display = 'flex';
    vocabList.innerHTML = '';
    hotspotsContainer.innerHTML = '';
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        imagePreview.src = e.target.result;
        
        imagePreview.onload = async () => {
             // Delay to allow image render
             setTimeout(async () => {
                 try {
                     if (!cocoSsdModel) {
                         cocoSsdModel = await cocoSsd.load();
                     }
                     
                     const predictions = await cocoSsdModel.detect(imagePreview);
                     loading.style.display = 'none';
                     
                     displayDetectedVocab(predictions, imagePreview);
                 } catch (err) {
                     loading.style.display = 'none';
                     vocabList.innerHTML = `<div class="no-detect">Lỗi khi tải AI. Vui lòng thử lại.</div>`;
                     console.error(err);
                 }
             }, 100);
        };
    };
    reader.readAsDataURL(file);
}

async function displayDetectedVocab(predictions, imgElement) {
    const vocabList = document.getElementById('detected-vocab-list');
    const hotspotsContainer = document.getElementById('upload-hotspots');
    
    const displayWidth = imgElement.width;
    const displayHeight = imgElement.height;
    const naturalWidth = imgElement.naturalWidth;
    const naturalHeight = imgElement.naturalHeight;
    const ratioX = displayWidth / naturalWidth;
    const ratioY = displayHeight / naturalHeight;
    
    if (predictions.length === 0) {
        vocabList.innerHTML = '<div class="no-detect">AI không tìm thấy đồ vật nào rõ ràng. Hãy thử một bức ảnh khác nhé!</div>';
        return;
    }
    
    const uniqueClasses = [...new Set(predictions.map(p => p.class))];
    let vocabHTML = '<h3 style="font-family: Quicksand; font-size: 24px; margin-top: 30px;">Từ vựng tìm thấy:</h3><div class="detected-grid">';
    
    // Create random IDs for phonetics so they don't clash
    for (let i = 0; i < uniqueClasses.length; i++) {
        let word = uniqueClasses[i];
        let phoneticId = `phonetic-upload-${i}`;
        
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            const viText = data[0][0][0];
            
            vocabHTML += `
                <div class="detected-card" onclick="playAudio('${word}')">
                    <div class="detected-en">${word}</div>
                    <div id="${phoneticId}" style="font-size: 16px; color: #555; font-style: italic; margin-bottom: 5px;"></div>
                    <div class="detected-vi">${viText}</div>
                    <button class="vocab-audio-btn" style="width:100%;">🔊 Nghe</button>
                </div>
            `;
            
            // Asynchronously fetch phonetic after adding to DOM
            setTimeout(() => fetchPhonetic(word, phoneticId), 100);
            
        } catch (e) {
            vocabHTML += `
                <div class="detected-card" onclick="playAudio('${word}')">
                    <div class="detected-en">${word}</div>
                    <button class="vocab-audio-btn" style="width:100%;">🔊 Nghe</button>
                </div>
            `;
        }
    }
    vocabHTML += '</div>';
    vocabList.innerHTML = vocabHTML;
    
    predictions.forEach(p => {
        const x = p.bbox[0] * ratioX;
        const y = p.bbox[1] * ratioY;
        const w = p.bbox[2] * ratioX;
        const h = p.bbox[3] * ratioY;
        
        const box = document.createElement('div');
        box.className = 'detect-box';
        box.style.left = `${x}px`;
        box.style.top = `${y}px`;
        box.style.width = `${w}px`;
        box.style.height = `${h}px`;
        
        const label = document.createElement('div');
        label.className = 'detect-label';
        label.innerText = p.class;
        box.appendChild(label);
        
        box.onclick = () => playAudio(p.class);
        hotspotsContainer.appendChild(box);
    });
}

// ------------------- ANIMAL API VOCAB -------------------
let currentAnimalType = 'dog';
let currentAnimalVi = 'con chó';
let currentAnimalEmoji = '🐶';

// History stack to go backward
let animalHistory = [];
let currentHistoryIndex = -1;

function showAnimalVocab() {
    showPage('vocab-animal');
    loadCommonAnimal();
}

function showVehicleVocab() {
    showPage('vocab-vehicle');
    loadCommonVehicle();
}

function showFoodVocab() {
    showPage('vocab-food');
    loadCommonFood();
}

function showBodyVocab() {
    showPage('vocab-body');
    loadCommonBody();
}

function loadAnimal(type, vi, emoji) {
    currentAnimalType = type;
    currentAnimalVi = vi;
    currentAnimalEmoji = emoji;
    
    document.querySelectorAll('.animal-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(emoji)) {
            btn.classList.add('active');
        }
    });
    
    // Reset default layout state smoothly
    document.getElementById('animal-card').style.display = 'flex';
    document.getElementById('animal-name-container').style.display = 'flex';
    document.getElementById('animal-name-container').style.flexDirection = 'column';
    document.getElementById('animal-name-container').style.alignItems = 'center';
    
    document.getElementById('animal-en').textContent = type;
    document.getElementById('animal-vi').textContent = vi;
    
    markAnimalLoadedForBlindfold();
    
    document.getElementById('animal-next-btn').textContent = `🔄 Next ${type}`;
    document.getElementById('animal-next-btn').onclick = loadCurrentAnimal;
    
    loadCurrentAnimal();
}

function loadCurrentAnimal() {
    const img = document.getElementById('animal-img');
    const loading = document.getElementById('animal-loading');
    
    loading.style.display = 'flex';
    img.style.display = 'none';
    
    let url = '';
    let extractUrl = (data) => data;
    
    switch(currentAnimalType) {
        case 'dog':
            url = 'https://dog.ceo/api/breeds/image/random';
            extractUrl = (data) => data.message;
            break;
        case 'cat':
            url = 'https://api.thecatapi.com/v1/images/search';
            extractUrl = (data) => data[0].url;
            break;
        case 'fox':
            url = 'https://randomfox.ca/floof/';
            extractUrl = (data) => data.image;
            break;
        case 'duck':
            url = 'https://random-d.uk/api/random';
            extractUrl = (data) => data.url;
            break;
        case 'bird':
            url = 'https://shibe.online/api/birds';
            extractUrl = (data) => data[0];
            break;
    }
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            img.src = extractUrl(data);
            img.onload = () => {
                loading.style.display = 'none';
                img.style.display = 'block';
            };
        })
        .catch(err => {
            console.error(err);
            loading.style.display = 'none';
            img.alt = "Lỗi khi tải hình ảnh. Vui lòng thử lại.";
            img.style.display = 'block';
        });
}

// Fetch random animal from iNaturalist (10,000+ species)
async function loadRandomAnimal() {
    const img = document.getElementById('animal-img');
    const loading = document.getElementById('animal-loading');
    const animalCard = document.getElementById('animal-card');
    
    document.querySelectorAll('.animal-btn').forEach(btn => btn.classList.remove('active'));
    // Set UI for random animal safely
    try {
        if (event && event.target && event.target.tagName === 'BUTTON') {
             event.target.classList.add('active'); 
        }
    } catch(e){}
    document.getElementById('mass-review-container').style.display = 'none';
    document.getElementById('blindfold-toggle-container').style.display = 'flex';
    if(document.getElementById('blindfold-toggle').checked) document.getElementById('blindfold-scoreboard').style.display = 'flex';
    
    animalCard.style.display = 'flex';
    loading.style.display = 'flex';
    img.style.display = 'none';
    
    const page = Math.floor(Math.random() * 10000) + 1;
    // taxon_id=1 represents Animalia. quality_grade=research ensures high-quality verified photos
    const url = `https://api.inaturalist.org/v1/observations?photos=true&taxon_id=1&quality_grade=research&per_page=1&page=${page}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        const obs = data.results[0];
        
        if (obs && obs.taxon && obs.photos && obs.photos.length > 0) {
            let enName = obs.taxon.preferred_common_name || obs.taxon.name;
            let imageUrl = obs.photos[0].url.replace('square', 'medium');
            
            // Translate name to Vietnamese
            const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(enName)}`;
            const transRes = await fetch(transUrl);
            const transData = await transRes.json();
            const viName = transData[0][0][0];
            
            // Re-check blindfold mode on next load
            const isBlindfolded = document.getElementById('blindfold-toggle').checked;
            const nameContainer = document.getElementById('animal-name-container');
            if(isBlindfolded) {
                nameContainer.style.display = 'none';
            } else {
                nameContainer.style.display = 'flex';
                nameContainer.style.flexDirection = 'column';
                nameContainer.style.alignItems = 'center';
            }
            
            document.getElementById('animal-en').textContent = enName;
            document.getElementById('animal-vi').textContent = viName;
            fetchPhonetic(enName, 'animal-phonetic');
            
            markAnimalLoadedForBlindfold();
            
            // Save to history if we are not navigating backwards
            if (currentHistoryIndex === -1 || currentHistoryIndex === animalHistory.length - 1) {
                animalHistory.push({
                    en: enName,
                    vi: viName,
                    img: imageUrl,
                    type: 'random' // Dấu hiệu để Next tiếp theo
                });
                currentHistoryIndex = animalHistory.length - 1;
            }
            
            updateNavigationButtons('random');
            
            img.src = imageUrl;
            img.onload = () => {
                loading.style.display = 'none';
                img.style.display = 'block';
            };
        } else {
            // Recursively try again if observation lacks good photos/data
            loadRandomAnimal();
        }
    } catch (err) {
        console.error(err);
        loading.style.display = 'none';
        img.alt = "Lỗi khi tải hình ảnh. Vui lòng thử lại.";
        img.style.display = 'block';
    }
}

// ------------------- 100 ANIMAL VOCAB LIST -------------------
const commonAnimals = [
  // Động vật có vú
  {en: "dog", vi: "chó"}, {en: "cat", vi: "mèo"}, {en: "lion", vi: "sư tử"}, {en: "tiger", vi: "hổ"}, {en: "elephant", vi: "voi"},
  {en: "giraffe", vi: "hươu cao cổ"}, {en: "zebra", vi: "ngựa vằn"}, {en: "bear", vi: "gấu"}, {en: "panda", vi: "gấu trúc"},
  {en: "wolf", vi: "sói"}, {en: "fox", vi: "cáo"}, {en: "deer", vi: "hươu"}, {en: "rabbit", vi: "thỏ"}, {en: "squirrel", vi: "sóc"},
  {en: "bat", vi: "dơi"}, {en: "monkey", vi: "khỉ"}, {en: "gorilla", vi: "khỉ đột"}, {en: "chimpanzee", vi: "tinh tinh"},
  {en: "kangaroo", vi: "chuột túi"}, {en: "koala", vi: "koala"}, {en: "horse", vi: "ngựa"}, {en: "donkey", vi: "lừa"},
  {en: "cow", vi: "bò"}, {en: "buffalo", vi: "trâu"}, {en: "goat", vi: "dê"}, {en: "sheep", vi: "cừu"}, {en: "pig", vi: "heo"},
  {en: "camel", vi: "lạc đà"}, {en: "llama", vi: "lạc đà Nam Mỹ"}, {en: "alpaca", vi: "alpaca"}, {en: "leopard", vi: "báo"},
  {en: "cheetah", vi: "báo gê-pa"}, {en: "hyena", vi: "linh cẩu"}, {en: "otter", vi: "rái cá"}, {en: "weasel", vi: "chồn"},
  {en: "raccoon", vi: "gấu mèo"}, {en: "skunk", vi: "chồn hôi"}, {en: "hedgehog", vi: "nhím"}, {en: "mole", vi: "chuột chũi"},
  {en: "hamster", vi: "chuột hamster"}, {en: "mouse", vi: "chuột"}, {en: "rat", vi: "chuột cống"}, {en: "seal", vi: "hải cẩu"},
  {en: "walrus", vi: "hải mã"}, {en: "dolphin", vi: "cá heo"}, {en: "whale", vi: "cá voi"}, {en: "porpoise", vi: "cá heo nhỏ"},
  {en: "manatee", vi: "bò biển"}, {en: "dugong", vi: "cá cúi"}, {en: "platypus", vi: "thú mỏ vịt"},
  // Chim
  {en: "eagle", vi: "đại bàng"}, {en: "hawk", vi: "diều hâu"}, {en: "falcon", vi: "chim ưng"}, {en: "owl", vi: "cú"},
  {en: "parrot", vi: "vẹt"}, {en: "pigeon", vi: "bồ câu"}, {en: "dove", vi: "chim cu"}, {en: "sparrow", vi: "chim sẻ"},
  {en: "crow", vi: "quạ"}, {en: "raven", vi: "quạ lớn"}, {en: "swan", vi: "thiên nga"}, {en: "duck", vi: "vịt"},
  {en: "goose", vi: "ngỗng"}, {en: "turkey", vi: "gà tây"}, {en: "chicken", vi: "gà"}, {en: "rooster", vi: "gà trống"},
  {en: "peacock", vi: "chim công"}, {en: "flamingo", vi: "hồng hạc"}, {en: "pelican", vi: "bồ nông"}, {en: "seagull", vi: "hải âu"},
  {en: "albatross", vi: "hải âu lớn"}, {en: "penguin", vi: "chim cánh cụt"}, {en: "woodpecker", vi: "chim gõ kiến"},
  {en: "kingfisher", vi: "bói cá"}, {en: "hummingbird", vi: "chim ruồi"}, {en: "crane", vi: "sếu"}, {en: "stork", vi: "cò"},
  {en: "heron", vi: "diệc"}, {en: "ibis", vi: "cò quăm"}, {en: "quail", vi: "chim cút"}, {en: "pheasant", vi: "gà lôi"},
  {en: "ostrich", vi: "đà điểu"}, {en: "emu", vi: "chim emu"}, {en: "kiwi", vi: "chim kiwi"}, {en: "toucan", vi: "chim toucan"},
  {en: "macaw", vi: "vẹt macaw"}, {en: "cockatoo", vi: "vẹt mào"}, {en: "budgie", vi: "vẹt nhỏ"}, {en: "canary", vi: "chim hoàng yến"},
  {en: "nightingale", vi: "sơn ca"}, {en: "skylark", vi: "chim chiền chiện"}, {en: "magpie", vi: "chim ác là"}, {en: "jay", vi: "chim giẻ cùi"},
  {en: "cuckoo", vi: "chim cu cu"}, {en: "swallow", vi: "chim én"}, {en: "swift", vi: "chim yến"}, {en: "robin", vi: "chim cổ đỏ"},
  {en: "finch", vi: "chim sẻ nhỏ"}, {en: "wren", vi: "chim hồng tước"}, {en: "thrush", vi: "chim hét"},
  // Cá
  {en: "shark", vi: "cá mập"}, {en: "tuna", vi: "cá ngừ"}, {en: "salmon", vi: "cá hồi"}, {en: "goldfish", vi: "cá vàng"},
  {en: "catfish", vi: "cá da trơn"}, {en: "swordfish", vi: "cá kiếm"}, {en: "eel", vi: "lươn"}, {en: "stingray", vi: "cá đuối"},
  // Côn trùng
  {en: "ant", vi: "kiến"}, {en: "bee", vi: "ong"}, {en: "butterfly", vi: "bướm"}, {en: "mosquito", vi: "muỗi"},
  {en: "fly", vi: "ruồi"}, {en: "grasshopper", vi: "châu chấu"}, {en: "dragonfly", vi: "chuồn chuồn"}, {en: "beetle", vi: "bọ cánh cứng"},
  {en: "cockroach", vi: "gián"}, {en: "termite", vi: "mối"}
];

async function loadCommonAnimal() {
    const img = document.getElementById('animal-img');
    const loading = document.getElementById('animal-loading');
    const animalCard = document.getElementById('animal-card');
    
    document.querySelectorAll('.animal-btn').forEach(btn => btn.classList.remove('active'));
    // Make sure 'this' or event.target gets active class safely
    try {
        if (event && event.target && event.target.tagName === 'BUTTON') {
            event.target.classList.add('active'); 
        }
    } catch(e){}
    document.getElementById('mass-review-container').style.display = 'none';
    document.getElementById('blindfold-toggle-container').style.display = 'flex';
    if(document.getElementById('blindfold-toggle').checked) document.getElementById('blindfold-scoreboard').style.display = 'flex';
    
    animalCard.style.display = 'flex';
    loading.style.display = 'flex';
    img.style.display = 'none';
        
    const randomAnimal = commonAnimals[Math.floor(Math.random() * commonAnimals.length)];
    const animalQuery = encodeURIComponent(randomAnimal.en);
    
    // Wikipedia API call
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${animalQuery}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
    
    try {
        const res = await fetch(wikiUrl);
        const data = await res.json();
        
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pageId !== "-1" && pages[pageId].thumbnail) {
            const imageUrl = pages[pageId].thumbnail.source;
            
            // Re-check blindfold mode on next load
            const isBlindfolded = document.getElementById('blindfold-toggle').checked;
            const nameContainer = document.getElementById('animal-name-container');
            if(isBlindfolded) {
                nameContainer.style.display = 'none';
            } else {
                nameContainer.style.display = 'flex';
                nameContainer.style.flexDirection = 'column';
                nameContainer.style.alignItems = 'center';
            }
            
            document.getElementById('animal-en').textContent = randomAnimal.en;
            document.getElementById('animal-vi').textContent = randomAnimal.vi;
            fetchPhonetic(randomAnimal.en, 'animal-phonetic');
            
            markAnimalLoadedForBlindfold();
            
            // Save to history if we are not navigating backwards
            if (currentHistoryIndex === -1 || currentHistoryIndex === animalHistory.length - 1) {
                animalHistory.push({
                    en: randomAnimal.en,
                    vi: randomAnimal.vi,
                    img: imageUrl,
                    type: 'common' // Dấu hiệu để Next tiếp theo
                });
                currentHistoryIndex = animalHistory.length - 1;
            }
            
            updateNavigationButtons('common');
            
            img.src = imageUrl;
            img.onload = () => {
                loading.style.display = 'none';
                img.style.display = 'block';
            };
        } else {
            // Wikipedia didn't have an image for this exact term, just recursive retry another one
            loadCommonAnimal();
        }
    } catch(err) {
        console.error(err);
        loading.style.display = 'none';
        img.alt = "Lỗi khi tải hình ảnh từ Wikipedia.";
        img.style.display = 'block';
    }
}

// ------------------- NAVIGATION HELPERS -------------------
function updateNavigationButtons(typeCallback) {
    const nextBtn = document.getElementById('animal-next-btn');
    const backBtn = document.getElementById('animal-back-btn');
    
    // Nút Next
    if (typeCallback === 'common') {
        nextBtn.textContent = `🔄 Next Q.Thuộc`;
        nextBtn.onclick = () => { processAnimalSkip(); handleNext('common'); };
    } else {
        nextBtn.textContent = `🔄 Next Random`;
        nextBtn.onclick = () => { processAnimalSkip(); handleNext('random'); };
    }
    
    // Hiện/Ẩn nút Back
    if (backBtn) {
        if (currentHistoryIndex > 0) {
            backBtn.style.display = 'inline-block';
        } else {
            backBtn.style.display = 'none';
        }
    }
}

function handleNext(type) {
    if (currentHistoryIndex < animalHistory.length - 1) {
        // Đi tới lịch sử tiếp theo nếu chúng ta đang ở giữa stack
        currentHistoryIndex++;
        displayHistoricalAnimal(animalHistory[currentHistoryIndex], type);
    } else {
        // Nếu ở cuối stack, tạo mới
        if (type === 'common') loadCommonAnimal();
        else loadRandomAnimal();
    }
}

function loadPreviousAnimal() {
    if (currentHistoryIndex > 0) {
        processAnimalSkip(); // Phạt skip nếu bỏ dở con hiện tại
        currentHistoryIndex--;
        const previous = animalHistory[currentHistoryIndex];
        displayHistoricalAnimal(previous, previous.type);
    }
}

function displayHistoricalAnimal(animalData, type) {
    const img = document.getElementById('animal-img');
    const loading = document.getElementById('animal-loading');
    
    loading.style.display = 'flex';
    img.style.display = 'none';
    
    // Re-check blindfold mode on next load
    const isBlindfolded = document.getElementById('blindfold-toggle').checked;
    const nameContainer = document.getElementById('animal-name-container');
    if(isBlindfolded) {
        nameContainer.style.display = 'none';
    } else {
        nameContainer.style.display = 'flex';
        nameContainer.style.flexDirection = 'column';
        nameContainer.style.alignItems = 'center';
    }
    
    document.getElementById('animal-en').textContent = animalData.en;
    document.getElementById('animal-vi').textContent = animalData.vi;
    fetchPhonetic(animalData.en, 'animal-phonetic');
    
    markAnimalLoadedForBlindfold();
    updateNavigationButtons(type);
    
    img.src = animalData.img;
    img.onload = () => {
        loading.style.display = 'none';
        img.style.display = 'block';
    };
}


// ------------------- BLINDFOLD MODE -------------------
let blindCorrect = 0;
let blindIncorrect = 0;
let blindSkipped = 0;
let blindCurrentState = 'pending'; // 'pending', 'correct'
let blindAnimalLoaded = false;

function updateScoreboard() {
    document.getElementById('score-correct').textContent = blindCorrect;
    document.getElementById('score-incorrect').textContent = blindIncorrect;
    document.getElementById('score-skipped').textContent = blindSkipped;
}

function processAnimalSkip() {
    const isBlindfolded = document.getElementById('blindfold-toggle').checked;
    if (isBlindfolded && blindAnimalLoaded && blindCurrentState !== 'correct') {
        blindSkipped++;
        updateScoreboard();
    }
    blindCurrentState = 'pending';
    blindAnimalLoaded = false;
}

function markAnimalLoadedForBlindfold() {
    blindAnimalLoaded = true;
    blindCurrentState = 'pending';
    
    const guessInput = document.getElementById('animal-guess-input');
    const guessResult = document.getElementById('animal-guess-result');
    if(guessInput) guessInput.value = '';
    if(guessResult) guessResult.textContent = '';
    // Reset persistent write box
    const writeInput = document.getElementById('persistent-write-input');
    if (writeInput) {
        writeInput.value = '';
        writeInput.style.backgroundColor = '#fff';
        writeInput.style.borderColor = '#000';
    }
}

function checkPersistentWrite() {
    const inputEl = document.getElementById('persistent-write-input');
    if (!inputEl) return;
    
    // So sánh gõ tiếng Anh
    const guess = inputEl.value.trim().toLowerCase();
    const actualName = document.getElementById('animal-en').textContent.toLowerCase();
    
    // Nếu gõ đúng (chấp nhận một phần từ cho API dài)
    if (guess !== '' && actualName.includes(guess) && guess.length >= Math.min(3, actualName.length)) { 
        // Chỉ chấp nhận nếu user gõ đủ dài gần bằng tên thật để tránh spam chữ "a" "b" "c"
        if (guess === actualName || actualName.split(' ').includes(guess)) {
            inputEl.style.backgroundColor = '#c8e6c9'; // Xanh lá
            inputEl.style.borderColor = '#4caf50';
            // Play âm thanh chút xíu để tạo hứng khởi nhưng âm lượng nhỏ để không ồn
            playAudio(actualName);
        } else {
             inputEl.style.backgroundColor = '#fff';
             inputEl.style.borderColor = '#000';
        }
    } else {
        inputEl.style.backgroundColor = '#fff';
        inputEl.style.borderColor = '#000';
    }
}

function toggleBlindfold() {
    const isBlindfolded = document.getElementById('blindfold-toggle').checked;
    const nameContainer = document.getElementById('animal-name-container');
    const guessContainer = document.getElementById('animal-guess-container');
    const audioBtn = document.getElementById('animal-audio-btn');
    const scoreboard = document.getElementById('blindfold-scoreboard');
    
    if (isBlindfolded) {
        scoreboard.style.display = 'flex';
        // Reset scores
        blindCorrect = 0;
        blindIncorrect = 0;
        blindSkipped = 0;
        blindCurrentState = 'pending';
        updateScoreboard();
        
        nameContainer.style.display = 'none'; // Ẩn hoàn toàn khối chữ
        audioBtn.style.display = 'none'; // Ẩn luôn nút nghe chống gian lận
        guessContainer.style.display = 'block';
    } else {
        scoreboard.style.display = 'none';
        nameContainer.style.display = 'flex'; // Hiện lại khối chữ (Nên để flex giống CSS default)
        nameContainer.style.flexDirection = 'column';
        nameContainer.style.alignItems = 'center';
        audioBtn.style.display = 'inline-block';
        guessContainer.style.display = 'none';
    }
}

function checkAnimalGuess(isAuto = false) {
    if (blindCurrentState === 'correct') return; // Đã đoán đúng rồi thì bỏ qua
    
    const guessInput = document.getElementById('animal-guess-input').value.trim().toLowerCase();
    const actualName = document.getElementById('animal-en').textContent.toLowerCase();
    const resultDiv = document.getElementById('animal-guess-result');
    
    const isMatch = actualName === guessInput || actualName.split(/[,/()]/).map(s => s.trim()).includes(guessInput) || (!isAuto && actualName.includes(guessInput) && guessInput.length > 2);
    
    if (guessInput === '') {
        if (!isAuto) {
            resultDiv.textContent = 'Vui lòng nhập dự đoán!';
            resultDiv.style.color = 'orange';
        }
    } else if (isMatch) {
        resultDiv.textContent = '🎉 Đúng rồi! Giỏi quá!';
        resultDiv.style.color = '#4caf50'; // green
        
        blindCorrect++;
        blindCurrentState = 'correct';
        updateScoreboard();
        
        // Hiện tên ra
        document.getElementById('animal-name-container').style.display = 'flex';
        document.getElementById('animal-name-container').style.flexDirection = 'column';
        document.getElementById('animal-name-container').style.alignItems = 'center';
        document.getElementById('animal-audio-btn').style.display = 'inline-block';
        
        // Phát âm thanh chúc mừng (tuỳ chọn)
        playAudio(actualName);
    } else {
        if (!isAuto) {
            resultDiv.textContent = '❌ Sai rồi, thử lại nhé!';
            resultDiv.style.color = '#f44336'; // red
            if (blindCurrentState === 'pending') {
                blindIncorrect++;
                blindCurrentState = 'incorrect';
                updateScoreboard();
            }
        }
    }
}

function revealAnimalGuess() {
    if (blindCurrentState === 'correct') return; // Đã xong thì không cần xem đáp án
    
    const actualName = document.getElementById('animal-en').textContent.toLowerCase();
    const resultDiv = document.getElementById('animal-guess-result');
    
    // Đánh thẻ là Sai và cộng điểm Sai nếu chưa từng bị trừ điểm
    if (blindCurrentState === 'pending') {
        blindIncorrect++;
        blindCurrentState = 'incorrect';
        updateScoreboard();
    }
    
    // Ghi đáp án vào text box để người dùng thấy rõ
    document.getElementById('animal-guess-input').value = actualName;
    
    resultDiv.textContent = 'Bị trừ điểm! (Đã xem đáp án)';
    resultDiv.style.color = '#f44336'; // red
    
    // Hiện tên lấp lánh như bình thường
    document.getElementById('animal-name-container').style.display = 'flex';
    document.getElementById('animal-name-container').style.flexDirection = 'column';
    document.getElementById('animal-name-container').style.alignItems = 'center';
    document.getElementById('animal-audio-btn').style.display = 'inline-block';
    
    // Phát âm thanh
    playAudio(actualName);
}

function swapLang() {
    const sourceLang = document.getElementById('source-lang');
    const targetLang = document.getElementById('target-lang');
    const sourceText = document.getElementById('source-text');
    const targetText = document.getElementById('target-text');

    // Đổi ngôn ngữ
    const tempLang = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = tempLang;

    // Đổi đoạn text
    const tempText = sourceText.value;
    sourceText.value = targetText.value;
    targetText.value = tempText;
}

// ------------------- UTILS -------------------

// Lấy phiên âm (Phonetic) từ Free Dictionary API
async function fetchPhonetic(word, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = ''; // clear old phonetic
    
    // Chỉ lấy từ đầu tiên nếu là cụm từ vì API này chỉ hỗ trợ từ đơn tốt nhất
    const singleWord = word.split(' ')[0].toLowerCase().trim();
    if (!singleWord) return;
    
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(singleWord)}`);
        if (!response.ok) return;
        const data = await response.json();
        
        if (data && data.length > 0 && data[0].phonetics) {
            // Tìm phiên âm đầu tiên có chứa text
            const textPhonetic = data[0].phonetics.find(p => p.text);
            if (textPhonetic && textPhonetic.text) {
                el.textContent = textPhonetic.text;
            } else if (data[0].phonetic) { // Fallback to top level phonetic string
                el.textContent = data[0].phonetic;
            }
        }
    } catch (error) {
        console.log("Không tìm thấy phiên âm cho:", singleWord);
    }
}

// ------------------- MASS REVIEW MODE -------------------
let massReviewScore = 0;
let massReviewData = [];

async function loadMassReview() {
    // Ẩn các giao diện trò chơi cũ
    document.getElementById('animal-card').style.display = 'none';
    document.getElementById('blindfold-toggle-container').style.display = 'none';
    document.getElementById('blindfold-scoreboard').style.display = 'none';
    
    // Đánh dấu nút đang chọn
    document.querySelectorAll('.animal-btn').forEach(btn => btn.classList.remove('active'));
    try {
        if (event && event.target && event.target.tagName === 'BUTTON') {
             event.target.classList.add('active'); 
        }
    } catch(e){}
    
    // Hiện vùng bài tập
    const container = document.getElementById('mass-review-container');
    const loading = document.getElementById('mass-review-loading');
    const grid = document.getElementById('mass-review-grid');
    
    container.style.display = 'block';
    loading.style.display = 'flex';
    grid.innerHTML = '';
    
    massReviewScore = 0;
    document.getElementById('mass-review-correct').textContent = massReviewScore;
    
    // Sao chép dữ liệu để thêm trực tiếp ảnh vào object mà không làm nát mảng gốc
    massReviewData = JSON.parse(JSON.stringify(commonAnimals)); 
    
    // Wikipedia API chặn tải quá 50 articles cùng lúc => Cắt ra làm 2 nhịp tải
    const chunkSize = 50;
    const promises = [];
    
    for (let i = 0; i < massReviewData.length; i += chunkSize) {
        const chunk = massReviewData.slice(i, i + chunkSize);
        const titles = chunk.map(a => encodeURIComponent(a.en)).join('|');
        // Kéo ảnh thumbnail cỡ 300px thay vì full-size để tránh tràn RAM
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${titles}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
        
        promises.push(
            fetch(wikiUrl).then(res => res.json()).then(data => {
                if(data.query && data.query.pages) {
                    const pages = data.query.pages;
                    Object.values(pages).forEach(page => {
                        if (page.title && page.thumbnail) {
                            // Find matching animal title ignoring cases
                            const match = massReviewData.find(a => a.en.toLowerCase() === page.title.toLowerCase());
                            if (match) {
                                match.img = page.thumbnail.source;
                            }
                        }
                    });
                }
            }).catch(err => console.error(err))
        );
    }
    
    // Chờ tất cả dữ liệu từ Wiki tải về máy
    await Promise.all(promises);
    
    loading.style.display = 'none';
    renderMassReviewGrid(massReviewData);
}

function renderMassReviewGrid(data) {
    const grid = document.getElementById('mass-review-grid');
    grid.innerHTML = '';
    
    data.forEach((animal, index) => {
        const itemBox = document.createElement('div');
        itemBox.style.border = '3px solid #000';
        itemBox.style.borderRadius = '12px';
        itemBox.style.padding = '10px';
        itemBox.style.background = '#fff';
        itemBox.style.boxShadow = '3px 3px 0 #222';
        itemBox.style.display = 'flex';
        itemBox.style.flexDirection = 'column';
        itemBox.style.alignItems = 'center';
        itemBox.style.gap = '10px';
        
        // Image
        const img = document.createElement('img');
        // Nếu Wiki lỗi ảnh thì dùng ảnh giữ chỗ báo lỗi
        img.src = animal.img || 'https://via.placeholder.com/300?text=' + encodeURIComponent(animal.en);
        img.alt = animal.en;
        img.style.width = '100%';
        img.style.height = '150px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '2px solid #000';
        
        // Vietnamese name label
        const viLabel = document.createElement('div');
        viLabel.textContent = animal.vi;
        viLabel.style.fontWeight = 'bold';
        viLabel.style.fontFamily = 'Quicksand';
        viLabel.style.fontSize = '18px';
        
        // Input text field
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nhập TA...';
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.fontFamily = 'Nunito';
        input.style.fontSize = '16px';
        input.style.border = '2px solid #000';
        input.style.borderRadius = '6px';
        input.style.textAlign = 'center';
        
        // Validate spelling immediately when user hits key or moves cursor
        input.oninput = (e) => checkMassReviewItem(index, e.target, itemBox);
        
        itemBox.appendChild(img);
        itemBox.appendChild(viLabel);
        itemBox.appendChild(input);
        
        grid.appendChild(itemBox);
    });
}

function checkMassReviewItem(index, inputElement, itemBox) {
    if (inputElement.disabled) return; // Nếu đã đúng rồi thì khóa không cho xóa sửa
    
    const animal = massReviewData[index];
    const guess = inputElement.value.trim().toLowerCase();
    
    if (guess === animal.en.toLowerCase()) {
        inputElement.disabled = true;
        inputElement.style.backgroundColor = '#c8e6c9';
        inputElement.style.color = '#2e7d32';
        inputElement.style.fontWeight = 'bold';
        itemBox.style.borderColor = '#4caf50';
        itemBox.style.boxShadow = '3px 3px 0 #4caf50';
        itemBox.style.backgroundColor = '#e8f5e9'; // Đổi nền thẻ cho rực rỡ
        
        massReviewScore++;
        document.getElementById('mass-review-correct').textContent = massReviewScore;
        
        playAudio(animal.en);
        
        if (massReviewScore === 100) {
            setTimeout(() => alert('🎉 Tuyệt đỉnh! Bạn đã vượt qua chướng ngại vật 100 từ vựng xuất sắc!'), 500);
        }
    }
}

function finishMassReview() {
    alert(`Bạn đã điền đúng ${massReviewScore}/100 con vật! Trình độ từ vựng của bạn rất tuyệt.`);
}

// ------------------- VEHICLE SECTION -------------------
const commonVehicles = [
    {en: "car", vi: "xe hơi"},
    {en: "bus", vi: "xe buýt"},
    {en: "bicycle", vi: "xe đạp"},
    {en: "motorcycle", vi: "xe máy"},
    {en: "train", vi: "tàu hỏa"},
    {en: "airplane", vi: "máy bay"},
    {en: "helicopter", vi: "trực thăng"},
    {en: "truck", vi: "xe tải"},
    {en: "ship", vi: "tàu thủy"},
    {en: "boat", vi: "thuyền"},
    {en: "scooter", vi: "xe tay ga"},
    {en: "taxi", vi: "xe taxi"},
    {en: "ambulance", vi: "xe cứu thương"},
    {en: "fire truck", vi: "xe cứu hỏa"},
    {en: "police car", vi: "xe cảnh sát"}
];

let vBlindCorrect = 0;
let vBlindIncorrect = 0;
let vBlindSkipped = 0;
let vBlindCurrentState = 'pending'; 
let vBlindAnimalLoaded = false;
let vehicleHistory = [];
let vCurrentHistoryIndex = -1;

async function loadCommonVehicle() {
    const img = document.getElementById('vehicle-img');
    const loading = document.getElementById('vehicle-loading');
    const vehicleCard = document.getElementById('vehicle-card');
    
    document.querySelectorAll('.animal-btn').forEach(btn => btn.classList.remove('active'));
    try { if (event && event.target && event.target.tagName === 'BUTTON') event.target.classList.add('active'); } catch(e){}
    
    document.getElementById('vehicle-mass-review-container').style.display = 'none';
    document.getElementById('vehicle-blindfold-toggle-container').style.display = 'flex';
    if(document.getElementById('vehicle-blindfold-toggle').checked) document.getElementById('vehicle-blindfold-scoreboard').style.display = 'flex';
    
    vehicleCard.style.display = 'flex';
    loading.style.display = 'flex';
    img.style.display = 'none';
        
    const randomVehicle = commonVehicles[Math.floor(Math.random() * commonVehicles.length)];
    const vehicleQuery = encodeURIComponent(randomVehicle.en);
    
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${vehicleQuery}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
    
    try {
        const res = await fetch(wikiUrl);
        const data = await res.json();
        
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        let imageUrl = '';
        if (pageId !== "-1" && pages[pageId].thumbnail) {
            imageUrl = pages[pageId].thumbnail.source;
        } else {
            imageUrl = 'https://via.placeholder.com/400x300?text=' + vehicleQuery;
        }
            
        const isBlindfolded = document.getElementById('vehicle-blindfold-toggle').checked;
        const nameContainer = document.getElementById('vehicle-name-container');
        if(isBlindfolded) {
            nameContainer.style.display = 'none';
        } else {
            nameContainer.style.display = 'flex';
            nameContainer.style.flexDirection = 'column';
            nameContainer.style.alignItems = 'center';
        }
        
        document.getElementById('vehicle-en').textContent = randomVehicle.en;
        document.getElementById('vehicle-vi').textContent = randomVehicle.vi;
        fetchPhonetic(randomVehicle.en, 'vehicle-phonetic');
        
        markVehicleLoadedForBlindfold();
        
        if (vCurrentHistoryIndex === -1 || vCurrentHistoryIndex === vehicleHistory.length - 1) {
            vehicleHistory.push({
                en: randomVehicle.en,
                vi: randomVehicle.vi,
                img: imageUrl
            });
            vCurrentHistoryIndex = vehicleHistory.length - 1;
        }
        
        updateVehicleNavigationButtons();
        
        img.src = imageUrl;
        img.onload = () => {
            loading.style.display = 'none';
            img.style.display = 'block';
        };
    } catch (err) {
        console.error(err);
        loading.style.display = 'none';
        img.alt = "Lỗi khi tải hình ảnh. Vui lòng thử lại.";
        img.style.display = 'block';
    }
}

function updateVehicleNavigationButtons() {
    const backBtn = document.getElementById('vehicle-back-btn');
    if (backBtn) {
        if (vCurrentHistoryIndex > 0) backBtn.style.display = 'inline-block';
        else backBtn.style.display = 'none';
    }
}

function processVehicleSkip() {
    const isBlindfolded = document.getElementById('vehicle-blindfold-toggle').checked;
    if (isBlindfolded && vBlindAnimalLoaded && vBlindCurrentState === 'pending') {
        vBlindSkipped++;
        updateVehicleScoreboard();
    }
}

function loadPreviousVehicle() {
    if (vCurrentHistoryIndex > 0) {
        processVehicleSkip(); 
        vCurrentHistoryIndex--;
        displayHistoricalVehicle(vehicleHistory[vCurrentHistoryIndex]);
    }
}

function displayHistoricalVehicle(vehicleData) {
    const img = document.getElementById('vehicle-img');
    const loading = document.getElementById('vehicle-loading');
    
    loading.style.display = 'flex';
    img.style.display = 'none';
    
    const isBlindfolded = document.getElementById('vehicle-blindfold-toggle').checked;
    const nameContainer = document.getElementById('vehicle-name-container');
    if(isBlindfolded) {
        nameContainer.style.display = 'none';
    } else {
        nameContainer.style.display = 'flex';
        nameContainer.style.flexDirection = 'column';
        nameContainer.style.alignItems = 'center';
    }
    
    document.getElementById('vehicle-en').textContent = vehicleData.en;
    document.getElementById('vehicle-vi').textContent = vehicleData.vi;
    fetchPhonetic(vehicleData.en, 'vehicle-phonetic');
    
    markVehicleLoadedForBlindfold();
    updateVehicleNavigationButtons();
    
    img.src = vehicleData.img;
    img.onload = () => {
        loading.style.display = 'none';
        img.style.display = 'block';
    };
}

// --- VEHICLE BLINDFOLD LOGIC ---
function toggleVehicleBlindfold() {
    const isBlindfolded = document.getElementById('vehicle-blindfold-toggle').checked;
    const nameContainer = document.getElementById('vehicle-name-container');
    const guessContainer = document.getElementById('vehicle-guess-container');
    const audioBtn = document.getElementById('vehicle-audio-btn');
    const scoreboard = document.getElementById('vehicle-blindfold-scoreboard');
    
    if (isBlindfolded) {
        scoreboard.style.display = 'flex';
        vBlindCorrect = 0; vBlindIncorrect = 0; vBlindSkipped = 0; vBlindCurrentState = 'pending';
        updateVehicleScoreboard();
        
        nameContainer.style.display = 'none';
        audioBtn.style.display = 'none';
        guessContainer.style.display = 'block';
    } else {
        scoreboard.style.display = 'none';
        nameContainer.style.display = 'flex';
        nameContainer.style.flexDirection = 'column';
        nameContainer.style.alignItems = 'center';
        audioBtn.style.display = 'inline-block';
        guessContainer.style.display = 'none';
    }
}

function updateVehicleScoreboard() {
    document.getElementById('v-score-correct').textContent = vBlindCorrect;
    document.getElementById('v-score-incorrect').textContent = vBlindIncorrect;
    document.getElementById('v-score-skipped').textContent = vBlindSkipped;
}

function markVehicleLoadedForBlindfold() {
    vBlindAnimalLoaded = true;
    vBlindCurrentState = 'pending';
    
    const guessInput = document.getElementById('vehicle-guess-input');
    const guessResult = document.getElementById('vehicle-guess-result');
    if(guessInput) guessInput.value = '';
    if(guessResult) guessResult.textContent = '';
    
    const writeInput = document.getElementById('vehicle-persistent-write-input');
    if (writeInput) {
        writeInput.value = '';
        writeInput.style.backgroundColor = '#fff';
        writeInput.style.borderColor = '#000';
    }
}

function checkVehicleGuess(isAuto = false) {
    if (vBlindCurrentState === 'correct') return;
    
    const guessInput = document.getElementById('vehicle-guess-input').value.trim().toLowerCase();
    const actualName = document.getElementById('vehicle-en').textContent.toLowerCase();
    const resultDiv = document.getElementById('vehicle-guess-result');
    
    const isMatch = actualName === guessInput || actualName.split(/[,/()]/).map(s => s.trim()).includes(guessInput) || (!isAuto && actualName.includes(guessInput) && guessInput.length > 2);
    
    if (guessInput === '') {
        if (!isAuto) {
            resultDiv.textContent = 'Vui lòng nhập dự đoán!';
            resultDiv.style.color = 'orange';
        }
    } else if (isMatch) {
        resultDiv.textContent = '🎉 Đúng rồi! Giỏi quá!';
        resultDiv.style.color = '#4caf50';
        
        vBlindCorrect++;
        vBlindCurrentState = 'correct';
        updateVehicleScoreboard();
        
        document.getElementById('vehicle-name-container').style.display = 'flex';
        document.getElementById('vehicle-name-container').style.flexDirection = 'column';
        document.getElementById('vehicle-name-container').style.alignItems = 'center';
        document.getElementById('vehicle-audio-btn').style.display = 'inline-block';
        playAudio(actualName);
    } else {
        if (!isAuto) {
            resultDiv.textContent = '❌ Sai rồi, thử lại nhé!';
            resultDiv.style.color = '#f44336';
            if (vBlindCurrentState === 'pending') {
                vBlindIncorrect++;
                vBlindCurrentState = 'incorrect';
                updateVehicleScoreboard();
            }
        }
    }
}

function revealVehicleGuess() {
    if (vBlindCurrentState === 'correct') return;
    
    const actualName = document.getElementById('vehicle-en').textContent.toLowerCase();
    const resultDiv = document.getElementById('vehicle-guess-result');
    
    if (vBlindCurrentState === 'pending') {
        vBlindIncorrect++;
        vBlindCurrentState = 'incorrect';
        updateVehicleScoreboard();
    }
    
    document.getElementById('vehicle-guess-input').value = actualName;
    resultDiv.textContent = 'Bị trừ điểm! (Đã xem đáp án)';
    resultDiv.style.color = '#f44336';
    
    document.getElementById('vehicle-name-container').style.display = 'flex';
    document.getElementById('vehicle-name-container').style.flexDirection = 'column';
    document.getElementById('vehicle-name-container').style.alignItems = 'center';
    document.getElementById('vehicle-audio-btn').style.display = 'inline-block';
    playAudio(actualName);
}

function checkVehiclePersistentWrite() {
    const inputEl = document.getElementById('vehicle-persistent-write-input');
    if (!inputEl) return;
    
    const guess = inputEl.value.trim().toLowerCase();
    const actualName = document.getElementById('vehicle-en').textContent.toLowerCase();
    
    if (guess !== '' && actualName.includes(guess) && guess.length >= Math.min(3, actualName.length)) { 
        if (guess === actualName || actualName.split(' ').includes(guess)) {
            inputEl.style.backgroundColor = '#c8e6c9';
            inputEl.style.borderColor = '#4caf50';
            playAudio(actualName);
        } else {
             inputEl.style.backgroundColor = '#fff';
             inputEl.style.borderColor = '#000';
        }
    } else {
        inputEl.style.backgroundColor = '#fff';
        inputEl.style.borderColor = '#000';
    }
}

// --- VEHICLE MASS REVIEW ---
let vMassReviewScore = 0;
let vMassReviewData = [];

async function loadVehicleMassReview() {
    document.getElementById('vehicle-card').style.display = 'none';
    document.getElementById('vehicle-blindfold-toggle-container').style.display = 'none';
    document.getElementById('vehicle-blindfold-scoreboard').style.display = 'none';
    
    document.querySelectorAll('.animal-btn').forEach(btn => btn.classList.remove('active'));
    try { if (event && event.target && event.target.tagName === 'BUTTON') event.target.classList.add('active'); } catch(e){}
    
    const container = document.getElementById('vehicle-mass-review-container');
    const loading = document.getElementById('v-mass-review-loading');
    const grid = document.getElementById('v-mass-review-grid');
    
    container.style.display = 'block';
    loading.style.display = 'flex';
    grid.innerHTML = '';
    
    vMassReviewScore = 0;
    document.getElementById('v-mass-review-correct').textContent = vMassReviewScore;
    
    vMassReviewData = JSON.parse(JSON.stringify(commonVehicles)); 
    
    const titles = vMassReviewData.map(a => encodeURIComponent(a.en)).join('|');
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${titles}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
        
    try {
        const res = await fetch(wikiUrl);
        const data = await res.json();
        if(data.query && data.query.pages) {
            const pages = data.query.pages;
            Object.values(pages).forEach(page => {
                if (page.title && page.thumbnail) {
                    const match = vMassReviewData.find(a => a.en.toLowerCase() === page.title.toLowerCase());
                    if (match) match.img = page.thumbnail.source;
                }
            });
        }
    } catch(err) {
        console.error(err);
    }
    
    loading.style.display = 'none';
    renderVehicleMassReviewGrid(vMassReviewData);
}

function renderVehicleMassReviewGrid(data) {
    const grid = document.getElementById('v-mass-review-grid');
    grid.innerHTML = '';
    
    data.forEach((vehicle, index) => {
        const itemBox = document.createElement('div');
        itemBox.style.border = '3px solid #000';
        itemBox.style.borderRadius = '12px';
        itemBox.style.padding = '10px';
        itemBox.style.background = '#fff';
        itemBox.style.boxShadow = '3px 3px 0 #222';
        itemBox.style.display = 'flex';
        itemBox.style.flexDirection = 'column';
        itemBox.style.alignItems = 'center';
        itemBox.style.gap = '10px';
        
        const img = document.createElement('img');
        img.src = vehicle.img || 'https://via.placeholder.com/300?text=' + encodeURIComponent(vehicle.en);
        img.alt = vehicle.en;
        img.style.width = '100%';
        img.style.height = '150px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '2px solid #000';
        
        const viLabel = document.createElement('div');
        viLabel.textContent = vehicle.vi;
        viLabel.style.fontWeight = 'bold';
        viLabel.style.fontFamily = 'Quicksand';
        viLabel.style.fontSize = '18px';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nhập TA...';
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.fontFamily = 'Nunito';
        input.style.fontSize = '16px';
        input.style.border = '2px solid #000';
        input.style.borderRadius = '6px';
        input.style.textAlign = 'center';
        input.oninput = (e) => checkVehicleMassReviewItem(index, e.target, itemBox);
        
        itemBox.appendChild(img);
        itemBox.appendChild(viLabel);
        itemBox.appendChild(input);
        
        grid.appendChild(itemBox);
    });
}

function checkVehicleMassReviewItem(index, inputElement, itemBox) {
    if (inputElement.disabled) return;
    
    const vehicle = vMassReviewData[index];
    const guess = inputElement.value.trim().toLowerCase();
    
    if (guess === vehicle.en.toLowerCase()) {
        inputElement.disabled = true;
        inputElement.style.backgroundColor = '#c8e6c9';
        inputElement.style.color = '#2e7d32';
        inputElement.style.fontWeight = 'bold';
        itemBox.style.borderColor = '#4caf50';
        itemBox.style.boxShadow = '3px 3px 0 #4caf50';
        itemBox.style.backgroundColor = '#e8f5e9';
        
        vMassReviewScore++;
        document.getElementById('v-mass-review-correct').textContent = vMassReviewScore;
        
        playAudio(vehicle.en);
        
        if (vMassReviewScore === vMassReviewData.length) {
            setTimeout(() => alert('🎉 Tuyệt đỉnh! Bạn đã hoàn thành xuất sắc bài kiểm tra Phương Tiện Giao Thông!'), 500);
        }
    }
}

function finishVehicleMassReview() {
    alert(`Bạn đã điền đúng ${vMassReviewScore}/${vMassReviewData.length} phương tiện!`);
}

// ------------------- FOOD SECTION -------------------
const commonFoods = [
    {en: "apple", vi: "quả táo"},
    {en: "banana", vi: "quả chuối"},
    {en: "pizza", vi: "bánh pizza"},
    {en: "hamburger", vi: "bánh mì kẹp thịt"},
    {en: "bread", vi: "bánh mì"},
    {en: "rice", vi: "cơm / gạo"},
    {en: "beef", vi: "thịt bò"},
    {en: "chicken", vi: "thịt gà"},
    {en: "pork", vi: "thịt lợn"},
    {en: "fish", vi: "cá"},
    {en: "egg", vi: "trứng"},
    {en: "cheese", vi: "phô mai"},
    {en: "salad", vi: "rau trộn"},
    {en: "soup", vi: "món súp"},
    {en: "noodle", vi: "mì / phở"}
];

let fBlindCorrect = 0;
let fBlindIncorrect = 0;
let fBlindSkipped = 0;
let fBlindCurrentState = 'pending'; 
let fBlindAnimalLoaded = false;
let foodHistory = [];
let fCurrentHistoryIndex = -1;

async function loadCommonFood() {
    const img = document.getElementById('food-img');
    const loading = document.getElementById('food-loading');
    const foodCard = document.getElementById('food-card');
    
    document.querySelectorAll('.animal-btn').forEach(btn => btn.classList.remove('active'));
    try { if (event && event.target && event.target.tagName === 'BUTTON') event.target.classList.add('active'); } catch(e){}
    
    document.getElementById('food-mass-review-container').style.display = 'none';
    document.getElementById('food-blindfold-toggle-container').style.display = 'flex';
    if(document.getElementById('food-blindfold-toggle').checked) document.getElementById('food-blindfold-scoreboard').style.display = 'flex';
    
    foodCard.style.display = 'flex';
    loading.style.display = 'flex';
    img.style.display = 'none';
        
    const randomFood = commonFoods[Math.floor(Math.random() * commonFoods.length)];
    const foodQuery = encodeURIComponent(randomFood.en);
    
    // Some foods might have disambiguation, but simple queries usually return the food item
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${foodQuery}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
    
    try {
        const res = await fetch(wikiUrl);
        const data = await res.json();
        
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        let imageUrl = '';
        if (pageId !== "-1" && pages[pageId].thumbnail) {
            imageUrl = pages[pageId].thumbnail.source;
        } else {
            imageUrl = 'https://via.placeholder.com/400x300?text=' + foodQuery;
        }
            
        const isBlindfolded = document.getElementById('food-blindfold-toggle').checked;
        const nameContainer = document.getElementById('food-name-container');
        if(isBlindfolded) {
            nameContainer.style.display = 'none';
        } else {
            nameContainer.style.display = 'flex';
            nameContainer.style.flexDirection = 'column';
            nameContainer.style.alignItems = 'center';
        }
        
        document.getElementById('food-en').textContent = randomFood.en;
        document.getElementById('food-vi').textContent = randomFood.vi;
        fetchPhonetic(randomFood.en, 'food-phonetic');
        
        markFoodLoadedForBlindfold();
        
        if (fCurrentHistoryIndex === -1 || fCurrentHistoryIndex === foodHistory.length - 1) {
            foodHistory.push({
                en: randomFood.en,
                vi: randomFood.vi,
                img: imageUrl
            });
            fCurrentHistoryIndex = foodHistory.length - 1;
        }
        
        updateFoodNavigationButtons();
        
        img.src = imageUrl;
        img.onload = () => {
            loading.style.display = 'none';
            img.style.display = 'block';
        };
    } catch (err) {
        console.error(err);
        loading.style.display = 'none';
        img.alt = "Lỗi khi tải hình ảnh. Vui lòng thử lại.";
        img.style.display = 'block';
    }
}

function updateFoodNavigationButtons() {
    const backBtn = document.getElementById('food-back-btn');
    if (backBtn) {
        if (fCurrentHistoryIndex > 0) backBtn.style.display = 'inline-block';
        else backBtn.style.display = 'none';
    }
}

function processFoodSkip() {
    const isBlindfolded = document.getElementById('food-blindfold-toggle').checked;
    if (isBlindfolded && fBlindAnimalLoaded && fBlindCurrentState === 'pending') {
        fBlindSkipped++;
        updateFoodScoreboard();
    }
}

function loadPreviousFood() {
    if (fCurrentHistoryIndex > 0) {
        processFoodSkip(); 
        fCurrentHistoryIndex--;
        displayHistoricalFood(foodHistory[fCurrentHistoryIndex]);
    }
}

function displayHistoricalFood(foodData) {
    const img = document.getElementById('food-img');
    const loading = document.getElementById('food-loading');
    
    loading.style.display = 'flex';
    img.style.display = 'none';
    
    const isBlindfolded = document.getElementById('food-blindfold-toggle').checked;
    const nameContainer = document.getElementById('food-name-container');
    if(isBlindfolded) {
        nameContainer.style.display = 'none';
    } else {
        nameContainer.style.display = 'flex';
        nameContainer.style.flexDirection = 'column';
        nameContainer.style.alignItems = 'center';
    }
    
    document.getElementById('food-en').textContent = foodData.en;
    document.getElementById('food-vi').textContent = foodData.vi;
    fetchPhonetic(foodData.en, 'food-phonetic');
    
    markFoodLoadedForBlindfold();
    updateFoodNavigationButtons();
    
    img.src = foodData.img;
    img.onload = () => {
        loading.style.display = 'none';
        img.style.display = 'block';
    };
}

// --- FOOD BLINDFOLD LOGIC ---
function toggleFoodBlindfold() {
    const isBlindfolded = document.getElementById('food-blindfold-toggle').checked;
    const nameContainer = document.getElementById('food-name-container');
    const guessContainer = document.getElementById('food-guess-container');
    const audioBtn = document.getElementById('food-audio-btn');
    const scoreboard = document.getElementById('food-blindfold-scoreboard');
    
    if (isBlindfolded) {
        scoreboard.style.display = 'flex';
        fBlindCorrect = 0; fBlindIncorrect = 0; fBlindSkipped = 0; fBlindCurrentState = 'pending';
        updateFoodScoreboard();
        
        nameContainer.style.display = 'none';
        audioBtn.style.display = 'none';
        guessContainer.style.display = 'block';
    } else {
        scoreboard.style.display = 'none';
        nameContainer.style.display = 'flex';
        nameContainer.style.flexDirection = 'column';
        nameContainer.style.alignItems = 'center';
        audioBtn.style.display = 'inline-block';
        guessContainer.style.display = 'none';
    }
}

function updateFoodScoreboard() {
    document.getElementById('f-score-correct').textContent = fBlindCorrect;
    document.getElementById('f-score-incorrect').textContent = fBlindIncorrect;
    document.getElementById('f-score-skipped').textContent = fBlindSkipped;
}

function markFoodLoadedForBlindfold() {
    fBlindAnimalLoaded = true;
    fBlindCurrentState = 'pending';
    
    const guessInput = document.getElementById('food-guess-input');
    const guessResult = document.getElementById('food-guess-result');
    if(guessInput) guessInput.value = '';
    if(guessResult) guessResult.textContent = '';
    
    const writeInput = document.getElementById('food-persistent-write-input');
    if (writeInput) {
        writeInput.value = '';
        writeInput.style.backgroundColor = '#fff';
        writeInput.style.borderColor = '#000';
    }
}

function checkFoodGuess(isAuto = false) {
    if (fBlindCurrentState === 'correct') return;
    
    const guessInput = document.getElementById('food-guess-input').value.trim().toLowerCase();
    const actualName = document.getElementById('food-en').textContent.toLowerCase();
    const resultDiv = document.getElementById('food-guess-result');
    
    const isMatch = actualName === guessInput || actualName.split(/[,/()]/).map(s => s.trim()).includes(guessInput) || (!isAuto && actualName.includes(guessInput) && guessInput.length > 2);
    
    if (guessInput === '') {
        if (!isAuto) {
            resultDiv.textContent = 'Vui lòng nhập dự đoán!';
            resultDiv.style.color = 'orange';
        }
    } else if (isMatch) {
        resultDiv.textContent = '🎉 Đúng rồi! Giỏi quá!';
        resultDiv.style.color = '#4caf50';
        
        fBlindCorrect++;
        fBlindCurrentState = 'correct';
        updateFoodScoreboard();
        
        document.getElementById('food-name-container').style.display = 'flex';
        document.getElementById('food-name-container').style.flexDirection = 'column';
        document.getElementById('food-name-container').style.alignItems = 'center';
        document.getElementById('food-audio-btn').style.display = 'inline-block';
        playAudio(actualName);
    } else {
        if (!isAuto) {
            resultDiv.textContent = '❌ Sai rồi, thử lại nhé!';
            resultDiv.style.color = '#f44336';
            if (fBlindCurrentState === 'pending') {
                fBlindIncorrect++;
                fBlindCurrentState = 'incorrect';
                updateFoodScoreboard();
            }
        }
    }
}

function revealFoodGuess() {
    if (fBlindCurrentState === 'correct') return;
    
    const actualName = document.getElementById('food-en').textContent.toLowerCase();
    const resultDiv = document.getElementById('food-guess-result');
    
    if (fBlindCurrentState === 'pending') {
        fBlindIncorrect++;
        fBlindCurrentState = 'incorrect';
        updateFoodScoreboard();
    }
    
    document.getElementById('food-guess-input').value = actualName;
    resultDiv.textContent = 'Bị trừ điểm! (Đã xem đáp án)';
    resultDiv.style.color = '#f44336';
    
    document.getElementById('food-name-container').style.display = 'flex';
    document.getElementById('food-name-container').style.flexDirection = 'column';
    document.getElementById('food-name-container').style.alignItems = 'center';
    document.getElementById('food-audio-btn').style.display = 'inline-block';
    playAudio(actualName);
}

function checkFoodPersistentWrite() {
    const inputEl = document.getElementById('food-persistent-write-input');
    if (!inputEl) return;
    
    const guess = inputEl.value.trim().toLowerCase();
    const actualName = document.getElementById('food-en').textContent.toLowerCase();
    
    if (guess !== '' && actualName.includes(guess) && guess.length >= Math.min(3, actualName.length)) { 
        if (guess === actualName || actualName.split(' ').includes(guess)) {
            inputEl.style.backgroundColor = '#c8e6c9';
            inputEl.style.borderColor = '#4caf50';
            playAudio(actualName);
        } else {
             inputEl.style.backgroundColor = '#fff';
             inputEl.style.borderColor = '#000';
        }
    } else {
        inputEl.style.backgroundColor = '#fff';
        inputEl.style.borderColor = '#000';
    }
}

// --- FOOD MASS REVIEW ---
let fMassReviewScore = 0;
let fMassReviewData = [];

async function loadFoodMassReview() {
    document.getElementById('food-card').style.display = 'none';
    document.getElementById('food-blindfold-toggle-container').style.display = 'none';
    document.getElementById('food-blindfold-scoreboard').style.display = 'none';
    
    document.querySelectorAll('.animal-btn').forEach(btn => btn.classList.remove('active'));
    try { if (event && event.target && event.target.tagName === 'BUTTON') event.target.classList.add('active'); } catch(e){}
    
    const container = document.getElementById('food-mass-review-container');
    const loading = document.getElementById('f-mass-review-loading');
    const grid = document.getElementById('f-mass-review-grid');
    
    container.style.display = 'block';
    loading.style.display = 'flex';
    grid.innerHTML = '';
    
    fMassReviewScore = 0;
    document.getElementById('f-mass-review-correct').textContent = fMassReviewScore;
    
    fMassReviewData = JSON.parse(JSON.stringify(commonFoods)); 
    
    const titles = fMassReviewData.map(a => encodeURIComponent(a.en)).join('|');
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${titles}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
        
    try {
        const res = await fetch(wikiUrl);
        const data = await res.json();
        if(data.query && data.query.pages) {
            const pages = data.query.pages;
            Object.values(pages).forEach(page => {
                if (page.title && page.thumbnail) {
                    const match = fMassReviewData.find(a => a.en.toLowerCase() === page.title.toLowerCase());
                    if (match) match.img = page.thumbnail.source;
                }
            });
        }
    } catch(err) {
        console.error(err);
    }
    
    loading.style.display = 'none';
    renderFoodMassReviewGrid(fMassReviewData);
}

function renderFoodMassReviewGrid(data) {
    const grid = document.getElementById('f-mass-review-grid');
    grid.innerHTML = '';
    
    data.forEach((food, index) => {
        const itemBox = document.createElement('div');
        itemBox.style.border = '3px solid #000';
        itemBox.style.borderRadius = '12px';
        itemBox.style.padding = '10px';
        itemBox.style.background = '#fff';
        itemBox.style.boxShadow = '3px 3px 0 #222';
        itemBox.style.display = 'flex';
        itemBox.style.flexDirection = 'column';
        itemBox.style.alignItems = 'center';
        itemBox.style.gap = '10px';
        
        const img = document.createElement('img');
        img.src = food.img || 'https://via.placeholder.com/300?text=' + encodeURIComponent(food.en);
        img.alt = food.en;
        img.style.width = '100%';
        img.style.height = '150px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '2px solid #000';
        
        const viLabel = document.createElement('div');
        viLabel.textContent = food.vi;
        viLabel.style.fontWeight = 'bold';
        viLabel.style.fontFamily = 'Quicksand';
        viLabel.style.fontSize = '18px';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nhập TA...';
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.fontFamily = 'Nunito';
        input.style.fontSize = '16px';
        input.style.border = '2px solid #000';
        input.style.borderRadius = '6px';
        input.style.textAlign = 'center';
        input.oninput = (e) => checkFoodMassReviewItem(index, e.target, itemBox);
        
        itemBox.appendChild(img);
        itemBox.appendChild(viLabel);
        itemBox.appendChild(input);
        
        grid.appendChild(itemBox);
    });
}

function checkFoodMassReviewItem(index, inputElement, itemBox) {
    if (inputElement.disabled) return;
    
    const food = fMassReviewData[index];
    const guess = inputElement.value.trim().toLowerCase();
    
    if (guess === food.en.toLowerCase()) {
        inputElement.disabled = true;
        inputElement.style.backgroundColor = '#c8e6c9';
        inputElement.style.color = '#2e7d32';
        inputElement.style.fontWeight = 'bold';
        itemBox.style.borderColor = '#4caf50';
        itemBox.style.boxShadow = '3px 3px 0 #4caf50';
        itemBox.style.backgroundColor = '#e8f5e9';
        
        fMassReviewScore++;
        document.getElementById('f-mass-review-correct').textContent = fMassReviewScore;
        
        playAudio(food.en);
        
        if (fMassReviewScore === fMassReviewData.length) {
            setTimeout(() => alert('🎉 Tuyệt đỉnh! Bạn đã hoàn thành xuất sắc bài kiểm tra Đồ Ăn!'), 500);
        }
    }
}

function finishFoodMassReview() {
    alert(`Bạn đã điền đúng ${fMassReviewScore}/${fMassReviewData.length} đồ ăn!`);
}

// ------------------- BODY PARTS SECTION -------------------
const commonBodyParts = [
    {en: "head", vi: "đầu"},
    {en: "face", vi: "khuôn mặt"},
    {en: "eye", vi: "mắt"},
    {en: "ear", vi: "tai"},
    {en: "nose", vi: "mũi"},
    {en: "mouth", vi: "miệng"},
    {en: "tooth", vi: "răng"},
    {en: "neck", vi: "cổ"},
    {en: "shoulder", vi: "vai"},
    {en: "arm", vi: "cánh tay"},
    {en: "hand", vi: "bàn tay"},
    {en: "finger", vi: "ngón tay"},
    {en: "chest", vi: "ngực"},
    {en: "leg", vi: "chân"},
    {en: "foot", vi: "bàn chân"}
];

let bBlindCorrect = 0;
let bBlindIncorrect = 0;
let bBlindSkipped = 0;
let bBlindCurrentState = 'pending'; 
let bBlindAnimalLoaded = false;
let bodyHistory = [];
let bCurrentHistoryIndex = -1;

async function loadCommonBody() {
    const img = document.getElementById('body-img');
    const loading = document.getElementById('body-loading');
    const bodyCard = document.getElementById('body-card');
    
    document.querySelectorAll('.animal-btn').forEach(btn => btn.classList.remove('active'));
    try { if (event && event.target && event.target.tagName === 'BUTTON') event.target.classList.add('active'); } catch(e){}
    
    document.getElementById('body-mass-review-container').style.display = 'none';
    document.getElementById('body-blindfold-toggle-container').style.display = 'flex';
    if(document.getElementById('body-blindfold-toggle').checked) document.getElementById('body-blindfold-scoreboard').style.display = 'flex';
    
    bodyCard.style.display = 'flex';
    loading.style.display = 'flex';
    img.style.display = 'none';
        
    const randomBody = commonBodyParts[Math.floor(Math.random() * commonBodyParts.length)];
    const bodyQueryHuman = encodeURIComponent("Human " + randomBody.en); 
    let wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${bodyQueryHuman}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
    
    try {
        let res = await fetch(wikiUrl);
        let data = await res.json();
        
        let pages = data.query.pages;
        let pageId = Object.keys(pages)[0];
        
        let imageUrl = '';
        if (pageId !== "-1" && pages[pageId].thumbnail) {
            imageUrl = pages[pageId].thumbnail.source;
        } else {
            // Fallback: Use standard name if "Human " fails to yield thumbnail
            const bodyQuery = encodeURIComponent(randomBody.en);
            wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${bodyQuery}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
            res = await fetch(wikiUrl);
            data = await res.json();
            pages = data.query.pages;
            pageId = Object.keys(pages)[0];
            
            if (pageId !== "-1" && pages[pageId].thumbnail) {
                imageUrl = pages[pageId].thumbnail.source;
            } else {
                imageUrl = 'https://dummyimage.com/400x300/f3f4f6/333333.png&text=' + encodeURIComponent(randomBody.en);
            }
        }
            
        const isBlindfolded = document.getElementById('body-blindfold-toggle').checked;
        const nameContainer = document.getElementById('body-name-container');
        if(isBlindfolded) {
            nameContainer.style.display = 'none';
        } else {
            nameContainer.style.display = 'flex';
            nameContainer.style.flexDirection = 'column';
            nameContainer.style.alignItems = 'center';
        }
        
        document.getElementById('body-en').textContent = randomBody.en;
        document.getElementById('body-vi').textContent = randomBody.vi;
        fetchPhonetic(randomBody.en, 'body-phonetic');
        
        markBodyLoadedForBlindfold();
        
        if (bCurrentHistoryIndex === -1 || bCurrentHistoryIndex === bodyHistory.length - 1) {
            bodyHistory.push({
                en: randomBody.en,
                vi: randomBody.vi,
                img: imageUrl
            });
            bCurrentHistoryIndex = bodyHistory.length - 1;
        }
        
        updateBodyNavigationButtons();
        
        img.src = imageUrl;
        img.onload = () => {
            loading.style.display = 'none';
            img.style.display = 'block';
        };
        img.onerror = () => {
            loading.style.display = 'none';
            img.style.display = 'block';
            img.alt = 'Lỗi ảnh';
        };
    } catch (err) {
        console.error(err);
        loading.style.display = 'none';
        img.alt = "Lỗi khi tải hình ảnh. Vui lòng thử lại.";
        img.style.display = 'block';
    }
}

function updateBodyNavigationButtons() {
    const backBtn = document.getElementById('body-back-btn');
    if (backBtn) {
        if (bCurrentHistoryIndex > 0) backBtn.style.display = 'inline-block';
        else backBtn.style.display = 'none';
    }
}

function processBodySkip() {
    const isBlindfolded = document.getElementById('body-blindfold-toggle').checked;
    if (isBlindfolded && bBlindAnimalLoaded && bBlindCurrentState === 'pending') {
        bBlindSkipped++;
        updateBodyScoreboard();
    }
}

function loadPreviousBody() {
    if (bCurrentHistoryIndex > 0) {
        processBodySkip(); 
        bCurrentHistoryIndex--;
        displayHistoricalBody(bodyHistory[bCurrentHistoryIndex]);
    }
}

function displayHistoricalBody(bodyData) {
    const img = document.getElementById('body-img');
    const loading = document.getElementById('body-loading');
    
    loading.style.display = 'flex';
    img.style.display = 'none';
    
    const isBlindfolded = document.getElementById('body-blindfold-toggle').checked;
    const nameContainer = document.getElementById('body-name-container');
    if(isBlindfolded) {
        nameContainer.style.display = 'none';
    } else {
        nameContainer.style.display = 'flex';
        nameContainer.style.flexDirection = 'column';
        nameContainer.style.alignItems = 'center';
    }
    
    document.getElementById('body-en').textContent = bodyData.en;
    document.getElementById('body-vi').textContent = bodyData.vi;
    fetchPhonetic(bodyData.en, 'body-phonetic');
    
    markBodyLoadedForBlindfold();
    updateBodyNavigationButtons();
    
    img.src = bodyData.img;
    img.onload = () => {
        loading.style.display = 'none';
        img.style.display = 'block';
    };
    img.onerror = () => {
        loading.style.display = 'none';
        img.style.display = 'block';
    };
}

// --- BODY PARTS BLINDFOLD LOGIC ---
function toggleBodyBlindfold() {
    const isBlindfolded = document.getElementById('body-blindfold-toggle').checked;
    const nameContainer = document.getElementById('body-name-container');
    const guessContainer = document.getElementById('body-guess-container');
    const audioBtn = document.getElementById('body-audio-btn');
    const scoreboard = document.getElementById('body-blindfold-scoreboard');
    
    if (isBlindfolded) {
        scoreboard.style.display = 'flex';
        bBlindCorrect = 0; bBlindIncorrect = 0; bBlindSkipped = 0; bBlindCurrentState = 'pending';
        updateBodyScoreboard();
        
        nameContainer.style.display = 'none';
        audioBtn.style.display = 'none';
        guessContainer.style.display = 'block';
    } else {
        scoreboard.style.display = 'none';
        nameContainer.style.display = 'flex';
        nameContainer.style.flexDirection = 'column';
        nameContainer.style.alignItems = 'center';
        audioBtn.style.display = 'inline-block';
        guessContainer.style.display = 'none';
    }
}

function updateBodyScoreboard() {
    document.getElementById('b-score-correct').textContent = bBlindCorrect;
    document.getElementById('b-score-incorrect').textContent = bBlindIncorrect;
    document.getElementById('b-score-skipped').textContent = bBlindSkipped;
}

function markBodyLoadedForBlindfold() {
    bBlindAnimalLoaded = true;
    bBlindCurrentState = 'pending';
    
    const guessInput = document.getElementById('body-guess-input');
    const guessResult = document.getElementById('body-guess-result');
    if(guessInput) guessInput.value = '';
    if(guessResult) guessResult.textContent = '';
    
    const writeInput = document.getElementById('body-persistent-write-input');
    if (writeInput) {
        writeInput.value = '';
        writeInput.style.backgroundColor = '#fff';
        writeInput.style.borderColor = '#000';
    }
}

function checkBodyGuess(isAuto = false) {
    if (bBlindCurrentState === 'correct') return;
    
    const guessInput = document.getElementById('body-guess-input').value.trim().toLowerCase();
    const actualName = document.getElementById('body-en').textContent.toLowerCase();
    const resultDiv = document.getElementById('body-guess-result');
    
    const isMatch = actualName === guessInput || actualName.split(/[,/()]/).map(s => s.trim()).includes(guessInput) || (!isAuto && actualName.includes(guessInput) && guessInput.length > 2);
    
    if (guessInput === '') {
        if (!isAuto) {
            resultDiv.textContent = 'Vui lòng nhập dự đoán!';
            resultDiv.style.color = 'orange';
        }
    } else if (isMatch) {
        resultDiv.textContent = '🎉 Đúng rồi! Giỏi quá!';
        resultDiv.style.color = '#4caf50';
        
        bBlindCorrect++;
        bBlindCurrentState = 'correct';
        updateBodyScoreboard();
        
        document.getElementById('body-name-container').style.display = 'flex';
        document.getElementById('body-name-container').style.flexDirection = 'column';
        document.getElementById('body-name-container').style.alignItems = 'center';
        document.getElementById('body-audio-btn').style.display = 'inline-block';
        playAudio(actualName);
    } else {
        if (!isAuto) {
            resultDiv.textContent = '❌ Sai rồi, thử lại nhé!';
            resultDiv.style.color = '#f44336';
            if (bBlindCurrentState === 'pending') {
                bBlindIncorrect++;
                bBlindCurrentState = 'incorrect';
                updateBodyScoreboard();
            }
        }
    }
}

function revealBodyGuess() {
    if (bBlindCurrentState === 'correct') return;
    
    const actualName = document.getElementById('body-en').textContent.toLowerCase();
    const resultDiv = document.getElementById('body-guess-result');
    
    if (bBlindCurrentState === 'pending') {
        bBlindIncorrect++;
        bBlindCurrentState = 'incorrect';
        updateBodyScoreboard();
    }
    
    document.getElementById('body-guess-input').value = actualName;
    resultDiv.textContent = 'Bị trừ điểm! (Đã xem đáp án)';
    resultDiv.style.color = '#f44336';
    
    document.getElementById('body-name-container').style.display = 'flex';
    document.getElementById('body-name-container').style.flexDirection = 'column';
    document.getElementById('body-name-container').style.alignItems = 'center';
    document.getElementById('body-audio-btn').style.display = 'inline-block';
    playAudio(actualName);
}

function checkBodyPersistentWrite() {
    const inputEl = document.getElementById('body-persistent-write-input');
    if (!inputEl) return;
    
    const guess = inputEl.value.trim().toLowerCase();
    const actualName = document.getElementById('body-en').textContent.toLowerCase();
    
    if (guess !== '' && actualName.includes(guess) && guess.length >= Math.min(3, actualName.length)) { 
        if (guess === actualName || actualName.split(' ').includes(guess)) {
            inputEl.style.backgroundColor = '#c8e6c9';
            inputEl.style.borderColor = '#4caf50';
            playAudio(actualName);
        } else {
             inputEl.style.backgroundColor = '#fff';
             inputEl.style.borderColor = '#000';
        }
    } else {
        inputEl.style.backgroundColor = '#fff';
        inputEl.style.borderColor = '#000';
    }
}

// --- BODY PARTS MASS REVIEW ---
let bMassReviewScore = 0;
let bMassReviewData = [];

async function loadBodyMassReview() {
    document.getElementById('body-card').style.display = 'none';
    document.getElementById('body-blindfold-toggle-container').style.display = 'none';
    document.getElementById('body-blindfold-scoreboard').style.display = 'none';
    
    document.querySelectorAll('.animal-btn').forEach(btn => btn.classList.remove('active'));
    try { if (event && event.target && event.target.tagName === 'BUTTON') event.target.classList.add('active'); } catch(e){}
    
    const container = document.getElementById('body-mass-review-container');
    const loading = document.getElementById('b-mass-review-loading');
    const grid = document.getElementById('b-mass-review-grid');
    
    container.style.display = 'block';
    loading.style.display = 'flex';
    grid.innerHTML = '';
    
    bMassReviewScore = 0;
    document.getElementById('b-mass-review-correct').textContent = bMassReviewScore;
    
    bMassReviewData = JSON.parse(JSON.stringify(commonBodyParts)); 
    
    const titles = bMassReviewData.map(a => encodeURIComponent(a.en)).join('|');
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${titles}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
        
    try {
        const res = await fetch(wikiUrl);
        const data = await res.json();
        if(data.query && data.query.pages) {
            const pages = data.query.pages;
            Object.values(pages).forEach(page => {
                if (page.title && page.thumbnail) {
                    const match = bMassReviewData.find(a => a.en.toLowerCase() === page.title.toLowerCase());
                    if (match) match.img = page.thumbnail.source;
                }
            });
        }
    } catch(err) {
        console.error(err);
    }
    
    loading.style.display = 'none';
    renderBodyMassReviewGrid(bMassReviewData);
}

function renderBodyMassReviewGrid(data) {
    const grid = document.getElementById('b-mass-review-grid');
    grid.innerHTML = '';
    
    data.forEach((bodyPart, index) => {
        const itemBox = document.createElement('div');
        itemBox.style.border = '3px solid #000';
        itemBox.style.borderRadius = '12px';
        itemBox.style.padding = '10px';
        itemBox.style.background = '#fff';
        itemBox.style.boxShadow = '3px 3px 0 #222';
        itemBox.style.display = 'flex';
        itemBox.style.flexDirection = 'column';
        itemBox.style.alignItems = 'center';
        itemBox.style.gap = '10px';
        
        const img = document.createElement('img');
        img.src = bodyPart.img || 'https://dummyimage.com/300x200/f3f4f6/333333.png&text=' + encodeURIComponent(bodyPart.en);
        img.alt = bodyPart.en;
        img.style.width = '100%';
        img.style.height = '150px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '2px solid #000';
        
        const viLabel = document.createElement('div');
        viLabel.textContent = bodyPart.vi;
        viLabel.style.fontWeight = 'bold';
        viLabel.style.fontFamily = 'Quicksand';
        viLabel.style.fontSize = '18px';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nhập TA...';
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.fontFamily = 'Nunito';
        input.style.fontSize = '16px';
        input.style.border = '2px solid #000';
        input.style.borderRadius = '6px';
        input.style.textAlign = 'center';
        input.oninput = (e) => checkBodyMassReviewItem(index, e.target, itemBox);
        
        itemBox.appendChild(img);
        itemBox.appendChild(viLabel);
        itemBox.appendChild(input);
        
        grid.appendChild(itemBox);
    });
}

function checkBodyMassReviewItem(index, inputElement, itemBox) {
    if (inputElement.disabled) return;
    
    const bodyPart = bMassReviewData[index];
    const guess = inputElement.value.trim().toLowerCase();
    
    if (guess === bodyPart.en.toLowerCase()) {
        inputElement.disabled = true;
        inputElement.style.backgroundColor = '#c8e6c9';
        inputElement.style.color = '#2e7d32';
        inputElement.style.fontWeight = 'bold';
        itemBox.style.borderColor = '#4caf50';
        itemBox.style.boxShadow = '3px 3px 0 #4caf50';
        itemBox.style.backgroundColor = '#e8f5e9';
        
        bMassReviewScore++;
        document.getElementById('b-mass-review-correct').textContent = bMassReviewScore;
        
        playAudio(bodyPart.en);
        
        if (bMassReviewScore === bMassReviewData.length) {
            setTimeout(() => alert('🎉 Tuyệt đỉnh! Bạn đã hoàn thành xuất sắc bài kiểm tra Cơ Thể!'), 500);
        }
    }
}

function finishBodyMassReview() {
    alert(`Bạn đã điền đúng ${bMassReviewScore}/${bMassReviewData.length} bộ phận cơ thể!`);
}

// ------------------- DYNAMIC TOPIC SECTION (20 Topics) -------------------
let currentDynTopicId = '';
let currentDynTopicData = [];
let dBlindCorrect = 0;
let dBlindIncorrect = 0;
let dBlindSkipped = 0;
let dBlindCurrentState = 'pending'; 
let dBlindItemLoaded = false;
let dynHistory = [];
let dCurrentHistoryIndex = -1;

// Load the JSON data for a specific topic
async function loadDynamicTopic(topicId, title) {
    showPage('vocab-dynamic');
    document.getElementById('dyn-page-title').textContent = title;
    currentDynTopicId = topicId;
    currentDynTopicData = []; // Clear old data
    dynHistory = [];
    dCurrentHistoryIndex = -1;
    updateDynNavigationButtons();
    
    // Hide UI elements while loading
    document.getElementById('dyn-card').style.display = 'none';
    document.getElementById('dyn-mass-review-container').style.display = 'none';
    document.getElementById('dyn-blindfold-toggle-container').style.display = 'none';
    document.getElementById('dyn-blindfold-scoreboard').style.display = 'none';
    
    try {
        // We will fetch JSON from a data folder (to be generated)
        const response = await fetch(`data/topics/${topicId}.json`);
        if (!response.ok) throw new Error('Network response was not ok');
        currentDynTopicData = await response.json();
        
        // Data loaded successfully, show toggle and load an item
        document.getElementById('dyn-blindfold-toggle-container').style.display = 'flex';
        loadDynItem();
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu chủ đề:", error);
        alert(`Dữ liệu cho chủ đề "${title}" đang được hoàn thiện. Vui lòng thử lại sau!`);
    }
}

async function loadDynItem() {
    if (!currentDynTopicData || currentDynTopicData.length === 0) return;
    
    const img = document.getElementById('dyn-img');
    const loading = document.getElementById('dyn-loading');
    const card = document.getElementById('dyn-card');
    
    document.getElementById('dyn-mass-review-container').style.display = 'none';
    document.getElementById('dyn-blindfold-toggle-container').style.display = 'flex';
    if(document.getElementById('dyn-blindfold-toggle').checked) document.getElementById('dyn-blindfold-scoreboard').style.display = 'flex';
    
    card.style.display = 'flex';
    loading.style.display = 'flex';
    img.style.display = 'none';
        
    const randomWordObj = currentDynTopicData[Math.floor(Math.random() * currentDynTopicData.length)];
    const wordQuery = encodeURIComponent(randomWordObj.en); 
    
    let wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${wordQuery}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
    
    try {
        let res = await fetch(wikiUrl);
        let data = await res.json();
        
        let pages = data.query.pages;
        let pageId = Object.keys(pages)[0];
        
        let imageUrl = '';
        if (pageId !== "-1" && pages[pageId].thumbnail) {
            imageUrl = pages[pageId].thumbnail.source;
        } else {
            // Wikipedia no image fallback -> Use DummyImage for now (In future, could plug in Pixabay/Pexels API here)
            imageUrl = 'https://dummyimage.com/400x300/f3f4f6/333333.png&text=' + encodeURIComponent(randomWordObj.en);
        }
            
        const isBlindfolded = document.getElementById('dyn-blindfold-toggle').checked;
        const nameContainer = document.getElementById('dyn-name-container');
        if(isBlindfolded) {
            nameContainer.style.display = 'none';
        } else {
            nameContainer.style.display = 'flex';
            nameContainer.style.flexDirection = 'column';
            nameContainer.style.alignItems = 'center';
        }
        
        document.getElementById('dyn-en').textContent = randomWordObj.en;
        document.getElementById('dyn-vi').textContent = randomWordObj.vi;
        fetchPhonetic(randomWordObj.en, 'dyn-phonetic');
        
        markDynItemLoadedForBlindfold();
        
        if (dCurrentHistoryIndex === -1 || dCurrentHistoryIndex === dynHistory.length - 1) {
            dynHistory.push({
                en: randomWordObj.en,
                vi: randomWordObj.vi,
                img: imageUrl
            });
            dCurrentHistoryIndex = dynHistory.length - 1;
        }
        
        updateDynNavigationButtons();
        
        img.src = imageUrl;
        img.onload = () => {
            loading.style.display = 'none';
            img.style.display = 'block';
        };
        img.onerror = () => {
            loading.style.display = 'none';
            img.style.display = 'block';
            img.alt = 'Lỗi ảnh';
        };
    } catch (err) {
        console.error(err);
        loading.style.display = 'none';
        img.alt = "Lỗi khi tải hình ảnh. Vui lòng thử lại.";
        img.style.display = 'block';
    }
}

function updateDynNavigationButtons() {
    const backBtn = document.getElementById('dyn-back-btn');
    if (backBtn) {
        if (dCurrentHistoryIndex > 0) backBtn.style.display = 'inline-block';
        else backBtn.style.display = 'none';
    }
}

function processDynSkip() {
    const isBlindfolded = document.getElementById('dyn-blindfold-toggle').checked;
    if (isBlindfolded && dBlindItemLoaded && dBlindCurrentState === 'pending') {
        dBlindSkipped++;
        updateDynScoreboard();
    }
}

function loadPreviousDyn() {
    if (dCurrentHistoryIndex > 0) {
        processDynSkip(); 
        dCurrentHistoryIndex--;
        displayHistoricalDyn(dynHistory[dCurrentHistoryIndex]);
    }
}

function displayHistoricalDyn(dynData) {
    const img = document.getElementById('dyn-img');
    const loading = document.getElementById('dyn-loading');
    
    loading.style.display = 'flex';
    img.style.display = 'none';
    
    const isBlindfolded = document.getElementById('dyn-blindfold-toggle').checked;
    const nameContainer = document.getElementById('dyn-name-container');
    if(isBlindfolded) {
        nameContainer.style.display = 'none';
    } else {
        nameContainer.style.display = 'flex';
        nameContainer.style.flexDirection = 'column';
        nameContainer.style.alignItems = 'center';
    }
    
    document.getElementById('dyn-en').textContent = dynData.en;
    document.getElementById('dyn-vi').textContent = dynData.vi;
    fetchPhonetic(dynData.en, 'dyn-phonetic');
    
    markDynItemLoadedForBlindfold();
    updateDynNavigationButtons();
    
    img.src = dynData.img;
    img.onload = () => {
        loading.style.display = 'none';
        img.style.display = 'block';
    };
    img.onerror = () => {
        loading.style.display = 'none';
        img.style.display = 'block';
    };
}

// --- DYNAMIC BLINDFOLD LOGIC ---
function toggleDynBlindfold() {
    const isBlindfolded = document.getElementById('dyn-blindfold-toggle').checked;
    const nameContainer = document.getElementById('dyn-name-container');
    const guessContainer = document.getElementById('dyn-guess-container');
    const audioBtn = document.getElementById('dyn-audio-btn');
    const scoreboard = document.getElementById('dyn-blindfold-scoreboard');
    
    if (isBlindfolded) {
        scoreboard.style.display = 'flex';
        dBlindCorrect = 0; dBlindIncorrect = 0; dBlindSkipped = 0; dBlindCurrentState = 'pending';
        updateDynScoreboard();
        
        nameContainer.style.display = 'none';
        audioBtn.style.display = 'none';
        guessContainer.style.display = 'block';
    } else {
        scoreboard.style.display = 'none';
        nameContainer.style.display = 'flex';
        nameContainer.style.flexDirection = 'column';
        nameContainer.style.alignItems = 'center';
        audioBtn.style.display = 'inline-block';
        guessContainer.style.display = 'none';
    }
}

function updateDynScoreboard() {
    document.getElementById('dyn-score-correct').textContent = dBlindCorrect;
    document.getElementById('dyn-score-incorrect').textContent = dBlindIncorrect;
    document.getElementById('dyn-score-skipped').textContent = dBlindSkipped;
}

function markDynItemLoadedForBlindfold() {
    dBlindItemLoaded = true;
    dBlindCurrentState = 'pending';
    
    const guessInput = document.getElementById('dyn-guess-input');
    const guessResult = document.getElementById('dyn-guess-result');
    if(guessInput) guessInput.value = '';
    if(guessResult) guessResult.textContent = '';
    
    const writeInput = document.getElementById('dyn-persistent-write-input');
    if (writeInput) {
        writeInput.value = '';
        writeInput.style.backgroundColor = '#fff';
        writeInput.style.borderColor = '#000';
    }
}

function checkDynGuess(isAuto = false) {
    if (dBlindCurrentState === 'correct') return;
    
    const guessInput = document.getElementById('dyn-guess-input').value.trim().toLowerCase();
    const actualName = document.getElementById('dyn-en').textContent.toLowerCase();
    const resultDiv = document.getElementById('dyn-guess-result');
    
    const isMatch = actualName === guessInput || actualName.split(/[,/()\-]/).map(s => s.trim().toLowerCase()).includes(guessInput) || (!isAuto && actualName.includes(guessInput) && guessInput.length > 2);
    
    if (guessInput === '') {
        if (!isAuto) {
            resultDiv.textContent = 'Vui lòng nhập dự đoán!';
            resultDiv.style.color = 'orange';
        }
    } else if (isMatch) {
        resultDiv.textContent = '🎉 Đúng rồi! Giỏi quá!';
        resultDiv.style.color = '#4caf50';
        
        dBlindCorrect++;
        dBlindCurrentState = 'correct';
        updateDynScoreboard();
        
        document.getElementById('dyn-name-container').style.display = 'flex';
        document.getElementById('dyn-name-container').style.flexDirection = 'column';
        document.getElementById('dyn-name-container').style.alignItems = 'center';
        document.getElementById('dyn-audio-btn').style.display = 'inline-block';
        playAudio(actualName);
    } else {
        if (!isAuto) {
            resultDiv.textContent = '❌ Sai rồi, thử lại nhé!';
            resultDiv.style.color = '#f44336';
            if (dBlindCurrentState === 'pending') {
                dBlindIncorrect++;
                dBlindCurrentState = 'incorrect';
                updateDynScoreboard();
            }
        }
    }
}

function revealDynGuess() {
    if (dBlindCurrentState === 'correct') return;
    
    const actualName = document.getElementById('dyn-en').textContent.toLowerCase();
    const resultDiv = document.getElementById('dyn-guess-result');
    
    if (dBlindCurrentState === 'pending') {
        dBlindIncorrect++;
        dBlindCurrentState = 'incorrect';
        updateDynScoreboard();
    }
    
    document.getElementById('dyn-guess-input').value = actualName;
    resultDiv.textContent = 'Bị trừ điểm! (Đã xem đáp án)';
    resultDiv.style.color = '#f44336';
    
    document.getElementById('dyn-name-container').style.display = 'flex';
    document.getElementById('dyn-name-container').style.flexDirection = 'column';
    document.getElementById('dyn-name-container').style.alignItems = 'center';
    document.getElementById('dyn-audio-btn').style.display = 'inline-block';
    playAudio(actualName);
}

function checkDynPersistentWrite() {
    const inputEl = document.getElementById('dyn-persistent-write-input');
    if (!inputEl) return;
    
    const guess = inputEl.value.trim().toLowerCase();
    const actualName = document.getElementById('dyn-en').textContent.toLowerCase();
    
    if (guess !== '' && actualName.includes(guess) && guess.length >= Math.min(3, actualName.length)) { 
        if (guess === actualName || actualName.split(' ').includes(guess)) {
            inputEl.style.backgroundColor = '#c8e6c9';
            inputEl.style.borderColor = '#4caf50';
            playAudio(actualName);
        } else {
             inputEl.style.backgroundColor = '#fff';
             inputEl.style.borderColor = '#000';
        }
    } else {
        inputEl.style.backgroundColor = '#fff';
        inputEl.style.borderColor = '#000';
    }
}

// --- DYNAMIC MASS REVIEW (WITH PAGINATION) ---
const ITEMS_PER_PAGE = 20;
let dynMassReviewScore = 0;
let dynMassReviewData = []; // State of all items (with input values)
let currentDynPage = 1;
let totalDynPages = 1;

async function loadDynMassReview() {
    if (!currentDynTopicData || currentDynTopicData.length === 0) return;
    
    document.getElementById('dyn-card').style.display = 'none';
    document.getElementById('dyn-blindfold-toggle-container').style.display = 'none';
    document.getElementById('dyn-blindfold-scoreboard').style.display = 'none';
    
    const container = document.getElementById('dyn-mass-review-container');
    const loading = document.getElementById('dyn-mass-review-loading');
    const grid = document.getElementById('dyn-mass-review-grid');
    
    container.style.display = 'block';
    grid.innerHTML = '';
    
    dynMassReviewScore = 0;
    // Clone array and initialize state for each item
    dynMassReviewData = JSON.parse(JSON.stringify(currentDynTopicData)).map(item => ({
        ...item,
        isCorrect: false,
        userInput: '',
        imgFetched: false
    }));
    
    document.getElementById('dyn-mass-review-correct').textContent = dynMassReviewScore;
    document.getElementById('dyn-mass-review-total').textContent = dynMassReviewData.length;
    
    totalDynPages = Math.ceil(dynMassReviewData.length / ITEMS_PER_PAGE);
    currentDynPage = 1;
    
    renderDynMassReviewPage();
}

async function renderDynMassReviewPage() {
    const loading = document.getElementById('dyn-mass-review-loading');
    const grid = document.getElementById('dyn-mass-review-grid');
    
    loading.style.display = 'flex';
    grid.innerHTML = '';
    
    // Update Pagination UI
    document.getElementById('dyn-page-info').textContent = `Trang ${currentDynPage} / ${totalDynPages}`;
    document.getElementById('dyn-page-prev').disabled = currentDynPage === 1;
    document.getElementById('dyn-page-next').disabled = currentDynPage === totalDynPages;
    document.getElementById('dyn-page-prev').style.opacity = currentDynPage === 1 ? '0.5' : '1';
    document.getElementById('dyn-page-next').style.opacity = currentDynPage === totalDynPages ? '0.5' : '1';
    
    // Get items for current page
    const startIndex = (currentDynPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, dynMassReviewData.length);
    const pageItems = dynMassReviewData.slice(startIndex, endIndex);
    
    // Batch Fetch Images for Current Page if not already fetched
    const unfetchedItems = pageItems.filter(item => !item.imgFetched);
    if (unfetchedItems.length > 0) {
        // Chunk API requests to Wikipedia in blocks of ~20 to avoid URI too long errors
        const titles = unfetchedItems.map(a => encodeURIComponent(a.en)).join('|');
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${titles}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
            
        try {
            const res = await fetch(wikiUrl);
            const data = await res.json();
            if(data.query && data.query.pages) {
                const pages = data.query.pages;
                Object.values(pages).forEach(page => {
                    if (page.title && page.thumbnail) {
                        const matchIndex = dynMassReviewData.findIndex(a => a.en.toLowerCase() === page.title.toLowerCase());
                        if (matchIndex !== -1) {
                            dynMassReviewData[matchIndex].img = page.thumbnail.source;
                        }
                    }
                });
            }
        } catch(err) {
            console.error("Lỗi tải ảnh phân trang:", err);
        }
        
        // Mark as fetched
        unfetchedItems.forEach(item => {
             const matchIndex = dynMassReviewData.findIndex(a => a.en === item.en);
             dynMassReviewData[matchIndex].imgFetched = true;
        });
    }
    
    loading.style.display = 'none';
    
    // Render the grid
    pageItems.forEach((wordObj, pageIndex) => {
        const globalIndex = startIndex + pageIndex; // Keep track of absolute index
        
        const itemBox = document.createElement('div');
        itemBox.style.border = '3px solid #000';
        itemBox.style.borderRadius = '12px';
        itemBox.style.padding = '10px';
        itemBox.style.background = '#fff';
        itemBox.style.boxShadow = '3px 3px 0 #222';
        itemBox.style.display = 'flex';
        itemBox.style.flexDirection = 'column';
        itemBox.style.alignItems = 'center';
        itemBox.style.gap = '10px';
        
        const img = document.createElement('img');
        img.src = wordObj.img || 'https://dummyimage.com/300x200/f3f4f6/333333.png&text=' + encodeURIComponent(wordObj.en);
        img.alt = wordObj.en;
        img.style.width = '100%';
        img.style.height = '150px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '2px solid #000';
        
        const viLabel = document.createElement('div');
        viLabel.textContent = wordObj.vi;
        viLabel.style.fontWeight = 'bold';
        viLabel.style.fontFamily = 'Quicksand';
        viLabel.style.fontSize = '18px';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nhập TA...';
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.fontFamily = 'Nunito';
        input.style.fontSize = '16px';
        input.style.border = '2px solid #000';
        input.style.borderRadius = '6px';
        input.style.textAlign = 'center';
        input.value = wordObj.userInput; // Restore persistent state
        
        if (wordObj.isCorrect) {
            input.disabled = true;
            input.style.backgroundColor = '#c8e6c9';
            input.style.color = '#2e7d32';
            input.style.fontWeight = 'bold';
            itemBox.style.borderColor = '#4caf50';
            itemBox.style.boxShadow = '3px 3px 0 #4caf50';
            itemBox.style.backgroundColor = '#e8f5e9';
        } else {
            input.oninput = (e) => checkDynMassReviewItem(globalIndex, e.target, itemBox);
        }
        
        itemBox.appendChild(img);
        itemBox.appendChild(viLabel);
        itemBox.appendChild(input);
        
        grid.appendChild(itemBox);
    });
}

function checkDynMassReviewItem(globalIndex, inputElement, itemBox) {
    if (inputElement.disabled) return;
    
    const wordObj = dynMassReviewData[globalIndex];
    const guess = inputElement.value.trim().toLowerCase();
    
    // Save state so if they switch pages and come back, incomplete text is preserved
    dynMassReviewData[globalIndex].userInput = inputElement.value;
    
    if (guess === wordObj.en.toLowerCase()) {
        dynMassReviewData[globalIndex].isCorrect = true;
        inputElement.disabled = true;
        inputElement.style.backgroundColor = '#c8e6c9';
        inputElement.style.color = '#2e7d32';
        inputElement.style.fontWeight = 'bold';
        itemBox.style.borderColor = '#4caf50';
        itemBox.style.boxShadow = '3px 3px 0 #4caf50';
        itemBox.style.backgroundColor = '#e8f5e9';
        
        dynMassReviewScore++;
        document.getElementById('dyn-mass-review-correct').textContent = dynMassReviewScore;
        
        playAudio(wordObj.en);
        
        if (dynMassReviewScore === dynMassReviewData.length) {
            setTimeout(() => alert('🎉 Tuyệt đỉnh! Bạn đã vượt qua bài Sinh Tồn 300 Từ!'), 500);
        }
    }
}

function prevDynPage() {
    if (currentDynPage > 1) {
        currentDynPage--;
        renderDynMassReviewPage();
    }
}

function nextDynPage() {
    if (currentDynPage < totalDynPages) {
        currentDynPage++;
        renderDynMassReviewPage();
    }
}

// --- LYRICS LOGIC ---
const theNightsLyrics = [
    { time: 0.0, text: "🎶 (Nhạc nền) 🎶" },
    { time: 4.5, text: "Once upon a younger year" },
    { time: 7.5, text: "When all our shadows disappeared" },
    { time: 10.5, text: "The animals inside came out to play" },
    { time: 14.5, text: "Went face to face with all our fears" },
    { time: 18.0, text: "Learned our lessons through the tears" },
    { time: 21.0, text: "Made memories we knew would never fade" },
    { time: 24.0, text: "One day, my father, he told me" },
    { time: 26.5, text: "\"Son, don't let it slip away\"" },
    { time: 29.5, text: "He took me in his arms, I heard him say" },
    { time: 34.5, text: "\"When you get older" },
    { time: 37.0, text: "Your wild heart will live for younger days" },
    { time: 41.0, text: "Think of me if ever you're afraid\"" },
    { time: 44.5, text: "He said, \"One day, you'll leave this world behind" },
    { time: 49.0, text: "So live a life you will remember\"" },
    { time: 54.0, text: "My father told me when I was just a child" },
    { time: 58.5, text: "\"These are the nights that never die\"" },
    { time: 62.0, text: "My father told me" },
    { time: 63.5, text: "🎶 (Nhạc nền sôi động) 🎶" },
    { time: 74.0, text: "When thunder clouds start pouring down" },
    { time: 77.0, text: "Light a fire they can't put out" },
    { time: 80.5, text: "Carve your name into those shining stars" },
    { time: 83.5, text: "He said, \"Go venture far beyond the shores" },
    { time: 87.5, text: "Don't forsake this life of yours" },
    { time: 90.5, text: "I'll guide you home no matter where you are\"" },
    { time: 94.0, text: "One day, my father, he told me" },
    { time: 96.5, text: "\"Son, don't let it slip away\"" },
    { time: 100.0, text: "When I was just a boy, I heard him say" },
    { time: 104.5, text: "\"When you get older" },
    { time: 107.0, text: "Your wild heart will live for younger days" },
    { time: 110.5, text: "Think of me if ever you're afraid\"" },
    { time: 114.0, text: "He said, \"One day, you'll leave this world behind" },
    { time: 119.0, text: "So live a life you will remember\"" },
    { time: 124.0, text: "My father told me when I was just a child" },
    { time: 128.5, text: "\"These are the nights that never die\"" },
    { time: 131.5, text: "My father told me" },
    { time: 133.0, text: "🎶 (Nhạc nền sôi động) 🎶" },
    { time: 144.0, text: "\"These are the nights that never die\"" },
    { time: 147.5, text: "My father told me" },
    { time: 149.0, text: "🎶 (Kết thúc) 🎶" }
];

document.addEventListener('DOMContentLoaded', () => {
    const bgMusic = document.getElementById('bg-music');
    const lyricsDisplay = document.getElementById('lyrics-display');

    // Chỉnh thời gian bù bù trừ (offset) ở đây. 
    // Nếu lời chậm hơn nhạc, ta tăng số này lên để lời chạy sớm hơn.
    const lyricsTimeOffset = 2.5; 

    if (bgMusic && lyricsDisplay) {
        let activeLineIndex = -1;

        bgMusic.addEventListener('play', () => {
            lyricsDisplay.style.display = 'flex';
        });

        bgMusic.addEventListener('timeupdate', () => {
            const adjustedTime = bgMusic.currentTime + lyricsTimeOffset;
            
            let newIndex = -1;
            for (let i = 0; i < theNightsLyrics.length; i++) {
                if (adjustedTime >= theNightsLyrics[i].time) {
                    newIndex = i;
                } else {
                    break;
                }
            }

            if (newIndex !== -1 && newIndex !== activeLineIndex) {
                activeLineIndex = newIndex;
                
                const prevLine = newIndex > 0 ? theNightsLyrics[newIndex - 1].text : "";
                const currentLine = theNightsLyrics[newIndex].text;
                const nextLine = newIndex < theNightsLyrics.length - 1 ? theNightsLyrics[newIndex + 1].text : "";

                lyricsDisplay.innerHTML = `
                    <div class="lyric-wrapper">
                        <div class="lyric-prev">${prevLine}</div>
                        <div class="lyric-current">${currentLine}</div>
                        <div class="lyric-next">${nextLine}</div>
                    </div>
                `;
            }
        });
    }
});

function finishDynMassReview() {
    alert(`Bạn đã điền đúng ${dynMassReviewScore}/${dynMassReviewData.length} từ vựng! Cố gắng cải thiện nhé!`);
}