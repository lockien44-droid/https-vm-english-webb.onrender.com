function showPage(pageId) {
    let pages = document.querySelectorAll(".page");
    pages.forEach(function(page) {
        page.style.display = "none";
    });
    document.getElementById(pageId).style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    showPage('home');
    loadSavedAITopics();
    
    // Load saved Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        updateThemeButtons(true);
    }

    // Add click listeners to all sidebar nav items to update active state
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to the clicked item
            this.classList.add('active');
        });
    });

    // 🚀 PRE-LOAD CACHED NEWS & PODCASTS IMMEDIATELY 🚀
    const newsContainer = document.getElementById('news-feed-container');
    const cachedNewsHtml = localStorage.getItem('cached_news_html');
    if (newsContainer && cachedNewsHtml) {
        newsContainer.innerHTML = cachedNewsHtml;
    }

    const podcastContainer = document.getElementById('podcast-feed-container');
    // Default URL is BBC 6 Minute English
    const defaultPodcastUrl = "https://podcasts.files.bbci.co.uk/p02pc9tn.rss";
    const cachedPodcastHtml = localStorage.getItem('cached_podcast_' + defaultPodcastUrl);
    if (podcastContainer && cachedPodcastHtml) {
        podcastContainer.innerHTML = cachedPodcastHtml;
        // Make sure the select dropdown matches this default (it is already the first option in HTML, so it should match)
    }

    // Khởi tạo tính năng đánh dấu hoàn thành chủ đề
    initTopicCompletion();
});

function openTopicOverlay() {
    const overlay = document.getElementById("topic-overlay");
    if (overlay) {
        overlay.style.display = "flex";
    }
}

// ==========================================
// THEME & ANIMATION TOGGLES
// ==========================================

function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        updateThemeButtons(false);
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeButtons(true);
    }
}

function updateThemeButtons(isDark) {
    const icon = isDark ? '☀️' : '🌙';
    const btnMobile = document.getElementById('theme-btn-mobile');
    const btnDesktop = document.getElementById('theme-btn-desktop');
    if(btnMobile) btnMobile.innerHTML = icon;
    if(btnDesktop) btnDesktop.innerHTML = icon;
}

let isHeartPaused = false;
function toggleHeartAnimation() {
    isHeartPaused = !isHeartPaused;
    
    // Attempt to post message to iframe
    const iframe = document.querySelector('.hero-blob iframe');
    if(iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'toggleHeart', paused: isHeartPaused }, '*');
    }
    
    const icon = isHeartPaused ? '▶️' : '⏸️';
    const btnMobile = document.getElementById('anim-btn-mobile');
    const btnDesktop = document.getElementById('anim-btn-desktop');
    if(btnMobile) btnMobile.innerHTML = icon;
    if(btnDesktop) btnDesktop.innerHTML = icon;
}

