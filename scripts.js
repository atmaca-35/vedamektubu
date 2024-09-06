document.addEventListener('DOMContentLoaded', async () => {
    const searchBox = document.getElementById('searchBox');
    const resultDiv = document.getElementById('result');
    const ghostText = document.getElementById('ghostText');
    const searchContainer = document.querySelector('.search-box');
    const wordCountElement = document.getElementById('wordCount');

    let dictionaryData = {};
    let lastQuery = '';
    let hasError = false;

    const clickableWords = {
        "+dAm": [["a", "b", "c"], ["d","e","f"]],
        
    };

    try {
        const response = await fetch('vocabulary.json');
        if (!response.ok) {
            throw new Error('Yoksa bir yerlerde bir harf mi kayıp?');
        }
        dictionaryData = await response.json();

        const wordCount = Object.keys(dictionaryData).length;
        wordCountElement.innerHTML = `Türk dilinin <span class="highlight">${wordCount}</span> maddelik arkeolojisi.`;
    } catch (error) {
        console.error('Yoksa bir yerlerde bir harf mi kayıp?', error);
        hasError = true;

        wordCountElement.innerHTML = `<p class="error-message">Yoksa bir yerlerde bir harf mi kayıp?</p>`;

        searchContainer.classList.add('error');
        resultDiv.classList.add('hidden');
        ghostText.classList.add('hidden');
    }

    function searchWord(query) {
        if (query === lastQuery) {
            return;
        }
        lastQuery = query;

        resultDiv.innerHTML = '';

        if (query.startsWith(' ') || query.trim().length === 0) {
            if (query.length === 0) {
                searchContainer.classList.remove('error');
                ghostText.textContent = "";
                return;
            }
            searchContainer.classList.add('error');
            ghostText.textContent = "";
            return;
        } else {
            searchContainer.classList.remove('error');
        }

        const normalizedQuery = normalizeTurkish(query);

        const sortedWords = Object.keys(dictionaryData)
            .map(word => ({ word: normalizeTurkish(word), original: word }))
            .sort((a, b) => a.word.localeCompare(b.word));

        const closestWord = sortedWords
            .find(({ word }) => word.startsWith(normalizedQuery));

        if (closestWord) {
            const wordDetails = dictionaryData[closestWord.original];
            const description = wordDetails.a.replace(/\n/g, "<br>");
            const descriptionElement = document.createElement('p');
            descriptionElement.classList.add('description');
            descriptionElement.innerHTML = highlightWords(sanitizeHTML(description));
            resultDiv.appendChild(descriptionElement);

            const descriptionHeight = descriptionElement.offsetHeight;
            descriptionElement.style.maxHeight = `${descriptionHeight}px`;

            // Fade-in animasyonu ekleniyor
            resultDiv.style.animation = 'fadeIn 1s ease-in-out';

            ghostText.textContent = closestWord.word.substring(query.length);
        } else {
            ghostText.textContent = "";
            searchContainer.classList.add('error');
        }

        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'fadeIn 1s ease-in-out';

        createClickableWords();
    }

    function createClickableWords() {
        Object.keys(clickableWords).forEach(word => {
            const regex = new RegExp(`(${word.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")})`, 'gi');
            resultDiv.innerHTML = resultDiv.innerHTML.replace(regex, `<span class="clickable-word" style="color: #e9d677; cursor: pointer;">$1</span>`);
        });

        // Tıklanabilir kelimeleri seçiyoruz
        const clickableElements = document.querySelectorAll('.clickable-word');

        clickableElements.forEach(element => {
            element.addEventListener('click', function () {
                
                const word = this.textContent;
                this.style.textDecoration = 'underline'; // Altı çizili yap
                showWordMeanings(word, this);
            });
        });
    }



    function showWordMeanings(word, element) {
        const meanings = clickableWords[word];

        // Mevcut olan tüm tooltiplere bakıyoruz ve varsa kaldırıyoruz
        const existingTooltips = document.querySelectorAll('.tooltip');
        existingTooltips.forEach(tooltip => tooltip.remove());

        if (meanings && meanings.length > 0) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            const random = Math.floor(Math.random() * meanings.length);
            var meaning = "";
            meanings[random].forEach(tempMeaning => meaning += tempMeaning + "<br>")
            tooltip.innerHTML = meaning;

            document.body.appendChild(tooltip);

            const elementRect = element.getBoundingClientRect();
            tooltip.style.position = 'absolute';
            tooltip.style.display = 'block';

            // Tooltip boyutu hesaplanıyor
            const tooltipRect = tooltip.getBoundingClientRect();

            // window.scrollY ve scrollX ile konum hesaplanıyor
            const top = elementRect.top + window.scrollY - tooltipRect.height - 5;
            const left = elementRect.left + window.scrollX + (elementRect.width / 2) - (tooltipRect.width / 2);

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;

            // Tooltip görünüm animasyonu
            tooltip.style.opacity = 0;
            tooltip.style.transition = 'opacity 0.3s ease-in-out';
            setTimeout(() => {
                tooltip.style.opacity = 1;
            }, 50); // Kısa bir gecikme ile görünür hale geliyor

            // Alt çizgi ekliyoruz
            element.style.textDecoration = 'underline';

            element.addEventListener('mouseleave', function () {
                // Tooltip kaybolma animasyonu
                tooltip.style.opacity = 0;
                setTimeout(() => {
                    tooltip.remove();
                    // Alt çizgiyi kaldırıyoruz
                    element.style.textDecoration = 'none';
                }, 300); // Animasyon süresi kadar bekle
            });
        }
    }




    function normalizeTurkish(text) {
        return text.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
    }

    function sanitizeHTML(htmlString) {
        return DOMPurify.sanitize(htmlString, {
            ALLOWED_TAGS: ['b', 'span', 'i', 'em', 'strong', 'a', 'br'],
            ALLOWED_ATTR: ['href', 'class'],
        });
    }

    function highlightWords(text) {
        const specialWords = {
            '00': 'Türkiye Türkçesi',
            '02': 'Azerbaycan Türkçesi',
            '03': 'Çuvaşça',
            '04': 'Halaçça',
            '05': 'Moğolca',
            '06': 'Arapça',
            '07': 'Karahanlı Türkçesi',
            '08': 'Kazak Türkçesi',
            '09': 'Kırgızca',
        };

        let markedText = text;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            markedText = markedText.replace(regex, (match) => `[SPECIAL:${key}]`);
        }

        let resultText = markedText;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\[SPECIAL:${key}\\](\\s+)(\\S+)`, 'gi');
            resultText = resultText.replace(regex, (match, p1, p2) => `<b>${value}</b>${p1}<span class="pink">${p2}</span>`);
        }

        resultText = resultText.replace(/\[SPECIAL:\S+\]/g, '');

        return resultText;
    }

    function updateSearchBoxPlaceholder(query) {
        const queryLower = normalizeTurkish(query);
        const matchingWord = Object.keys(dictionaryData)
            .map(word => ({ word: normalizeTurkish(word), original: word }))
            .sort((a, b) => a.word.localeCompare(b.word))
            .find(({ word }) => word.startsWith(queryLower));

        if (matchingWord) {
            const remainingPart = matchingWord.word.substring(query.length);
            ghostText.textContent = remainingPart;

            const inputRect = searchBox.getBoundingClientRect();
            const inputStyle = window.getComputedStyle(searchBox);
            const paddingLeft = parseFloat(inputStyle.paddingLeft);
            const fontSize = parseFloat(inputStyle.fontSize);

            const firstCharWidth = getTextWidth(query, fontSize);
            ghostText.style.left = `${paddingLeft + firstCharWidth}px`;
        } else {
            ghostText.textContent = "";
        }
    }

    function getTextWidth(text, fontSize) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px 'Poppins', sans-serif`;
        return context.measureText(text).width;
    }

    searchBox.addEventListener('input', () => {
        const query = searchBox.value;
        updateSearchBoxPlaceholder(query);
        searchWord(query);
    });
});
