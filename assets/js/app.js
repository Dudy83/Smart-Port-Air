require('../css/app.scss');

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

    if (window.scrollY !== 0) {
        nav.style.setProperty('box-shadow', '0 .125rem .25rem rgba(0,0,0,.075)');
        nav.style.setProperty('background-color', '#fff');
        
        navLinks.forEach(element => {
            element.style.setProperty('color', '#6BBA62')
        })

        spans.forEach(element => {
            element.style.setProperty('stroke', '#6BBA62')
        })
    } else {
        nav.removeAttribute('style');
        navLinks.forEach(element => {
            element.removeAttribute('style');
        })
        spans.forEach(element => {
            element.removeAttribute('style');
        })

    }
}

navIcons();
window.addEventListener('resize', navIcons);
document.addEventListener('scroll', navbarAnim);