function closeTopicOverlay() {
    const overlay = document.getElementById("topic-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }
}

// --- GAME STATE ---
let pendingGameMode = '';
let currentGameTopicData = [];
let currentGameTopicId = '';
// ------------------

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

function openGameTopicSelector(gameMode) {
    pendingGameMode = gameMode;
    const overlay = document.getElementById("game-topic-selector");
    if (overlay) {
        overlay.style.display = "flex";
    }
}

function closeGameTopicSelector() {
    const overlay = document.getElementById("game-topic-selector");
    if (overlay) {
        overlay.style.display = "none";
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

async function startSelectedGame(topicId) {
    const modeToStart = pendingGameMode;
    pendingGameMode = '';
    closeGameTopicSelector();
    
    // Set a flag to show it's loading
    const overlayTitle = document.getElementById("game-topic-title");
    const originalTitle = overlayTitle.innerText;
    overlayTitle.innerText = "⏳ Đang tải dữ liệu...";

    try {
        let topicData = [];
        // Map hardcoded IDs to their arrays, or default to JSON fetch
        if (topicId === 'animal') {
            topicData = [...commonAnimals]; // from early parts of script.js
        } else if (topicId === 'fruit') {
            topicData = [...commonFruits];
        } else if (topicId === 'culture') {
            topicData = [...commonCulture];
        } else {
            // Read from bundled JSON object to avoid CORS
            if (window.bundledTopics && window.bundledTopics[topicId]) {
                topicData = [...window.bundledTopics[topicId]];
            } else {
                throw new Error("Topic not bundled or found: " + topicId);
            }
        }
        
        currentGameTopicId = topicId;
        currentGameTopicData = topicData;
        
        // Execute the pending game mode
        if (modeToStart === 'quiz') {
            startQuiz();
        } else if (modeToStart === 'match') {
            startMatchGame();
        } else if (modeToStart === 'flashcard') {
            startFlashcard();
        } else if (modeToStart === 'listen') {
            startListenGame();
        } else if (modeToStart === 'adventure') {
            startAdventureGame();
        }
        
    } catch (error) {
        alert("Lỗi tải dữ liệu chủ đề: " + error.message);
        console.error(error);
    } finally {
        overlayTitle.innerText = originalTitle;
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
    if (!text) return;
    
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech (like the one that happens 500ms after listen game loads)
        // This ensures the button click plays immediately.
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 0.8; // Lower pitch to sound more masculine globally
        
        // Try to pick a standard US voice if available before speaking
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            // 1. Prefer known US Male voices
            const maleNames = ['Microsoft David', 'Alex', 'Aaron', 'Fred'];
            let selectedVoice = voices.find(v => maleNames.some(name => v.name.includes(name)));
            
            // 2. Try any US voice with 'male' in the name
            if (!selectedVoice) {
                selectedVoice = voices.find(v => (v.lang === 'en-US' || v.lang === 'en_US') && v.name.toLowerCase().includes('male'));
            }
            
            // 3. Fallback to any US voice
            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang === 'en-US' || v.lang === 'en_US' || v.name.includes('Google US English'));
            }
            
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }
        
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

// ------------------- GAMES: PREVENT REPETITION -------------------
let allVocabList = [];
let shuffledVocabList = []; // Array of words we haven't seen in the current loop

function initVocabList() {
    allVocabList = [];
    if (currentGameTopicData && currentGameTopicData.length > 0) {
        currentGameTopicData.forEach(item => {
            allVocabList.push({
                ...item,
                emoji: item.emoji || '💬' // Tự động thêm biểu tượng nếu JSON chưa có
            });
        });
        
        // Create a new shuffled copy for the games to consume
        shuffledVocabList = [...allVocabList].sort(() => Math.random() - 0.5);
    } else {
        // Fallback or empty handle
        alert("Dữ liệu trống, vui lòng chọn lại chủ đề.");
    }
}

// Helper: Get N unique unseen words (return fewer if not enough left)
function getNextVocabItems(count) {
    if (shuffledVocabList.length === 0) return [];
    
    // If asking for more than exists in shuffled list, just return what's left
    const actualCount = Math.min(count, shuffledVocabList.length);
    
    let selected = [];
    while (selected.length < actualCount) {
        if (shuffledVocabList.length === 0) {
            break; // Stop if no more words
        }
        
        const candidate = shuffledVocabList.pop();
        if (!selected.find(s => s.en === candidate.en)) {
            selected.push(candidate);
        }
    }
    return selected;
}

function getNextVocabItem() {
    const items = getNextVocabItems(1);
    return items.length > 0 ? items[0] : null;
}

function showGameCompleteMessage(containerId, gameMode) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; background: white; border: 4px solid #1f1f1f; border-radius: 20px; box-shadow: 8px 8px 0px #b455ff;">
            <div style="font-size: 80px; margin-bottom: 20px;">🏆</div>
            <h2 style="font-family: 'Quicksand'; font-size: 32px; color: #4caf50; margin-bottom: 15px;">Chúc mừng bạn!</h2>
            <p style="font-family: 'Nunito'; font-size: 20px; color: #555; margin-bottom: 30px;">Bạn đã hoàn thành 100 từ vựng của chủ đề này xuất sắc.</p>
            <button onclick="openGameTopicSelector('${gameMode || 'quiz'}')" style="background: #29b6f6; color: white; border: 3px solid #1f1f1f; border-radius: 12px; padding: 15px 30px; font-size: 20px; font-weight: bold; cursor: pointer; box-shadow: 4px 4px 0 #1f1f1f;">🔄 Chọn Chủ Đề Khác</button>
        </div>
    `;
}


// Global Image Cache for Games
const apiImagesCache = {};

async function fetchImageForWord(word, viWord) {
    if (apiImagesCache[word]) return apiImagesCache[word];

    const wordQuery = encodeURIComponent(word);
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${wordQuery}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
    
    try {
        const res = await fetch(wikiUrl);
        const data = await res.json();
        if (data.query && data.query.pages) {
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            
            if (pageId !== "-1" && pages[pageId].thumbnail) {
                apiImagesCache[word] = pages[pageId].thumbnail.source;
                return apiImagesCache[word];
            }
        }
    } catch (e) {
        console.error("Error fetching API image for " + word, e);
    }
    
    // Default dummy fallback (No text to prevent cheating from showing English word)
    return `https://dummyimage.com/400x300/f0f0f0/888888.png&text=${encodeURIComponent(viWord || 'No Image')}`;
}

// ------------------- QUIZ GAME -------------------
let currentQuizWord = null;

function startQuiz() {
    showPage('game-quiz');
    initVocabList();
    loadQuestion();
}

async function loadQuestion() {
    const container = document.getElementById('quiz-container');
    
    // Pick correct answer from the unseen list
    currentQuizWord = getNextVocabItem();
    if (!currentQuizWord) {
        showGameCompleteMessage('quiz-container', 'quiz');
        return;
    }
    
    // Pick 2 wrong answers (can be any word from the topic, duplicate check)
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
            <div class="quiz-question">Đây là gì? (${allVocabList.length - shuffledVocabList.length}/${allVocabList.length})</div>
            <div class="quiz-image" id="quiz-img-container" style="min-height: 180px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div class="spinner" style="font-size: 16px; color: #666;">⏳ Đang tải ảnh...</div>
            </div>
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

    // Fetch and display image
    const imageUrl = await fetchImageForWord(currentQuizWord.en, currentQuizWord.vi);
    const imgContainer = document.getElementById('quiz-img-container');
    
    // Ensure we are still showing the image for the current question
    if (imgContainer && document.querySelector('.quiz-btn').textContent.includes(options[0].en)) {
        imgContainer.innerHTML = `
            <img src="${imageUrl}" style="max-height: 150px; max-width: 100%; border-radius: 8px; border: 2px solid #555; margin-bottom: 10px; object-fit: contain;">
            <br>
            <span style="font-size:24px; font-weight: bold;">(${currentQuizWord.vi})</span>
        `;
    }
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
let flashcardList = []; // Specifically for flashcards so we don't mess up other games if switched

function startFlashcard() {
    showPage('game-flashcard');
    initVocabList();
    flashcardList = [...allVocabList].sort(() => Math.random() - 0.5); // Randomize flashcard order
    currentFlashcardIdx = 0;
    renderFlashcard();
}

async function renderFlashcard() {
    const container = document.getElementById('flashcard-container');
    if (flashcardList.length === 0) return;
    const word = flashcardList[currentFlashcardIdx];
    
    // Set a loading state
    container.innerHTML = `
        <div class="flashcard-wrapper">
            <div class="flashcard">
                <div class="flashcard-front" style="display: flex; justify-content: center; align-items: center; border-radius: 12px; background: white;">
                     <div class="spinner" style="font-size: 16px; color: #666;">⏳ Đang tải ảnh...</div>
                </div>
            </div>
            <div class="flashcard-controls">
                <button class="flashcard-nav-btn" onclick="prevFlashcard()">⬅ Tới trước</button>
                <div class="flashcard-counter">${currentFlashcardIdx + 1} / ${flashcardList.length}</div>
                <button class="flashcard-nav-btn" onclick="nextFlashcard()">Tiếp theo ➡</button>
            </div>
        </div>
    `;

    const imageUrl = await fetchImageForWord(word.en, word.vi);
    const currentWordStillSame = flashcardList[currentFlashcardIdx] === word;
    if (!currentWordStillSame) return; // if user clicked Next quickly

    container.innerHTML = `
        <div class="flashcard-wrapper">
            <div class="flashcard" onclick="this.classList.toggle('flipped')">
                <div class="flashcard-front">
                    <img src="${imageUrl}" style="width: 100%; height: 75%; object-fit: cover; border-top-left-radius: 12px; border-top-right-radius: 12px;">
                    <div style="height: 25%; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: bold; background-color: #f5f5f5; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                        ${word.emoji}
                    </div>
                </div>
                <div class="flashcard-back">
                    <div class="flashcard-en">${word.en}</div>
                    <div class="flashcard-phonetic" id="flashcard-phonetic-${currentFlashcardIdx}" style="font-size: 18px; color: #666; font-style: italic; margin-bottom: 5px;"></div>
                    <div class="flashcard-vi">${word.vi}</div>
                    <button class="flashcard-audio" onclick="event.stopPropagation(); playAudio('${word.en}')">🔊 Nghe</button>
                    <div class="flashcard-hint">Chạm để lật lại</div>
                </div>
            </div>
            
            <div class="flashcard-controls">
                <button class="flashcard-nav-btn" onclick="prevFlashcard()">⬅ Tới trước</button>
                <div class="flashcard-counter">${currentFlashcardIdx + 1} / ${flashcardList.length}</div>
                <button class="flashcard-nav-btn" onclick="nextFlashcard()">Tiếp theo ➡</button>
            </div>
        </div>
    `;
    
    fetchPhonetic(word.en, `flashcard-phonetic-${currentFlashcardIdx}`);
}

function prevFlashcard() {
    if (currentFlashcardIdx > 0) {
        currentFlashcardIdx--;
        renderFlashcard();
    }
}

function nextFlashcard() {
    if (currentFlashcardIdx < flashcardList.length - 1) {
        currentFlashcardIdx++;
        renderFlashcard();
    } else {
        showGameCompleteMessage('flashcard-container', 'flashcard');
    }
}

// ------------------- MATCHING GAME (Drag & Drop) -------------------
let matchItems = [];

function startMatchGame() {
    showPage('game-match');
    initVocabList();
    loadMatchGame();
}

async function loadMatchGame() {
    const container = document.getElementById('match-container');
    
    // Random 4 non-repeating items
    matchItems = getNextVocabItems(4);
    if (matchItems.length === 0) {
        showGameCompleteMessage('match-container', 'match');
        return;
    }
    
    container.innerHTML = `
        <div class="match-game-wrapper">
            <div style="text-align: center; padding: 40px; font-size: 18px; color: #555;">⏳ Đang tải ảnh API...</div>
        </div>
    `;

    // Fetch images concurrently
    const imagePromises = matchItems.map(item => fetchImageForWord(item.en, item.vi));
    const images = await Promise.all(imagePromises);

    matchItems.forEach((item, idx) => {
        item.fetchedImage = images[idx];
    });

    // Create drop zones (images)
    const dropZonesHTML = matchItems.map((item, index) => `
        <div class="match-zone-card">
            <div class="match-emoji" style="padding: 5px;">
                <img src="${item.fetchedImage}" style="max-width: 100%; height: 70px; object-fit: contain; border-radius: 8px;"> <br>
                <span style="font-size:18px;">(${item.vi})</span>
            </div>
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
            <button class="match-reload-btn" onclick="loadMatchGame()">🔄 Chơi tiếp tục</button>
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

async function loadListenGame() {
    const container = document.getElementById('listen-container');
    
    // Pick 4 options
    const options = getNextVocabItems(4);
    if (options.length === 0) {
        showGameCompleteMessage('listen-container', 'listen');
        return;
    }
    
    // Pick 1 target
    currentListenTarget = options[Math.floor(Math.random() * options.length)];
    
    container.innerHTML = `
        <div class="listen-game-wrapper">
            <div style="text-align: center; padding: 40px; font-size: 18px; color: #555;">⏳ Đang tải ảnh API...</div>
        </div>
    `;

    // Fetch images concurrently
    const imagePromises = options.map(item => fetchImageForWord(item.en, item.vi));
    const images = await Promise.all(imagePromises);
    options.forEach((item, idx) => {
        item.fetchedImage = images[idx];
    });

    container.innerHTML = `
        <div class="listen-game-wrapper">
            <button class="listen-play-btn" onclick="playAudio('${currentListenTarget.en}')">🔊 Play Audio</button>
            <div class="listen-hint">Nghe và chọn hình đúng</div>
            
            <div class="listen-options-grid">
                ${options.map((opt, index) => `
                    <div class="listen-option-card" data-en="${opt.en}" onclick="checkListenAnswer(this, '${opt.en}')">
                        <div class="listen-emoji">
                             <img src="${opt.fetchedImage}" style="max-width: 100%; max-height: 100px; border-radius: 8px;">
                        </div>
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
            if(c.dataset.en === currentListenTarget.en) {
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

// ------------------ Theme Management -------------------
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.querySelector('.theme-toggle-btn').textContent = '☀️';
    } else {
        document.body.removeAttribute('data-theme');
        document.querySelector('.theme-toggle-btn').textContent = '🌙';
    }
}

function toggleTheme() {
    const isDark = document.body.hasAttribute('data-theme');
    if (isDark) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        document.querySelector('.theme-toggle-btn').textContent = '🌙';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        document.querySelector('.theme-toggle-btn').textContent = '☀️';
    }
}

// Apply theme on load
initTheme();

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
    const animalMindmapContainer = document.getElementById('animal-mindmap-container');
    if (animalMindmapContainer) animalMindmapContainer.style.display = 'none';
    document.getElementById('animal-writing-practice-container').style.display = 'none';
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
    const animalMindmapContainer = document.getElementById('animal-mindmap-container');
    if (animalMindmapContainer) animalMindmapContainer.style.display = 'none';
    document.getElementById('animal-writing-practice-container').style.display = 'none';
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
async function fetchPhonetic(word, elementOrId) {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
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
    document.getElementById('animal-writing-practice-container').style.display = 'none';
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

// ------------------- ANIMAL WRITING PRACTICE (100 WORDS) -------------------
let animalWritingScore = 0;
let animalWritingData = [];
let isAnimalWritingShowingAnswers = false;

function loadAnimalWritingPractice() {
    // Hide other views
    document.getElementById('animal-card').style.display = 'none';
    document.getElementById('mass-review-container').style.display = 'none';
    const animalMindmapContainer = document.getElementById('animal-mindmap-container');
    if (animalMindmapContainer) animalMindmapContainer.style.display = 'none';
    document.getElementById('blindfold-toggle-container').style.display = 'none';
    document.getElementById('blindfold-scoreboard').style.display = 'none';
    
    document.getElementById('animal-writing-practice-container').style.display = 'block';
    
    // Toggle active button
    const animalSelector = document.querySelector('#vocab-animal .animal-selector');
    if (animalSelector) {
        const buttons = animalSelector.querySelectorAll('.animal-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        if (buttons.length >= 4) {
            buttons[3].classList.add('active'); 
        }
    }

    animalWritingScore = 0;
    isAnimalWritingShowingAnswers = false;
    document.getElementById('animal-writing-correct').textContent = animalWritingScore;
    document.getElementById('animal-writing-show-ans-btn').innerHTML = '👀 Hiện đáp án';
    
    // Copy data
    animalWritingData = JSON.parse(JSON.stringify(commonAnimals));
    
    renderAnimalWritingPractice();
}

function shuffleAnimalWriting() {
    animalWritingData.sort(() => Math.random() - 0.5);
    animalWritingScore = 0;
    // reset correct flags
    animalWritingData.forEach(w => {
        w.correct = false;
        w.typed = '';
    });
    document.getElementById('animal-writing-correct').textContent = animalWritingScore;
    isAnimalWritingShowingAnswers = false;
    document.getElementById('animal-writing-show-ans-btn').innerHTML = '👀 Hiện đáp án';
    renderAnimalWritingPractice();
}

function toggleAnimalWritingAnswers() {
    isAnimalWritingShowingAnswers = !isAnimalWritingShowingAnswers;
    const btn = document.getElementById('animal-writing-show-ans-btn');
    if (isAnimalWritingShowingAnswers) {
        btn.innerHTML = '🙈 Ẩn đáp án';
    } else {
        btn.innerHTML = '👀 Hiện đáp án';
    }
    renderAnimalWritingPractice();
}

function renderAnimalWritingPractice() {
    const tbodyLeft = document.getElementById('animal-writing-table-body-left');
    const tbodyMiddle = document.getElementById('animal-writing-table-body-middle');
    const tbodyRight = document.getElementById('animal-writing-table-body-right');
    tbodyLeft.innerHTML = ''; 
    tbodyMiddle.innerHTML = ''; 
    tbodyRight.innerHTML = '';

    const thirdLength = Math.ceil(animalWritingData.length / 3);

    animalWritingData.forEach((wordObj, index) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #ddd';
        
        const tdVi = document.createElement('td');
        tdVi.style.padding = '12px 15px';
        tdVi.style.fontSize = '18px';
        tdVi.style.borderRight = '2px solid #ddd';
        tdVi.textContent = wordObj.vi;
        
        const tdEn = document.createElement('td');
        tdEn.style.padding = '12px 15px';
        
        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.alignItems = 'center';
        inputContainer.style.gap = '10px';
        inputContainer.style.flexWrap = 'wrap';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Gõ TA...';
        input.id = `animal-write-input-${index}`;
        input.style.padding = '10px';
        input.style.fontSize = '18px';
        input.style.border = '2px solid #555';
        input.style.borderRadius = '6px';
        input.style.fontFamily = 'Nunito, sans-serif';
        input.style.flex = '1';
        input.style.minWidth = '120px';
        input.style.outline = 'none';
        
        if (wordObj.correct) {
            input.value = wordObj.en;
            input.disabled = true;
            input.style.backgroundColor = '#c8e6c9';
            input.style.borderColor = '#4caf50';
        } else if (isAnimalWritingShowingAnswers) {
            input.value = wordObj.en;
            input.style.color = '#1976d2';
            input.style.fontWeight = 'bold';
        } else {
            input.value = wordObj.typed || '';
        }
        
        input.oninput = (e) => {
            wordObj.typed = e.target.value;
            checkAnimalWritingAnswer(e.target, index);
        };
        
        const resultIcon = document.createElement('span');
        resultIcon.id = `animal-write-result-${index}`;
        resultIcon.style.fontSize = '20px';
        if (wordObj.correct) {
            resultIcon.textContent = '✅';
        }
        
        // Add an optional phonetic/audio container next to the input
        const extraInfoContainer = document.createElement('div');
        extraInfoContainer.style.display = 'flex';
        extraInfoContainer.style.alignItems = 'center';
        extraInfoContainer.style.gap = '8px';
        
        if (wordObj.correct || isAnimalWritingShowingAnswers) {
            // Phonetic
            const phoneticSpan = document.createElement('span');
            phoneticSpan.id = `animal-write-phonetic-${index}`;
            phoneticSpan.style.fontStyle = 'italic';
            phoneticSpan.style.color = '#555';
            phoneticSpan.style.fontSize = '14px';
            fetchPhonetic(wordObj.en, phoneticSpan);
            extraInfoContainer.appendChild(phoneticSpan);
            
            // Audio Button
            const audioBtn = document.createElement('button');
            audioBtn.innerHTML = '🔊';
            audioBtn.title = 'Nghe từ này';
            audioBtn.style.background = 'none';
            audioBtn.style.border = 'none';
            audioBtn.style.cursor = 'pointer';
            audioBtn.style.fontSize = '16px';
            audioBtn.onclick = () => playAudio(wordObj.en);
            extraInfoContainer.appendChild(audioBtn);
        }

        inputContainer.appendChild(input);
        inputContainer.appendChild(resultIcon);
        if (extraInfoContainer.hasChildNodes()) {
            inputContainer.appendChild(extraInfoContainer);
        }
        tdEn.appendChild(inputContainer);
        
        tr.appendChild(tdVi);
        tr.appendChild(tdEn);
        
        if (index < thirdLength) {
            tbodyLeft.appendChild(tr);
        } else if (index < thirdLength * 2) {
            tbodyMiddle.appendChild(tr);
        } else {
            tbodyRight.appendChild(tr);
        }
    });
}

function checkAnimalWritingAnswer(inputEl, wordIndex) {
    if (inputEl.disabled) return; 

    const guess = inputEl.value.trim().toLowerCase();
    const actualWord = animalWritingData[wordIndex].en.toLowerCase();
    const resultIcon = document.getElementById(`animal-write-result-${wordIndex}`);
    
    if (isAnimalWritingShowingAnswers) return; 
    
    const isMatch = guess === actualWord || 
                    actualWord.split(/[,/()\-]/).map(s => s.trim().toLowerCase()).includes(guess);

    if (isMatch) {
        inputEl.style.backgroundColor = '#c8e6c9';
        inputEl.style.borderColor = '#4caf50';
        inputEl.disabled = true; 
        resultIcon.textContent = '✅';
        animalWritingData[wordIndex].correct = true;
        
        animalWritingScore++;
        document.getElementById('animal-writing-correct').textContent = animalWritingScore;
        
        if (animalWritingScore === animalWritingData.length) {
            setTimeout(() => alert('🎉 Tuyệt đỉnh! Bạn đã hoàn thành xuất sắc bài Luyện Viết 100 từ!'), 500);
        }
    } else if (guess.length > 0 && actualWord.startsWith(guess) && guess.length >= 3) {
        inputEl.style.borderColor = '#ffb300';
        resultIcon.textContent = '⏳';
    } else if (guess.length > 0) {
        inputEl.style.borderColor = '#555';
        resultIcon.textContent = '';
    } else {
        inputEl.style.borderColor = '#555';
        inputEl.style.backgroundColor = 'white';
        resultIcon.textContent = '';
    }
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
    const vehicleMindmapContainer = document.getElementById('vehicle-mindmap-container');
    if (vehicleMindmapContainer) vehicleMindmapContainer.style.display = 'none';
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
const commonFruits = [
    {en: "apple", vi: "quả táo"},
    {en: "banana", vi: "quả chuối"},
    {en: "orange", vi: "quả cam"},
    {en: "grape", vi: "quả nho"},
    {en: "strawberry", vi: "quả dâu tây"},
    {en: "watermelon", vi: "quả dưa hấu"},
    {en: "melon", vi: "quả dưa lưới"},
    {en: "lemon", vi: "quả chanh vàng"},
    {en: "lime", vi: "quả chanh xanh"},
    {en: "peach", vi: "quả đào"},
    {en: "pear", vi: "quả lê"},
    {en: "mango", vi: "quả xoài"},
    {en: "pineapple", vi: "quả dứa"},
    {en: "papaya", vi: "quả đu đủ"},
    {en: "coconut", vi: "quả dừa"},
    {en: "cherry", vi: "quả anh đào"},
    {en: "blueberry", vi: "quả việt quất"},
    {en: "blackberry", vi: "quả mâm xôi đen"},
    {en: "raspberry", vi: "quả mâm xôi đỏ"},
    {en: "plum", vi: "quả mận"},
    {en: "apricot", vi: "quả mơ"},
    {en: "kiwi", vi: "quả kiwi"},
    {en: "pomegranate", vi: "quả lựu"},
    {en: "fig", vi: "quả sung"},
    {en: "date", vi: "quả chà là"},
    {en: "guava", vi: "quả ổi"},
    {en: "passion fruit", vi: "quả chanh dây"},
    {en: "dragon fruit", vi: "quả thanh long"},
    {en: "lychee", vi: "quả vải"},
    {en: "longan", vi: "quả nhãn"},
    {en: "rambutan", vi: "quả chôm chôm"},
    {en: "mangosteen", vi: "quả măng cụt"},
    {en: "durian", vi: "quả sầu riêng"},
    {en: "jackfruit", vi: "quả mít"},
    {en: "star apple", vi: "quả vú sữa"},
    {en: "starfruit", vi: "quả khế"},
    {en: "soursop", vi: "quả mãng cầu xiêm"},
    {en: "custard apple", vi: "quả na"},
    {en: "grapefruit", vi: "quả bưởi chùm"},
    {en: "pomelo", vi: "quả bưởi"},
    {en: "persimmon", vi: "quả hồng"},
    {en: "tamarind", vi: "quả me"},
    {en: "sapodilla", vi: "quả hồng xiêm"},
    {en: "rose apple", vi: "quả roi / mận đào"},
    {en: "kumquat", vi: "quả quất / khế"},
    {en: "cranberry", vi: "quả nam việt quất"},
    {en: "gooseberry", vi: "quả lý gai"},
    {en: "mulberry", vi: "quả dâu tằm"},
    {en: "spondias", vi: "quả cóc"},
    {en: "cantaloupe", vi: "quả dưa vàng"},
    {en: "honeydew", vi: "quả dưa bở"},
    {en: "avocado", vi: "quả bơ"},
    {en: "olive", vi: "quả ô liu"},
    {en: "nectarine", vi: "quả đào tiên"},
    {en: "tangerine", vi: "quả quýt"},
    {en: "mandarin", vi: "quả quýt hồng"},
    {en: "clementine", vi: "quả quýt ngọt"},
    {en: "yuzu", vi: "quả thanh yên"},
    {en: "buddha's hand", vi: "quả phật thủ"},
    {en: "quince", vi: "quả mộc qua"},
    {en: "loquat", vi: "quả nhót tây"},
    {en: "jujube", vi: "quả táo tàu"},
    {en: "acerola", vi: "quả sơ ri"},
    {en: "surinam cherry", vi: "quả khế tàu"},
    {en: "ackee", vi: "quả ackee"},
    {en: "breadfruit", vi: "quả sa kê"},
    {en: "cacao", vi: "quả ca cao"},
    {en: "coffee berry", vi: "quả cà phê"},
    {en: "salak", vi: "quả da rắn"},
    {en: "langsat", vi: "quả bòn bon"},
    {en: "santol", vi: "quả sấu đỏ"},
    {en: "water apple", vi: "quả mận nước"},
    {en: "otaheite gooseberry", vi: "quả chùm ruột"},
    {en: "baccaurea", vi: "quả dâu da đất"},
    {en: "gac", vi: "quả gấc"},
    {en: "blackcurrant", vi: "quả lý chua đen"},
    {en: "redcurrant", vi: "quả lý chua đỏ"},
    {en: "whitecurrant", vi: "quả lý chua trắng"},
    {en: "elderberry", vi: "quả cơm cháy"},
    {en: "boysenberry", vi: "quả mâm xôi lai"},
    {en: "loganberry", vi: "quả dâu tằm lai"},
    {en: "cloudberry", vi: "quả mâm xôi bắc cực"},
    {en: "huckleberry", vi: "quả việt quất đầm lầy"},
    {en: "salmonberry", vi: "quả mâm xôi cá hồi"},
    {en: "marionberry", vi: "quả mâm xôi đen marion"},
    {en: "pineberry", vi: "quả dâu tây trắng"},
    {en: "tayberry", vi: "quả lai mâm xôi đỏ"},
    {en: "calamansi", vi: "quả tắc"},
    {en: "bergamot", vi: "quả cam bergamot"},
    {en: "blood orange", vi: "quả cam máu"},
    {en: "kaffir lime", vi: "quả chanh sả"},
    {en: "ugli fruit", vi: "quả chanh bưởi"},
    {en: "pawpaw", vi: "quả đu đủ mỹ"},
    {en: "cherimoya", vi: "quả mãng cầu nam mỹ"},
    {en: "feijoa", vi: "quả ổi dứa"},
    {en: "jabuticaba", vi: "quả nho thân gỗ"},
    {en: "miracle fruit", vi: "quả thần kỳ"},
    {en: "monstera deliciosa", vi: "quả trầu bà nam mỹ"},
    {en: "pepino", vi: "quả dưa nam mỹ"},
    {en: "tamarillo", vi: "quả cà chua cây"}
];

// ------------------- CULTURE SECTION (100 words) -------------------
const commonCulture = [
    {en: "culture", vi: "văn hoá"},
    {en: "tradition", vi: "truyền thống"},
    {en: "custom", vi: "phong tục / tập quán"},
    {en: "belief", vi: "niềm tin / tín ngưỡng"},
    {en: "heritage", vi: "di sản"},
    {en: "value", vi: "giá trị"},
    {en: "diversity", vi: "sự đa dạng"},
    {en: "identity", vi: "bản sắc"},
    {en: "society", vi: "xã hội"},
    {en: "community", vi: "cộng đồng"},
    {en: "history", vi: "lịch sử"},
    {en: "religion", vi: "tôn giáo"},
    {en: "language", vi: "ngôn ngữ"},
    {en: "dialect", vi: "phương ngữ"},
    {en: "art", vi: "nghệ thuật"},
    {en: "architecture", vi: "kiến trúc"},
    {en: "literature", vi: "văn học"},
    {en: "music", vi: "âm nhạc"},
    {en: "dance", vi: "điệu nhảy / vũ đạo"},
    {en: "festival", vi: "lễ hội"},
    {en: "ceremony", vi: "nghi lễ"},
    {en: "ritual", vi: "nghi thức"},
    {en: "costume", vi: "trang phục truyền thống"},
    {en: "garment", vi: "quần áo / y phục"},
    {en: "cuisine", vi: "ẩm thực"},
    {en: "recipe", vi: "công thức nấu ăn"},
    {en: "myth", vi: "thần thoại"},
    {en: "legend", vi: "truyền thuyết"},
    {en: "folklore", vi: "văn học dân gian"},
    {en: "fairytale", vi: "truyện cổ tích"},
    {en: "proverb", vi: "tục ngữ"},
    {en: "idiom", vi: "thành ngữ"},
    {en: "ancestor", vi: "tổ tiên"},
    {en: "descendant", vi: "hậu duệ"},
    {en: "generation", vi: "thế hệ"},
    {en: "civilization", vi: "nền văn minh"},
    {en: "empire", vi: "đế chế"},
    {en: "monarch", vi: "vua / quốc vương"},
    {en: "dynasty", vi: "triều đại"},
    {en: "artifact", vi: "cổ vật / tạo tác"},
    {en: "monument", vi: "đài kỷ niệm / di tích"},
    {en: "museum", vi: "bảo tàng"},
    {en: "gallery", vi: "phòng trưng bày"},
    {en: "exhibition", vi: "cuộc triển lãm"},
    {en: "sculpture", vi: "tác phẩm điêu khắc"},
    {en: "painting", vi: "bức tranh"},
    {en: "pottery", vi: "đồ gốm"},
    {en: "craft", vi: "thủ công mỹ nghệ"},
    {en: "weaving", vi: "nghề dệt"},
    {en: "embroidery", vi: "nghề thêu"},
    {en: "calligraphy", vi: "thư pháp"},
    {en: "martial arts", vi: "võ thuật"},
    {en: "worship", vi: "sự thờ cúng"},
    {en: "shrine", vi: "miếu thờ / điện thờ"},
    {en: "temple", vi: "đền / chùa"},
    {en: "pagoda", vi: "chùa (châu Á)"},
    {en: "church", vi: "nhà thờ"},
    {en: "mosque", vi: "đền thờ Hồi giáo"},
    {en: "monastery", vi: "tu viện"},
    {en: "priest", vi: "linh mục / giáo sĩ"},
    {en: "monk", vi: "thầy tu / nhà sư"},
    {en: "pilgrimage", vi: "cuộc hành hương"},
    {en: "sacred", vi: "thiêng liêng"},
    {en: "holy", vi: "thánh thiện / linh thiêng"},
    {en: "superstition", vi: "sự mê tín"},
    {en: "taboo", vi: "điều cấm kỵ"},
    {en: "etiquette", vi: "phép lịch sự / nghi thức"},
    {en: "politeness", vi: "sự lễ phép"},
    {en: "respect", vi: "sự tôn trọng"},
    {en: "hospitality", vi: "lòng hiếu khách"},
    {en: "greeting", vi: "lời chào hỏi"},
    {en: "bow", vi: "cúi chào"},
    {en: "handshake", vi: "chiếc bắt tay"},
    {en: "gift exchanges", vi: "tặng quà"},
    {en: "celebration", vi: "sự ăn mừng"},
    {en: "anniversary", vi: "lễ kỷ niệm"},
    {en: "wedding", vi: "đám cưới"},
    {en: "funeral", vi: "đám tang"},
    {en: "nomad", vi: "người du mục"},
    {en: "tribe", vi: "bộ lạc"},
    {en: "clan", vi: "thị tộc / gia tộc"},
    {en: "indigenous", vi: "bản địa"},
    {en: "ethnic", vi: "thuộc sắc tộc"},
    {en: "minority", vi: "thiểu số"},
    {en: "migration", vi: "sự di cư"},
    {en: "immigration", vi: "sự nhập cư"},
    {en: "globalization", vi: "toàn cầu hoá"},
    {en: "assimilation", vi: "sự đồng hoá"},
    {en: "integration", vi: "sự hội nhập"},
    {en: "stereotyping", vi: "sự rập khuôn / định kiến"},
    {en: "prejudice", vi: "thành kiến"},
    {en: "racism", vi: "chủ nghĩa phân biệt chủng tộc"},
    {en: "tolerance", vi: "lòng khoan dung"},
    {en: "harmony", vi: "sự hoà hợp"},
    {en: "philosophy", vi: "triết học"},
    {en: "ideology", vi: "hệ tư tưởng"},
    {en: "morality", vi: "đạo đức"},
    {en: "ethics", vi: "luân lý"}
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
        
    const randomFood = commonFruits[Math.floor(Math.random() * commonFruits.length)];
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

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});

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
    
    fMassReviewData = JSON.parse(JSON.stringify(commonFruits)); 
    
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
                imageUrl = `https://dummyimage.com/400x300/f3f4f6/333333.png&text=${encodeURIComponent(randomBody.vi || 'No Image')}`;
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
        img.src = bodyPart.img || 'https://dummyimage.com/300x200/f3f4f6/333333.png&text=No+Image';
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

// Tracking for non-repeating words
let dynUnseenWords = [];
let dynAltImagesCache = {};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Load the JSON data for a specific topic
async function loadDynamicTopic(topicId, title) {
    showPage('vocab-dynamic');
    document.getElementById('dyn-page-title').textContent = title;
    currentDynTopicId = topicId;
    currentDynTopicData = []; // Clear old data
    dynHistory = [];
    dCurrentHistoryIndex = -1;
    dynUnseenWords = [];
    dynAltImagesCache = {}; // Clear old cache for new topic
    updateDynNavigationButtons();
    
    // Hide UI elements while loading
    const dynCard = document.getElementById('dyn-card');
    if (dynCard) dynCard.style.display = 'none';
    
    const massReviewContainer = document.getElementById('dyn-mass-review-container');
    if (massReviewContainer) massReviewContainer.style.display = 'none';
    
    // Some elements may not exist in test.html depending on the current feature set
    const blindfoldToggleContainer = document.getElementById('dyn-blindfold-toggle-container');
    if (blindfoldToggleContainer) blindfoldToggleContainer.style.display = 'none';
    
    const blindfoldScoreboard = document.getElementById('dyn-blindfold-scoreboard');
    if (blindfoldScoreboard) blindfoldScoreboard.style.display = 'none';
    
    const writingPracticeContainer = document.getElementById('dyn-writing-practice-container');
    if (writingPracticeContainer) writingPracticeContainer.style.display = 'none';
    
    try {
        // We read from the bundled JavaScript object to avoid CORS issues
        if (topicId === 'fruit') {
            currentDynTopicData = [...commonFruits];
        } else if (topicId === 'culture') {
            currentDynTopicData = [...commonCulture];
        } else if (window.bundledTopics && window.bundledTopics[topicId]) {
            currentDynTopicData = [...window.bundledTopics[topicId]];
        } else {
            throw new Error('Topic data not found in bundle');
        }
        
        // Initialize the tracking arrays
        dynUnseenWords = [...currentDynTopicData];
        shuffleArray(dynUnseenWords);
        
        // Data loaded successfully, show toggle and load an item
        document.getElementById('dyn-blindfold-toggle-container').style.display = 'flex';
        loadDynItem();
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu chủ đề:", error);
        alert(`Dữ liệu cho chủ đề "${title}" đang được hoàn thiện. Vui lòng thử lại sau!`);
    }
}

async function fetchAlternativeImages(word) {
    if (dynAltImagesCache[word]) return dynAltImagesCache[word];
    
    const wordQuery = encodeURIComponent(word);
    let wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${wordQuery}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
    
    try {
        let res = await fetch(wikiUrl);
        let data = await res.json();
        let images = [];
        if (data.query && data.query.pages) {
            Object.values(data.query.pages).forEach(page => {
                if (page.thumbnail && page.thumbnail.source) {
                    images.push(page.thumbnail.source);
                }
            });
        }
        dynAltImagesCache[word] = images;
        return images;
    } catch(err) {
        console.error("Lỗi tải ảnh thay thế:", err);
        return [];
    }
}

// ------------------- WRITING PRACTICE SECTION -------------------
let dynWritingScore = 0;
let dynWritingData = [];
let isDynWritingShowingAnswers = false;

function loadDynWritingPractice() {
    if (!currentDynTopicData || currentDynTopicData.length === 0) {
        alert("Vui lòng đợi dữ liệu tải xong hoặc chọn một chủ đề trước.");
        console.warn("Attempted to load writing practice before data was ready.");
        return;
    }

    // Update UI visibility
    document.getElementById('dyn-card').style.display = 'none';
    const dynMindmapContainer = document.getElementById('dyn-mindmap-container');
    if (dynMindmapContainer) dynMindmapContainer.style.display = 'none';
    document.getElementById('dyn-mass-review-container').style.display = 'none';
    document.getElementById('dyn-writing-practice-container').style.display = 'block';
    
    // Toggle active button
    const dynSelector = document.querySelector('#vocab-dynamic .animal-selector');
    if (dynSelector) {
        const buttons = dynSelector.querySelectorAll('.animal-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        if (buttons.length >= 3) {
            buttons[2].classList.add('active'); // The 3rd button is Writing Practice
        }
    }

    dynWritingScore = 0;
    isDynWritingShowingAnswers = false;
    document.getElementById('dyn-writing-correct').textContent = dynWritingScore;
    document.getElementById('dyn-writing-total').textContent = currentDynTopicData.length;
    document.getElementById('dyn-writing-show-ans-btn').innerHTML = '👀 Hiện đáp án';
    
    // Copy data
    dynWritingData = JSON.parse(JSON.stringify(currentDynTopicData));
    
    renderDynWritingPractice();
}

function shuffleDynWriting() {
    if (!dynWritingData || dynWritingData.length === 0) return;
    dynWritingData.sort(() => Math.random() - 0.5);
    dynWritingScore = 0;
    dynWritingData.forEach(w => {
        w.correct = false;
        w.typed = '';
    });
    document.getElementById('dyn-writing-correct').textContent = dynWritingScore;
    isDynWritingShowingAnswers = false;
    document.getElementById('dyn-writing-show-ans-btn').innerHTML = '👀 Hiện đáp án';
    renderDynWritingPractice();
}

function toggleDynWritingAnswers() {
    isDynWritingShowingAnswers = !isDynWritingShowingAnswers;
    const btn = document.getElementById('dyn-writing-show-ans-btn');
    if (isDynWritingShowingAnswers) {
        btn.innerHTML = '🙈 Ẩn đáp án';
    } else {
        btn.innerHTML = '👀 Hiện đáp án';
    }
    renderDynWritingPractice();
}

function renderDynWritingPractice() {
    const tbodyLeft = document.getElementById('dyn-writing-table-body-left');
    const tbodyMiddle = document.getElementById('dyn-writing-table-body-middle');
    const tbodyRight = document.getElementById('dyn-writing-table-body-right');
    tbodyLeft.innerHTML = ''; 
    tbodyMiddle.innerHTML = ''; 
    tbodyRight.innerHTML = '';

    const thirdLength = Math.ceil(dynWritingData.length / 3);

    dynWritingData.forEach((wordObj, index) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #ddd';
        
        // Vietnamese Meaning Column
        const tdVi = document.createElement('td');
        tdVi.style.padding = '12px 15px';
        tdVi.style.fontSize = '18px';
        tdVi.style.borderRight = '2px solid #ddd';
        tdVi.style.cursor = 'pointer';
        tdVi.textContent = wordObj.vi;
        
        // English Input Column
        const tdEn = document.createElement('td');
        tdEn.style.padding = '12px 15px';
        
        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.alignItems = 'center';
        inputContainer.style.gap = '10px';
        inputContainer.style.flexWrap = 'wrap';
        
        const inputWrapper = document.createElement('div');
        inputWrapper.style.position = 'relative';
        inputWrapper.style.flex = '1';
        inputWrapper.style.minWidth = '120px';

        const hintSpan = document.createElement('span');
        hintSpan.textContent = wordObj.en;
        hintSpan.style.position = 'absolute';
        hintSpan.style.left = '12px'; // 10px padding + 2px border
        hintSpan.style.top = '50%';
        hintSpan.style.transform = 'translateY(-50%)';
        hintSpan.style.fontSize = '18px';
        hintSpan.style.fontFamily = 'Nunito, sans-serif';
        hintSpan.style.color = '#ccc';
        hintSpan.style.pointerEvents = 'none';
        hintSpan.style.zIndex = '1';
        hintSpan.style.whiteSpace = 'nowrap';
        hintSpan.style.overflow = 'hidden';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `dyn-write-input-${index}`;
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
        input.style.padding = '10px';
        input.style.fontSize = '18px';
        input.style.border = '2px solid #555';
        input.style.borderRadius = '6px';
        input.style.fontFamily = 'Nunito, sans-serif';
        input.style.outline = 'none';
        input.style.background = 'transparent';
        input.style.position = 'relative';
        input.style.zIndex = '2';
        
        inputWrapper.appendChild(hintSpan);
        inputWrapper.appendChild(input);
        
        if (wordObj.correct) {
            input.value = wordObj.en;
            input.disabled = true;
            input.style.backgroundColor = '#c8e6c9';
            input.style.borderColor = '#4caf50';
        } else if (isDynWritingShowingAnswers) {
            input.value = wordObj.en;
            input.style.backgroundColor = '#fff';
            input.style.color = '#1976d2';
            input.style.fontWeight = 'bold';
        } else {
            input.value = wordObj.typed || '';
        }
        
        // Listen for input to check answer automatically
        input.oninput = (e) => {
            wordObj.typed = e.target.value;
            checkDynWritingAnswer(e.target, index);
        };

        // Open 10-time repetition modal when clicking the row/Vietnamese text
        tdVi.onclick = () => {
            openWriteRepeatModal(wordObj);
        };
        
        const resultIcon = document.createElement('span');
        resultIcon.id = `dyn-write-result-${index}`;
        resultIcon.style.fontSize = '20px';
        if (wordObj.correct) {
            resultIcon.textContent = '✅';
        }
        
        // Add an optional phonetic/audio container next to the input
        const extraInfoContainer = document.createElement('div');
        extraInfoContainer.style.display = 'flex';
        extraInfoContainer.style.alignItems = 'center';
        extraInfoContainer.style.gap = '8px';
        
        if (wordObj.correct || isDynWritingShowingAnswers) {
            // Phonetic
            const phoneticSpan = document.createElement('span');
            phoneticSpan.id = `dyn-write-phonetic-${index}`;
            phoneticSpan.style.fontStyle = 'italic';
            phoneticSpan.style.color = '#555';
            phoneticSpan.style.fontSize = '14px';
            fetchPhonetic(wordObj.en, phoneticSpan);
            extraInfoContainer.appendChild(phoneticSpan);
            
            // Audio Button
            const audioBtn = document.createElement('button');
            audioBtn.innerHTML = '🔊';
            audioBtn.title = 'Nghe từ này';
            audioBtn.style.background = 'none';
            audioBtn.style.border = 'none';
            audioBtn.style.cursor = 'pointer';
            audioBtn.style.fontSize = '16px';
            audioBtn.onclick = () => playAudio(wordObj.en);
            extraInfoContainer.appendChild(audioBtn);
        }

        inputContainer.appendChild(inputWrapper);
        inputContainer.appendChild(resultIcon);
        if (extraInfoContainer.hasChildNodes()) {
            inputContainer.appendChild(extraInfoContainer);
        }
        tdEn.appendChild(inputContainer);
        
        tr.appendChild(tdVi);
        tr.appendChild(tdEn);
        
        if (index < thirdLength) {
            tbodyLeft.appendChild(tr);
        } else if (index < thirdLength * 2) {
            tbodyMiddle.appendChild(tr);
        } else {
            tbodyRight.appendChild(tr);
        }
    });
}

function checkDynWritingAnswer(inputEl, wordIndex) {
    if (inputEl.disabled) return; // Already answered correctly
    if (isDynWritingShowingAnswers) return;

    const guess = inputEl.value.trim().toLowerCase();
    const actualWord = dynWritingData[wordIndex].en.toLowerCase();
    const resultIcon = document.getElementById(`dyn-write-result-${wordIndex}`);
    
    // Check if the guess matches the word or one of its variants
    const isMatch = guess === actualWord || 
                    actualWord.split(/[,/()\-]/).map(s => s.trim().toLowerCase()).includes(guess);

    if (isMatch) {
        inputEl.style.backgroundColor = '#c8e6c9';
        inputEl.style.borderColor = '#4caf50';
        inputEl.disabled = true; // Lock the input
        resultIcon.textContent = '✅';
        dynWritingData[wordIndex].correct = true;
        
        dynWritingScore++;
        document.getElementById('dyn-writing-correct').textContent = dynWritingScore;
        
        // Check for completion
        if (dynWritingScore === dynWritingData.length) {
            setTimeout(() => alert('🎉 Tuyệt đỉnh! Bạn đã hoàn thành xuất sắc bài Luyện Viết!'), 500);
        }
    } else if (guess.length > 0 && actualWord.startsWith(guess) && guess.length >= 3) {
        // Partial correct styling (optional, nice UX)
        inputEl.style.borderColor = '#ffb300';
        resultIcon.textContent = '⏳';
    } else if (guess.length > 0) {
        // Typing but not correct
        inputEl.style.borderColor = '#555';
        resultIcon.textContent = '';
    } else {
        // Empty
        inputEl.style.borderColor = '#555';
        inputEl.style.backgroundColor = 'transparent';
        resultIcon.textContent = '';
    }
}
async function loadDynItem() {
    try {
        if (!currentDynTopicData || currentDynTopicData.length === 0) return;
        
        const img = document.getElementById('dyn-img');
        const loading = document.getElementById('dyn-loading');
        const card = document.getElementById('dyn-card');
        
        const massReviewContainer = document.getElementById('dyn-mass-review-container');
        if (massReviewContainer) massReviewContainer.style.display = 'none';
        const dynMindmapContainer = document.getElementById('dyn-mindmap-container');
        if (dynMindmapContainer) dynMindmapContainer.style.display = 'none';
        const dynWritingContainer = document.getElementById('dyn-writing-practice-container');
        if (dynWritingContainer) dynWritingContainer.style.display = 'none';
        
        const toggleContainer = document.getElementById('dyn-blindfold-toggle-container');
        if (toggleContainer) toggleContainer.style.display = 'flex';
        
        const blindToggle = document.getElementById('dyn-blindfold-toggle');
        if (blindToggle && blindToggle.checked) {
            const scoreboard = document.getElementById('dyn-blindfold-scoreboard');
            if (scoreboard) scoreboard.style.display = 'flex';
        }
        
        if (card) card.style.display = 'flex';
        if (loading) loading.style.display = 'flex';
        if (img) img.style.display = 'none';
            
        // Refill and reshuffle the array if it's empty
        if (dynUnseenWords.length === 0) {
            dynUnseenWords = [...currentDynTopicData];
            shuffleArray(dynUnseenWords);
        }
        
        // Pop a word off the end to ensure we don't repeat until empty
        const randomWordObj = dynUnseenWords.pop();
        if (!randomWordObj) return;
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
                // Wikipedia no image fallback -> Use DummyImage with Vietnamese text
                imageUrl = `https://dummyimage.com/400x300/f3f4f6/333333.png&text=${encodeURIComponent(randomWordObj.vi || 'No Image')}`;
            }
                
            const nameContainer = document.getElementById('dyn-name-container');
            if (blindToggle && blindToggle.checked) {
                if (nameContainer) nameContainer.style.display = 'none';
            } else {
                if (nameContainer) {
                    nameContainer.style.display = 'flex';
                    nameContainer.style.flexDirection = 'column';
                    nameContainer.style.alignItems = 'center';
                }
            }
            
            const dynEn = document.getElementById('dyn-en');
            if (dynEn) dynEn.textContent = randomWordObj.en;
            
            const dynVi = document.getElementById('dyn-vi');
            if (dynVi) dynVi.textContent = randomWordObj.vi;
            
            fetchPhonetic(randomWordObj.en, 'dyn-phonetic');
            
            if (typeof markDynItemLoadedForBlindfold === 'function') {
                markDynItemLoadedForBlindfold();
            }
            
            if (dCurrentHistoryIndex === -1 || dCurrentHistoryIndex === dynHistory.length - 1) {
                dynHistory.push({
                    en: randomWordObj.en,
                    vi: randomWordObj.vi,
                    img: imageUrl
                });
                dCurrentHistoryIndex = dynHistory.length - 1;
            }
            
            updateDynNavigationButtons();
            
            if (img) {
                img.src = imageUrl;
                img.onload = () => {
                    if (loading) loading.style.display = 'none';
                    img.style.display = 'block';
                };
                img.onerror = () => {
                    if (loading) loading.style.display = 'none';
                    img.style.display = 'block';
                    img.alt = 'Lỗi ảnh';
                };
            }
        } catch (err) {
            console.error(err);
            if (loading) loading.style.display = 'none';
            if (img) {
                img.alt = "Lỗi khi tải hình ảnh. Vui lòng thử lại.";
                img.style.display = 'block';
            }
        }
    } catch (globalErr) {
        console.error("Critical error in loadDynItem:", globalErr);
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
    const dynMindmapContainer = document.getElementById('dyn-mindmap-container');
    if (dynMindmapContainer) dynMindmapContainer.style.display = 'none';
    const dynWritingContainer = document.getElementById('dyn-writing-practice-container');
    if (dynWritingContainer) dynWritingContainer.style.display = 'none';
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

function shuffleDynMassReview() {
    if (!dynMassReviewData || dynMassReviewData.length === 0) return;
    
    // Shuffle the state array
    shuffleArray(dynMassReviewData);
    
    // Go back to the first page and re-render
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
        
        const imgContainer = document.createElement('div');
        imgContainer.style.position = 'relative';
        imgContainer.style.width = '100%';
        
        const img = document.createElement('img');
        const imgId = `dyn-mass-img-${globalIndex}`;
        const loadingId = `dyn-mass-loading-${globalIndex}`;
        img.id = imgId;
        img.src = wordObj.img || `https://dummyimage.com/300x200/f3f4f6/333333.png&text=${encodeURIComponent(wordObj.vi || 'No Image')}`;
        img.alt = wordObj.en;
        img.style.width = '100%';
        img.style.height = '150px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '2px solid #000';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = loadingId;
        loadingDiv.style.position = 'absolute';
        loadingDiv.style.top = '0';
        loadingDiv.style.left = '0';
        loadingDiv.style.width = '100%';
        loadingDiv.style.height = '100%';
        loadingDiv.style.display = 'none';
        loadingDiv.style.justifyContent = 'center';
        loadingDiv.style.alignItems = 'center';
        loadingDiv.style.backgroundColor = 'rgba(255,255,255,0.7)';
        loadingDiv.style.borderRadius = '8px';
        loadingDiv.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div>';
        
        imgContainer.appendChild(img);
        imgContainer.appendChild(loadingDiv);
        
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
        
        itemBox.appendChild(imgContainer);
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

function finishDynMassReview() {
    alert(`Bạn đã điền đúng ${dynMassReviewScore}/${dynMassReviewData.length} từ vựng! Cố gắng cải thiện nhé!`);
}

// ------------------- MIND MAP -------------------

let currentNetwork = null;

function renderMindMap(containerId, centerText, dataList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Destroy previous network if any
    if (currentNetwork) {
        currentNetwork.destroy();
        currentNetwork = null;
    }
    
    const nodes = [];
    const edges = [];
    
    // Center Node (Category)
    nodes.push({
        id: 'center', 
        label: centerText, 
        shape: 'box', 
        color: '#ffb74d', 
        font: { size: 24, face: 'Quicksand', color: '#000', bold: true },
        borderWidth: 3
    });
    
    // Child Nodes
    if (dataList && dataList.length > 0) {
        dataList.forEach((item, index) => {
            const nodeId = `node_${index}`;
            nodes.push({
                id: nodeId,
                label: `${item.en}\n(${item.vi})`,
                shape: 'box',
                color: '#bbdefb',
                font: { size: 16, face: 'Nunito', color: '#000' },
                borderWidth: 2,
                word_en: item.en // custom property
            });
            
            edges.push({
                from: 'center',
                to: nodeId,
                color: { color: '#9e9e9e', opacity: 0.6 },
                length: 150
            });
        });
    }
    
    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };
    
    const options = {
        interaction: { hover: true },
        physics: {
            barnesHut: { 
                gravitationalConstant: -10000, 
                centralGravity: 0.1, 
                springLength: 300,
                avoidOverlap: 1
            }
        }
    };
    
    currentNetwork = new vis.Network(container, data, options);
    
    // Add click event for pronunciation
    currentNetwork.on("click", function (params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const clickedNode = data.nodes.get(nodeId);
            if (clickedNode && clickedNode.word_en) {
                playAudio(clickedNode.word_en);
            }
        }
    });
}

function hideAllDynContainers() {
    document.getElementById('dyn-card').style.display = 'none';
    document.getElementById('dyn-mass-review-container').style.display = 'none';
    const dynWritingContainer = document.getElementById('dyn-writing-practice-container');
    if(dynWritingContainer) dynWritingContainer.style.display = 'none';
    document.getElementById('dyn-blindfold-toggle-container').style.display = 'none';
    document.getElementById('dyn-blindfold-scoreboard').style.display = 'none';
    const dynMindmapContainer = document.getElementById('dyn-mindmap-container');
    if(dynMindmapContainer) dynMindmapContainer.style.display = 'none';
}

function hideAllAnimalContainers() {
    document.getElementById('animal-card').style.display = 'none';
    document.getElementById('mass-review-container').style.display = 'none';
    const animalWritingContainer = document.getElementById('animal-writing-practice-container');
    if(animalWritingContainer) animalWritingContainer.style.display = 'none';
    document.getElementById('blindfold-toggle-container').style.display = 'none';
    document.getElementById('blindfold-scoreboard').style.display = 'none';
    const animalMindmapContainer = document.getElementById('animal-mindmap-container');
    if(animalMindmapContainer) animalMindmapContainer.style.display = 'none';
}

function hideAllVehicleContainers() {
    document.getElementById('vehicle-card').style.display = 'none';
    document.getElementById('vehicle-mass-review-container').style.display = 'none';
    document.getElementById('vehicle-blindfold-toggle-container').style.display = 'none';
    document.getElementById('vehicle-blindfold-scoreboard').style.display = 'none';
    const vehicleMindmapContainer = document.getElementById('vehicle-mindmap-container');
    if(vehicleMindmapContainer) vehicleMindmapContainer.style.display = 'none';
}

function loadDynMindMap() {
    hideAllDynContainers();
    
    const container = document.getElementById('dyn-mindmap-container');
    if(container) container.style.display = 'block';
    
    document.querySelectorAll('#vocab-dynamic .animal-btn').forEach(btn => btn.classList.remove('active'));
    try { if (event && event.target && event.target.tagName === 'BUTTON') event.target.classList.add('active'); } catch(e){}
    
    const title = (document.getElementById('dyn-page-title').textContent || "Chủ đề").replace("📚 ", "");
    if (!currentDynTopicData || currentDynTopicData.length === 0) {
        alert("Vui lòng đợi dữ liệu tải xong hoặc chọn một chủ đề trước.");
        return;
    }
    renderMindMap('dyn-mindmap-container', title, currentDynTopicData);
}

function loadAnimalMindMap() {
    hideAllAnimalContainers();
    
    const container = document.getElementById('animal-mindmap-container');
    if(container) container.style.display = 'block';
    
    document.querySelectorAll('#vocab-animal .animal-btn').forEach(btn => btn.classList.remove('active'));
    try { if (event && event.target && event.target.tagName === 'BUTTON') event.target.classList.add('active'); } catch(e){}
    
    renderMindMap('animal-mindmap-container', "🐶 Động Vật", commonAnimals);
}

function loadVehicleMindMap() {
    hideAllVehicleContainers();
    
    const container = document.getElementById('vehicle-mindmap-container');
    if(container) container.style.display = 'block';
    
    document.querySelectorAll('#vocab-vehicle .animal-btn').forEach(btn => btn.classList.remove('active'));
    renderMindMap('vehicle-mindmap-container', "🚗 Phương Tiện", commonVehicles);
}

// ==========================================
// ADVENTURE GAME LOGIC (V2)
// ==========================================
let advVocabList = [];
let currentAdvIdx = 0;
let advHearts = 5;
let advHints = 5;

// Phase 1 Variables
let advScore = 0;
let advCombo = 0;
let advLevel = 1;

// Phase 3 Variables
let advBossMode = false;
let advBossQuestions = [];
let advBossIdx = 0;
let advBossTimer = 0;
let advBossInterval = null;

function startAdventureGame() {
    showPage('game-adventure');
    
    // Prepare up to 100 words (reduce to test easily if needed, but keeping 100 as default)
    advVocabList = [...currentGameTopicData].sort(() => Math.random() - 0.5).slice(0, 100);
    
    currentAdvIdx = 0;
    advHearts = 5;
    advHints = 5;
    advScore = 0;
    advCombo = 0;
    advLevel = 1;
    advBossMode = false;
    
    // Try to load top score for display in the stats later
    
    renderAdventureStep();
}

// Level 1 -> 10 words, Level 2 -> 10 + 20 = 30 words, Level 3 -> 30 + 30 = 60 words, etc.
function getAdvLevelTarget(level) {
    if (level <= 0) return 0;
    let target = 0;
    for (let i = 1; i <= level; i++) {
        target += i * 10;
    }
    return target;
}

function showLevelComplete() {
    const container = document.getElementById('adventure-container');
    const bgm = new Audio('https://commondatastorage.googleapis.com/codeskulptor-assets/week7-button.wav'); // simple chime
    bgm.play().catch(e=>console.log(e));
    
    // Awards
    advScore += 50; 
    advHints += 1;
    advLevel += 1;
    advCombo = 0; // reset combo for new level
    
    container.innerHTML = `
        <div class="adventure-game-wrapper" style="padding: 40px; background: var(--card-bg); border-radius: 20px; border: 4px solid var(--border-color); animation: fadeIn 0.5s;">
            <h2 style="font-size: 36px; color: #ff9800; margin-bottom: 20px; text-shadow: 2px 2px 0px #000;">🌟 LEVEL ${advLevel - 1} COMPLETE!</h2>
            <div style="font-size: 24px; margin-bottom: 30px; line-height: 1.6;">
                <p style="color: #4caf50; font-weight: bold;">+50 XP Thưởng</p>
                <p style="color: #2196f3; font-weight: bold;">+1 💡 Gợi ý</p>
            </div>
            <button class="adv-btn" onclick="renderAdventureStep()" style="font-size: 24px; padding: 15px 40px;">Tiếp tục Level ${advLevel} 🚀</button>
        </div>
    `;
}

function renderAdventureStep() {
    const container = document.getElementById('adventure-container');
    
    if (advHearts <= 0) {
        container.innerHTML = `
            <div class="adventure-game-wrapper" style="padding: 40px; background: var(--card-bg); border-radius: 20px; border: 4px solid var(--border-color);">
                <h2 style="font-size: 32px; color: #f44336; margin-bottom: 20px;">💥 GAME OVER!</h2>
                <div style="font-size: 22px; margin-bottom: 30px; display: flex; flex-direction: column; gap: 10px;">
                   <span>⛔ Hết số mạng cho phép.</span>
                   <span style="color: #ff9800; font-weight: 900; font-size: 28px;">🏆 Điểm: ${advScore} XP</span>
                   <span>🚩 Tiến độ: ${currentAdvIdx}/${advVocabList.length} từ</span>
                </div>
                <button class="adv-btn" onclick="startAdventureGame()">🔄 Chơi lại từ đầu</button>
            </div>
        `;
        return;
    }

    if (currentAdvIdx >= advVocabList.length && !advBossMode) {
        // Triger Boss Quiz
        startBossQuiz();
        return;
    }

    if (advBossMode) {
        renderBossStep();
        return;
    }
    
    // Check Level Complete progressive milestones
    if (currentAdvIdx > 0 && currentAdvIdx === getAdvLevelTarget(advLevel)) {
        showLevelComplete();
        return;
    }

    const currentWord = advVocabList[currentAdvIdx];
    
    let heartsHtml = '';
    for(let i=0; i<5; i++) {
        heartsHtml += (i < advHearts) ? '❤️' : '🖤';
    }
    
    // Calculate Level Progress
    const wordsInCurrentLevel = advLevel * 10;
    const wordsCompletedInCurrentLevel = currentAdvIdx - getAdvLevelTarget(advLevel - 1);
    
    // Calculate Multiplier
    let multiplier = 1;
    let comboBadge = '';
    if (advCombo >= 5) {
        multiplier = 3;
        comboBadge = '<span style="color:#f44336; font-size:14px; background: #ffebee; border-radius: 8px; padding: 2px 5px; margin-left: 5px;">🔥 x3 Dã man</span>';
    } else if (advCombo >= 3) {
        multiplier = 2;
        comboBadge = '<span style="color:#ff9800; font-size:14px; background: #fff3e0; border-radius: 8px; padding: 2px 5px; margin-left: 5px;">🔥 x2 Tuyệt cú</span>';
    } else if (advCombo > 0) {
        comboBadge = `<span style="color:#888; font-size:14px; margin-left: 5px;">(${advCombo} liên tiếp)</span>`;
    }

    // Determine obstacle type dynamically
    // 0 = Normal Typing, 1 = Missing Letter, 2 = Multiple Choice, 3 = Item (Heart), 4 = Item (Hint)
    let obsType = 0; 
    let rand = Math.random();
    
    // Ensure the very first word is simple typing
    if (currentAdvIdx > 0) {
        if (rand < 0.05 && advHearts < 5) obsType = 3; // 5% chance Heart
        else if (rand < 0.1) obsType = 4; // 5% chance Hint
        else if (rand < 0.4) obsType = 1; // 30% chance Missing Letter
        else if (rand < 0.7) obsType = 2; // 30% chance MCQ
    }

    let inputAreaHtml = '';
    let obsContentHtml = '';
    let currentAns = currentWord.en.toLowerCase();
    
    // Set a global variable for the current answer so check function knows what to look for
    window.currentAdvAnswer = currentAns;
    window.currentAdvObsType = obsType;

    if (obsType === 3) { // HEART ITEM
        currentAns = 'heart';
        window.currentAdvAnswer = currentAns;
        obsContentHtml = `<span style="font-size: 30px; margin-bottom: 5px; animation: advWalk 0.5s infinite;">❤️</span>Nhặt (Gõ "heart")`;
        inputAreaHtml = `
            <input type="text" id="adv-answer-input" class="adv-input" placeholder="Gõ 'heart' để nhặt..." autocomplete="off" style="border-color: #f44336; box-shadow: 0 0 10px rgba(244, 67, 54, 0.4);">
            <button class="adv-btn" onclick="checkAdventureAnswer()" style="background:#f44336; color:#fff;">Nhặt ❤️</button>
        `;
    } else if (obsType === 4) { // HINT ITEM
        currentAns = 'hint';
        window.currentAdvAnswer = currentAns;
        obsContentHtml = `<span style="font-size: 30px; margin-bottom: 5px; animation: advWalk 0.5s infinite;">💡</span>Nhặt (Gõ "hint")`;
        inputAreaHtml = `
            <input type="text" id="adv-answer-input" class="adv-input" placeholder="Gõ 'hint' để nhặt..." autocomplete="off" style="border-color: #2196f3; box-shadow: 0 0 10px rgba(33, 150, 243, 0.4);">
            <button class="adv-btn" onclick="checkAdventureAnswer()" style="background:#2196f3; color:#fff;">Nhặt 💡</button>
        `;
    } else if (obsType === 1) { // MISSING LETTER
        let charArr = currentWord.en.split('');
        // Hide 1 or 2 letters depending on length
        let hideCount = Math.min(Math.floor(charArr.length / 2), 2) || 1;
        for(let i=0; i<hideCount; i++) {
            let ri = Math.floor(Math.random() * charArr.length);
            if (charArr[ri] !== " ") charArr[ri] = "_";
        }
        let missingFormatted = charArr.join(" ");
        
        obsContentHtml = `<span style="font-size: 30px; margin-bottom: 5px;">${currentWord.emoji || '💬'}</span>${currentWord.vi}`;
        inputAreaHtml = `
            <div style="font-size: 24px; font-family: monospace; font-weight: bold; margin-right: 15px;">${missingFormatted}</div>
            <input type="text" id="adv-answer-input" class="adv-input" placeholder="Điền TỪ hoàn chỉnh..." autocomplete="off">
            <button class="adv-btn" onclick="checkAdventureAnswer()">Tiến 🚀</button>
            <button class="adv-hint-btn" onclick="useAdventureHint()">💡 Hỗ trợ</button>
        `;
    } else if (obsType === 2) { // MULTIPLE CHOICE
        // Generate options
        let options = [currentWord.en];
        while (options.length < 3) {
            let randW = advVocabList[Math.floor(Math.random() * advVocabList.length)].en;
            if (!options.includes(randW)) options.push(randW);
        }
        options.sort(() => Math.random() - 0.5);
        
        obsContentHtml = `<span style="font-size: 30px; margin-bottom: 5px;">${currentWord.emoji || '💬'}</span>${currentWord.vi}`;
        inputAreaHtml = options.map(opt => `
            <button class="adv-btn" style="background:#fff; border-color:#2196f3; color:#2196f3; width:auto; padding: 10px 20px; font-size:18px;" onclick="checkAdventureMCQ('${opt.replace(/'/g, "\\'")}')">${opt}</button>
        `).join('');
        // add hint button
        inputAreaHtml += `<button class="adv-hint-btn" onclick="useAdventureHint()" style="margin-left: 10px;">💡 Hỗ trợ</button>`;
        
    } else { // NORMAL TYPING
        obsContentHtml = `<span style="font-size: 30px; margin-bottom: 5px;">${currentWord.emoji || '💬'}</span>${currentWord.vi}`;
        inputAreaHtml = `
            <input type="text" id="adv-answer-input" class="adv-input" placeholder="Gõ tiếng Anh..." autocomplete="off">
            <button class="adv-btn" onclick="checkAdventureAnswer()">Tiến 🚀</button>
            <button class="adv-hint-btn" onclick="useAdventureHint()">💡 Hỗ trợ</button>
        `;
    }

    // Dynamic speeds based on level
    const roadSpeed = Math.max(0.4, 1.0 - (advLevel * 0.15)); // 1s -> 0.85s -> 0.7s
    const charSpeed = Math.max(0.3, 0.5 - (advLevel * 0.05)); // 0.5s -> 0.45s 

    container.innerHTML = `
        <div class="adventure-game-wrapper">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-weight: 900; font-size: 24px; color: #ff9800; text-shadow: 1px 1px 0px #000;">⭐ ${advScore} XP ${comboBadge}</div>
                <div style="font-weight: bold; font-size: 18px; color: #555; background: #fff; padding: 5px 15px; border-radius: 20px; border: 2px solid #000;">Level ${advLevel}</div>
            </div>
            <div class="adventure-stats" style="margin-bottom: 10px;">
                <div class="adv-hearts">${heartsHtml}</div>
                <div class="adv-hints">💡 ${advHints} Gợi ý</div>
                <div class="adv-progress" title="Tiến độ Level ${advLevel}">🚩 ${wordsCompletedInCurrentLevel}/${wordsInCurrentLevel}</div>
            </div>
            
            <div class="adv-viewport">
                <div class="adv-ground moving" id="adv-ground" style="animation-duration: ${roadSpeed}s;"></div>
                <!-- Character -->
                <div class="adv-char walking" id="adv-char" style="animation-duration: ${charSpeed}s;">🏃</div>
                
                <!-- Obstacle -->
                <div class="adv-obstacle approaching" id="adv-obstacle" style="border-color: ${obsType === 3 ? '#f44336' : (obsType === 4 ? '#2196f3' : 'var(--border-color)')}">
                    ${obsContentHtml}
                </div>
            </div>
            
            <div class="adv-input-area">
                ${inputAreaHtml}
            </div>
        </div>
    `;

    // Focus input automatically
    setTimeout(() => {
        const input = document.getElementById('adv-answer-input');
        if (input) {
            input.focus();
            input.addEventListener('keyup', (e) => {
                if(e.key === 'Enter') checkAdventureAnswer();
            });
            input.addEventListener('input', (e) => {
                // Auto-forward if user types correct word
                if(input.value.trim().toLowerCase() === window.currentAdvAnswer) {
                    checkAdventureAnswer();
                }
            });
        }
    }, 100);
}

function checkAdventureMCQ(selectedAns) {
    const inputSim = { value: selectedAns };
    _processAdventureAnswer(inputSim, selectedAns.toLowerCase());
}

function checkAdventureAnswer() {
    const input = document.getElementById('adv-answer-input');
    if(!input || input.disabled) return;
    _processAdventureAnswer(input, input.value.trim().toLowerCase());
}

function useAdventureHint() {
    if (advHints <= 0) {
        alert("Bạn đã hết Gợi ý (💡) rồi!");
        return;
    }
    
    // ObsType: 1 = Missing Letter, 2 = MCQ, 0 = Normal Typing
    if (window.currentAdvObsType === 3 || window.currentAdvObsType === 4) {
        alert("Đây là vật phẩm, không cần gợi ý đâu! Cứ gõ tên vật phẩm bằng tiếng Anh.");
        return;
    }
    
    advHints--;
    const hintsDisplay = document.querySelector('.adv-hints');
    if (hintsDisplay) {
        hintsDisplay.innerText = `💡 ${advHints} Gợi ý`;
    }
    
    const correctAns = window.currentAdvAnswer;
    
    if (window.currentAdvObsType === 2) {
        // Multiple Choice: find one incorrect button and disable it
        const buttons = Array.from(document.querySelectorAll('.adv-input-area .adv-btn'));
        const incorrectButtons = buttons.filter(b => b.innerText.toLowerCase() !== correctAns && !b.disabled);
        if (incorrectButtons.length > 0) {
            // Pick a random incorrect button to disable
            const btnToDisable = incorrectButtons[Math.floor(Math.random() * incorrectButtons.length)];
            btnToDisable.disabled = true;
            btnToDisable.style.opacity = '0.3';
            btnToDisable.style.textDecoration = 'line-through';
        }
    } else {
        // Typing or Missing Letter: Type out the full word for the user and auto-submit
        const input = document.getElementById('adv-answer-input');
        if (input && !input.disabled) {
            input.value = correctAns;
            checkAdventureAnswer(); // Auto-forward
        }
    }
}

function _processAdventureAnswer(inputObj, ans) {
    const correctAns = window.currentAdvAnswer;
    const isItem = (window.currentAdvObsType === 3 || window.currentAdvObsType === 4);
    
    const charEl = document.getElementById('adv-char');
    const obsEl = document.getElementById('adv-obstacle');
    
    // Allow item skip by answering correct english word anyway
    const actualWordEn = advVocabList[currentAdvIdx].en.toLowerCase();
    
    if (ans === correctAns || (isItem && ans === actualWordEn)) {
        // Correct 
        if(!isItem) playAudio(actualWordEn);
        
        if (isItem) {
             if (window.currentAdvObsType === 3) advHearts = Math.min(5, advHearts + 1);
             if (window.currentAdvObsType === 4) advHints++;
             
             // No Combo or XP for picking up items, just effects
             const effectFloat = document.createElement('div');
             effectFloat.innerText = window.currentAdvObsType === 3 ? "+1 ❤️" : "+1 💡";
             effectFloat.style.position = 'absolute';
             effectFloat.style.color = window.currentAdvObsType === 3 ? '#f44336' : '#2196f3';
             effectFloat.style.fontWeight = 'bold';
             effectFloat.style.fontSize = '30px';
             effectFloat.style.left = '160px'; 
             effectFloat.style.bottom = '150px';
             effectFloat.style.animation = 'floatUp 1s forwards ease-out';
             effectFloat.style.zIndex = '20';
             document.querySelector('.adv-viewport').appendChild(effectFloat);
             
         }
         
         // Trigger Jump Animation
        charEl.classList.remove('walking');
        charEl.classList.add('jumping');
        obsEl.classList.replace('approaching', 'cleared');
        if(inputObj.tagName === 'INPUT') inputObj.disabled = true;
        else {
             // Disable all buttons if MCQ
             document.querySelectorAll('.adv-input-area .adv-btn').forEach(b => b.disabled = true);
        }
        
        setTimeout(() => {
            currentAdvIdx++;
            renderAdventureStep();
        }, 800); // Wait for jump animation
        
    } else {
        // Incorrect
        advHearts--;
        advCombo = 0; // Break combo
        if(inputObj.tagName === 'INPUT') {
            inputObj.classList.add('adv-shake');
            inputObj.style.borderColor = '#f44336';
            
            setTimeout(() => {
                inputObj.classList.remove('adv-shake');
                inputObj.style.borderColor = 'var(--border-color)';
                if (advHearts <= 0) {
                    renderAdventureStep(); // trigger game over
                } else {
                    inputObj.value = '';
                    inputObj.focus();
                    renderAdventureStep(); // Re-render to show lost heart instantly
                }
            }, 400);
        } else {
            // MCQ incorrect visual feedback
            inputObj.style.backgroundColor = '#f44336';
            inputObj.style.color = '#fff';
            inputObj.style.borderColor = '#b71c1c';
            inputObj.classList.add('adv-shake');
            setTimeout(() => {
                if (advHearts <= 0) renderAdventureStep();
                else renderAdventureStep(); // Refresh hearts immediately
            }, 400);
        }
    }
}

// ==========================================
// BOSS QUIZ LOGIC
// ==========================================
function startBossQuiz() {
    advBossMode = true;
    advBossIdx = 0;
    advHearts = 3; // Reset to 3 hearts for boss
    advBossQuestions = [...advVocabList].sort(() => Math.random() - 0.5).slice(0, 10);
    advBossTimer = 30; // 30 seconds for boss
    
    clearInterval(advBossInterval);
    advBossInterval = setInterval(() => {
        advBossTimer--;
        const timerEl = document.getElementById('adv-boss-timer');
        if(timerEl) timerEl.innerText = advBossTimer + "s";
        
        if(advBossTimer <= 0) {
            clearInterval(advBossInterval);
            advHearts = 0;
            renderAdventureStep(); // handles game over
        }
    }, 1000);
    
    renderBossStep();
}

function renderBossStep() {
    const container = document.getElementById('adventure-container');
    
    if (advBossIdx >= advBossQuestions.length) {
        clearInterval(advBossInterval);
        saveAdventureScore(currentGameTopicId, advScore + (advHearts * 100) + (advBossTimer * 10)); // Time bonus!
        
        container.innerHTML = `
            <div class="adventure-game-wrapper" style="padding: 40px; background: var(--card-bg); border-radius: 20px; border: 4px solid var(--border-color); animation: fadeIn 0.5s;">
                <h2 style="font-size: 48px; color: #4caf50; margin-bottom: 20px; text-shadow: 2px 2px 0px #000;">🏆 VICTORY!</h2>
                <div style="font-size: 24px; margin-bottom: 30px; line-height: 1.6;">
                    <p style="font-size: 36px; padding: 15px; background: #fff3e0; border-radius: 12px; color: #ff9800; font-weight: 900; border: 3px solid #ffb74d;">🥇 Điểm của bạn: ${advScore}</p>
                    <p>Phần thưởng chặn đường: +${advHearts * 100} (Máu)</p>
                    <p>Phần thưởng thời gian: +${advBossTimer * 10} (Tốc độ)</p>
                </div>
                <button class="adv-btn" onclick="startAdventureGame()" style="font-size: 24px; padding: 15px 40px;">🔄 Chơi lại</button>
            </div>
        `;
        return;
    }
    
    const currentWord = advBossQuestions[advBossIdx];
    window.currentAdvAnswer = currentWord.en.toLowerCase();
    
    let heartsHtml = '';
    for(let i=0; i<3; i++) {
        heartsHtml += (i < advHearts) ? '❤️' : '🖤';
    }
    
    container.innerHTML = `
        <div class="adventure-game-wrapper">
            <h2 style="font-size: 40px; color: #f44336; text-shadow: 2px 2px 0px #000; animation: advShake 1s infinite alternate;">🔥 BOSS QUIZ 🔥</h2>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="font-weight: 900; font-size: 24px; color: #4caf50; border: 3px solid #000; padding: 5px 15px; border-radius: 10px; background: #e8f5e9;">${heartsHtml}</div>
                <div style="font-weight: 900; font-size: 30px; color: #f44336; border: 3px solid #000; padding: 5px 15px; border-radius: 10px; background: #ffebee;">⏳ <span id="adv-boss-timer">${advBossTimer}s</span></div>
                <div style="font-weight: bold; font-size: 24px; color: #fff; background: #1f1f1f; padding: 5px 15px; border-radius: 10px; border: 3px solid #555;">${advBossIdx + 1}/10</div>
            </div>
            
            <div style="background: var(--card-bg); border: 4px solid #f44336; border-radius: 16px; padding: 40px 20px; font-size: 32px; font-weight: 900; margin-bottom: 30px; box-shadow: 6px 6px 0 #b71c1c;">
               ${currentWord.emoji || '💬'} ${currentWord.vi}
            </div>
            
            <div class="adv-input-area">
                <input type="text" id="adv-answer-input" class="adv-input" placeholder="Gõ tiếng Anh nhanh lên!..." autocomplete="off" style="border-color: #f44336;">
                <button class="adv-btn" onclick="checkBossAnswer()" style="background: #f44336; color: #fff;">Chém ⚔️</button>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const input = document.getElementById('adv-answer-input');
        if (input) {
            input.focus();
            input.addEventListener('keyup', (e) => {
                if(e.key === 'Enter') checkBossAnswer();
            });
        }
    }, 100);
}

function checkBossAnswer() {
    const input = document.getElementById('adv-answer-input');
    if(!input || input.disabled) return;
        
    const ans = input.value.trim().toLowerCase();
    const correctAns = window.currentAdvAnswer;
    
    if (ans === correctAns) {
        playAudio(correctAns);
        
        advScore += 50; // Boss kill bonus
        
        input.disabled = true;
        input.style.backgroundColor = '#a5d6a7';
        
        setTimeout(() => {
            advBossIdx++;
            renderBossStep();
        }, 500);
    } else {
        advHearts--;
        input.classList.add('adv-shake');
        input.style.borderColor = '#b71c1c';
        
        setTimeout(() => {
            input.classList.remove('adv-shake');
            if (advHearts <= 0) {
                renderAdventureStep(); // Game Over
            } else {
                input.value = '';
                input.focus();
                renderBossStep();
            }
        }, 400);
    }
}

// ==========================================
// LEADERBOARD LOGIC
// ==========================================
function saveAdventureScore(topicId, score) {
    const key = `adv_score_${topicId}`;
    const scores = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Prompt for name (simple way)
    let playerName = prompt("Lưu bảng xếp hạng! Tên của bạn là gì?", "Guest");
    if (!playerName) playerName = "Người Chơi Ẩn Danh";
    
    scores.push({ name: playerName, score: score });
    // Sort descending
    scores.sort((a,b) => b.score - a.score);
    // Keep top 10
    const top10 = scores.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(top10));
}

function showLeaderboard(topicId) {
     const key = `adv_score_${topicId}`;
     const scores = JSON.parse(localStorage.getItem(key) || '[]');
     
     let modalHtml = `<div style="text-align: center;">`;
     modalHtml += `<h3 style="margin-top:0; color:#ff9800; font-size: 28px;">🏆 BẢNG XẾP HẠNG</h3>`;
     
     if (scores.length === 0) {
         modalHtml += `<p>Chưa có ai chinh phục chủ đề này cả!</p>`;
     } else {
         modalHtml += `<table style="width: 100%; text-align: left; border-collapse: collapse; margin-top: 15px;">`;
         modalHtml += `<tr style="border-bottom: 2px solid #ddd; font-weight: bold;"><th style="padding: 10px;">Hạng</th><th>Tên</th><th>Điểm XP</th></tr>`;
         scores.forEach((entry, idx) => {
             let medal = (idx === 0) ? '🥇 ' : (idx === 1) ? '🥈 ' : (idx === 2) ? '🥉 ' : `#${idx+1} `;
             modalHtml += `<tr><td style="padding: 10px; font-weight: bold; color: #ff9800;">${medal}</td><td style="padding: 10px; font-weight: bold;">${entry.name}</td><td style="padding: 10px; color: #4caf50; font-weight: bold;">${entry.score}</td></tr>`;
         });
         modalHtml += `</table>`;
     }
     
     modalHtml += `</div>`;
     
     // Simplest way to show without creating full new modal logic is replacing overlay content temporarily
     const overlayContent = document.querySelector('#game-topic-selector .topic-overlay-content');
     if (!overlayContent.dataset.originalHTML) {
         overlayContent.dataset.originalHTML = overlayContent.innerHTML;
     }
     
     overlayContent.innerHTML = `
        <button class="close-overlay-btn" onclick="restoreTopicOverlay()">✖</button>
        ${modalHtml}
        <button class="vocab-audio-btn" style="width: 100%; margin-top: 20px;" onclick="restoreTopicOverlay()">Quay lại Chọn Chủ Đề</button>
     `;
}

// ------------------- CORS PROXY HELPER -------------------
async function fetchWithProxy(targetUrl) {
    // Ordered by current reliability and speed
    const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
    ];

    for (let proxy of proxies) {
        try {
            const controller = new AbortController();
            // Reduce timeout to 4 seconds so it fails over faster
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            
            const res = await fetch(proxy, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) continue;

            let text;
            if (proxy.includes('allorigins.win')) {
                const data = await res.json();
                text = data.contents;
            } else {
                text = await res.text();
            }

            if (text && text.includes('<rss')) {
                return text; // Valid XML
            }
        } catch (e) {
            console.warn("Proxy failed:", proxy, e);
        }
    }
    throw new Error("All CORS proxies failed.");
}

