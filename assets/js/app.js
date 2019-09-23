
require('../css/app.css');


const $ = require('jquery');


$(document).ready(function () {

    $('.first-button').on('click', function () {

        $('.animated-icon1').toggleClass('open');
    });
    $('.second-button').on('click', function () {

        $('.animated-icon2').toggleClass('open');
    });
    $('.third-button').on('click', function () {

        $('.animated-icon3').toggleClass('open');
    });
});

// Scroll Cards Animations 

window.addEventListener('scroll', () => scrollCardsAnimation());
 

function scrollCardsAnimation() {

let cardsContainer = document.querySelector('#cards-container');
let elm = document.querySelector('#diams-port-container').offsetTop;


  if (window.scrollY >= 300)
        cardsContainer.setAttribute('class', 'd-flex align-items-center justify-content-around loaded');
  else return;

}

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


//animation-logo removed
let $animLogo = document.getElementById('animation-logo');

window.addEventListener('load', setTimeout(() =>{
    $animLogo.setAttribute('class', 'not-loaded');
}, 500));