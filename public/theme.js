document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.checked = true; 
    }
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }
});