// ------------------- NEWS READING API -------------------
async function refreshEnglishNews() {
    localStorage.removeItem('cached_news_html');
    await fetchEnglishNews();
}

async function fetchEnglishNews() {
    const container = document.getElementById('news-feed-container');
    const loading = document.getElementById('news-loading');
    
    if (container.children.length > 0 && container.innerHTML.trim() !== "") return; // Already loaded via clicking

    const cachedHtml = localStorage.getItem('cached_news_html');
    if (cachedHtml) {
        loading.style.display = 'none';
        container.innerHTML = cachedHtml;
        return;
    }

    // Only show loading if cache is empty
    container.innerHTML = '';
    loading.style.display = 'block';
    loading.innerHTML = '⏳ Đang tải tin tức mới nhất...';

    // We use a free CORS proxy converting The Guardian RSS
    const rssUrl = "https://www.theguardian.com/international/rss";
    
    try {
        const rawXml = await fetchWithProxy(rssUrl);
        
        // Parse the raw XML contents
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rawXml, "text/xml");
        
        const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 12);
        
        let html = "";
        items.forEach(item => {
            const title = item.querySelector("title")?.textContent || "No Title";
            const pubDate = item.querySelector("pubDate")?.textContent || new Date().toISOString();
            const link = item.querySelector("link")?.textContent || "#";
            const rawDesc = item.querySelector("description")?.textContent || "";
            
            let thumbnail = "https://via.placeholder.com/300x160/2196f3/ffffff?text=News";
            // Guardian puts <media:content url="..."> inside item
            const mediaNodes = item.getElementsByTagName("media:content");
            if(mediaNodes && mediaNodes.length > 0) {
                const urlAttr = mediaNodes[0].getAttribute("url");
                if (urlAttr) thumbnail = urlAttr;
            } else if (rawDesc.includes("<img")) {
                const imgMatch = rawDesc.match(/src="([^"]+)"/);
                if(imgMatch) thumbnail = imgMatch[1];
            }
            
            // Clean description
            const tmpElement = document.createElement("div");
            tmpElement.innerHTML = rawDesc;
            const plainDesc = tmpElement.textContent || tmpElement.innerText || "";
            
            // Generate Card
            html += `
                <div class="news-card" onclick="openNewsModal('${encodeURIComponent(title)}', '${encodeURIComponent(pubDate)}', '${encodeURIComponent(plainDesc)}', '${encodeURIComponent(link)}')" style="background: #fff; border: 3px solid #000; border-radius: 12px; overflow: hidden; box-shadow: 4px 4px 0px #000; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <div style="height: 160px; background-image: url('${thumbnail}'); background-size: cover; background-position: center; border-bottom: 3px solid #000;"></div>
                    <div style="padding: 15px;">
                        <div style="font-size: 12px; color: #666; font-family: 'Nunito'; margin-bottom: 5px; font-weight: bold;">📅 ${new Date(pubDate).toLocaleDateString()}</div>
                        <h3 style="font-family: 'Quicksand'; font-size: 18px; color: #1f1f1f; margin: 0 0 10px 0; line-height: 1.3;">${title}</h3>
                        <p style="font-family: 'Nunito'; font-size: 14px; color: #444; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${plainDesc}</p>
                    </div>
                </div>
            `;
        });
        
        loading.style.display = 'none';
        container.innerHTML = html;
        localStorage.setItem('cached_news_html', html);
        
    } catch (err) {
        console.error("News API Error:", err);
        loading.innerHTML = "❌ Quá tải băng thông hoặc kết nối bị gián đoạn. Bạn thử lại nha!";
    }
}

