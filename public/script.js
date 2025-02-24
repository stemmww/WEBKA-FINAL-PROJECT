document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const themeToggle = document.getElementById('themeToggle');

    const savedUsername = localStorage.getItem('username');
    if (!savedUsername) {
        return;
    }else{
        document.getElementById('usernameDisplay').textContent = savedUsername;
        showPreferences();
    }
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('username'); 
        window.location.href = 'profile.html';  
    });

    function showPreferences() {
        logoutBtn.style.display = 'block';
        preferencesSection.style.display = 'block';
    }
});


const hamBurger = document.querySelector(".toggle-btn");
const sidebar = document.querySelector("#sidebar");

function checkScreenSize() {
    if (window.innerWidth >= 989) {
        sidebar.classList.add("expand");
    } else {
        sidebar.classList.remove("expand");
    }
}

hamBurger.addEventListener("click", function () {
    sidebar.classList.toggle("expand");
});

window.addEventListener("load", checkScreenSize);
window.addEventListener("resize", checkScreenSize);

const stars = document.querySelectorAll('.star');

stars.forEach((star, index) => {
    star.addEventListener('click', () => {
        stars.forEach(s => s.classList.remove('selected'));
        for (let i = 0; i <= index; i++) {
            stars[i].classList.add('selected');
        }
    });
});

