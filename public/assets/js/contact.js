let contactForm = document.getElementById('contact__form');
let submitBtn = document.getElementById('contact_envoyer');
let errorContainer = document.querySelector('#errors');

contactForm.addEventListener('submit', sendForm)

/**
 * Envoie le formulaire de contact en Ajax et affiche une alerte de success ou fail 
 * @param {} event 
 */
async function sendForm(event) {
    event.preventDefault();
    errors.innerHTML = ``;

    submitBtn.textContent = '';
    submitBtn.innerHTML = `
    <div class="spinner-border text-light" role="status">
        <span class="sr-only">Loading...</span>
    </div>`;

    const data = new FormData(this);

    let response = await fetch('/smartport/mailer.php', {
        method: 'POST',
        body: data
    });

    let jsonRes = await response.json();

    if(jsonRes.response[0].status !== false) {
        errors.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <strong>Succès !</strong> Votre message a bien été envoyé.
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>`;
    } else {
        errors.innerHTML = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            <strong>Problème !</strong> Nous avons rencontré un problème lors de l'envoi. Veuillez réessayer.
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>`;
    }

    submitBtn.innerHTML = ``;
    submitBtn.textContent = 'Envoyer';
}