// Open News Article in Modal
function openNewsModal(encodedTitle, encodedDate, encodedDesc, encodedLink) {
    const title = decodeURIComponent(encodedTitle);
    const date = decodeURIComponent(encodedDate);
    const desc = decodeURIComponent(encodedDesc);
    const link = decodeURIComponent(encodedLink);
    
    document.getElementById('news-modal-title').innerText = title;
    document.getElementById('news-modal-date').innerText = "📅 " + new Date(date).toLocaleDateString();
    
    const contentBox = document.getElementById('news-modal-content');
    
    // Guardian / RSS desc often contains full HTML or summaries. We render it safely.
    // If it's too short, we can also provide an iframe to the actual site (some sites block it, but Guardian usually allows or degrades gracefully)
    contentBox.innerHTML = `
        <div id="news-summary-box" style="margin-bottom: 20px; font-size: 18px; font-weight: bold; padding: 15px; background: #f5f5f5; border-left: 5px solid #ff9800; border-radius: 4px;">
            ${desc}
        </div>
        <div style="text-align: center; margin: 20px 0; color: #666; font-style: italic;">
            -- Kéo xuống để tải trang báo gốc (Nội dung tiếng Anh) --
        </div>
        <iframe src="${link}" style="width: 100%; height: 60vh; border: 2px solid #ddd; border-radius: 8px;"></iframe>
    `;
    
    // Attach Highlighting tool to the summary box
    const summaryBox = document.getElementById('news-summary-box');
    summaryBox.addEventListener('mouseup', highlightSelection);
    
    document.getElementById('news-modal-link').href = link;
    
    // Bind Save Button event
    const saveBtn = document.getElementById('save-news-btn');
    saveBtn.onclick = () => saveNewsArticle(title, date, desc, link);
    
    // Check if already saved
    const saved = JSON.parse(localStorage.getItem('saved_news') || '[]');
    const isSaved = saved.some(item => item.link === link);
    if(isSaved) {
        saveBtn.innerText = "❤️ Đã lưu";
        saveBtn.style.background = "#ffcdd2";
    } else {
        saveBtn.innerText = "🤍 Lưu bài viết";
        saveBtn.style.background = "#ffebee";
    }

    document.getElementById('news-modal').style.display = 'flex';
}

function closeNewsModal() {
    document.getElementById('news-modal').style.display = 'none';
    document.getElementById('news-modal-content').innerHTML = ''; // Clear iframe to stop audio/video
}

// Save News to LocalStorage
function saveNewsArticle(title, date, desc, link) {
    let saved = JSON.parse(localStorage.getItem('saved_news') || '[]');
    const isSaved = saved.some(item => item.link === link);
    const saveBtn = document.getElementById('save-news-btn');

    if (isSaved) {
        // Remove it
        saved = saved.filter(item => item.link !== link);
        saveBtn.innerText = "🤍 Lưu bài viết";
        saveBtn.style.background = "#ffebee";
        alert("Đã bỏ lưu bài viết.");
    } else {
        // Save it
        saved.push({ title, date, desc, link });
        saveBtn.innerText = "❤️ Đã lưu";
        saveBtn.style.background = "#ffcdd2";
        alert("Đã lưu bài viết thành công!");
    }
    localStorage.setItem('saved_news', JSON.stringify(saved));
    
    // Auto-refresh the saved view if we are currently looking at it
    if (document.getElementById('news-page-mode') === 'saved') {
        showSavedNews();
    }
}

// Show Saved News Page
function showSavedNews() {
    const container = document.getElementById('news-feed-container');
    const loading = document.getElementById('news-loading');
    
    loading.style.display = 'none';
    
    const saved = JSON.parse(localStorage.getItem('saved_news') || '[]');
    
    if (saved.length === 0) {
         container.innerHTML = `<div style="text-align: center; grid-column: 1 / -1; margin-top: 50px; font-family: 'Quicksand'; font-size: 20px; color: #666;">Chưa có bài viết nào được lưu! 😢</div>`;
         return;
    }
    
    let html = "";
    saved.forEach(item => {
        // We don't save thumbnails to save space, use a placeholder
        let thumbnail = "https://via.placeholder.com/300x160/ffccbc/000000?text=Saved+Article";
        html += `
            <div class="news-card" onclick="openNewsModal('${encodeURIComponent(item.title)}', '${encodeURIComponent(item.date)}', '${encodeURIComponent(item.desc)}', '${encodeURIComponent(item.link)}')" style="background: #fff; border: 3px solid #000; border-radius: 12px; overflow: hidden; box-shadow: 4px 4px 0px #000; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="height: 160px; background-image: url('${thumbnail}'); background-size: cover; background-position: center; border-bottom: 3px solid #000;"></div>
                <div style="padding: 15px;">
                    <div style="font-size: 12px; color: #666; font-family: 'Nunito'; margin-bottom: 5px; font-weight: bold;">📅 ${new Date(item.date).toLocaleDateString()}</div>
                    <h3 style="font-family: 'Quicksand'; font-size: 18px; color: #1f1f1f; margin: 0 0 10px 0; line-height: 1.3;">${item.title}</h3>
                    <p style="font-family: 'Nunito'; font-size: 14px; color: #444; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${item.desc}</p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Summary Highlighting Feature
function highlightSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    const summaryBox = document.getElementById('news-summary-box');
    
    // Ensure selection is inside summary box
    if (!summaryBox.contains(range.commonAncestorContainer)) return;
    
    // Check if the selection length is reasonable
    const text = selection.toString().trim();
    if (text.length === 0) return;

    // Create a temporary highlight button floating near cursor
    let btn = document.getElementById('temp-highlight-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'temp-highlight-btn';
        btn.innerHTML = '🖍️ Tô Đậm';
        btn.style.position = 'absolute';
        btn.style.zIndex = '10001';
        btn.style.background = '#ffd54f';
        btn.style.border = '2px solid #ffb300';
        btn.style.borderRadius = '5px';
        btn.style.padding = '5px 10px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '2px 2px 0px rgba(0,0,0,0.2)';
        btn.style.fontWeight = 'bold';
        document.body.appendChild(btn);
    }
    
    const rect = range.getBoundingClientRect();
    btn.style.top = `${rect.top + window.scrollY - 40}px`;
    btn.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 40}px`;
    btn.style.display = 'block';
    
    // Handle click
    btn.onclick = function() {
        try {
            const mark = document.createElement('mark');
            mark.style.backgroundColor = '#ffeb3b';
            mark.style.color = '#000';
            mark.style.padding = '0 2px';
            mark.style.borderRadius = '3px';
            range.surroundContents(mark);
        } catch (e) {
            console.warn("Could not highlight across HTML elements safely.", e);
        }
        selection.removeAllRanges();
        btn.style.display = 'none';
        
        // Also play pronunciation if it's a single word/short phrase
        if (text.length < 20 && text.split(' ').length <= 3) {
            playAudio(text);
        }
    };
    
    // Hide if clicked elsewhere
    setTimeout(() => {
        document.addEventListener('mousedown', function hideBtn(e) {
            if (e.target.id !== 'temp-highlight-btn') {
                if (btn) btn.style.display = 'none';
                document.removeEventListener('mousedown', hideBtn);
            }
        });
    }, 100);
}

// ==========================================
// PODCAST API (RSS to JSON)
// ==========================================

async function refreshPodcasts(rssUrl) {
    if (!rssUrl) return;
    const cacheKey = 'cached_podcast_' + rssUrl;
    localStorage.removeItem(cacheKey);
    await fetchPodcasts(rssUrl);
}

async function fetchPodcasts(rssUrl) {
    const container = document.getElementById('podcast-feed-container');
    const loading = document.getElementById('podcast-loading');
    const cacheKey = 'cached_podcast_' + rssUrl;

    const cachedHtml = localStorage.getItem(cacheKey);
    if (cachedHtml) {
        loading.style.display = 'none';
        container.innerHTML = cachedHtml;
        return;
    }
    
    // Only show loading if cache is empty
    container.innerHTML = '';
    loading.style.display = 'block';
    loading.innerHTML = '⏳ Đang tải danh sách Podcast...';
    
    // Instead of rss2json (which rate limits easily), use a CORS proxy to get raw XML
    try {
        const rawXml = await fetchWithProxy(rssUrl);
        
        // Parse the raw XML contents
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rawXml, "text/xml");
        
        // Get generic channel image if available
        let channelImage = "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=300&h=300";
        const imgNode = xmlDoc.querySelector("channel > image > url") || xmlDoc.querySelector("channel > itunes\\:image, image");
        if (imgNode) {
            channelImage = imgNode.textContent || imgNode.getAttribute('href') || channelImage;
        }

        const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 15);
        
        let html = "";
        items.forEach(item => {
            const title = item.querySelector("title")?.textContent || "No Title";
            const pubDate = item.querySelector("pubDate")?.textContent || new Date().toISOString();
            const link = item.querySelector("link")?.textContent || "#";
            
            // Handle audio enclosure
            const enclosure = item.querySelector("enclosure");
            const audioUrl = enclosure ? enclosure.getAttribute("url") : "";
            
            // Try to get specific episode image
            const itunesImage = item.querySelector("itunes\\:image, image");
            const thumbnail = itunesImage ? (itunesImage.getAttribute("href") || itunesImage.textContent) : channelImage;
            
            // Clean description
            const rawDesc = item.querySelector("description")?.textContent || "";
            const tmpElement = document.createElement("div");
            tmpElement.innerHTML = rawDesc;
            const plainDesc = tmpElement.textContent || tmpElement.innerText || "";
            
            if (audioUrl) {
                html += `
                    <div style="background: #fff; border: 3px solid #000; border-radius: 12px; overflow: hidden; box-shadow: 4px 4px 0px #000; display: flex; flex-direction: column; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; flex-direction: row; padding: 15px;">
                            <img src="${thumbnail}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #000; margin-right: 15px; flex-shrink: 0;" onerror="this.src='https://via.placeholder.com/100x100?text=🎙️'">
                            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                                <div style="font-size: 12px; color: #666; font-family: 'Nunito'; margin-bottom: 5px; font-weight: bold;">📅 ${new Date(pubDate).toLocaleDateString()}</div>
                                <h3 style="font-family: 'Quicksand'; font-size: 18px; color: #1f1f1f; margin: 0 0 8px 0; line-height: 1.3;">${title}</h3>
                                <p style="font-family: 'Nunito'; font-size: 14px; color: #444; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${plainDesc}</p>
                            </div>
                        </div>
                        <div style="background: #f5f5f5; padding: 10px 15px; border-top: 2px solid #eee; display: flex; align-items: center; justify-content: space-between;">
                            <audio controls style="height: 40px; width: 100%; max-width: 400px; outline: none;">
                                <source src="${audioUrl}" type="audio/mpeg">
                                Trình duyệt của bạn không hỗ trợ thẻ audio.
                            </audio>
                            <a href="${link}" target="_blank" style="margin-left: 15px; font-family: 'Nunito'; font-weight: bold; color: #1976d2; text-decoration: none; font-size: 14px;">📄 Nguồn</a>
                        </div>
                    </div>
                `;
            }
        });
        
        loading.style.display = 'none';
        
        if (html === "") {
             container.innerHTML = `<div style="text-align: center; margin-top: 20px; font-family: 'Quicksand'; font-size: 18px; color: #d32f2f;">Kênh này hiện không có file nghe phù hợp. Vui lòng chọn kênh khác!</div>`;
        } else {
             container.innerHTML = html;
             localStorage.setItem(cacheKey, html);
        }
        
    } catch (err) {
        console.error("Podcast API Error:", err);
        loading.innerHTML = "❌ Quá tải băng thông hoặc lỗi kết nối. Bạn hãy đợi vài giây rồi thử lại tải kênh nhé!";
    }
}

