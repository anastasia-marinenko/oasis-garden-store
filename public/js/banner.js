const slides = document.querySelector('.banner .slides');
const indicators = document.querySelectorAll('.banner .indicators button');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
let currentIndex = 0;
const totalSlides = 10;
const slideWidth = 100 / totalSlides; // Percentage width of one slide
let autoSlide;

function updateSlide(index) {
    slides.style.transform = `translateX(-${index * slideWidth}%)`;
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSlide(currentIndex);
}

function prevSlide() {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateSlide(currentIndex);
}

function startAutoSlide() {
    autoSlide = setInterval(nextSlide, 5000); // Auto change every 10 seconds
}

function stopAutoSlide() {
    clearInterval(autoSlide);
}

// Події для кнопок
prevButton.addEventListener('click', () => {
    stopAutoSlide();
    prevSlide();
    startAutoSlide();
});

nextButton.addEventListener('click', () => {
    stopAutoSlide();
    nextSlide();
    startAutoSlide();
});

// Події для індикаторів
indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
        stopAutoSlide();
        currentIndex = index;
        updateSlide(currentIndex);
        startAutoSlide();
    });
});

// Start autoslide change
startAutoSlide();