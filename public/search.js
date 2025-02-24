document.getElementById("searchButton").addEventListener("click", function() {
    document.getElementById("searchPopup").style.display = "flex";
    document.getElementById("searchInput").focus(); // Focus on input when opened
});
  
  document.getElementById("closePopup").addEventListener("click", function() {
    document.getElementById("searchPopup").style.display = "none";
});
  
  document.getElementById("searchPopup").addEventListener("click", function(event) {
    if (event.target === this) {
      this.style.display = "none";
    }
  });

document.getElementById("searchInput").addEventListener("input", function() {
    const searchQuery = this.value.toLowerCase();
    const cards = document.querySelectorAll("#cardContainer .col-md-3");

    cards.forEach(card => {
        const title = card.querySelector(".card-title").textContent.toLowerCase();

        if (title.includes(searchQuery)) {
            card.style.display = "block"; 
        } else {
            card.style.display = "none"; 
        }
    });
});