// ------------------- NGỮ PHÁP (GRAMMAR) FEATURE -------------------
const grammarData = {
    tenses: `
        <h2 style="font-family: 'Quicksand'; margin-top: 0; padding-bottom: 10px; border-bottom: 2px solid #eee; color: #1976d2;">⏳ Tổng hợp 12 Thì Trong Tiếng Anh</h2>
        <p style="text-align: center; color: #555; font-style: italic;">Hệ thống trọn bộ 12 thì từ cơ bản đến nâng cao để nắm vững mọi bối cảnh thời gian.</p>

        <!-- HIỆN TẠI -->
        <h3 style="color: #2e7d32; background: #e8f5e9; padding: 5px 10px; border-radius: 5px;">I. Nhóm Thì Hiện Tại (Present Tenses)</h3>
        
        <h4 style="color: #388e3c; margin-bottom: 5px;">1. Hiện Tại Đơn (Present Simple)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Diễn tả thói quen, chân lý, sự thật hiển nhiên hoặc lịch trình cố định.</p>
        <div style="background: #f1f8e9; padding: 10px; border-radius: 8px; border-left: 4px solid #4caf50; font-family: 'monospace'; font-size: 15px;">(+) S + V(s/es) + O<br>(-) S + do/does + not + V<br>(?) Do/Does + S + V?</div>
        <p><em>Dấu hiệu:</em> always, usually, often, sometimes, never, every day...<br><em>Ví dụ:</em> He <strong>eats</strong> apples every day. (Anh ấy ăn táo mỗi ngày.)</p>

        <h4 style="color: #388e3c; margin-bottom: 5px;">2. Hiện Tại Tiếp Diễn (Present Continuous)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Diễn tả hành động đang xảy ra ngay lúc nói hoặc xung quanh thời điểm nói.</p>
        <div style="background: #f1f8e9; padding: 10px; border-radius: 8px; border-left: 4px solid #4caf50; font-family: 'monospace'; font-size: 15px;">(+) S + am/is/are + V-ing<br>(-) S + am/is/are + not + V-ing<br>(?) Am/Is/Are + S + V-ing?</div>
        <p><em>Dấu hiệu:</em> now, right now, at the moment, at present, Look!, Listen!...<br><em>Ví dụ:</em> It <strong>is raining</strong> heavily outside now. (Bây giờ trời đang mưa to.)</p>

        <h4 style="color: #388e3c; margin-bottom: 5px;">3. Hiện Tại Hoàn Thành (Present Perfect)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Hành động đã xảy ra trong quá khứ nhưng kết quả còn lưu lại ở hiện tại, hoặc một trải nghiệm.</p>
        <div style="background: #f1f8e9; padding: 10px; border-radius: 8px; border-left: 4px solid #4caf50; font-family: 'monospace'; font-size: 15px;">(+) S + have/has + V3/ed<br>(-) S + have/has + not + V3/ed<br>(?) Have/Has + S + V3/ed?</div>
        <p><em>Dấu hiệu:</em> just, recently, lately, already, yet, since, for, ever, never...<br><em>Ví dụ:</em> She <strong>has cooked</strong> diner. (Cô ấy vừa nấu xong bữa tối.)</p>

        <h4 style="color: #388e3c; margin-bottom: 5px;">4. Hiện Tại Hoàn Thành Tiếp Diễn (Present Perfect Continuous)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Nhấn mạnh "khoảng thời gian / tính liên tục" của một hành động bắt đầu từ quá khứ và kéo dài đến hiện tại.</p>
        <div style="background: #f1f8e9; padding: 10px; border-radius: 8px; border-left: 4px solid #4caf50; font-family: 'monospace'; font-size: 15px;">(+) S + have/has + been + V-ing<br>(-) S + have/has + not + been + V-ing<br>(?) Have/Has + S + been + V-ing?</div>
        <p><em>Dấu hiệu:</em> all day, all week, since, for, for a long time...<br><em>Ví dụ:</em> I <strong>have been waiting</strong> for you for 2 hours. (Tôi đã chờ bạn liên tục suốt 2 tiếng rồi.)</p>

        <!-- QUÁ KHỨ -->
        <h3 style="color: #d84315; background: #fbe9e7; padding: 5px 10px; border-radius: 5px; margin-top: 30px;">II. Nhóm Thì Quá Khứ (Past Tenses)</h3>

        <h4 style="color: #e64a19; margin-bottom: 5px;">5. Quá Khứ Đơn (Past Simple)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Diễn tả hành động đã xảy ra và chấm dứt hoàn toàn trong quá khứ.</p>
        <div style="background: #fbe9e7; padding: 10px; border-radius: 8px; border-left: 4px solid #ff5722; font-family: 'monospace'; font-size: 15px;">(+) S + V2/ed<br>(-) S + did + not (didn't) + V<br>(?) Did + S + V?</div>
        <p><em>Dấu hiệu:</em> yesterday, last (week, year...), ago, in + năm quá khứ...<br><em>Ví dụ:</em> They <strong>visited</strong> the museum yesterday. (Họ đã thăm bảo tàng hôm qua.)</p>

        <h4 style="color: #e64a19; margin-bottom: 5px;">6. Quá Khứ Tiếp Diễn (Past Continuous)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Diễn tả hành động đang xảy ra tại một thời điểm xác định trong quá khứ.</p>
        <div style="background: #fbe9e7; padding: 10px; border-radius: 8px; border-left: 4px solid #ff5722; font-family: 'monospace'; font-size: 15px;">(+) S + was/were + V-ing<br>(-) S + was/were + not + V-ing<br>(?) Was/Were + S + V-ing?</div>
        <p><em>Dấu hiệu:</em> at this time yesterday, at 8 PM last night, when, while...<br><em>Ví dụ:</em> I <strong>was watching</strong> TV at 8 PM last night. (Lúc 8h tối qua tôi đang xem TV.)</p>

        <h4 style="color: #e64a19; margin-bottom: 5px;">7. Quá Khứ Hoàn Thành (Past Perfect)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Diễn tả một hành động đã xảy ra và hoàn thành "trước" một hành động/thời điểm khác trong quá khứ.</p>
        <div style="background: #fbe9e7; padding: 10px; border-radius: 8px; border-left: 4px solid #ff5722; font-family: 'monospace'; font-size: 15px;">(+) S + had + V3/ed<br>(-) S + had + not + V3/ed<br>(?) Had + S + V3/ed?</div>
        <p><em>Dấu hiệu:</em> by the time, before, after, prior to...<br><em>Ví dụ:</em> When I arrived, the train <strong>had left</strong>. (Khi tôi tới, tàu đã rời đi từ trước rồi.)</p>

        <h4 style="color: #e64a19; margin-bottom: 5px;">8. Quá Khứ Hoàn Thành Tiếp Diễn (Past Perfect Continuous)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Tương tự quá khứ hoàn thành nhưng nhấn mạnh "tính liên tục / quá trình dài" của hành động đó trước một hành động khác trong quá khứ.</p>
        <div style="background: #fbe9e7; padding: 10px; border-radius: 8px; border-left: 4px solid #ff5722; font-family: 'monospace'; font-size: 15px;">(+) S + had + been + V-ing<br>(-) S + had + not + been + V-ing<br>(?) Had + S + been + V-ing?</div>
        <p><em>Ví dụ:</em> They <strong>had been working</strong> for 5 hours before they took a break. (Họ đã làm việc ròng rã 5 tiếng trước khi nghỉ mát.)</p>

        <!-- TƯƠNG LAI -->
        <h3 style="color: #6a1b9a; background: #f3e5f5; padding: 5px 10px; border-radius: 5px; margin-top: 30px;">III. Nhóm Thì Tương Lai (Future Tenses)</h3>

        <h4 style="color: #8e24aa; margin-bottom: 5px;">9. Tương Lai Đơn (Future Simple)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Diễn tả một quyết định nảy ra ngay lúc nói, một phỏng đoán không có căn cứ, hoặc một lời hứa.</p>
        <div style="background: #f3e5f5; padding: 10px; border-radius: 8px; border-left: 4px solid #9c27b0; font-family: 'monospace'; font-size: 15px;">(+) S + will + V<br>(-) S + will + not (won't) + V<br>(?) Will + S + V?</div>
        <p><em>Dấu hiệu:</em> tomorrow, next (week, year...), in the future, think, promise...<br><em>Ví dụ:</em> I think it <strong>will rain</strong> soon. (Tôi nghĩ trời sẽ chóng mưa thôi.)</p>

        <h4 style="color: #8e24aa; margin-bottom: 5px;">10. Tương Lai Tiếp Diễn (Future Continuous)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Diễn tả một hành động "sẽ đang xảy ra" tại một thời điểm xác định trong tương lai.</p>
        <div style="background: #f3e5f5; padding: 10px; border-radius: 8px; border-left: 4px solid #9c27b0; font-family: 'monospace'; font-size: 15px;">(+) S + will + be + V-ing<br>(-) S + will + not + be + V-ing<br>(?) Will + S + be + V-ing?</div>
        <p><em>Dấu hiệu:</em> at this time tomorrow, at 10 AM tomorrow...<br><em>Ví dụ:</em> At 10 AM tomorrow, I <strong>will be flying</strong> to Paris. (Vào 10h sáng mai, tôi sẽ đang bay đi Paris.)</p>

        <h4 style="color: #8e24aa; margin-bottom: 5px;">11. Tương Lai Hoàn Thành (Future Perfect)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Diễn tả một hành động sẽ hoàn thành "trước" một mốc thời gian hoặc hành động khác trong tương lai.</p>
        <div style="background: #f3e5f5; padding: 10px; border-radius: 8px; border-left: 4px solid #9c27b0; font-family: 'monospace'; font-size: 15px;">(+) S + will + have + V3/ed<br>(-) S + will + not + have + V3/ed<br>(?) Will + S + have + V3/ed?</div>
        <p><em>Dấu hiệu:</em> by + mốc thời gian tương lai, by the time + S+V(hiện tại)...<br><em>Ví dụ:</em> By next year, I <strong>will have graduated</strong>. (Trước thềm năm tới, tôi sẽ tốt nghiệp xong rồi.)</p>

        <h4 style="color: #8e24aa; margin-bottom: 5px;">12. Tương Lai Hoàn Thành Tiếp Diễn (Future Perfect Continuous)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Nhấn mạnh quá trình / khoảng thời gian của một hành động sẽ kéo dài liên tục đến một mốc thời gian trong tương lai.</p>
        <div style="background: #f3e5f5; padding: 10px; border-radius: 8px; border-left: 4px solid #9c27b0; font-family: 'monospace'; font-size: 15px;">(+) S + will + have + been + V-ing<br>(-) S + will + not + have + been + V-ing<br>(?) Will + S + have + been + V-ing?</div>
        <p><em>Ví dụ:</em> By the end of this month, I <strong>will have been working</strong> here for 5 years. (Tính đến cuối tháng này, tôi sẽ làm việc ở đây được tròn 5 năm liên tục.)</p>

        <!-- Mở rộng: BE GOING TO -->
        <h4 style="color: #8e24aa; margin-bottom: 5px;">* Tương Lai Gần (Near Future / Be going to)</h4>
        <p style="margin-top: 5px;"><strong>Dùng để:</strong> Kế hoạch có dự tính từ trước, hoặc một phỏng đoán có căn cứ rất rõ ràng.</p>
        <div style="background: #f3e5f5; padding: 10px; border-radius: 8px; border-left: 4px solid #9c27b0; font-family: 'monospace'; font-size: 15px;">S + am/is/are + going to + V</div>
        <p><em>Ví dụ:</em> Look at those black clouds! It <strong>is going to rain</strong>. (Chắc chắn sẽ mưa vì mây đen kịt kìa.)</p>
    `,
    sentences: `
        <h2 style="font-family: 'Quicksand'; margin-top: 0; padding-bottom: 10px; border-bottom: 2px solid #eee; color: #ef6c00;">📝 Cấu Trúc Câu Toàn Diện (Syntax)</h2>
        <p style="text-align: center; color: #555; font-style: italic;">Từ những câu đơn giản nhất (Subject + Verb) cho tới Câu Phức, Bị Động, Câu Điều Kiện...</p>
        
        <h3 style="color: #d84315; background: #fff3e0; padding: 5px 10px; border-radius: 5px;">I. Phân Loại Câu Theo Cấu Trúc (Sentence Types)</h3>
        
        <h4 style="color: #e65100;">1. Câu Đơn (Simple Sentences)</h4>
        <p>Gồm 1 mệnh đề độc lập duy nhất (Có đủ Chủ ngữ và Động từ).</p>
        <ul style="line-height: 1.6;">
            <li><strong>S + V:</strong> The dog barks. (Con chó sửa. - 🐶 Động vật)</li>
            <li><strong>S + V + O:</strong> I love music. (Tôi yêu âm nhạc. - 🎵 Âm nhạc)</li>
            <li><strong>S + V + O + O:</strong> I give him an apple. (Tôi cho anh ấy 1 quả táo. - 🍎 Trái cây)</li>
            <li><strong>S + V + C (Bổ ngữ):</strong> She is beautiful. (Cô ấy thì xinh đẹp.)</li>
        </ul>

        <h4 style="color: #e65100;">2. Câu Ghép (Compound Sentences)</h4>
        <p>Nối 2 hay nhiều mệnh đề độc lập có tầm quan trọng tương đương nhau, thường qua liên từ <strong>FANBOYS</strong> (For, And, Nor, But, Or, Yet, So).</p>
        <ul>
            <li>I like apples, <strong style="color: #d32f2f;">but</strong> my brother likes bananas.</li>
            <li>It rained heavily, <strong style="color: #d32f2f;">so</strong> we stayed inside.</li>
        </ul>

        <h4 style="color: #e65100;">3. Câu Phức (Complex Sentences)</h4>
        <p>Gồm 1 mệnh đề độc lập (chính) và 1 hay nhiều mệnh đề phụ thuộc (ví dụ mệnh đề quan hệ, mệnh đề trạng ngữ).</p>
        <ul>
            <li><strong>Mệnh đề quan hệ (Who/Which/That...):</strong> The car <strong style="color: #1976d2;">which I bought yesterday</strong> is very expensive.</li>
            <li><strong>Mệnh đề trạng ngữ (Because, If, When, Although...):</strong> <strong style="color: #1976d2;">Because it was raining</strong>, we cancelled the match.</li>
        </ul>

        <h3 style="color: #d84315; background: #fff3e0; padding: 5px 10px; border-radius: 5px; margin-top: 30px;">II. Các Cấu Trúc Ngữ Pháp Nâng Cao (Advanced Structures)</h3>

        <h4 style="color: #e65100;">1. Câu Hỏi (Questions)</h4>
        <ul>
            <li><strong>Yes/No Questions:</strong> Đưa trợ động từ lên đầu. -> <em>Do you like pizza?</em></li>
            <li><strong>Wh- Questions:</strong> Từ để hỏi (What/Where/When/Why/Who/How) + Trợ Động Từ + S + V?. -> <em>Where do you live?</em></li>
            <li><strong>Tag Questions (Câu hỏi đuôi):</strong> Khẳng định, Phủ định? -> <em>She is a doctor, <strong>isn't she?</strong></em></li>
        </ul>

        <h4 style="color: #e65100;">2. Câu Mệnh Lệnh (Imperative) & Câu Cảm Thán (Exclamatory)</h4>
        <ul>
            <li><strong>Mệnh lệnh:</strong> Bắt đầu bằng Động từ khuyết Chủ ngữ. -> <em>Open the door! / Don't touch that!</em></li>
            <li><strong>Cảm thán:</strong> What + a/an + Adj + Noun! -> <em>What a beautiful house! (Thật là một căn nhà đẹp! - 🏠 Nhà cửa)</em></li>
        </ul>

        <h4 style="color: #e65100;">3. Câu Bị Động (Passive Voice)</h4>
        <p>Chuyển trọng tâm từ "Người thực hiện" sang "Đối tượng bị tác động".</p>
        <div style="background: #fff8e1; padding: 10px; border-radius: 8px; border-left: 4px solid #ffb300; font-family: 'monospace'; font-size: 15px;">S + Be + V3/ed + (by O)</div>
        <p><em>Chủ động:</em> Active: The boy kicked the ball. (Cậu bé đá ném quả bóng. - ⚽ Thể thao)<br>
        <em>Bị động:</em> Passive: The ball <strong>was kicked</strong> by the boy. (Quả bóng đã bị đá bởi cậu bé.)</p>

        <h4 style="color: #e65100;">4. Câu Điều Kiện (Conditional Sentences)</h4>
        <ul style="line-height: 1.8;">
            <li><strong>Loại 0 (Sự thật hiển nhiên):</strong> If + Hiện Tại, Hiện Tại. -> <em>If you heat ice, it melts.</em></li>
            <li><strong>Loại 1 (Có thể xảy ra ở T.Lai):</strong> If + Hiện Tại, Tương Lai (will + V). -> <em>If it rains, I will stay at home.</em></li>
            <li><strong>Loại 2 (Không có thật ở H.Tại):</strong> If + Quá khứ đơn, would + V. -> <em>If I were you, I would buy that car.</em></li>
            <li><strong>Loại 3 (Không có thật ở Q.Khứ):</strong> If + Past Perfect, would have + V3/ed. -> <em>If I had studied harder, I would have passed.</em></li>
        </ul>

        <h4 style="color: #e65100;">5. Câu Gián Tiếp (Reported Speech)</h4>
        <p>Thuật lại lời của ai đó. Quy tắc chung: Lùi 1 Thì trong quá khứ, Đổi ngôi (Đại từ), Đổi từ chỉ mốc thời gian.</p>
        <p><em>Trực tiếp:</em> He said: "I <strong>am</strong> playing a game <strong>now</strong>."<br>
        <em>Gián tiếp:</em> He said that he <strong>was</strong> playing a game <strong>then</strong>.</p>
    `,
    words: `
        <h2 style="font-family: 'Quicksand'; margin-top: 0; padding-bottom: 10px; border-bottom: 2px solid #eee; color: #2e7d32;">🧩 8 Loại Từ Cơ Bản (Parts of Speech)</h2>
        <p style="text-align: center; color: #555; font-style: italic;">Ngữ pháp tiếng Anh được xây dựng từ 8 viên gạch nền tảng này.</p>
        
        <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-top: 20px;">
            
            <div style="background: #f1f8e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                <h3 style="color: #1b5e20; margin-top: 0;">1. Danh Từ (Noun - n.)</h3>
                <p><strong>Chức năng:</strong> Gọi tên người, vật, con vật, địa điểm, sự việc, khái niệm. Làm Chủ ngữ hoặc Tân ngữ trong câu.</p>
                <p><strong>Phân loại:</strong> Đếm được (Apple), Không đếm được (Water), Danh từ riêng (Vietnam), Danh từ chung (City).</p>
                <p><em>Ví dụ:</em> <strong>Dog</strong> (Chó), <strong>Happiness</strong> (Niềm hạnh phúc), <strong>Teacher</strong> (Giáo viên).</p>
            </div>

            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #388e3c;">
                <h3 style="color: #1b5e20; margin-top: 0;">2. Đại Từ (Pronoun - pron.)</h3>
                <p><strong>Chức năng:</strong> Thay thế cho Danh từ để tránh lập lại từ ngữ quá nhiều lần.</p>
                <p><strong>Các loại:</strong> I, you, we, they, he, she, it (nhân xưng). Mine, yours (sở hữu). This, that (chỉ định).</p>
                <p><em>Ví dụ:</em> Mary is absent. <strong>She</strong> is sick. (She thế chỗ cho Mary).</p>
            </div>

            <div style="background: #e0f2f1; padding: 15px; border-radius: 8px; border-left: 4px solid #00897b;">
                <h3 style="color: #004d40; margin-top: 0;">3. Động Từ (Verb - v.)</h3>
                <p><strong>Chức năng:</strong> Diễn tả hành động (chạy, nhảy) hoặc trạng thái (thích, là, ở).</p>
                <p><strong>Phân loại:</strong> Động từ thường (run, eat). Trợ động từ (do, will, have). Động từ "To be" (is, am, are). Khuyết thiếu (can, should).</p>
                <p><em>Ví dụ:</em> The bird <strong>flies</strong>. I <strong>can</strong> swim in the pool.</p>
            </div>

            <div style="background: #e0f7fa; padding: 15px; border-radius: 8px; border-left: 4px solid #00acc1;">
                <h3 style="color: #006064; margin-top: 0;">4. Tính Từ (Adjective - adj.)</h3>
                <p><strong>Chức năng:</strong> Miêu tả, bổ nghĩa thêm thông tin tính chất, màu sắc, hình dáng,... cho Danh từ hoặc Đại từ.</p>
                <p><strong>Vị trí:</strong> Đứng trước Danh từ hoặc sau to Be / Động từ giác quan (look, feel).</p>
                <p><em>Ví dụ:</em> A <strong>beautiful</strong> flower. He looks <strong>tired</strong>.</p>
            </div>

            <div style="background: #e1f5fe; padding: 15px; border-radius: 8px; border-left: 4px solid #039be5;">
                <h3 style="color: #01579b; margin-top: 0;">5. Trạng Từ (Adverb - adv.)</h3>
                <p><strong>Chức năng:</strong> Bổ nghĩa để chỉ cách thức, mức độ, thời gian, nơi chốn cho Động từ, Tính từ, hoặc Trạng từ khác.</p>
                <p><strong>Dấu hiệu:</strong> Thường được cấu tạo bằng cách thêm đuôi "-ly" vào Tính từ (quick -> quickly).</p>
                <p><em>Ví dụ:</em> He speaks English <strong>fluently</strong>. It is <strong>very</strong> hot today.</p>
            </div>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #1e88e5;">
                <h3 style="color: #0d47a1; margin-top: 0;">6. Giới Từ (Preposition - prep.)</h3>
                <p><strong>Chức năng:</strong> Nối các từ, cụm từ để chỉ mối quan hệ về không gian, thời gian, phương hướng.</p>
                <p><strong>Các từ phổ biến:</strong> in, on, at, about, with, under, over, from, to.</p>
                <p><em>Ví dụ:</em> The cat is <strong>on</strong> the roof. I wake up <strong>at</strong> 6 AM.</p>
            </div>

            <div style="background: #ede7f6; padding: 15px; border-radius: 8px; border-left: 4px solid #5e35b1;">
                <h3 style="color: #311b92; margin-top: 0;">7. Liên Từ (Conjunction - conj.)</h3>
                <p><strong>Chức năng:</strong> Liên kết các từ, cụm từ, mệnh đề hoặc các câu lại với nhau.</p>
                <p><strong>Các từ phổ biến:</strong> and, but, or, so, because, although, if, unless.</p>
                <p><em>Ví dụ:</em> I like tea <strong>and</strong> coffee. She passed the exam <strong>because</strong> she studied hard.</p>
            </div>

            <div style="background: #fce4ec; padding: 15px; border-radius: 8px; border-left: 4px solid #d81b60;">
                <h3 style="color: #880e4f; margin-top: 0;">8. Thán Từ (Interjection - interj.)</h3>
                <p><strong>Chức năng:</strong> Thể hiện cảm xúc mạnh mẽ, ngắn gọn (ngạc nhiên, vui, buồn, đau đớn). Thường đi kèm dấu chấm than (!).</p>
                <p><strong>Các từ phổ biến:</strong> Oh!, Wow!, Ouch!, Alas!, Hey!.</p>
                <p><em>Ví dụ:</em> <strong>Wow!</strong> That is a stunning dress. <strong>Ouch!</strong> It hurts.</p>
            </div>

        </div>
        
        <p style="margin-top: 20px; font-style: italic; color: #555; text-align: center; border-top: 2px dashed #ccc; padding-top: 15px;">🔥 Mẹo: Hiểu rõ 8 từ loại này sẽ giúp bạn tra từ điển cực nhanh và biết cách ghép từ chính xác nhất! 🔥</p>
    `
};

function loadGrammarLesson(type) {
    const container = document.getElementById('grammar-content');
    const data = grammarData[type];
    
    if (data) {
        container.innerHTML = `<div style="font-family: 'Nunito'; font-size: 18px; line-height: 1.6; color: #333; animation: fadeIn 0.3s;">${data}</div>`;
    }
}

// ------------------- GRAMMAR QUIZ FEATURE -------------------
// Note: grammarQuizData is now loaded from grammar_data.js

let currentQuizCategory = '';
let currentQuizIndex = 0;
let quizScore = 0;
let activeQuizData = [];

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Clone and shuffle quiz questions and their options
function prepareQuizData(dataArray) {
    // 1. Clone array to avoid modifying original data
    let clonedData = JSON.parse(JSON.stringify(dataArray));
    
    // 2. Lấy ngẫu nhiên tối đa 20 câu để làm 1 đề thi (không bắt người dùng làm hết 100 câu 1 lúc gây chán)
    shuffleArray(clonedData);
    let selectedQuestions = clonedData.slice(0, 20); 

    // 3. Shuffle options within each question
    selectedQuestions.forEach(q => {
        const correctText = q.options[q.correct]; // Save correct string
        shuffleArray(q.options);
        q.correct = q.options.indexOf(correctText); // Find new index of correct answer
    });

    return selectedQuestions;
}

function startGrammarQuiz() {
    const container = document.getElementById('grammar-content');
    
    // Giao diện chọn chuyên đề trắc nghiệm
    container.innerHTML = `
        <div style="animation: fadeIn 0.3s; font-family: 'Nunito'; max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #ccc; border-radius: 12px; padding: 30px; text-align: center;">
            <h2 style="font-family: 'Quicksand'; color: #e91e63; margin-top: 0;">🎯 Chọn Chủ Đề Trắc Nghiệm</h2>
            <p style="color: #666; margin-bottom: 25px;">Hãy thử sức với các gói câu hỏi trắc nghiệm dưới đây để củng cố kiến thức ngữ pháp của bạn!</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <button onclick="startGrammarQuizCategory('specific_tenses')" style="padding: 15px; font-size: 16px; background: #e3f2fd; color: #1565c0; border: 2px solid #90caf9; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.2s;">1. Nhận Biết Các Thì</button>
                <button onclick="startGrammarQuizCategory('mixed_tenses')" style="padding: 15px; font-size: 16px; background: #fce4ec; color: #c2185b; border: 2px solid #f48fb1; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.2s;">2. 12 Thì Lộn Xộn</button>
                <button onclick="startGrammarQuizCategory('sentences')" style="padding: 15px; font-size: 16px; background: #fff3e0; color: #e65100; border: 2px solid #ffcc80; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.2s;">3. Cấu Trúc Câu</button>
                <button onclick="startGrammarQuizCategory('words')" style="padding: 15px; font-size: 16px; background: #e8f5e9; color: #2e7d32; border: 2px solid #a5d6a7; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.2s;">4. 8 Loại Từ Cơ Bản</button>
                <button onclick="startGrammarQuizCategory('prepositions')" style="padding: 15px; font-size: 16px; background: #ede7f6; color: #4527a0; border: 2px solid #b39ddb; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.2s; grid-column: span 2;">5. Điền Từ Vào Chỗ Trống</button>
            </div>
            <div style="margin-top: 30px;">
                <button class="vocab-audio-btn" onclick="loadGrammarLesson('tenses')" style="background-color: #757575; color: white; padding: 10px 20px; font-size: 16px;">⬅ Quay lại bài học</button>
            </div>
        </div>
    `;
}

// Giả lập gọi API lấy bộ đề 100 câu ngẫu nhiên, sắp xếp từ Dễ -> Khó
async function fetchGrammarAPI(category) {
    // Giả lập thời gian load API (800ms)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Lấy tối đa toàn bộ câu hỏi của chủ đề này từ CSDL cục bộ
    let sourceData = grammarQuizData[category] || [];
    
    // Lọc trùng lặp dựa trên nội dung câu hỏi thực tế (bỏ số thứ tự ở đầu)
    let uniqueQuestionsMap = new Map();
    sourceData.forEach(q => {
        let cleanText = q.question.replace(/^\d+\.\s*/, '').trim();
        if (!uniqueQuestionsMap.has(cleanText)) {
            // Sắp xếp lại ngẫu nhiên các lựa chọn cho mỗi câu hỏi
            // Vì mặc định correct = 0 (đáp án A), nên ta phải xáo trộn và tìm lại vị trí mới
            let correctText = q.options[q.correct || 0];
            let shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
            let newCorrectIndex = shuffledOptions.indexOf(correctText);
            
            uniqueQuestionsMap.set(cleanText, {
                ...q,
                options: shuffledOptions,
                correct: newCorrectIndex
            });
        }
    });
    
    let uniqueData = Array.from(uniqueQuestionsMap.values());
    
    // Trộn ngẫu nhiên để đảm bảo mỗi lần chơi là một bộ đề khác nhau (không lặp)
    let shuffled = uniqueData.sort(() => Math.random() - 0.5);
    
    // Chọn tối đa 100 câu
    let selected = shuffled.slice(0, 100);
    
    // Đánh giá độ khó giả lập dựa trên độ dài câu hỏi và đáp án
    selected.forEach(q => {
        let diffScore = q.question.length + q.options.join('').length;
        if (diffScore < 85) q._difficulty = 1; // Dễ
        else if (diffScore < 125) q._difficulty = 2; // Trung bình
        else q._difficulty = 3; // Khó
    });
    
    // Sắp xếp câu hỏi từ Khó -> Dễ (1 là dễ, 2 là tb, 3 là khó)
    selected.sort((a, b) => a._difficulty - b._difficulty);
    
    return selected;
}

