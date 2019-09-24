
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

  if (window.scrollY >= 300)
        cardsContainer.setAttribute('class', 'd-flex align-items-stretch justify-content-around loaded');
  else return;

}

//function drop nav-side
let $navLeaver = document.getElementById('nav-dropdown-leaver');
let $dropdown = document.getElementById('nav-dropdown');
let $hamburger = document.getElementById('nav-icon3');
let $dropdownContent = document.getElementById('dropdown-content');
let $websiteContent = document.getElementById('main');
let $websiteBrand = document.getElementById('website-brand');
let $footer = document.getElementsByTagName('footer')[0];


$navLeaver.addEventListener('click', () => {
    $dropdown.setAttribute('class', 'dropdown-not-loaded');
    $dropdownContent.style.visibility = "hidden";
    $websiteContent.removeAttribute('style');
    $websiteBrand.removeAttribute('style');
    $footer.removeAttribute('style');

    setTimeout(() =>{
        $dropdown.setAttribute('class', 'not-loaded');
    }, 500)
});

$hamburger.addEventListener('click', () => {
    $dropdown.setAttribute('class', 'dropdown-loaded');
    $dropdownContent.style.visibility = "visible";
    $websiteContent.style.setProperty('filter', 'blur(2px)');
    $websiteBrand.style.setProperty('filter', 'blur(2px)');
    $footer.style.setProperty('filter', 'blur(2px)');
});



//animation-logo removed
let $animLogo = document.getElementById('animation-logo');

window.addEventListener('load', setTimeout(() =>{
    $animLogo.setAttribute('class', 'not-loaded');
}, 500));


let iframe = document.getElementById("pollution-paca");

let svg = iframe.contentWindow.document.getElementsByTagName("svg")[0];

svg.style.setProperty('transform', 'translate3d(-656px, 255px, 0px)');

