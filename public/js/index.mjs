import { login, logout, signup } from "./login.mjs";
import { displayMap } from "./leaflet.mjs";
import { updateSettings } from "./updateSettings.mjs";
import { bookTour } from "./stripe.mjs";

// DOM
const mapElement = document.getElementById('map');

const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const signupForm = document.querySelector('.form--signup');

const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');


const bookElement = document.getElementById('book-tour');
if (mapElement) {
    displayMap(mapElement);
}

if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        login(email, password)
    });
}

if (logOutBtn) {
    logOutBtn.addEventListener('click', logout)
}

if (userDataForm) {

    userDataForm.addEventListener('submit', e => {

        e.preventDefault();

        // const name = document.getElementById('name').value;
        // const email = document.getElementById('email').value;

        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);


        updateSettings(form, 'data')
    });
}

if (userPasswordForm) {

    userPasswordForm.addEventListener('submit', async e => {

        e.preventDefault();

        document.querySelector('.btn-save-password').textContent = 'Updating...';

        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;

        await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password')


        document.querySelector('.btn-save-password').textContent = ' Save password';

        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';


    });
}

if (bookElement) {
    bookElement.addEventListener('click', (e) => {
        e.preventDefault
        e.target.textContent = 'Processing payment...';

        // Extract the tour ID from the HTML data attribute
        const { tourId } = e.target.dataset;

        // Fire the checkout redirect flow
        bookTour(tourId);
    })
}

if (signupForm) {
    signupForm.addEventListener('submit', e => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;

        signup(name, email, password, passwordConfirm);
    });
}