async function startGrammarQuizCategory(categoryKey) {
    if (categoryKey === 'specific_tenses') {
        // Giao diện chọn 1 trong 12 thì
        const container = document.getElementById('grammar-content');
        container.innerHTML = `
            <div style="animation: fadeIn 0.3s; font-family: 'Nunito'; max-width: 800px; margin: 0 auto; background: #fff; border: 2px solid #ccc; border-radius: 12px; padding: 25px; text-align: center;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px dashed #eee; padding-bottom: 10px;">
                    <span style="font-weight: bold; color: #1976d2; font-size: 16px; text-transform: uppercase;">[Chọn 1 trong 12 Thì]</span>
                    <button onclick="startGrammarQuiz()" style="background: none; border: none; color: #999; cursor: pointer; font-weight: bold; font-size: 16px;">⬅ Quay lại</button>
                </div>
                
                <h3 style="font-family: 'Quicksand'; color: #0277bd; margin-bottom: 20px;">Lựa chọn một Thì để bắt đầu làm bài tập:</h3>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <button onclick="startSpecificTenseQuiz('tense_1', 'Hiện tại đơn')" style="padding: 12px; background: #e1f5fe; border: 2px solid #81d4fa; border-radius: 8px; cursor: pointer; font-weight: bold; color: #0277bd; transition: 0.2s;">1. Hiện tại đơn</button>
                    <button onclick="startSpecificTenseQuiz('tense_2', 'Hiện tại tiếp diễn')" style="padding: 12px; background: #e1f5fe; border: 2px solid #81d4fa; border-radius: 8px; cursor: pointer; font-weight: bold; color: #0277bd; transition: 0.2s;">2. HT Tiếp diễn</button>
                    <button onclick="startSpecificTenseQuiz('tense_3', 'Hiện tại hoàn thành')" style="padding: 12px; background: #e1f5fe; border: 2px solid #81d4fa; border-radius: 8px; cursor: pointer; font-weight: bold; color: #0277bd; transition: 0.2s;">3. HT Hoàn thành</button>
                    <button onclick="startSpecificTenseQuiz('tense_4', 'Hiện tại hoàn thành tiếp diễn')" style="padding: 12px; background: #e1f5fe; border: 2px solid #81d4fa; border-radius: 8px; cursor: pointer; font-weight: bold; color: #0277bd; transition: 0.2s;">4. HT HT Tiếp diễn</button>
                    <button onclick="startSpecificTenseQuiz('tense_5', 'Quá khứ đơn')" style="padding: 12px; background: #f3e5f5; border: 2px solid #ce93d8; border-radius: 8px; cursor: pointer; font-weight: bold; color: #6a1b9a; transition: 0.2s;">5. Quá khứ đơn</button>
                    <button onclick="startSpecificTenseQuiz('tense_6', 'Quá khứ tiếp diễn')" style="padding: 12px; background: #f3e5f5; border: 2px solid #ce93d8; border-radius: 8px; cursor: pointer; font-weight: bold; color: #6a1b9a; transition: 0.2s;">6. QK Tiếp diễn</button>
                    <button onclick="startSpecificTenseQuiz('tense_7', 'Quá khứ hoàn thành')" style="padding: 12px; background: #f3e5f5; border: 2px solid #ce93d8; border-radius: 8px; cursor: pointer; font-weight: bold; color: #6a1b9a; transition: 0.2s;">7. QK Hoàn thành</button>
                    <button onclick="startSpecificTenseQuiz('tense_8', 'Quá khứ hoàn thành tiếp diễn')" style="padding: 12px; background: #f3e5f5; border: 2px solid #ce93d8; border-radius: 8px; cursor: pointer; font-weight: bold; color: #6a1b9a; transition: 0.2s;">8. QK HT Tiếp diễn</button>
                    <button onclick="startSpecificTenseQuiz('tense_9', 'Tương lai đơn')" style="padding: 12px; background: #fff3e0; border: 2px solid #ffcc80; border-radius: 8px; cursor: pointer; font-weight: bold; color: #ef6c00; transition: 0.2s;">9. Tương lai đơn</button>
                    <button onclick="startSpecificTenseQuiz('tense_10', 'Tương lai tiếp diễn')" style="padding: 12px; background: #fff3e0; border: 2px solid #ffcc80; border-radius: 8px; cursor: pointer; font-weight: bold; color: #ef6c00; transition: 0.2s;">10. TL Tiếp diễn</button>
                    <button onclick="startSpecificTenseQuiz('tense_11', 'Tương lai hoàn thành')" style="padding: 12px; background: #fff3e0; border: 2px solid #ffcc80; border-radius: 8px; cursor: pointer; font-weight: bold; color: #ef6c00; transition: 0.2s;">11. TL Hoàn thành</button>
                    <button onclick="startSpecificTenseQuiz('tense_12', 'Tương lai hoàn thành tiếp diễn')" style="padding: 12px; background: #fff3e0; border: 2px solid #ffcc80; border-radius: 8px; cursor: pointer; font-weight: bold; color: #ef6c00; transition: 0.2s;">12. TL HT Tiếp diễn</button>
                </div>
            </div>
        `;
        return;
    }

    const container = document.getElementById('grammar-content');
    container.innerHTML = `<div style="text-align: center; padding: 100px 20px;"><div class="spinner" style="font-size: 20px; color: #1976d2;">⏳ Đang kết nối API tải 100 câu trắc nghiệm...</div></div>`;

    currentQuizCategory = categoryKey;
    activeQuizData = await fetchGrammarAPI(categoryKey);
    currentQuizIndex = 0;
    quizScore = 0;
    renderGrammarQuizQuestion();
}

async function startSpecificTenseQuiz(tenseKey, tenseName) {
    const container = document.getElementById('grammar-content');
    container.innerHTML = `<div style="text-align: center; padding: 100px 20px;"><div class="spinner" style="font-size: 20px; color: #1976d2;">⏳ Đang kết nối API tải 100 câu trắc nghiệm...</div></div>`;

    currentQuizCategory = tenseKey;
    activeQuizData = await fetchGrammarAPI(tenseKey);
    currentQuizIndex = 0;
    quizScore = 0;
    
    // Lưu tên hiển thị tạm vào biến global cho phần tiêu đề
    window.currentTenseNameLabel = tenseName;
    renderGrammarQuizQuestion();
}

