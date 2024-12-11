const navMenu = document.getElementById('nav-menu');

// Toggle the hamburger menu and menu visibility
    function myFunction(x) {
        x.classList.toggle("change");
        navMenu.classList.toggle('show');
    }

    // Close the menu
    function closeMenu() {
        navMenu.classList.remove('show');
        document.querySelector('.container').classList.remove('change');
    }