require('../css/app.css');

//function drop nav-side
let $navLeaver = document.getElementById('nav-dropdown-leaver');
let $dropdown = document.getElementById('nav-dropdown');
let $hamburger = document.getElementById('nav-icon3');
let $dropdownContent = document.getElementById('dropdown-content');

$navLeaver.addEventListener('click', () => {
    $dropdown.setAttribute('class', 'dropdown-not-loaded');
    $dropdownContent.style.visibility = "hidden";
    setTimeout(() =>{
        $dropdown.setAttribute('class', 'not-loaded');
    }, 500)
});

$hamburger.addEventListener('click', () => {
    $dropdown.setAttribute('class', 'dropdown-loaded');
    $dropdownContent.style.visibility = "visible";
});




