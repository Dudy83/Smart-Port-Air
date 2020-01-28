require('../css/app.scss');

//function drop nav-side
function dropdown_menu() {
    let $dropdown = document.getElementById('nav-dropdown');
    let $hamburger = document.getElementById('nav-icon');
    let $dropdownContent = document.getElementById('dropdown-content');
    let $body = document.getElementById('main');

    $hamburger.addEventListener('click', () => {
        if ($dropdown.classList.contains('dropdown-loaded')) {
            $dropdown.setAttribute('class', 'dropdown-not-loaded');
            $body.removeAttribute('style');

            setTimeout(() => {
                $dropdownContent.style.visibility = "hidden";
                $dropdown.setAttribute('class', 'not-loaded');
            }, 500)
        } else {
            $dropdown.setAttribute('class', 'dropdown-loaded');
            $dropdownContent.style.visibility = "visible";
            $body.style.setProperty('filter', 'blur(4px)');
        }
    });
}

// Removes text after navbar icons if the screen width is under 1300px
function navIcons() {
    if (window.innerWidth <= 1300) {
        let navLinks = document.getElementsByClassName('navbar-links-content');
        navLinks.forEach(element => {
            element.style.setProperty('display', 'none');
        });
    } else {
        let navLinks = document.getElementsByClassName('navbar-links-content');

        navLinks.forEach(element => {
            element.style.setProperty('display', 'block');
        });
    }
}

function navbarAnim() {
    let nav = document.getElementById('navbar');
    let navLinks = document.getElementsByClassName('navbar-links');
    let spans = document.getElementsByClassName('line');
    let dropdown = document.getElementsByClassName('dropdown-toggle')[0];

    if (window.scrollY !== 0) {
        nav.style.setProperty('box-shadow', '0 .125rem .25rem rgba(0,0,0,.075)');
        nav.style.setProperty('background-color', '#fff');
        
        navLinks.forEach(element => {
            element.style.setProperty('color', '#6BBA62')
        })
        dropdown.setAttribute('style', 'color: #6BBA62 !important')

        spans.forEach(element => {
            element.style.setProperty('stroke', '#6BBA62')
        })
    } else {
        nav.removeAttribute('style');
        navLinks.forEach(element => {
            element.removeAttribute('style');
        })
        dropdown.removeAttribute('style');
        spans.forEach(element => {
            element.removeAttribute('style');
        })

    }
}

let dropdownProfilContainer = document.getElementById('profil-dropdown-menu');
let profilBtn = document.getElementById('dropdown-trigger');

profilBtn.addEventListener('click', () =>
{
    if(dropdownProfilContainer.classList.contains('profil-dropdown-hidden')) {
        dropdownProfilContainer.classList.remove('profil-dropdown-hidden');
        dropdownProfilContainer.classList.add('profil-dropdown-visible');
    } else {
        dropdownProfilContainer.classList.remove('profil-dropdown-visible');
        dropdownProfilContainer.classList.add('profil-dropdown-leave');
        setTimeout(() =>
        {
            dropdownProfilContainer.classList.remove('profil-dropdown-leave');
            dropdownProfilContainer.classList.add('profil-dropdown-hidden');
        }, 200);
        
    }
})

dropdown_menu();
window.addEventListener('resize', navIcons);
navIcons();
document.addEventListener('scroll', navbarAnim);