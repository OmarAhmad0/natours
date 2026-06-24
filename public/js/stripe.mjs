//import axios from 'axios';
import { showAlert } from './alert.mjs';
import axiosInstance from "./axiosInstance.js";

export const bookTour = async (tourId) => {
    const stripe = Stripe(`pk_test_51TdY7aL08jB5gaIbArlcgP22OQskQwPxMlaxOiLwfAADajvNjTIZjISDr51p0Q6pfrHL69Dzqy4x2ZvYXbOnUVaA008Vl5BvDE`)
    try {
        // 1) Get checkout session from our API

        const res = await axiosInstance(`/bookings/checkout-session/${tourId}`);

        // 2) Modern Way: Grab the session URL directly from the server response
        const sessionUrl = res.data.session.url;
        //console.log(sessionUrl)
        // 3) Redirect user directly to the gorgeous Stripe checkout page
        window.location.replace(sessionUrl);

    } catch (err) {
        console.log(err);
        showAlert('error', err.response?.data?.message || 'Something went wrong!');
    }
};