function renderGrammarQuizQuestion() {
    const container = document.getElementById('grammar-content');
    
    if (currentQuizIndex >= activeQuizData.length) {
        // Hoàn thành Quiz
        const categoryTitles = {
            'mixed_tenses': '12 Thì Lộn Xộn',
            'sentences': 'Cấu Trúc Câu',
            'words': '8 Loại Từ Cơ Bản',
            'prepositions': 'Điền Từ Vào Chỗ Trống'
        };
        const title = categoryTitles[currentQuizCategory] || window.currentTenseNameLabel || 'Ngữ Pháp';
        
        let replayAction = currentQuizCategory.startsWith('tense_') ? 
            `startGrammarQuizCategory('specific_tenses')` : 
            `startGrammarQuizCategory('${currentQuizCategory}')`;

        container.innerHTML = `
            <div style="text-align: center; animation: fadeIn 0.5s;">
                <h2 style="font-family: 'Quicksand'; font-size: 32px; color: #2e7d32;">🎉 Chúc mừng bạn đã hoàn thành phần thi: ${title}!</h2>
                <div style="font-size: 60px; margin: 20px 0;">🏅</div>
                <p style="font-size: 24px; font-weight: bold; color: #d84315;">Điểm của bạn: ${quizScore} / ${activeQuizData.length}</p>
                <div style="margin-top: 30px;">
                    <button class="vocab-audio-btn" onclick="${replayAction}" style="background-color: #29b6f6; color: white; padding: 10px 20px; font-size: 16px;">🔄 Chơi lại mục này</button>
                    <button class="vocab-audio-btn" onclick="startGrammarQuiz()" style="background-color: #e91e63; color: white; padding: 10px 20px; font-size: 16px;">🎯 Chọn mục khác</button>
                </div>
            </div>
        `;
        return;
    }

    const q = activeQuizData[currentQuizIndex];
    
    // Category label
    const categoryTitles = {
        'mixed_tenses': '12 Thì Lộn Xộn',
        'sentences': 'Cấu Trúc Câu',
        'words': '8 Loại Từ Cơ Bản',
        'prepositions': 'Điền Từ Vào Chỗ Trống'
    };
    const titleLabel = categoryTitles[currentQuizCategory] || window.currentTenseNameLabel || 'Ngữ Pháp';
    
    let backAction = currentQuizCategory.startsWith('tense_') ? `startGrammarQuizCategory('specific_tenses')` : `startGrammarQuiz()`;

    let html = `
        <div style="animation: fadeIn 0.3s; font-family: 'Nunito'; max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #ccc; border-radius: 12px; padding: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px dashed #eee; padding-bottom: 10px;">
                <span style="font-weight: bold; color: #1976d2; font-size: 14px; text-transform: uppercase;">[${titleLabel}]</span>
                <button onclick="${backAction}" style="background: none; border: none; color: #999; cursor: pointer; font-weight: bold;">✖ Thoát</button>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <span style="font-weight: bold; color: #666; background: #eee; padding: 5px 12px; border-radius: 20px;">Câu ${currentQuizIndex + 1}/${activeQuizData.length}</span>
                <button onclick="shuffleCurrentGrammarQuiz()" style="background: #ff9800; color: white; border: 3px solid #e65100; padding: 5px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; box-shadow: 2px 2px 0px #e65100;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">🔀 Trộn Đề</button>
                <span style="font-weight: bold; color: #d84315; font-size: 18px;">Điểm: ${quizScore}</span>
            </div>
            
            <h3 style="font-size: 22px; color: #333; margin-bottom: 25px; line-height: 1.5;">${q.question.replace(/^\d+\.\s*/, '')}</h3>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 12px;" id="grammar-options-container">
    `;
    
    q.options.forEach((opt, index) => {
        html += `
                <button 
                    onclick="checkGrammarQuizAnswer(${index})" 
                    style="text-align: left; padding: 15px 20px; font-size: 18px; font-family: 'Nunito'; background: white; border: 2px solid #ddd; border-bottom: 4px solid #ddd; border-radius: 10px; cursor: pointer; transition: 0.2s;"
                    onmouseover="this.style.background='#f5f5f5'"
                    onmouseout="this.style.background='white'"
                    id="gram-opt-${index}"
                >
                    <span style="display: inline-block; width: 30px; font-weight: bold; color: #1976d2;">${String.fromCharCode(65 + index)}.</span> ${opt}
                </button>
        `;
    });
    
    html += `
            </div>
            
            <div id="grammar-explanation-box" style="display: none; margin-top: 25px; padding: 15px; border-radius: 8px; font-size: 16px; line-height: 1.6;">
            </div>
            
            <div style="text-align: right; margin-top: 20px;">
                <button id="gram-next-btn" onclick="nextGrammarQuizQuestion()" style="display: none; background: #4caf50; color: white; border: none; padding: 10px 25px; font-size: 18px; border-radius: 8px; cursor: pointer; font-family: 'Quicksand'; border-bottom: 3px solid #388e3c;">Tiếp theo ➔</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function checkGrammarQuizAnswer(selectedIndex) {
    const q = activeQuizData[currentQuizIndex];
    const optionsCont = document.getElementById('grammar-options-container');
    const btns = optionsCont.querySelectorAll('button');
    const explanationBox = document.getElementById('grammar-explanation-box');
    const nextBtn = document.getElementById('gram-next-btn');
    
    // Disable all buttons immediately
    btns.forEach(b => {
        b.onclick = null;
        b.style.pointerEvents = 'none';
    });
    
    // Check answer
    const isCorrect = selectedIndex === q.correct;
    
    if (isCorrect) {
        quizScore++;
        btns[selectedIndex].style.background = '#e8f5e9';
        btns[selectedIndex].style.borderColor = '#4caf50';
        btns[selectedIndex].style.color = '#2e7d32';
        
        explanationBox.style.background = '#e8f5e9';
        explanationBox.style.borderLeft = '5px solid #4caf50';
        explanationBox.innerHTML = `<strong style="color: #2e7d32;">✅ Chính xác!</strong><br><span style="color: #333;">${q.explanation}</span>`;
    } else {
        btns[selectedIndex].style.background = '#ffebee';
        btns[selectedIndex].style.borderColor = '#f44336';
        btns[selectedIndex].style.color = '#c62828';
        
        // Highlight correct answer
        btns[q.correct].style.background = '#e8f5e9';
        btns[q.correct].style.borderColor = '#4caf50';
        
        explanationBox.style.background = '#ffebee';
        explanationBox.style.borderLeft = '5px solid #f44336';
        explanationBox.innerHTML = `<strong style="color: #c62828;">❌ Sai rồi!</strong> Đáp án đúng là <strong>${q.options[q.correct]}</strong>.<br><span style="color: #333;">${q.explanation}</span>`;
    }
    
    explanationBox.style.display = 'block';
    nextBtn.style.display = 'inline-block';
}

function nextGrammarQuizQuestion() {
    currentQuizIndex++;
    renderGrammarQuizQuestion();
}

function shuffleCurrentGrammarQuiz() {
    if (confirm("Hệ thống sẽ trộn ngẫu nhiên toàn bộ câu hỏi và vị trí các đáp án. Cài đặt lại điểm từ đầu. Bạn có chắc chắn không?")) {
        // Shuffle activeQuizData questions
        shuffleArray(activeQuizData);
        // Shuffle options
        activeQuizData.forEach(q => {
            const correctText = q.options[q.correct];
            shuffleArray(q.options);
            q.correct = q.options.indexOf(correctText);
        });
        currentQuizIndex = 0;
        quizScore = 0;
        renderGrammarQuizQuestion();
    }
}

// --- TOPIC COMPLETION FEATURE ---
let isShowingCompleted = false;

function initTopicCompletion() {
    const overlays = [document.getElementById("topic-overlay"), document.getElementById("game-topic-selector")];
    
    overlays.forEach(overlay => {
        if (!overlay) return;
        
        // Add toggle visibility button to title if it's the learning topic overlay
        if (overlay.id === "topic-overlay") {
            const titleEle = overlay.querySelector('.overlay-title');
            // Remove the old restore button if it exists
            const oldBtn = titleEle.querySelector('.restore-topics-btn');
            if (oldBtn) oldBtn.remove();
            
            if (titleEle && !titleEle.querySelector('.toggle-completed-btn')) {
                const toggleBtn = document.createElement('button');
                toggleBtn.innerHTML = isShowingCompleted ? '🙈 Ẩn chủ đề đã học' : '👀 Các chủ đề đã học';
                toggleBtn.className = 'vocab-audio-btn toggle-completed-btn';
                toggleBtn.style.fontSize = '14px';
                toggleBtn.style.padding = '8px 12px';
                toggleBtn.style.marginLeft = '15px';
                toggleBtn.style.backgroundColor = isShowingCompleted ? '#ff9800' : '#4caf50';
                toggleBtn.style.color = 'white';
                toggleBtn.style.verticalAlign = 'middle';
                toggleBtn.onclick = toggleCompletedVisibility;
                titleEle.appendChild(toggleBtn);
            }
        }
    
        const cards = overlay.querySelectorAll('.topic-grid .topic-card');
        cards.forEach(card => {
            // Avoid adding multiple checkboxes
            if (card.querySelector('.topic-completed-cb')) return;
            
            const onclickAttr = card.getAttribute('onclick') || '';
            let topicId = '';
            
            if (onclickAttr.includes("loadDynamicTopic('")) {
                topicId = onclickAttr.split("loadDynamicTopic('")[1].split("'")[0];
            } else if (onclickAttr.includes("showAnimalVocab()")) {
                topicId = 'animal';
            } else if (onclickAttr.includes("startSelectedGame('")) {
                topicId = onclickAttr.split("startSelectedGame('")[1].split("'")[0];
            }
            
            if (topicId) {
                card.dataset.topicId = topicId;
                card.style.position = 'relative';
                
                const cbContainer = document.createElement('div');
                cbContainer.style.position = 'absolute';
                cbContainer.style.top = '8px';
                cbContainer.style.right = '8px';
                cbContainer.style.zIndex = '10';
                cbContainer.style.background = 'white';
                cbContainer.style.borderRadius = '50%';
                cbContainer.style.width = '24px';
                cbContainer.style.height = '24px';
                cbContainer.style.display = 'flex';
                cbContainer.style.alignItems = 'center';
                cbContainer.style.justifyContent = 'center';
                cbContainer.style.boxShadow = '2px 2px 0px #222';
                cbContainer.style.border = '2px solid #222';
                
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.className = 'topic-completed-cb';
                cb.title = 'Đánh dấu đã học';
                cb.style.cursor = 'pointer';
                cb.style.width = '16px';
                cb.style.height = '16px';
                
                // Initialize state
                const completedTopics = JSON.parse(localStorage.getItem('completed_topics') || '[]');
                if (completedTopics.includes(topicId)) {
                    cb.checked = true;
                    if (!isShowingCompleted) {
                        card.style.display = 'none';
                    } else {
                        card.style.opacity = '0.6';
                        card.style.filter = 'grayscale(50%)';
                    }
                }
                
                cb.onclick = (e) => {
                    e.stopPropagation();
                    toggleCompletedTopic(topicId, cb.checked);
                };
                
                cbContainer.appendChild(cb);
                card.appendChild(cbContainer);
            }
        });
    });
}

function toggleCompletedVisibility() {
    isShowingCompleted = !isShowingCompleted;
    const completedTopics = JSON.parse(localStorage.getItem('completed_topics') || '[]');
    
    const overlays = [document.getElementById("topic-overlay"), document.getElementById("game-topic-selector")];
    overlays.forEach(overlay => {
        if (!overlay) return;
        
        if (overlay.id === "topic-overlay") {
            const toggleBtn = overlay.querySelector('.toggle-completed-btn');
            if (toggleBtn) {
                toggleBtn.innerHTML = isShowingCompleted ? '🙈 Ẩn chủ đề đã học' : '👀 Các chủ đề đã học';
                toggleBtn.style.backgroundColor = isShowingCompleted ? '#ff9800' : '#4caf50';
            }
        }
        
        const cards = overlay.querySelectorAll('.topic-grid .topic-card');
        cards.forEach(card => {
            const topicId = card.dataset.topicId;
            if (topicId && completedTopics.includes(topicId)) {
                if (isShowingCompleted) {
                    card.style.display = 'flex';
                    setTimeout(() => {
                        card.style.opacity = '0.6';
                        card.style.filter = 'grayscale(50%)';
                        card.style.transform = 'none';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.style.display = 'none';
                        card.style.filter = 'none';
                    }, 300);
                }
            }
        });
    });
}

function toggleCompletedTopic(topicId, isCompleted) {
    let completedTopics = JSON.parse(localStorage.getItem('completed_topics') || '[]');
    if (isCompleted) {
        if (!completedTopics.includes(topicId)) {
            completedTopics.push(topicId);
        }
    } else {
        completedTopics = completedTopics.filter(id => id !== topicId);
    }
    localStorage.setItem('completed_topics', JSON.stringify(completedTopics));
    
    // Update UI for all cards with this topicId
    const overlays = [document.getElementById("topic-overlay"), document.getElementById("game-topic-selector")];
    overlays.forEach(overlay => {
        if (!overlay) return;
        const cards = overlay.querySelectorAll('.topic-grid .topic-card');
        cards.forEach(card => {
            if (card.dataset.topicId === topicId) {
                const cb = card.querySelector('.topic-completed-cb');
                if (cb) cb.checked = isCompleted;
                
                if (isCompleted) {
                    if (!isShowingCompleted) {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            card.style.display = 'none';
                            card.style.filter = 'none';
                        }, 300);
                    } else {
                        card.style.opacity = '0.6';
                        card.style.filter = 'grayscale(50%)';
                    }
                } else {
                    card.style.display = 'flex';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.filter = 'none';
                        card.style.transform = 'none';
                    }, 50);
                }
            }
        });
    });
}

// ==========================================
// 10-REPETITION WRITING PRACTICE MODAL LOGIC
// ==========================================

let writeRepeatScore = 0;
let writeRepeatWordObj = null;

function openWriteRepeatModal(wordObj) {
    writeRepeatWordObj = wordObj;
    writeRepeatScore = 0;
    
    document.getElementById('write-repeat-word').textContent = wordObj.en;
    document.getElementById('write-repeat-vi').textContent = wordObj.vi;
    document.getElementById('write-repeat-score').textContent = '0';
    
    const container = document.getElementById('write-repeat-inputs');
    container.innerHTML = `
        <div style="text-align: right; margin-bottom: 10px; position: sticky; top: -10px; z-index: 20; background: #fafafa; padding: 5px;">
            <button id="wr-mode-btn" onclick="toggleWrDrawMode()" style="padding: 6px 15px; background: #ffecb3; border: 2px solid #000; border-radius: 8px; font-weight: bold; font-family: 'Quicksand'; cursor: pointer; box-shadow: 2px 2px 0 #000;">🖍️ Viết tự do (Bảng Vẽ)</button>
            <button id="wr-clear-btn" onclick="clearWrCanvas()" style="display: none; padding: 6px 15px; background: #ff5252; color: #fff; border: 2px solid #000; border-radius: 8px; font-weight: bold; font-family: 'Quicksand'; cursor: pointer; margin-left: 10px; box-shadow: 2px 2px 0 #000;">Xóa mực</button>
        </div>
        <div style="position: relative; width: 100%; border-radius: 8px;" id="wr-scroll-wrapper">
            <canvas id="wr-draw-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; pointer-events: none; touch-action: none; border-radius: 8px;"></canvas>
            <div id="wr-inputs-container" style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 15px;">
            </div>
        </div>
    `;
    
    const inputsContainer = document.getElementById('wr-inputs-container');

    
    for (let i = 0; i < 10; i++) {
        const inputWrapper = document.createElement('div');
        inputWrapper.style.display = 'flex';
        inputWrapper.style.alignItems = 'center';
        inputWrapper.style.gap = '10px';
        
        const spanNum = document.createElement('span');
        spanNum.textContent = (i + 1) + '.';
        spanNum.style.fontWeight = 'bold';
        spanNum.style.color = '#555';
        spanNum.style.width = '25px';
        
        const innerWrapper = document.createElement('div');
        innerWrapper.style.position = 'relative';
        innerWrapper.style.flex = '1';

        const hintSpan = document.createElement('span');
        hintSpan.textContent = wordObj.en;
        hintSpan.style.position = 'absolute';
        hintSpan.style.left = '14px'; // 12px padding + 2px border
        hintSpan.style.top = '50%';
        hintSpan.style.transform = 'translateY(-50%)';
        hintSpan.style.fontSize = '18px';
        hintSpan.style.fontFamily = 'Nunito, sans-serif';
        hintSpan.style.color = '#ccc';
        hintSpan.style.pointerEvents = 'none';
        hintSpan.style.zIndex = '1';
        hintSpan.style.whiteSpace = 'nowrap';
        hintSpan.style.overflow = 'hidden';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'write-repeat-input';
        
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
        input.style.padding = '12px';
        input.style.fontSize = '18px';
        input.style.border = '2px solid #bdbdbd';
        input.style.borderRadius = '8px';
        input.style.outline = 'none';
        input.style.background = 'transparent';
        input.style.position = 'relative';
        input.style.zIndex = '2';
        input.style.fontFamily = 'Nunito, sans-serif';
        
        input.oninput = (e) => checkWriteRepeatAnswer(e.target, wordObj.en);
        
        innerWrapper.appendChild(hintSpan);
        innerWrapper.appendChild(input);
        
        const resultIcon = document.createElement('span');
        resultIcon.className = 'write-repeat-icon';
        resultIcon.style.fontSize = '24px';
        resultIcon.style.width = '30px';
        resultIcon.textContent = '';
        
        inputWrapper.appendChild(spanNum);
        inputWrapper.appendChild(innerWrapper);
        inputWrapper.appendChild(resultIcon);
        
        inputsContainer.appendChild(inputWrapper);
    }
    
    // Reset draw mode variables
    wrDrawMode = false;
    
    document.getElementById('write-repeat-modal').style.display = 'flex';
    
    // Initialize Canvas after display so heights are calculated properly
    setTimeout(initWrCanvas, 150);
}

// =====================================
// WRITE-REPEAT HANDWRITING MODE LOGIC
// =====================================
let wrDrawMode = false;
let wrCanvas, wrCtx;
let wrDrawing = false;
let wrLastX = 0, wrLastY = 0;

function initWrCanvas() {
    wrCanvas = document.getElementById('wr-draw-canvas');
    if(!wrCanvas) return;
    wrCtx = wrCanvas.getContext('2d');
    
    function resizeWrCanvas() {
        if(!wrCanvas) return;
        const wrapper = document.getElementById('wr-scroll-wrapper');
        wrCanvas.width = wrapper.offsetWidth;
        wrCanvas.height = wrapper.offsetHeight;
        wrCtx.lineCap = 'round';
        wrCtx.lineJoin = 'round';
        wrCtx.lineWidth = 4;
        wrCtx.strokeStyle = '#29b6f6'; // Light blue ink
    }
    
    resizeWrCanvas();
    window.addEventListener('resize', resizeWrCanvas);
    
    wrCanvas.addEventListener('mousedown', startWrDraw);
    wrCanvas.addEventListener('mousemove', drawWr);
    wrCanvas.addEventListener('mouseup', endWrDraw);
    wrCanvas.addEventListener('mouseout', endWrDraw);
    
    wrCanvas.addEventListener('touchstart', startWrDraw, {passive: false});
    wrCanvas.addEventListener('touchmove', drawWr, {passive: false});
    wrCanvas.addEventListener('touchend', endWrDraw);
}

function startWrDraw(e) {
    if(!wrDrawMode) return;
    if(e.type === 'touchstart') e.preventDefault();
    wrDrawing = true;
    const pos = getWrPos(e);
    wrLastX = pos.x;
    wrLastY = pos.y;
}

function drawWr(e) {
    if(!wrDrawing || !wrDrawMode) return;
    if(e.type === 'touchmove') e.preventDefault();
    
    const pos = getWrPos(e);
    wrCtx.beginPath();
    wrCtx.moveTo(wrLastX, wrLastY);
    wrCtx.lineTo(pos.x, pos.y);
    wrCtx.stroke();
    wrLastX = pos.x;
    wrLastY = pos.y;
}

function endWrDraw() {
    wrDrawing = false;
}

function getWrPos(evt) {
    const rect = wrCanvas.getBoundingClientRect();
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    
    if (evt.touches && evt.touches.length > 0) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
    }
    
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function toggleWrDrawMode() {
    wrDrawMode = !wrDrawMode;
    const btn = document.getElementById('wr-mode-btn');
    const clearBtn = document.getElementById('wr-clear-btn');
    const canvas = document.getElementById('wr-draw-canvas');
    const inputs = document.querySelectorAll('.write-repeat-input');
    // We cannot automatically verify drawings, so we let the user manually toggle done
    
    if(wrDrawMode) {
        btn.textContent = "💻 Tắt Bảng Vẽ";
        btn.style.background = "#fff9c4";
        canvas.style.pointerEvents = "auto";
        clearBtn.style.display = "inline-block";
        
        inputs.forEach(inp => {
            inp.style.pointerEvents = "none"; 
        });
    } else {
        btn.textContent = "🖍️ Viết tự do (Bảng Vẽ)";
        btn.style.background = "#ffecb3";
        canvas.style.pointerEvents = "none";
        clearBtn.style.display = "none";
        
        inputs.forEach(inp => {
            inp.style.pointerEvents = "auto";
        });
    }
}

function clearWrCanvas() {
    if(!wrCtx || !wrCanvas) return;
    wrCtx.clearRect(0, 0, wrCanvas.width, wrCanvas.height);
}

function closeWriteRepeatModal() {
    document.getElementById('write-repeat-modal').style.display = 'none';
}

function checkWriteRepeatAnswer(inputElem, correctEn) {
    const val = inputElem.value.trim().toLowerCase();
    // The input is inside an innerWrapper, which is inside an inputWrapper.
    // The icon is the next sibling of the innerWrapper.
    const innerWrapper = inputElem.parentElement;
    const icon = innerWrapper.nextElementSibling;
    
    if (val === correctEn.toLowerCase()) {
        if (!inputElem.disabled) {
            writeRepeatScore++;
            document.getElementById('write-repeat-score').textContent = writeRepeatScore;
        }
        inputElem.style.backgroundColor = '#c8e6c9';
        inputElem.style.borderColor = '#4caf50';
        icon.textContent = '✅';
        inputElem.disabled = true; // Lock it if correct
        
        playAudio(correctEn); // Đọc từ vựng khi nhập đúng
        
        // Auto-focus next empty input
        const allInputs = document.querySelectorAll('.write-repeat-input');
        for (let i = 0; i < allInputs.length; i++) {
            if (!allInputs[i].disabled) {
                allInputs[i].focus();
                break;
            }
        }
    } else {
        inputElem.style.backgroundColor = 'transparent';
        inputElem.style.borderColor = '#bdbdbd';
        icon.textContent = '';
        
        if (val !== '' && correctEn.toLowerCase().startsWith(val)) {
             inputElem.style.borderColor = '#2196f3'; // partial correct indication
        }
    }
}

// ==========================================
// QUOTES SECTION LOGIC
// ==========================================

const billionaireQuotes = {
    "Bill Gates": [
        { en: "Success is a lousy teacher.", vi: "Thành công là một người thầy tồi." },
        { en: "Your most unhappy customers are your greatest source of learning.", vi: "Những khách hàng không hài lòng nhất chính là nguồn bài học lớn nhất của bạn." },
        { en: "It's fine to celebrate success but it is more important to heed the lessons of failure.", vi: "Ăn mừng thành công là tốt, nhưng quan trọng hơn là phải chú ý đến những bài học từ sự thất bại." },
        { en: "Don't compare yourself with anyone in this world.", vi: "Đừng so sánh bản thân mình với bất kỳ ai trên thế giới này." },
        { en: "If you are born poor it's not your mistake, but if you die poor it's your mistake.", vi: "Nếu bạn sinh ra trong nghèo khó, đó không phải là lỗi của bạn, nhưng nếu bạn chết trong nghèo khó, thì đó là lỗi của bạn." },
        { en: "Patience is a key element of success.", vi: "Sự kiên nhẫn là yếu tố then chốt của thành công." },
        { en: "Life is not fair — get used to it.", vi: "Cuộc sống vốn không công bằng — hãy quen với điều đó đi." },
        { en: "To win big, you sometimes have to take big risks.", vi: "Để thắng lớn, đôi khi bạn phải chấp nhận rủi ro lớn." },
        { en: "Technology is just a tool.", vi: "Công nghệ chỉ là một công cụ." },
        { en: "I believe innovation is the key to the future.", vi: "Tôi tin rằng sự đổi mới là chìa khóa của tương lai." }
    ],
    "Elon Musk": [
        { en: "When something is important enough, you do it even if the odds are not in your favor.", vi: "Khi một việc đủ quan trọng, bạn sẽ làm nó ngay cả khi rủi ro không đứng về phía bạn." },
        { en: "Failure is an option here.", vi: "Thất bại là một sự lựa chọn ở đây." },
        { en: "Some people don't like change, but you need to embrace change.", vi: "Một số người không thích sự thay đổi, nhưng bạn cần phải đón nhận nó." },
        { en: "Persistence is very important.", vi: "Sự kiên trì là rất quan trọng." },
        { en: "Work like hell.", vi: "Làm việc như điên." },
        { en: "If you get up in the morning and think the future will be better, it is a bright day.", vi: "Nếu bạn thức dậy vào buổi sáng và nghĩ rằng tương lai sẽ tốt đẹp hơn, đó là một ngày tươi sáng." },
        { en: "Great companies are built on great products.", vi: "Những công ty vĩ đại được xây dựng dựa trên những sản phẩm tuyệt vời." },
        { en: "I think it is possible for ordinary people to choose to be extraordinary.", vi: "Tôi nghĩ rằng những người bình thường hoàn toàn có thể chọn trở nên phi thường." },
        { en: "The first step is to establish that something is possible.", vi: "Bước đầu tiên là phải xác lập rằng một điều gì đó là khả thi." },
        { en: "You should take risks.", vi: "Bạn nên chấp nhận rủi ro." }
    ],
    "Warren Buffett": [
        { en: "The best investment you can make is in yourself.", vi: "Khoản đầu tư tốt nhất bạn có thể làm là đầu tư vào chính mình." },
        { en: "Risk comes from not knowing what you're doing.", vi: "Rủi ro đến từ việc bạn không biết mình đang làm gì." },
        { en: "Price is what you pay. Value is what you get.", vi: "Giá là những gì bạn trả. Giá trị là những gì bạn nhận được." },
        { en: "Someone is sitting in the shade today because someone planted a tree a long time ago.", vi: "Hôm nay có người đang ngồi trong bóng râm vì ai đó đã trồng một cái cây từ rất lâu rồi." },
        { en: "Honesty is a very expensive gift.", vi: "Sự trung thực là một món quà rất đắt giá." },
        { en: "Never invest in a business you cannot understand.", vi: "Đừng bao giờ đầu tư vào một doanh nghiệp mà bạn không thể hiểu." },
        { en: "It takes 20 years to build a reputation and five minutes to ruin it.", vi: "Mất 20 năm để xây dựng danh tiếng và 5 phút để hủy hoại nó." },
        { en: "The stock market is designed to transfer money from the impatient to the patient.", vi: "Thị trường chứng khoán được thiết kế để chuyển tiền từ kẻ thiếu kiên nhẫn sang người kiên nhẫn." },
        { en: "Opportunities come infrequently.", vi: "Cơ hội không đến thường xuyên." },
        { en: "Rule No.1: Never lose money.", vi: "Quy tắc 1: Không bao giờ để mất tiền." }
    ],
    "Jeff Bezos": [
        { en: "Your brand is what people say about you when you're not in the room.", vi: "Thương hiệu của bạn là những gì người ta nói về bạn khi bạn không có mặt." },
        { en: "If you double the number of experiments you do per year, you're going to double your inventiveness.", vi: "Nếu nhân đôi số lượng bthí nghiệm mỗi năm, bạn sẽ nhân đôi sức sáng tạo của mình." },
        { en: "Work hard, have fun, make history.", vi: "Làm việc chăm chỉ, vui vẻ, làm nên lịch sử." },
        { en: "Life's too short to hang out with people who aren't resourceful.", vi: "Cuộc sống quá ngắn ngủi để kết giao với những người không có chí tiến thủ." },
        { en: "We are stubborn on vision but flexible on details.", vi: "Chúng tôi kiên định về tầm nhìn nhưng linh hoạt về chi tiết." },
        { en: "If you don't understand the details of your business you are going to fail.", vi: "Nếu bạn không hiểu chi tiết về doanh nghiệp của mình, bạn sẽ thất bại." },
        { en: "Failure and invention are inseparable twins.", vi: "Thất bại và phát minh là cặp song sinh không thể tách rời." },
        { en: "Customer obsession is the secret.", vi: "Ám ảnh về khách hàng chính là bí quyết." },
        { en: "What we need to do is always lean into the future.", vi: "Những gì chúng ta cần làm là luôn hướng về tương lai." },
        { en: "The biggest risk is not taking any risk.", vi: "Rủi ro lớn nhất là không dám chấp nhận rủi ro nào." }
    ],
    "Jack Ma": [
        { en: "Never give up.", vi: "Đừng bao giờ từ bỏ." },
        { en: "Today is hard, tomorrow will be worse, but the day after tomorrow will be sunshine.", vi: "Hôm nay khó khăn, ngày mai sẽ còn tệ hơn, nhưng ngày mốt sẽ là ánh nắng." },
        { en: "If you don't give up, you still have a chance.", vi: "Nếu bạn không tới bỏ, bạn vẫn còn cơ hội." },
        { en: "Opportunities lie in the place where the complaints are.", vi: "Cơ hội nằm ở nơi có những lời phàn nàn." },
        { en: "A leader should be visionary.", vi: "Một nhà lãnh đạo cần có tầm nhìn." },
        { en: "You should learn from your competitor but never copy.", vi: "Bạn nên học từ đối thủ nhưng đừng bao giờ sao chép." },
        { en: "If you want to grow, find a good opportunity.", vi: "Nếu bạn muốn phát triển, hãy tìm một cơ hội tốt." },
        { en: "Small is beautiful.", vi: "Nhỏ gọn là một vẻ đẹp." },
        { en: "Help young people.", vi: "Hãy giúp đỡ những người trẻ." },
        { en: "Learn from mistakes.", vi: "Hãy học từ những sai lầm." }
    ],
    "Steve Jobs": [
        { en: "Stay hungry. Stay foolish.", vi: "Hãy cứ khát khao. Hãy cứ dại khờ." },
        { en: "Innovation distinguishes between a leader and a follower.", vi: "Sự đổi mới làm nên ranh giới giữa người lãnh đạo và kẻ theo sau." },
        { en: "Your time is limited.", vi: "Thời gian của bạn là hữu hạn." },
        { en: "Have the courage to follow your heart.", vi: "Hãy có can đảm làm theo trái tim mình." },
        { en: "Great things in business are never done by one person.", vi: "Những điều vĩ đại trong kinh doanh không bao giờ được làm bởi một người." },
        { en: "Design is not just what it looks like.", vi: "Thiết kế không chỉ là vẻ bề ngoài của nó." },
        { en: "The only way to do great work is to love what you do.", vi: "Cách duy nhất để làm nên công việc vĩ đại là yêu thích những gì bạn làm." },
        { en: "Sometimes life hits you in the head with a brick.", vi: "Đôi khi cuộc đời ném một viên gạch vào đầu bạn." },
        { en: "Quality is more important than quantity.", vi: "Chất lượng quan trọng hơn số lượng." },
        { en: "Think different.", vi: "Hãy nghĩ khác biệt." }
    ],
    "Mark Zuckerberg": [
        { en: "The biggest risk is not taking any risk.", vi: "Rủi ro lớn nhất là không dám nhận bất kỳ rủi ro nào." },
        { en: "Move fast and break things.", vi: "Di chuyển nhanh và phá vỡ mọi lề thói." },
        { en: "Ideas don't come out fully formed.", vi: "Những ý tưởng không nảy sinh một cách hoàn chỉnh từ ban đầu." },
        { en: "Find the thing you are super passionate about.", vi: "Hãy tìm thứ mà bạn cực kỳ đam mê." },
        { en: "People influence people.", vi: "Con người tạo sức ảnh hưởng lên con người." },
        { en: "The question isn't what we want to know about people.", vi: "Câu hỏi không phải là chúng ta muốn biết gì về mọi người." },
        { en: "Code wins arguments.", vi: "Code luôn thắng các cuộc tranh cãi." },
        { en: "The future is private.", vi: "Tương lai là sự riêng tư." },
        { en: "Done is better than perfect.", vi: "Hoàn thành tốt hơn là hoàn hảo." },
        { en: "Simple can be harder than complex.", vi: "Đơn giản đôi khi còn khó hơn phức tạp." }
    ],
    "Doanh nhân chung": [
        { en: "Dreams don't work unless you do.", vi: "Ước mơ sẽ không thành nếu bạn không hành động." },
        { en: "Hard work beats talent when talent doesn't work hard.", vi: "Chăm chỉ sẽ vượt qua tài năng khi tài năng không chăm chỉ." },
        { en: "Success usually comes to those who are too busy to be looking for it.", vi: "Thành công thường đến với những ai quá bận rộn để tìm kiếm nó." },
        { en: "Don't watch the clock; do what it does. Keep going.", vi: "Đừng nhìn đồng hồ; hãy làm như nó. Cứ tiếp tục tiến lên." },
        { en: "The secret of getting ahead is getting started.", vi: "Bí mật của việc tiến lên phía trước là bắt đầu." },
        { en: "Opportunities don't happen. You create them.", vi: "Cơ hội không tự dưng xảy ra. Bạn là người tạo ra chúng." },
        { en: "Success is not final, failure is not fatal.", vi: "Thành công không phải là điểm dừng, thất bại cũng không phải là điểm kết." },
        { en: "If you can dream it, you can do it.", vi: "Nếu bạn có thể mơ về nó, bạn có thể làm được." },
        { en: "The way to get started is to quit talking and begin doing.", vi: "Cách bắt đầu là ngừng nói và bắt tay vào làm." },
        { en: "The future belongs to those who believe in the beauty of their dreams.", vi: "Tương lai thuộc về những ai tin vào vẻ đẹp trong ước mơ của họ." },
        { en: "Believe you can and you're halfway there.", vi: "Tin rằng bạn có thể và bạn đã đi được một nửa chặng đường." },
        { en: "The harder you work for something, the greater you'll feel when you achieve it.", vi: "Càng làm việc vất vả vì điều gì, bạn càng thấy tuyệt khi đạt được nó." },
        { en: "Don't stop until you're proud.", vi: "Đừng dừng lại cho đến khi bạn tự hào." },
        { en: "Difficult roads often lead to beautiful destinations.", vi: "Những con đường nhiều chông gai thường dẫn đến những đích đến tuyệt đẹp." },
        { en: "Push yourself because no one else will do it for you.", vi: "Hãy tự thúc đẩy bản thân vì không ai khác sẽ làm điều đó thay bạn." },
        { en: "Success doesn't just find you.", vi: "Thành công không tự tìm đến với bạn." },
        { en: "Don't limit your challenges. Challenge your limits.", vi: "Đừng giới hạn các thử thách. Hãy thử thách những giới hạn của bản thân." },
        { en: "Great things never come from comfort zones.", vi: "Những điều vĩ đại không bao giờ xuất phát từ vùng an toàn." },
        { en: "Success is the sum of small efforts repeated daily.", vi: "Thành công là tổng hòa của những nỗ lực nhỏ lặp lại mỗi ngày." },
        { en: "Dream bigger. Do bigger.", vi: "Mơ lớn hơn. Làm lớn hơn." },
        { en: "Don't be afraid to give up the good to go for the great.", vi: "Đừng ngại bước ra khỏi cái tốt để đi tới cái vĩ đại." },
        { en: "Success is not how high you have climbed, but how you make a positive difference.", vi: "Thành công không phải là bạn đã leo cao tới đâu, mà là cách bạn tạo ra sự khác biệt tích cực." },
        { en: "Focus on being productive instead of busy.", vi: "Hãy tập trung vào việc hiệu quả thay vì bận rộn." },
        { en: "The key to success is to focus on goals.", vi: "Chìa khóa tới thành công là tập trung vào mục tiêu." },
        { en: "Do something today that your future self will thank you for.", vi: "Hãy làm một điều gì đó hôm nay để con người của bạn trong tương lai phải biết ơn." },
        { en: "Winners never quit and quitters never win.", vi: "Người chiến thắng không bao giờ bỏ cuộc và kẻ bỏ cuộc sẽ không bao giờ chiến thắng." },
        { en: "Believe in yourself and all that you are.", vi: "Hãy tin vào chính mình và vào tất cả những gì bạn đang có." },
        { en: "The best way to predict the future is to create it.", vi: "Cách tốt nhất để dự đoán tương lai là tạo ra nó." },
        { en: "If opportunity doesn't knock, build a door.", vi: "Nếu cơ hội không gõ cửa, hãy xây một cánh cửa." },
        { en: "Start where you are. Use what you have. Do what you can.", vi: "Bắt đầu từ nơi bạn đứng. Dùng những gì bạn có. Làm những gì bạn có thể." }
    ]
};

const motivationalQuotes = [
    { en: "No pain, no gain.", vi: "Không có nỗ lực thì không có thành quả." },
    { en: "Practice makes perfect.", vi: "Luyện tập tạo nên sự hoàn hảo." },
    { en: "Never give up.", vi: "Đừng bao giờ bỏ cuộc." },
    { en: "Believe in yourself.", vi: "Hãy tin vào bản thân." },
    { en: "Dream big.", vi: "Hãy mơ ước lớn." },
    { en: "Work hard, dream big.", vi: "Làm việc chăm chỉ, mơ ước lớn." },
    { en: "Nothing is impossible.", vi: "Không gì là không thể." },
    { en: "Success takes time.", vi: "Thành công cần thời gian." },
    { en: "Hard work pays off.", vi: "Chăm chỉ sẽ được đền đáp." },
    { en: "Where there is a will, there is a way.", vi: "Có chí thì nên." },

    { en: "Actions speak louder than words.", vi: "Hành động quan trọng hơn lời nói." },
    { en: "Better late than never.", vi: "Thà muộn còn hơn không." },
    { en: "The sky is the limit.", vi: "Không có giới hạn cho thành công." },
    { en: "Never stop learning.", vi: "Đừng bao giờ ngừng học hỏi." },
    { en: "Stay positive.", vi: "Hãy luôn tích cực." },
    { en: "Keep going.", vi: "Hãy tiếp tục tiến lên." },
    { en: "Make it happen.", vi: "Hãy biến nó thành hiện thực." },
    { en: "Push yourself.", vi: "Hãy thúc đẩy bản thân." },
    { en: "Focus on your goals.", vi: "Tập trung vào mục tiêu." },
    { en: "Great things take time.", vi: "Điều lớn lao cần thời gian." },

    { en: "Be stronger than your excuses.", vi: "Hãy mạnh mẽ hơn những lời biện minh." },
    { en: "Work until you succeed.", vi: "Làm việc cho đến khi thành công." },
    { en: "Small steps every day.", vi: "Mỗi ngày tiến một bước nhỏ." },
    { en: "Success is earned.", vi: "Thành công phải được tạo ra." },
    { en: "Don't stop until you're proud.", vi: "Đừng dừng lại cho đến khi bạn tự hào." },
    { en: "The best is yet to come.", vi: "Điều tốt đẹp nhất vẫn còn phía trước." },
    { en: "Create your own future.", vi: "Hãy tạo ra tương lai của chính mình." },
    { en: "Stay focused.", vi: "Hãy luôn tập trung." },
    { en: "Be fearless.", vi: "Hãy không sợ hãi." },
    { en: "The harder you work, the luckier you get.", vi: "Bạn càng chăm chỉ thì càng may mắn." },

    { en: "Turn dreams into plans.", vi: "Biến ước mơ thành kế hoạch." },
    { en: "Rise and grind.", vi: "Thức dậy và nỗ lực." },
    { en: "Chase your dreams.", vi: "Hãy theo đuổi ước mơ." },
    { en: "Great things never come easy.", vi: "Những điều vĩ đại không đến dễ dàng." },
    { en: "Make today count.", vi: "Hãy làm cho hôm nay có ý nghĩa." },
    { en: "Start now.", vi: "Hãy bắt đầu ngay." },
    { en: "Work smarter, not harder.", vi: "Làm việc thông minh hơn, không chỉ chăm chỉ." },
    { en: "Your only limit is you.", vi: "Giới hạn duy nhất là chính bạn." },
    { en: "Success is a journey.", vi: "Thành công là một hành trình." },
    { en: "Don't quit.", vi: "Đừng bỏ cuộc." },

    { en: "Aim high.", vi: "Hãy đặt mục tiêu cao." },
    { en: "Keep moving forward.", vi: "Hãy tiếp tục tiến về phía trước." },
    { en: "Believe and achieve.", vi: "Tin tưởng và đạt được." },
    { en: "Dream it. Do it.", vi: "Hãy mơ và thực hiện." },
    { en: "Success starts with effort.", vi: "Thành công bắt đầu từ nỗ lực." },
    { en: "Learn from failure.", vi: "Học từ thất bại." },
    { en: "Stay strong.", vi: "Hãy mạnh mẽ." },
    { en: "Keep improving.", vi: "Luôn cải thiện bản thân." },
    { en: "Be the best version of yourself.", vi: "Hãy trở thành phiên bản tốt nhất của chính mình." },
    { en: "Work for your dreams.", vi: "Hãy làm việc vì ước mơ của bạn." }
];

// ==========================================
// AI TOPIC GENERATOR LOGIC
// ==========================================

function openAITopicGenerator() {
    const modal = document.getElementById('ai-topic-generator-modal');
    if (modal) modal.style.display = 'flex';
}

function closeAITopicGenerator() {
    const modal = document.getElementById('ai-topic-generator-modal');
    if (modal) modal.style.display = 'none';
}

async function generateTopicWithAI() {
    const topicInput = document.getElementById('ai-topic-input').value.trim();
    
    if (!topicInput) {
        alert("Vui lòng nhập chủ đề bạn muốn học (Ví dụ: Đồ dùng học tập).");
        return;
    }
    
    const loadingDiv = document.getElementById('ai-topic-loading');
    const submitBtn = document.getElementById('ai-topic-submit');
    
    loadingDiv.style.display = 'flex';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.textContent = 'Đang tạo...';
    
    try {
        const prompt = `Tạo một danh sách 100 từ vựng tiếng Anh thuộc chủ đề: "${topicInput}". Trả về CHỈ một mảng JSON hợp lệ theo định dạng chính xác sau (không markdown, không giải thích): [{"en": "word1", "vi": "nghĩa 1", "emoji": "🌍"}, {"en": "word2", "vi": "nghĩa 2", "emoji": "🚗"}]`;
        
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        const textContent = data.text;
        
        // Trích xuất JSON bằng RegExp nếu AI cố tình wrap bằng markdown ```json ... ```
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('AI không trả về đúng định dạng JSON.');
        }
        
        const vocabArray = JSON.parse(jsonMatch[0]);
        
        if (!Array.isArray(vocabArray) || vocabArray.length === 0) {
            throw new Error('Dữ liệu từ vựng trống.');
        }
        
        // Inject into window.bundledTopics
        const topicId = 'ai_topic_' + new Date().getTime();
        window.bundledTopics[topicId] = vocabArray;
        
        // Save to localStorage
        let savedTopics = [];
        try {
            const stored = localStorage.getItem('savedAITopics');
            if (stored) savedTopics = JSON.parse(stored);
        } catch(e) {}
        
        savedTopics.push({
            id: topicId,
            title: `🤖 ${topicInput}`,
            data: vocabArray,
            timestamp: new Date().getTime()
        });
        localStorage.setItem('savedAITopics', JSON.stringify(savedTopics));
        
        // Re-render UI list
        renderSavedAITopics();
        
        alert(`🎉 Thành công! Đã tạo xong ${vocabArray.length} từ vựng cho chủ đề "${topicInput}".`);
        closeAITopicGenerator();
        
        // Mở game với chủ đề vừa tạo
        loadDynamicTopic(topicId, `🤖 ${topicInput}`);
        
    } catch (error) {
        console.error("AI Generation Error:", error);
        alert("Có lỗi xảy ra: " + error.message);
    } finally {
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.textContent = '✨ Tạo Bộ Từ Vựng';
    }
}

function loadSavedAITopics() {
    try {
        const stored = localStorage.getItem('savedAITopics');
        if (stored) {
            const savedTopics = JSON.parse(stored);
            savedTopics.forEach(topic => {
                // Ensure it exists in bundledTopics so games can load it
                window.bundledTopics[topic.id] = topic.data;
            });
            renderSavedAITopics();
        }
    } catch(e) {
        console.error("Error loading saved AI topics:", e);
    }
}

function renderSavedAITopics() {
    const listContainer = document.getElementById('saved-ai-topics-list');
    const gameTopicGridAi = document.getElementById('game-topic-grid-ai');
    
    if (listContainer) {
        listContainer.innerHTML = '';
        listContainer.style.display = 'grid';
        listContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
        listContainer.style.gap = '15px';
        listContainer.style.maxWidth = '800px';
        listContainer.style.margin = '0 auto';
        listContainer.style.padding = '10px';
    }
    
    if (gameTopicGridAi) {
        gameTopicGridAi.innerHTML = '';
    }
    
    let savedTopics = [];
    try {
        const stored = localStorage.getItem('savedAITopics');
        if (stored) savedTopics = JSON.parse(stored);
    } catch(e) { return; }
    
    if (savedTopics.length === 0) {
         if (listContainer) {
             listContainer.style.display = 'block';
             listContainer.innerHTML = '<p style="text-align: center; font-style: italic; color: #888; font-family: Nunito;">Bạn chưa tạo chủ đề AI nào. Hãy bấm "Tạo Mới Chủ Đề Khác" để bắt đầu!</p>';
         }
         return;
    }
    
    savedTopics.forEach(topic => {
        // --- Create card for Homepage List ---
        if (listContainer) {
            const card = document.createElement('div');
            card.className = 'topic-card';
            card.style.position = 'relative';
            card.style.backgroundColor = '#e0f2f1';
            card.style.borderColor = '#00897b';
            card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'topic-icon';
            iconDiv.textContent = '🤖';
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'topic-name';
            nameDiv.textContent = topic.title.replace('🤖 ', '');
            nameDiv.style.fontWeight = '900';
            nameDiv.style.color = '#00695c';
            
            const countDiv = document.createElement('div');
            countDiv.textContent = `${topic.data.length} từ`;
            countDiv.style.fontSize = '12px';
            countDiv.style.color = '#004d40';
            countDiv.style.fontFamily = 'Nunito, sans-serif';
            countDiv.style.marginTop = '4px';

            const delBtn = document.createElement('button');
            delBtn.textContent = '✖';
            delBtn.style.position = 'absolute';
            delBtn.style.top = '-8px';
            delBtn.style.right = '-8px';
            delBtn.style.background = '#ff5252';
            delBtn.style.color = 'white';
            delBtn.style.border = '2px solid #000';
            delBtn.style.borderRadius = '50%';
            delBtn.style.width = '24px';
            delBtn.style.height = '24px';
            delBtn.style.fontSize = '12px';
            delBtn.style.lineHeight = '20px';
            delBtn.style.cursor = 'pointer';
            delBtn.style.padding = '0';
            delBtn.style.zIndex = '5';
            delBtn.title = 'Xóa chủ đề này';
            
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Bạn có chắc muốn xóa chủ đề AI "${topic.title}" khỏi lịch sử?`)) {
                    deleteSavedAITopic(topic.id);
                }
            };
            
            card.onclick = () => {
                loadDynamicTopic(topic.id, topic.title);
            };
            
            card.appendChild(iconDiv);
            card.appendChild(nameDiv);
            card.appendChild(countDiv);
            card.appendChild(delBtn);
            listContainer.appendChild(card);
        }
        
        // --- Create card for Game Overlay ---
        if (gameTopicGridAi) {
            const gameCard = document.createElement('div');
            gameCard.className = 'topic-card';
            gameCard.style.backgroundColor = '#e0f2f1';
            gameCard.style.borderColor = '#00897b';
            
            const gameIconDiv = document.createElement('div');
            gameIconDiv.className = 'topic-icon';
            gameIconDiv.textContent = '🤖';
            
            const gameNameDiv = document.createElement('div');
            gameNameDiv.className = 'topic-name';
            gameNameDiv.textContent = topic.title.replace('🤖 ', '');
            gameNameDiv.style.fontWeight = '900';
            gameNameDiv.style.color = '#00695c';
            
            gameCard.onclick = () => {
                startSelectedGame(topic.id);
            };
            
            gameCard.appendChild(gameIconDiv);
            gameCard.appendChild(gameNameDiv);
            gameTopicGridAi.appendChild(gameCard);
        }
    });
}

