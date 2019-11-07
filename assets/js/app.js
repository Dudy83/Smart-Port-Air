require('../css/app.css');

//function drop nav-side
function dropdown_menu()
{
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
}

// Removes text after navbar icons if the screen width is under 1300px
function navIcons()
{
    if(window.innerWidth <= 1300)
    {
        let navLinks = document.getElementsByClassName('navbar-links-content');
        navLinks.forEach(element => {
            element.style.setProperty('display', 'none');
        });
    }else{
        let navLinks = document.getElementsByClassName('navbar-links-content');

        navLinks.forEach(element => {
            element.style.setProperty('display', 'block');
        });
    }
}

function navbarAnim()
{
    let nav = document.getElementById('navbar');

    if(window.scrollY !== 0)
    {
        nav.style.setProperty('box-shadow', '0 .125rem .25rem rgba(0,0,0,.075)')
    }else{
        nav.removeAttribute('style')
    }
}

dropdown_menu();
window.addEventListener('resize', navIcons);
navIcons();
document.addEventListener('scroll', navbarAnim);

