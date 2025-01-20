document.addEventListener("DOMContentLoaded", () => {
    const mainPhoto = document.getElementById("main-photo");
    const thumbnails = document.querySelectorAll(".thumbnail");
    const prevBtn = document.querySelector(".prev-btn");
    const nextBtn = document.querySelector(".next-btn");
    const quantityInput = document.getElementById("quantity");
    const decreaseBtn = document.getElementById("decrease");
    const increaseBtn = document.getElementById("increase");

    let currentIndex = 0;

    // Change the main photo when clicking on thumbnails
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener("click", () => {
            mainPhoto.src = thumbnail.src;
            thumbnails[currentIndex].classList.remove("active");
            currentIndex = index;
            thumbnail.classList.add("active");
        });
    });

    // Smooth transition of photo
    const changePhoto = (direction) => {
        thumbnails[currentIndex].classList.remove("active");
        currentIndex = (currentIndex + direction + thumbnails.length) % thumbnails.length;
        mainPhoto.src = thumbnails[currentIndex].src;
        thumbnails[currentIndex].classList.add("active");
    };

    prevBtn.addEventListener("click", () => changePhoto(-1));
    nextBtn.addEventListener("click", () => changePhoto(1));

    // Buttons "+" and "-" to change the quantity
    decreaseBtn.addEventListener("click", () => {
        if (quantityInput.value > 1) {
            quantityInput.value--;
        }
    });

    increaseBtn.addEventListener("click", () => {
        quantityInput.value++;
    });
});