function deleteSavedAITopic(topicId) {
    let savedTopics = [];
    try {
        const stored = localStorage.getItem('savedAITopics');
        if (stored) savedTopics = JSON.parse(stored);
        
        savedTopics = savedTopics.filter(t => t.id !== topicId);
        localStorage.setItem('savedAITopics', JSON.stringify(savedTopics));
        
        // Remove from bundledTopics to free memory
        if (window.bundledTopics[topicId]) {
             delete window.bundledTopics[topicId];
        }
        
        renderSavedAITopics();
    } catch(e) {
        console.error("Error deleting saved topic:", e);
    }
}

function openInspirationModal() {
    const modal = document.getElementById('inspiration-selection-modal');
    if (modal) modal.style.display = 'flex';
}

function closeInspirationModal() {
    const modal = document.getElementById('inspiration-selection-modal');
    if (modal) modal.style.display = 'none';
}

function openBillionaireSelection() {
    const grid = document.getElementById('billionaire-grid');
    grid.innerHTML = '';
    
    for (const person in billionaireQuotes) {
        let avatarHTML = '';
        
        switch(person) {
            case 'Bill Gates': avatarHTML = '<img src="Image typhu/bill gate.jpg" alt="Bill Gates" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #000; margin-bottom: 10px;">'; break;
            case 'Elon Musk': avatarHTML = '<img src="Image typhu/elon musk.jpg" alt="Elon Musk" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #000; margin-bottom: 10px;">'; break;
            case 'Warren Buffett': avatarHTML = '<img src="Image typhu/Warren Buffett.jpg" alt="Warren Buffett" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #000; margin-bottom: 10px;">'; break;
            case 'Jeff Bezos': avatarHTML = '<img src="Image typhu/Jeff Bezos.jpg" alt="Jeff Bezos" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #000; margin-bottom: 10px;">'; break;
            case 'Jack Ma': avatarHTML = '<img src="Image typhu/Jack Ma.jpg" alt="Jack Ma" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #000; margin-bottom: 10px;">'; break;
            case 'Steve Jobs': avatarHTML = '<img src="Image typhu/Steve Jobs.jpg" alt="Steve Jobs" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #000; margin-bottom: 10px;">'; break;
            case 'Mark Zuckerberg': avatarHTML = '<img src="Image typhu/Mark Zuckerberg.jpg" alt="Mark Zuckerberg" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #000; margin-bottom: 10px;">'; break;
            case 'Doanh nhân chung': avatarHTML = '<div style="font-size: 60px; margin-bottom: 10px;">🌍</div>'; break;
            default: avatarHTML = '<div style="font-size: 60px; margin-bottom: 10px;">👤</div>';
        }
        
        const card = document.createElement('div');
        card.style.background = '#f5f5f5';
        card.style.border = '3px solid #000';
        card.style.borderRadius = '12px';
        card.style.padding = '20px';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s, box-shadow 0.2s';
        card.style.boxShadow = '3px 3px 0 #000';
        card.className = 'topic-card-hover'; // To apply hover effect
        
        card.innerHTML = `
            ${avatarHTML}
            <div style="font-family: 'Quicksand'; font-weight: bold; font-size: 18px; color: #333;">${person}</div>
        `;
        
        card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-5px)');
        card.addEventListener('mouseleave', () => card.style.transform = '');
        
        card.onclick = () => {
            closeBillionaireSelection();
            openQuotesList(`Câu nói của ${person}`, billionaireQuotes[person]);
        };
        
        grid.appendChild(card);
    }
    
    document.getElementById('billionaire-selection-modal').style.display = 'flex';
}

function closeBillionaireSelection() {
    document.getElementById('billionaire-selection-modal').style.display = 'none';
}

function openMotivationalQuotes() {
    openQuotesList('50 Câu Truyền Động Lực', motivationalQuotes);
}

function openQuotesList(title, quotes) {
    document.getElementById('quotes-modal-title').textContent = title;
    
    const container = document.getElementById('quotes-list-container');
    container.innerHTML = '';
    
    quotes.forEach((q, index) => {
        const item = document.createElement('div');
        item.style.background = '#f9f9f9';
        item.style.border = '2px solid #ddd';
        item.style.borderRadius = '8px';
        item.style.padding = '15px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.gap = '15px';
        
        const textWrapper = document.createElement('div');
        textWrapper.style.flex = '1';
        
        const enDiv = document.createElement('div');
        enDiv.style.fontFamily = 'Nunito, sans-serif';
        enDiv.style.fontWeight = 'bold';
        enDiv.style.fontSize = '18px';
        enDiv.style.color = '#1f1f1f';
        enDiv.style.marginBottom = '5px';
        enDiv.innerHTML = `<span style="color: #4caf50; margin-right: 5px;">${index + 1}.</span> ${q.en}`;
        
        const viDiv = document.createElement('div');
        viDiv.style.fontFamily = 'Nunito, sans-serif';
        viDiv.style.fontSize = '16px';
        viDiv.style.color = '#555';
        viDiv.style.fontStyle = 'italic';
        viDiv.textContent = `→ ${q.vi}`;
        
        textWrapper.appendChild(enDiv);
        textWrapper.appendChild(viDiv);
        
        const audioBtn = document.createElement('button');
        audioBtn.innerHTML = '🔊';
        audioBtn.style.background = '#e3f2fd';
        audioBtn.style.border = '2px solid #2196f3';
        audioBtn.style.borderRadius = '50%';
        audioBtn.style.width = '40px';
        audioBtn.style.height = '40px';
        audioBtn.style.cursor = 'pointer';
        audioBtn.style.fontSize = '18px';
        audioBtn.style.flexShrink = '0';
        audioBtn.onclick = () => playAudio(q.en); // Use existing TTS function
        
        item.appendChild(textWrapper);
        item.appendChild(audioBtn);
        
        container.appendChild(item);
    });
    
    document.getElementById('quotes-list-modal').style.display = 'flex';
}

function closeQuotesList() {
    document.getElementById('quotes-list-modal').style.display = 'none';
}

// ==========================================
// HANDWRITING PRACTICE FEATURE (BẢNG VIẾT TAY)
// ==========================================

let handwritingData = [];
let handwritingIndex = 0;
let isDrawing = false;
let handwritingCanvasBase = null;
let handwritingCtx = null;
let canvasHasDrawing = false;

function initHandwritingCanvas() {
    if (!handwritingCanvasBase) {
        handwritingCanvasBase = document.getElementById('handwriting-canvas');
        if(!handwritingCanvasBase) return;
        handwritingCtx = handwritingCanvasBase.getContext('2d');
        
        // Setup drawing style
        handwritingCtx.strokeStyle = '#222';
        handwritingCtx.lineWidth = 4;
        handwritingCtx.lineCap = 'round';
        handwritingCtx.lineJoin = 'round';
        
        // Handle resize/DPI logic
        const rect = handwritingCanvasBase.parentElement.getBoundingClientRect();
        handwritingCanvasBase.width = rect.width;
        handwritingCanvasBase.height = rect.height;
        
        // Event Listeners
        const getPos = (e) => {
            const rect = handwritingCanvasBase.getBoundingClientRect();
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
            }
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        const startDrawing = (e) => {
            e.preventDefault();
            isDrawing = true;
            canvasHasDrawing = true;
            const pos = getPos(e);
            handwritingCtx.beginPath();
            handwritingCtx.moveTo(pos.x, pos.y);
        };
        
        const draw = (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            handwritingCtx.lineTo(pos.x, pos.y);
            handwritingCtx.stroke();
        };

        const stopDrawing = (e) => {
            if (isDrawing) {
                e.preventDefault();
                isDrawing = false;
            }
        };

        handwritingCanvasBase.addEventListener('mousedown', startDrawing);
        handwritingCanvasBase.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stopDrawing);
        
        handwritingCanvasBase.addEventListener('touchstart', startDrawing, {passive: false});
        handwritingCanvasBase.addEventListener('touchmove', draw, {passive: false});
        window.addEventListener('touchend', stopDrawing);
    } else {
        // Just resize in case container changed
        const rect = handwritingCanvasBase.parentElement.getBoundingClientRect();
        if (rect.width && rect.height) {
            handwritingCanvasBase.width = rect.width;
            handwritingCanvasBase.height = rect.height;
            handwritingCtx.strokeStyle = '#222';
            handwritingCtx.lineWidth = 4;
            handwritingCtx.lineCap = 'round';
            handwritingCtx.lineJoin = 'round';
        }
    }
}

function clearHandwritingCanvas() {
    if (!handwritingCtx || !handwritingCanvasBase) return;
    handwritingCtx.clearRect(0, 0, handwritingCanvasBase.width, handwritingCanvasBase.height);
    canvasHasDrawing = false;
}

function showHandwritingAnswer() {
    document.getElementById('handwriting-answer-layer').style.display = 'flex';
}

function retryCurrentHandwriting() {
    document.getElementById('handwriting-answer-layer').style.display = 'none';
    clearHandwritingCanvas();
}

function nextHandwritingWord() {
    handwritingIndex++;
    if (handwritingIndex >= handwritingData.length) {
        alert("🎉 Chúc mừng bạn đã hoàn thành phần luyện viết tay!");
        closeHandwritingModal();
        return;
    }
    renderHandwritingWord();
}

function playHandwritingAudio() {
    const currentWord = handwritingData[handwritingIndex];
    if (currentWord && currentWord.en) {
        playAudio(currentWord.en);
    }
}

function renderHandwritingWord() {
    const currentWord = handwritingData[handwritingIndex];
    if (!currentWord) return;
    
    document.getElementById('handwriting-progress-text').textContent = (handwritingIndex + 1) + "/" + handwritingData.length;
    let percentage = ((handwritingIndex + 1) / handwritingData.length) * 100;
    document.getElementById('handwriting-progress-bar').style.width = percentage + "%";
    
    document.getElementById('handwriting-target-vi').textContent = currentWord.vi;
    document.getElementById('handwriting-answer-text').textContent = currentWord.en;
    
    clearHandwritingCanvas();
    document.getElementById('handwriting-answer-layer').style.display = 'none';
}

function openHandwritingModal(dataArray) {
    if (!dataArray || dataArray.length === 0) return;
    handwritingData = [...dataArray];
    
    // Shuffle the array for randomness
    handwritingData.sort(() => Math.random() - 0.5);
    
    handwritingIndex = 0;
    document.getElementById('handwriting-modal').style.display = 'flex';
    
    // Slight delay to allow modal to render before init canvas (to get correct rect width)
    setTimeout(() => {
        initHandwritingCanvas();
        renderHandwritingWord();
    }, 100);
}

function closeHandwritingModal() {
    document.getElementById('handwriting-modal').style.display = 'none';
    clearHandwritingCanvas();
}

// BINDINGS FOR SPECIFIC TOPICS
function loadDynHandwritingPractice() {
    if(!currentDynTopicData || currentDynTopicData.length === 0) {
        alert("Chưa có dữ liệu chủ đề!");
        return;
    }
    openHandwritingModal(currentDynTopicData);
}

function loadAnimalHandwritingPractice() {
    openHandwritingModal(commonAnimals);
}

function loadVehicleHandwritingPractice() {
    openHandwritingModal(commonVehicles);
}

function loadFoodHandwritingPractice() {
    openHandwritingModal(commonFruits);
}

// ==========================================
// GRAMMAR WORKSHEET FEATURE
// ==========================================

const grammarWorksheetData = {
    sorry_for_about: {
        rules: [
            { title: "sorry for", desc: "what I did<br>(an action)" },
            { title: "sorry about", desc: "a situation / thing<br>(the noise, the news)" }
        ],
        questions: [
            {
                prefix: "I'm ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>thing</div>the noise outside.</span>",
                answer: "sorry about"
            },
            {
                prefix: "She's ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>action</div>not calling you back.</span>",
                answer: "sorry for"
            },
            {
                prefix: "We're ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block; border-bottom: 2px solid #222; padding-bottom: 2px;'><div class='gw-hint-text' style='top:-22px; right:-20px;'></div>the bad weather</span> today.",
                answer: "sorry about"
            }
        ]
    },
    in_on_at: {
        rules: [
            { title: "in", desc: "tháng, năm, mùa<br>nơi chốn lớn (thành phố...)" },
            { title: "on", desc: "ngày trong tuần<br>bề mặt phẳng" },
            { title: "at", desc: "giờ giấc cụ thể<br>địa điểm cụ thể" }
        ],
        questions: [
            {
                prefix: "I will meet you ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>giấc cụ thể</div>5 PM.</span>",
                answer: "at"
            },
            {
                prefix: "My birthday is ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>tháng</div>August.</span>",
                answer: "in"
            },
            {
                prefix: "Do you have class ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>thứ trong tuần</div>Monday?</span>",
                answer: "on"
            }
        ]
    },
    much_many: {
        rules: [
            { title: "much", desc: "danh từ KHÔNG đếm được<br>(water, money, time)" },
            { title: "many", desc: "danh từ đếm được số nhiều<br>(books, friends, days)" }
        ],
        questions: [
            {
                prefix: "How ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>không đếm được</div>time do we have left?</span>",
                answer: "much"
            },
            {
                prefix: "I don't have ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>số nhiều</div>friends in this city.</span>",
                answer: "many"
            },
            {
                prefix: "She didn't drink ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>không đếm được</div>water today.</span>",
                answer: "much"
            }
        ]
    },
    make_do: {
        rules: [
            { title: "make", desc: "tạo ra, sản xuất cái mới<br>(make a cake, make a mistake)" },
            { title: "do", desc: "hành động, công việc chung<br>(do homework, do business)" }
        ],
        questions: [
            {
                prefix: "I need to ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>việc chung</div>my homework.</span>",
                answer: "do"
            },
            {
                prefix: "She loves to ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>tạo mới</div>dinner for her family.</span>",
                answer: "make"
            },
            {
                prefix: "Don't ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>tạo mới</div>a sound!</span>",
                answer: "make"
            }
        ]
    },
    say_tell: {
        rules: [
            { title: "say", desc: "nói ra điều gì đó<br>(say hello, say something)" },
            { title: "tell", desc: "kể cho ai đó nghe<br>(tell me a story, tell him)" }
        ],
        questions: [
            {
                prefix: "Can you ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>kể cho ai</div>me the truth?</span>",
                answer: "tell"
            },
            {
                prefix: "Did he ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>nói lời</div>goodbye?</span>",
                answer: "say"
            },
            {
                prefix: "Please don't ",
                suffix: "&nbsp;<span style='position:relative; display:inline-block;'><div class='gw-hint-text' style='top:-30px;'>kể cho ai</div>anyone my secret.</span>",
                answer: "tell"
            }
        ]
    }
};

function showGrammarWorksheet() {
    showPage('grammar-worksheet');
    const select = document.getElementById('grammar-rule-select');
    if(select) {
        loadGrammarWorksheetRule(select.value);
    }
}

function loadGrammarWorksheetRule(ruleKey) {
    const container = document.getElementById('grammar-ws-container');
    if(!container) return;
    
    const data = grammarWorksheetData[ruleKey];
    if(!data) {
        container.innerHTML = '<div style="text-align:center; padding: 20px; font-family: Quicksand; font-size: 20px;">Dữ liệu bài tập đang được cập nhật...</div>';
        return;
    }
    
    const bgColors = ['#f8eee4', '#e3f2fd', '#fff3e0', '#f0f0f0'];
    let rulesHtml = data.rules.map((r, index) => `
        <div class="gw-rule-side" style="background: ${bgColors[index % bgColors.length]}; ${index !== data.rules.length - 1 ? 'border-right: 4px solid #ccc;' : ''}">
            <div class="gw-rule-title">${r.title}</div>
            <div class="gw-rule-desc">${r.desc}</div>
        </div>
    `).join('');
    
    let html = `
        <div class="gw-rule-card">
            ${rulesHtml}
        </div>
        
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <button id="gw-mode-btn" class="gw-mode-btn" onclick="toggleGwDrawMode()">🖍️ Bật chế độ Viết Tay</button>
            <button id="gw-clear-btn" class="gw-clear-btn" onclick="clearGwCanvas()">Xóa Mực</button>
        </div>
        
        <div class="gw-list-wrapper">
            <canvas id="gw-draw-canvas" class="gw-draw-canvas"></canvas>
            <div class="gw-question-list" id="gw-question-list">
    `;
    
    data.questions.forEach((q, idx) => {
        html += `
            <div class="gw-question-item" id="gw-item-${idx}">
                <div class="gw-checkbox" id="gw-check-${idx}" onclick="toggleGwCheck(${idx})"></div>
                <div style="position: relative; display: flex; align-items: flex-end; flex-wrap: wrap; width: 100%;">
                    <span>${q.prefix}</span>
                    <div class="gw-input-wrapper">
                        <input type="text" class="gw-blank-input" id="gw-input-${idx}" data-ans="${q.answer}" autocomplete="off" autocorrect="off" spellcheck="false" oninput="checkGwAnswer(${idx})">
                        <div class="gw-reveal-ans" id="gw-reveal-${idx}">${q.answer}</div>
                    </div>
                    <span>${q.suffix}</span>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        <div style="text-align: center; margin-top: 50px;">
            <button id="gw-submit-btn" onclick="checkAllGwAnswers()" style="padding: 12px 40px; font-size: 22px; font-family: 'Quicksand'; font-weight: 800; background: #2196f3; color: white; border: 4px solid #222; border-radius: 12px; cursor: pointer; box-shadow: 4px 4px 0 #222; transition: transform 0.1s;">Nộp Bài / Kiểm Tra</button>
            <button id="gw-reveal-btn" onclick="revealGwAnswers()" style="display:none; padding: 12px 40px; font-size: 22px; font-family: 'Quicksand'; font-weight: 800; background: #8bc34a; color: white; border: 4px solid #222; border-radius: 12px; cursor: pointer; box-shadow: 4px 4px 0 #222; transition: transform 0.1s;">Hiện Đáp Án</button>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Initialize drawing mode off by default
    gwDrawMode = false;
    initGwCanvas();
}

let gwDrawMode = false;
let gwCanvas, gwCtx;
let gwDrawing = false;
let gwLastX = 0, gwLastY = 0;

function initGwCanvas() {
    gwCanvas = document.getElementById('gw-draw-canvas');
    if(!gwCanvas) return;
    gwCtx = gwCanvas.getContext('2d');
    
    // Resize observer or manual resize
    function resizeCanvas() {
        if(!gwCanvas) return;
        const rect = gwCanvas.parentElement.getBoundingClientRect();
        gwCanvas.width = rect.width;
        gwCanvas.height = rect.height;
        gwCtx.lineCap = 'round';
        gwCtx.lineJoin = 'round';
        gwCtx.lineWidth = 4;
        gwCtx.strokeStyle = '#1e88e5'; // Blue ink
    }
    
    // We need to wait a tiny bit for the layout to settle before resizing
    setTimeout(resizeCanvas, 100);
    window.addEventListener('resize', resizeCanvas);
    
    // Events
    gwCanvas.addEventListener('mousedown', startGwDraw);
    gwCanvas.addEventListener('mousemove', drawGw);
    gwCanvas.addEventListener('mouseup', endGwDraw);
    gwCanvas.addEventListener('mouseout', endGwDraw);
    
    gwCanvas.addEventListener('touchstart', startGwDraw, {passive: false});
    gwCanvas.addEventListener('touchmove', drawGw, {passive: false});
    gwCanvas.addEventListener('touchend', endGwDraw);
}

function startGwDraw(e) {
    if(!gwDrawMode) return;
    if(e.type === 'touchstart') e.preventDefault();
    gwDrawing = true;
    const pos = getGwPos(e);
    gwLastX = pos.x;
    gwLastY = pos.y;
}

function drawGw(e) {
    if(!gwDrawing || !gwDrawMode) return;
    if(e.type === 'touchmove') e.preventDefault();
    
    const pos = getGwPos(e);
    gwCtx.beginPath();
    gwCtx.moveTo(gwLastX, gwLastY);
    gwCtx.lineTo(pos.x, pos.y);
    gwCtx.stroke();
    gwLastX = pos.x;
    gwLastY = pos.y;
}

function endGwDraw() {
    gwDrawing = false;
}

function getGwPos(evt) {
    const rect = gwCanvas.getBoundingClientRect();
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    
    if (evt.touches && evt.touches.length > 0) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
    }
    
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function toggleGwDrawMode() {
    gwDrawMode = !gwDrawMode;
    const btn = document.getElementById('gw-mode-btn');
    const clearBtn = document.getElementById('gw-clear-btn');
    const canvas = document.getElementById('gw-draw-canvas');
    const inputs = document.querySelectorAll('.gw-blank-input');
    const submitBtn = document.getElementById('gw-submit-btn');
    const revealBtn = document.getElementById('gw-reveal-btn');
    
    if(gwDrawMode) {
        btn.classList.add('active');
        btn.textContent = "🖍️ Tắt chế độ Viết Tay";
        canvas.style.pointerEvents = "auto";
        clearBtn.style.display = "inline-block";
        submitBtn.style.display = "none";
        revealBtn.style.display = "inline-block";
        
        inputs.forEach(inp => {
            inp.style.pointerEvents = "none";
            inp.value = ""; // Clear text if they switch to drawing
            inp.classList.remove('correct', 'wrong');
        });
        
        // Hide reveals if they switch back to draw mode
        document.querySelectorAll('.gw-reveal-ans').forEach(r => r.style.display = "none");
        
    } else {
        btn.classList.remove('active');
        btn.textContent = "🖍️ Bật chế độ Viết Tay";
        canvas.style.pointerEvents = "none";
        clearBtn.style.display = "none";
        submitBtn.style.display = "inline-block";
        revealBtn.style.display = "none";
        
        inputs.forEach(inp => {
            inp.style.pointerEvents = "auto";
        });
        
        document.querySelectorAll('.gw-reveal-ans').forEach(r => r.style.display = "none");
    }
}

function clearGwCanvas() {
    if(!gwCtx || !gwCanvas) return;
    gwCtx.clearRect(0, 0, gwCanvas.width, gwCanvas.height);
}

function revealGwAnswers() {
    document.querySelectorAll('.gw-reveal-ans').forEach(r => {
        r.style.display = "block";
    });
}

function checkGwAnswer(idx) {
    const input = document.getElementById(`gw-input-${idx}`);
    if(!input) return;
    
    const correctAns = input.getAttribute('data-ans').toLowerCase().trim();
    const userVal = input.value.toLowerCase().trim();
    const checkbox = document.getElementById(`gw-check-${idx}`);
    
    // Remove previous states while typing
    input.classList.remove('correct', 'wrong');
    if(checkbox) checkbox.classList.remove('correct');
    
    if (userVal === correctAns) {
        input.classList.add('correct');
        if(checkbox) checkbox.classList.add('correct');
    }
}

function checkAllGwAnswers() {
    const inputs = document.querySelectorAll('.gw-blank-input');
    let allCorrect = true;
    inputs.forEach((input, i) => {
        const correctAns = input.getAttribute('data-ans').toLowerCase().trim();
        const userVal = input.value.toLowerCase().trim();
        const checkbox = document.getElementById(`gw-check-${i}`);
        
        input.classList.remove('correct', 'wrong');
        if(checkbox) checkbox.classList.remove('correct');
        
        if (userVal === correctAns) {
            input.classList.add('correct');
            if(checkbox) checkbox.classList.add('correct');
        } else {
            input.classList.add('wrong');
            allCorrect = false;
        }
    });
    
    if(allCorrect && inputs.length > 0) {
        alert("🎉 Chúc mừng! Bạn đã hoàn thành chính xác bài tập ngữ pháp này.");
    }
}

function toggleGwCheck(idx) {
    const checkbox = document.getElementById(`gw-check-${idx}`);
    if(checkbox) {
        checkbox.classList.toggle('correct');
    }
}
